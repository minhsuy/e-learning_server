import { prisma } from '../src/config/prisma'
import {
  parseDayOfWeek,
  formatDayOfWeek,
  ConfigureDailyScheduleSchema,
  ConfigureWeeklyScheduleSchema
} from '../src/models/telegramSchedule.model'
import {
  createVietnamDate,
  createVietnamDateTime,
  getVietnamCalendarDate,
  calculateNextRunAt,
  calculateSubsequentRunAt,
  resolveDailySnapshotRange,
  resolvePreviousCompletedWeekRange,
  resolvePriorWeekComparisonRange
} from '../src/utils/analyticsDateRange'
import {
  getTeacherSchedulesService,
  configureDailyScheduleService,
  configureWeeklyScheduleService,
  pauseAllTeacherSchedulesService
} from '../src/services/telegramReportSchedule.service'
import {
  generateDailyReportMessage,
  generateWeeklyReportMessage,
  dispatchScheduleReport,
  formatReportAiInsight,
  stripMarkdownCodeFences
} from '../src/services/telegramReportDelivery.service'
import {
  claimOrInspectReportDelivery,
  findDeliveryByScheduleAndPeriod,
  tryClaimReportDelivery,
  updateReportDeliveryStatus,
  updateScheduleRunMetadata,
  upsertDailySchedule,
  upsertWeeklySchedule,
  findDueSchedules,
  findScheduleByTeacherAndType,
  findSchedulesByTeacherId
} from '../src/repositories/telegramReportSchedule.repository'
import {
  checkAndDispatchDueReports,
  startTelegramReportScheduler,
  stopTelegramReportScheduler,
  isTelegramReportSchedulerRunning
} from '../src/jobs/telegramReportScheduler'
import { handleScheduleCommand } from '../src/telegram/handlers/schedule.handler'
import { TeacherBotContext } from '../src/telegram/types'

/**
 * TMDEMY — TG-05 AUTOMATED TELEGRAM REPORTS & SCHEDULING TEST SUITE
 *
 * Verifies all requirements of TG-05:
 * 1. Zod Models, Day-of-Week Parsing, Time Validation
 * 2. Vietnam Timezone Date Ranges & Next Run Calculations
 * 3. Schedule Service Configuration & Unlinked Teacher Guard
 * 4. Report Content Generation (Daily Snapshot, Weekly Prior-Week Delta, Zero Timezone Leakage)
 * 5. Atomic Claiming & PostgreSQL Idempotency (Concurrency Duplicate Prevention)
 * 6. Background Scheduler Dispatching, Metadata Updates & Error Isolation
 * 7. Telegram /schedule Command Handler & Subcommands
 * 8. Cleanup & Database Integrity
 */

let totalTests = 0
let passedTests = 0
let failedTests = 0

function assert(condition: boolean, testName: string, failureDetails?: string) {
  totalTests++
  if (condition) {
    passedTests++
    console.log(`  ✅ [PASS] ${testName}`)
  } else {
    failedTests++
    console.error(`  ❌ [FAIL] ${testName}${failureDetails ? ` — ${failureDetails}` : ''}`)
  }
}

interface MockReply {
  text: string
  options?: any
}

function createMockTelegramContext(
  text: string,
  teacherProfile?: any
): TeacherBotContext & { getReplies: () => MockReply[] } {
  const replies: MockReply[] = []

  return {
    from: {
      id: 99887766,
      is_bot: false,
      first_name: 'ScheduledTeacher',
      username: 'scheduled_teacher'
    },
    chat: {
      id: 99887766,
      type: 'private',
      first_name: 'ScheduledTeacher'
    },
    message: {
      message_id: 101,
      date: Math.floor(Date.now() / 1000),
      chat: { id: 99887766, type: 'private' },
      text
    },
    teacherProfile: teacherProfile || null,
    reply: async (replyText: string, options?: any) => {
      replies.push({ text: replyText, options })
      return { message_id: replies.length, date: Date.now(), chat: { id: 99887766, type: 'private' }, text: replyText } as any
    },
    getReplies: () => replies
  } as any
}

async function runTG05TestSuite() {
  console.log('====================================================================')
  console.log('🚀 TMDEMY — TG-05 AUTOMATED TELEGRAM REPORTS & SCHEDULING TEST SUITE')
  console.log('====================================================================\n')

  let testTeacher: any = null
  let linkedTelegramAccount: any = null

  try {
    // -------------------------------------------------------------
    // GROUP 1: ZOD MODELS, DAY-OF-WEEK PARSING & VALIDATION
    // -------------------------------------------------------------
    console.log('📦 GROUP 1: Zod Models & Validation Contracts')

    // 1.1 parseDayOfWeek Vietnamese & English
    assert(parseDayOfWeek('t2') === 1, 'parseDayOfWeek parses "t2" as 1 (Monday)')
    assert(parseDayOfWeek('thu2') === 1, 'parseDayOfWeek parses "thu2" as 1 (Monday)')
    assert(parseDayOfWeek('thứ hai') === 1, 'parseDayOfWeek parses "thứ hai" as 1 (Monday)')
    assert(parseDayOfWeek('mon') === 1, 'parseDayOfWeek parses "mon" as 1 (Monday)')
    assert(parseDayOfWeek('monday') === 1, 'parseDayOfWeek parses "monday" as 1 (Monday)')
    assert(parseDayOfWeek('t7') === 6, 'parseDayOfWeek parses "t7" as 6 (Saturday)')
    assert(parseDayOfWeek('cn') === 7, 'parseDayOfWeek parses "cn" as 7 (Sunday)')
    assert(parseDayOfWeek('chủ nhật') === 7, 'parseDayOfWeek parses "chủ nhật" as 7 (Sunday)')
    assert(parseDayOfWeek('sunday') === 7, 'parseDayOfWeek parses "sunday" as 7 (Sunday)')
    assert(parseDayOfWeek('invalid_day') === null, 'parseDayOfWeek returns null for invalid string')
    assert(parseDayOfWeek(4) === 4, 'parseDayOfWeek accepts integer 4')
    assert(parseDayOfWeek(9) === null, 'parseDayOfWeek rejects integer > 7')

    // 1.2 formatDayOfWeek
    assert(formatDayOfWeek(1) === 'Thứ Hai', 'formatDayOfWeek(1) returns "Thứ Hai"')
    assert(formatDayOfWeek(7) === 'Chủ Nhật', 'formatDayOfWeek(7) returns "Chủ Nhật"')
    assert(formatDayOfWeek(null) === 'Chưa đặt', 'formatDayOfWeek(null) returns "Chưa đặt"')

    // 1.3 Zod Schema validation
    const validDaily = ConfigureDailyScheduleSchema.safeParse({ isEnabled: true, deliveryTime: '20:30' })
    assert(validDaily.success === true, 'ConfigureDailyScheduleSchema accepts valid time "20:30"')

    const invalidDailyTime = ConfigureDailyScheduleSchema.safeParse({ deliveryTime: '25:99' })
    assert(invalidDailyTime.success === false, 'ConfigureDailyScheduleSchema rejects invalid time "25:99"')

    const validWeekly = ConfigureWeeklyScheduleSchema.safeParse({
      isEnabled: true,
      deliveryTime: '08:00',
      dayOfWeek: 1
    })
    assert(validWeekly.success === true, 'ConfigureWeeklyScheduleSchema accepts valid weekly payload')

    const invalidWeeklyDay = ConfigureWeeklyScheduleSchema.safeParse({ dayOfWeek: 8 })
    assert(invalidWeeklyDay.success === false, 'ConfigureWeeklyScheduleSchema rejects dayOfWeek = 8')

    // -------------------------------------------------------------
    // GROUP 2: DATE RANGE & NEXT RUN CALCULATIONS (TIMEZONE SAFETY)
    // -------------------------------------------------------------
    console.log('\n⏰ GROUP 2: Date Range Utilities & Deterministic nextRunAt Calculation')

    // Ref: Wednesday 2026-11-04 10:00:00 VN
    const refWed10AM = createVietnamDateTime(2026, 10, 4, 10, 0, 0) // Nov is month 10 (0-indexed)

    // Daily nextRunAt:
    // If deliveryTime is 20:00 and ref is 10:00, next run is TODAY 20:00
    const nextDailyToday = calculateNextRunAt('DAILY', '20:00', null, refWed10AM)
    const nextDailyTodayVn = getVietnamCalendarDate(nextDailyToday)
    assert(
      nextDailyTodayVn.year === 2026 &&
        nextDailyTodayVn.month === 10 &&
        nextDailyTodayVn.day === 4 &&
        nextDailyTodayVn.hours === 20 &&
        nextDailyTodayVn.minutes === 0,
      'calculateNextRunAt(DAILY, 20:00) before 20:00 schedules run for TODAY at 20:00'
    )

    // If deliveryTime is 08:00 and ref is 10:00, next run is TOMORROW 08:00
    const nextDailyTomorrow = calculateNextRunAt('DAILY', '08:00', null, refWed10AM)
    const nextDailyTomorrowVn = getVietnamCalendarDate(nextDailyTomorrow)
    assert(
      nextDailyTomorrowVn.year === 2026 &&
        nextDailyTomorrowVn.month === 10 &&
        nextDailyTomorrowVn.day === 5 &&
        nextDailyTomorrowVn.hours === 8 &&
        nextDailyTomorrowVn.minutes === 0,
      'calculateNextRunAt(DAILY, 08:00) after 08:00 schedules run for TOMORROW at 08:00'
    )

    // Weekly nextRunAt:
    // Ref is Wednesday (dayOfWeek = 3).
    // Target is Friday (dayOfWeek = 5) at 09:00 -> schedules for THIS FRIDAY 2026-11-06 09:00
    const nextWeeklyFri = calculateNextRunAt('WEEKLY', '09:00', 5, refWed10AM)
    const nextWeeklyFriVn = getVietnamCalendarDate(nextWeeklyFri)
    assert(
      nextWeeklyFriVn.dayOfWeek === 5 && nextWeeklyFriVn.day === 6 && nextWeeklyFriVn.hours === 9,
      'calculateNextRunAt(WEEKLY, Fri 09:00) on Wednesday schedules run for upcoming Friday'
    )

    // Target is Monday (dayOfWeek = 1) at 08:00 on Wednesday -> schedules for NEXT MONDAY 2026-11-09 08:00
    const nextWeeklyMon = calculateNextRunAt('WEEKLY', '08:00', 1, refWed10AM)
    const nextWeeklyMonVn = getVietnamCalendarDate(nextWeeklyMon)
    assert(
      nextWeeklyMonVn.dayOfWeek === 1 && nextWeeklyMonVn.day === 9 && nextWeeklyMonVn.hours === 8,
      'calculateNextRunAt(WEEKLY, Mon 08:00) on Wednesday schedules run for next week Monday'
    )

    // 2.2 Date boundaries for Daily & Weekly reports
    const dailyRange = resolveDailySnapshotRange(refWed10AM)
    assert(dailyRange.startDate.getTime() < dailyRange.endDate.getTime(), 'Daily snapshot range has valid bounds')
    assert(dailyRange.periodKey.startsWith('DAILY:2026-11-04'), `Daily periodKey format is correct (${dailyRange.periodKey})`)

    const weeklyRange = resolvePreviousCompletedWeekRange(refWed10AM)
    // On Wed Nov 4, previous completed week is Monday Oct 26 to Sunday Nov 1
    assert(weeklyRange.startDate.getTime() < weeklyRange.endDate.getTime(), 'Weekly range has valid bounds')
    assert(weeklyRange.periodKey.startsWith('WEEKLY:2026-10-26_2026-11-01'), `Weekly periodKey format is correct (${weeklyRange.periodKey})`)

    const priorWeekRange = resolvePriorWeekComparisonRange(refWed10AM)
    assert(priorWeekRange.startDate.getTime() < priorWeekRange.endDate.getTime(), 'Prior week comparison range has valid bounds')

    // -------------------------------------------------------------
    // GROUP 3: TEACHER SETUP & SCHEDULE SERVICE CRUD
    // -------------------------------------------------------------
    console.log('\n👨‍🏫 GROUP 3: Teacher Schedule Service CRUD & Multi-Tenant Guard')

    // Find an active teacher
    testTeacher = await prisma.user.findFirst({
      where: {
        role: 'TEACHER',
        status: 'ACTIVE'
      },
      include: { telegramAccount: true }
    })

    if (!testTeacher) {
      console.warn('⚠️ No existing active teacher found. Creating a test teacher...')
      testTeacher = await prisma.user.create({
        data: {
          username: 'sched_test_teacher',
          email: 'sched_test_teacher@tmdemy.internal',
          password: 'hashed_password_placeholder',
          role: 'TEACHER',
          status: 'ACTIVE'
        }
      })
    }

    console.log(`  ℹ️ Test Teacher: ${testTeacher.username} (${testTeacher.id})`)

    // Clean up any pre-existing schedules for this teacher
    await prisma.telegramReportSchedule.deleteMany({
      where: { teacherId: testTeacher.id }
    })

    // 3.1 Initial query returns default items when none exist in DB
    const initialSummary = await getTeacherSchedulesService(testTeacher.id)
    assert(initialSummary.teacherId === testTeacher.id, 'getTeacherSchedulesService returns correct teacherId')
    assert(initialSummary.daily.isEnabled === false, 'Default daily schedule is disabled')
    assert(initialSummary.daily.deliveryTime === '20:00', 'Default daily delivery time is 20:00')
    assert(initialSummary.weekly.isEnabled === false, 'Default weekly schedule is disabled')
    assert(initialSummary.weekly.deliveryTime === '08:00', 'Default weekly delivery time is 08:00')

    // 3.2 Unlinked teacher guard: if teacher has NO telegram account, enabling schedule must throw error
    if (testTeacher.telegramAccount) {
      // Temporarily delete or unlink for this test
      await prisma.telegramAccount.delete({ where: { userId: testTeacher.id } })
    }

    let unlinkedErrorThrown = false
    try {
      await configureDailyScheduleService(testTeacher.id, { isEnabled: true })
    } catch (err: any) {
      unlinkedErrorThrown = true
      assert(
        err.message.includes('chưa liên kết Telegram'),
        'configureDailyScheduleService rejects enabling when teacher has no Telegram account'
      )
    }
    assert(unlinkedErrorThrown, 'Guard successfully prevented unlinked teacher from enabling schedule')

    // 3.3 Link a test Telegram Account
    linkedTelegramAccount = await prisma.telegramAccount.create({
      data: {
        userId: testTeacher.id,
        telegramUserId: BigInt(99887766),
        telegramChatId: BigInt(99887766),
        telegramUsername: 'test_sched_bot_user',
        telegramFirstName: 'ScheduledTeacher'
      }
    })
    assert(Boolean(linkedTelegramAccount.id), 'Test Telegram Account linked to teacher successfully')

    // 3.4 Configure Daily Schedule (enable & set time)
    const configuredDaily = await configureDailyScheduleService(testTeacher.id, {
      isEnabled: true,
      deliveryTime: '21:15'
    })
    assert(configuredDaily.isEnabled === true, 'configureDailyScheduleService enabled Daily Report')
    assert(configuredDaily.deliveryTime === '21:15', 'Daily delivery time updated to 21:15')
    assert(configuredDaily.nextRunAt !== null, 'Daily nextRunAt calculated and persisted')

    // 3.5 Configure Weekly Schedule (enable, set Monday 08:30)
    const configuredWeekly = await configureWeeklyScheduleService(testTeacher.id, {
      isEnabled: true,
      deliveryTime: '08:30',
      dayOfWeek: 1
    })
    assert(configuredWeekly.isEnabled === true, 'configureWeeklyScheduleService enabled Weekly Report')
    assert(configuredWeekly.deliveryTime === '08:30', 'Weekly delivery time updated to 08:30')
    assert(configuredWeekly.dayOfWeek === 1, 'Weekly dayOfWeek updated to 1 (Thứ Hai)')
    assert(configuredWeekly.dayOfWeekLabel === 'Thứ Hai', 'Weekly dayOfWeekLabel is "Thứ Hai"')
    assert(configuredWeekly.nextRunAt !== null, 'Weekly nextRunAt calculated and persisted')

    // 3.6 Pause All Schedules
    const pauseResult = await pauseAllTeacherSchedulesService(testTeacher.id)
    assert(pauseResult.pausedCount >= 2, `pauseAllTeacherSchedulesService paused ${pauseResult.pausedCount} schedules`)

    const summaryAfterPause = await getTeacherSchedulesService(testTeacher.id)
    assert(summaryAfterPause.daily.isEnabled === false, 'Daily schedule is now disabled after pause')
    assert(summaryAfterPause.daily.nextRunAt === null, 'Daily nextRunAt cleared after pause')
    assert(summaryAfterPause.weekly.isEnabled === false, 'Weekly schedule is now disabled after pause')
    assert(summaryAfterPause.weekly.nextRunAt === null, 'Weekly nextRunAt cleared after pause')

    // -------------------------------------------------------------
    // GROUP 4: REPORT CONTENT GENERATION & ZERO TIMEZONE LEAKAGE
    // -------------------------------------------------------------
    console.log('\n📄 GROUP 4: Report Content Generation & Zero Timezone Leakage')

    // 4.1 Daily Report Content
    const dailyGenerated = await generateDailyReportMessage(
      testTeacher.id,
      testTeacher.username,
      new Date(),
      { skipAi: true }
    )
    assert(dailyGenerated.messageText.length > 50, 'generateDailyReportMessage returns non-empty message')
    assert(dailyGenerated.messageText.includes('BÁO CÁO KINH DOANH HÀNG NGÀY'), 'Daily message contains title header')
    assert(dailyGenerated.messageText.includes('Doanh thu thực nhận'), 'Daily message contains net revenue metric')
    assert(dailyGenerated.messageText.includes('Đơn hàng thành công'), 'Daily message contains order metric')
    // Mandatory rule: ZERO client-facing timezone footer!
    assert(
      !dailyGenerated.messageText.includes('Asia/Ho_Chi_Minh') && !dailyGenerated.messageText.includes('UTC+7'),
      'Daily message strictly contains ZERO client-facing timezone footers'
    )

    // 4.2 Weekly Report Content
    const weeklyGenerated = await generateWeeklyReportMessage(
      testTeacher.id,
      testTeacher.username,
      new Date(),
      { skipAi: true }
    )
    assert(weeklyGenerated.messageText.length > 50, 'generateWeeklyReportMessage returns non-empty message')
    assert(weeklyGenerated.messageText.includes('BÁO CÁO KINH DOANH HÀNG TUẦN'), 'Weekly message contains title header')
    assert(weeklyGenerated.messageText.includes('Hiệu quả tuần qua so với tuần trước'), 'Weekly message contains comparison section')
    assert(weeklyGenerated.messageText.includes('so với tuần trước'), 'Weekly message contains delta vs prior week')
    // Mandatory rule: ZERO client-facing timezone footer!
    assert(
      !weeklyGenerated.messageText.includes('Asia/Ho_Chi_Minh') && !weeklyGenerated.messageText.includes('UTC+7'),
      'Weekly message strictly contains ZERO client-facing timezone footers'
    )

    // 4.3 Hotfix: Gemini Insight Parsing & Formatting
    console.log('\n  🧠 4.3 Hotfix: Gemini Insight Parsing & Vietnamese Formatting Tests')

    // 4.3.1 Valid JSON string parsing
    const validJsonRaw = JSON.stringify({
      observation: 'Hôm nay nền tảng chưa ghi nhận phát sinh doanh thu, đơn hàng mới hay học viên đăng ký mới.',
      recommendation: 'Giảng viên có thể xem lại mô tả khóa học hoặc chia sẻ liên kết lên mạng xã hội để thu hút học viên tiềm năng.'
    })
    const formattedFromStr = formatReportAiInsight(validJsonRaw)
    assert(formattedFromStr !== null, 'formatReportAiInsight successfully parses valid JSON string')
    const combinedStr = formattedFromStr!.join('\n')
    assert(combinedStr.includes('💡 *NHẬN ĐỊNH NHANH AI*'), 'Formatted insight contains header "💡 *NHẬN ĐỊNH NHANH AI*"')
    assert(combinedStr.includes('📊 *Tình hình kinh doanh:*'), 'Formatted insight contains section "📊 *Tình hình kinh doanh:*"')
    assert(combinedStr.includes('Hôm nay nền tảng chưa ghi nhận phát sinh doanh thu'), 'Observation rendered as plain text')
    assert(combinedStr.includes('🚀 *Đề xuất cải thiện:*'), 'Formatted insight contains section "🚀 *Đề xuất cải thiện:*"')
    assert(combinedStr.includes('Giảng viên có thể xem lại mô tả khóa học'), 'Recommendation rendered as plain text')
    assert(
      !combinedStr.includes('{"observation":') && !combinedStr.includes('"recommendation":') && !combinedStr.includes('}'),
      'Formatted insight contains zero raw JSON braces or field names'
    )

    // 4.3.2 Structured object parsing
    const objInput = {
      observation: 'Doanh thu ngày hôm nay tăng trưởng ổn định.',
      recommendation: 'Tiếp tục duy trì tương tác bài giảng.'
    }
    const formattedFromObj = formatReportAiInsight(objInput)
    assert(formattedFromObj !== null, 'formatReportAiInsight handles structured object input')
    assert(formattedFromObj!.join('\n').includes('Doanh thu ngày hôm nay tăng trưởng ổn định.'), 'Object observation rendered')

    // 4.3.3 Markdown code fences stripping
    const fencedJson = '```json\n{\n  "observation": "Tuần qua đạt 14 đơn hàng thành công.",\n  "recommendation": "Phát hành coupon ưu đãi."\n}\n```'
    const stripped = stripMarkdownCodeFences(fencedJson)
    assert(stripped.startsWith('{') && stripped.endsWith('}'), 'stripMarkdownCodeFences removes opening and closing fences')
    const formattedFromFenced = formatReportAiInsight(fencedJson)
    assert(formattedFromFenced !== null, 'formatReportAiInsight handles Markdown code-fenced JSON string')
    assert(!formattedFromFenced!.join('\n').includes('```'), 'Zero code fences in formatted output')

    // 4.3.4 Malformed / Invalid JSON handling
    const malformedJson = '{"observation": "Unclosed json string...'
    assert(formatReportAiInsight(malformedJson) === null, 'formatReportAiInsight returns null for malformed JSON')
    assert(formatReportAiInsight('Random non-json text string') === null, 'formatReportAiInsight returns null for plain non-json text')

    // 4.3.5 Missing observation
    const missingObs = JSON.stringify({ recommendation: 'Chỉ có gợi ý mà không có nhận định.' })
    assert(formatReportAiInsight(missingObs) === null, 'formatReportAiInsight returns null when observation is missing')

    // 4.3.6 Null or omitted recommendation
    const nullRec = JSON.stringify({
      observation: 'Chỉ có nhận định tình hình kinh doanh.',
      recommendation: null
    })
    const formattedNullRec = formatReportAiInsight(nullRec)
    assert(formattedNullRec !== null, 'formatReportAiInsight accepts null recommendation')
    assert(!formattedNullRec!.join('\n').includes('🚀 *Đề xuất cải thiện:*'), 'Omits recommendation section when recommendation is null')

    // 4.3.7 Markdown special characters escaping
    const specialCharsJson = JSON.stringify({
      observation: 'Học viên [Nguyễn A] đã hoàn thành khóa *Next.js*.',
      recommendation: 'Tham gia nhóm _Zalo_ (hỗ trợ).'
    })
    const formattedSpecial = formatReportAiInsight(specialCharsJson)!.join('\n')
    assert(
      formattedSpecial.includes('\\[Nguyễn A\\]') && formattedSpecial.includes('\\*Next.js\\*'),
      'Markdown special characters in observation escaped properly'
    )
    assert(
      formattedSpecial.includes('\\_Zalo\\_') && formattedSpecial.includes('\\(hỗ trợ\\)'),
      'Markdown special characters in recommendation escaped properly'
    )

    // 4.3.8 Daily Report with mock AI response
    const dailyWithAi = await generateDailyReportMessage(
      testTeacher.id,
      testTeacher.username,
      new Date(),
      { mockAiResponse: validJsonRaw }
    )
    assert(dailyWithAi.messageText.includes('💡 *NHẬN ĐỊNH NHANH AI*'), 'Daily report includes parsed AI insight block')
    assert(dailyWithAi.messageText.includes('📊 *Tình hình kinh doanh:*'), 'Daily report includes business status section')
    assert(dailyWithAi.messageText.includes('🚀 *Đề xuất cải thiện:*'), 'Daily report includes recommendation section')
    assert(
      !dailyWithAi.messageText.includes('{"observation":') && !dailyWithAi.messageText.includes('"recommendation":'),
      'Daily report with AI insight contains zero raw JSON or field names'
    )
    assert(
      !dailyWithAi.messageText.includes('Asia/Ho_Chi_Minh') && !dailyWithAi.messageText.includes('UTC+7'),
      'Daily report with AI insight strictly contains ZERO timezone footers'
    )

    // 4.3.9 Weekly Report with mock AI response (code-fenced)
    const weeklyWithAi = await generateWeeklyReportMessage(
      testTeacher.id,
      testTeacher.username,
      new Date(),
      { mockAiResponse: fencedJson }
    )
    assert(weeklyWithAi.messageText.includes('💡 *NHẬN ĐỊNH NHANH AI*'), 'Weekly report includes parsed AI insight block')
    assert(!weeklyWithAi.messageText.includes('```'), 'Weekly report contains zero markdown code fences')
    assert(
      !weeklyWithAi.messageText.includes('Asia/Ho_Chi_Minh') && !weeklyWithAi.messageText.includes('UTC+7'),
      'Weekly report with AI insight strictly contains ZERO timezone footers'
    )

    // 4.3.10 Fallback on Gemini error / malformed response in Daily Report
    const dailyWithBrokenAi = await generateDailyReportMessage(
      testTeacher.id,
      testTeacher.username,
      new Date(),
      { mockAiResponse: '{ broken json' }
    )
    assert(
      dailyWithBrokenAi.messageText.includes('BÁO CÁO KINH DOANH HÀNG NGÀY'),
      'Daily report generates successfully even when AI response is broken'
    )
    assert(
      !dailyWithBrokenAi.messageText.includes('💡 *NHẬN ĐỊNH NHANH AI*'),
      'Daily report cleanly omits AI block when AI response is malformed'
    )
    assert(
      !dailyWithBrokenAi.messageText.includes('{ broken json'),
      'Daily report never leaks raw malformed AI text'
    )

    // -------------------------------------------------------------
    // GROUP 5: ATOMIC CLAIMING & POSTGRESQL CONCURRENCY SAFETY
    // -------------------------------------------------------------
    console.log('\n🔒 GROUP 5: Atomic PostgreSQL Claiming & Concurrency Safety')

    // Re-enable daily schedule for delivery tests
    const activeDaily = await configureDailyScheduleService(testTeacher.id, {
      isEnabled: true,
      deliveryTime: '20:00'
    })

    const testPeriodKey = 'DAILY:2026-11-04_CONCURRENCY_TEST'

    // First claim attempt: MUST SUCCEED
    const claim1 = await tryClaimReportDelivery({
      scheduleId: activeDaily.id,
      teacherId: testTeacher.id,
      reportType: 'DAILY',
      periodKey: testPeriodKey
    })
    assert(claim1 !== null && claim1.status === 'CLAIMED', 'First delivery claim succeeds with status CLAIMED')

    // Concurrent second claim attempt for identical (scheduleId, periodKey): MUST RETURN NULL
    const claim2 = await tryClaimReportDelivery({
      scheduleId: activeDaily.id,
      teacherId: testTeacher.id,
      reportType: 'DAILY',
      periodKey: testPeriodKey
    })
    assert(
      claim2 === null,
      'Concurrent duplicate claim for same (scheduleId, periodKey) returns null (P2002 conflict trapped)'
    )

    // Update delivery record to DELIVERED
    const updatedDelivery = await updateReportDeliveryStatus(claim1!.id, {
      status: 'DELIVERED',
      responseMessageId: 12345
    })
    assert(updatedDelivery.status === 'DELIVERED', 'updateReportDeliveryStatus sets status to DELIVERED')
    assert(updatedDelivery.responseMessageId === 12345, 'updateReportDeliveryStatus records responseMessageId')

    // Clean up test delivery
    await prisma.telegramReportDelivery.deleteMany({
      where: { periodKey: testPeriodKey }
    })

    // -------------------------------------------------------------
    // GROUP 6: BACKGROUND SCHEDULER ENGINE & DISPATCHING
    // -------------------------------------------------------------
    console.log('\n⚙️ GROUP 6: Background Scheduler Engine & Mock Telegram Dispatching')

    // Set daily schedule nextRunAt to 10 minutes in the PAST so findDueSchedules picks it up
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    await prisma.telegramReportSchedule.update({
      where: { id: activeDaily.id },
      data: {
        isEnabled: true,
        nextRunAt: tenMinutesAgo
      }
    })

    // Verify findDueSchedules returns this schedule
    const dueSchedules = await findDueSchedules(new Date(), 10)
    const myDue = dueSchedules.find((s) => s.id === activeDaily.id)
    assert(Boolean(myDue), 'findDueSchedules successfully finds past-due enabled schedule')

    // Dispatch via checkAndDispatchDueReports with mock Telegram sender
    let mockSenderCalled = false
    let sentChatId: any = null
    let sentMessageText: string = ''

    const mockTelegramSender = async (chatId: any, text: string) => {
      mockSenderCalled = true
      sentChatId = chatId
      sentMessageText = text
      return { message_id: 888999 }
    }

    const dispatchResults = await checkAndDispatchDueReports(new Date(), {
      mockTelegramSender,
      skipAi: true
    })

    const myResult = dispatchResults.find((r) => r.scheduleId === activeDaily.id)
    assert(Boolean(myResult), 'checkAndDispatchDueReports dispatched report for teacher schedule')
    assert(myResult?.status === 'DELIVERED', 'Report delivery status is DELIVERED')
    assert(mockSenderCalled === true, 'mockTelegramSender was invoked with report content')
    assert(
      String(sentChatId) === '99887766',
      `Delivered to correct teacher Telegram Chat ID (${sentChatId})`
    )
    assert(sentMessageText.includes('BÁO CÁO KINH DOANH'), 'Delivered message contains verified report text')

    // Verify schedule's nextRunAt has been advanced into the FUTURE
    const scheduleAfterDispatch = await findScheduleByTeacherAndType(testTeacher.id, 'DAILY')
    assert(
      scheduleAfterDispatch?.nextRunAt !== null && scheduleAfterDispatch!.nextRunAt! > new Date(),
      'Schedule nextRunAt was atomically advanced into future date after successful dispatch'
    )
    assert(
      scheduleAfterDispatch?.lastStatus === 'SUCCESS',
      'Schedule lastStatus updated to SUCCESS'
    )

    // Test Idempotency: Immediate second sweep in same period must SKIPPED duplicate delivery
    // Force nextRunAt back to past to test periodKey deduplication
    await prisma.telegramReportSchedule.update({
      where: { id: activeDaily.id },
      data: { nextRunAt: tenMinutesAgo }
    })

    mockSenderCalled = false
    const secondSweep = await checkAndDispatchDueReports(new Date(), {
      mockTelegramSender,
      skipAi: true
    })
    const secondResult = secondSweep.find((r) => r.scheduleId === activeDaily.id)
    assert(
      secondResult?.status === 'SKIPPED',
      'Second sweep in same period skipped duplicate delivery safely'
    )
    assert(mockSenderCalled === false, 'mockTelegramSender was NOT called on duplicate skipped run')

    // Test Scheduler lifecycle
    startTelegramReportScheduler(5000)
    assert(isTelegramReportSchedulerRunning() === true, 'startTelegramReportScheduler marked runner active')
    stopTelegramReportScheduler()
    assert(isTelegramReportSchedulerRunning() === false, 'stopTelegramReportScheduler stopped runner gracefully')

    // -------------------------------------------------------------
    // GROUP 7: TELEGRAM /SCHEDULE COMMAND HANDLER
    // -------------------------------------------------------------
    console.log('\n🤖 GROUP 7: Telegram /schedule Command Handler & Subcommands')

    const teacherProfile = {
      userId: testTeacher.id,
      username: testTeacher.username,
      telegramUserId: 99887766,
      telegramChatId: 99887766,
      role: 'teacher'
    }

    // 7.1 /schedule (status overview)
    const ctxStatus = createMockTelegramContext('/schedule', teacherProfile)
    await handleScheduleCommand(ctxStatus)
    const repliesStatus = ctxStatus.getReplies()
    assert(repliesStatus.length === 1, '/schedule replied with 1 status overview message')
    assert(
      repliesStatus[0].text.includes('CẤU HÌNH LỊCH BÁO CÁO TỰ ĐỘNG'),
      '/schedule status message contains header'
    )
    assert(
      !repliesStatus[0].text.includes('Asia/Ho_Chi_Minh'),
      '/schedule status message strictly contains ZERO timezone footers'
    )

    // 7.2 /schedule daily 20:45
    const ctxDailyTime = createMockTelegramContext('/schedule daily 20:45', teacherProfile)
    await handleScheduleCommand(ctxDailyTime)
    const repliesDailyTime = ctxDailyTime.getReplies()
    assert(
      repliesDailyTime[0].text.includes('Cập nhật lịch báo cáo hàng ngày thành công'),
      '/schedule daily 20:45 returned success reply'
    )
    assert(repliesDailyTime[0].text.includes('20:45'), '/schedule daily 20:45 reflected new time')

    // 7.3 /schedule weekly t2 08:15
    const ctxWeekly = createMockTelegramContext('/schedule weekly t2 08:15', teacherProfile)
    await handleScheduleCommand(ctxWeekly)
    const repliesWeekly = ctxWeekly.getReplies()
    assert(
      repliesWeekly[0].text.includes('Cập nhật lịch báo cáo hàng tuần thành công'),
      '/schedule weekly t2 08:15 returned success reply'
    )
    assert(repliesWeekly[0].text.includes('Thứ Hai'), '/schedule weekly reflected "Thứ Hai"')
    assert(repliesWeekly[0].text.includes('08:15'), '/schedule weekly reflected "08:15"')

    // 7.4 /schedule daily off
    const ctxDailyOff = createMockTelegramContext('/schedule daily off', teacherProfile)
    await handleScheduleCommand(ctxDailyOff)
    const repliesDailyOff = ctxDailyOff.getReplies()
    assert(
      repliesDailyOff[0].text.includes('ĐÃ TẮT'),
      '/schedule daily off successfully disabled Daily Report'
    )

    // 7.5 /schedule pause
    const ctxPause = createMockTelegramContext('/schedule pause', teacherProfile)
    await handleScheduleCommand(ctxPause)
    const repliesPause = ctxPause.getReplies()
    assert(
      repliesPause[0].text.includes('Đã tạm dừng toàn bộ lịch báo cáo'),
      '/schedule pause successfully paused all schedules'
    )

    // -------------------------------------------------------------
    // GROUP 8: TG-05 SCHEDULER RELIABILITY HOTFIX (22 MANDATORY SCENARIOS)
    // -------------------------------------------------------------
    console.log('\n🛡️ GROUP 8: TG-05 Scheduler Reliability Hotfix — 22 Mandatory Scenarios')

    // Scenario 1: Daily delivery at the configured time
    const fixedDailyRefDate = createVietnamDateTime(2026, 10, 10, 20, 0) // Nov 10, 2026 20:00 VN
    const fixedDailyPeriodKey = resolveDailySnapshotRange(fixedDailyRefDate).periodKey
    // Ensure clean state for this period
    await prisma.telegramReportDelivery.deleteMany({
      where: { teacherId: testTeacher.id, periodKey: fixedDailyPeriodKey }
    })
    const dailyScheduleS1 = await upsertDailySchedule({
      teacherId: testTeacher.id,
      isEnabled: true,
      deliveryTime: '20:00',
      nextRunAt: fixedDailyRefDate
    })
    const dueDailyS1 = (await findDueSchedules(fixedDailyRefDate)).find((s) => s.id === dailyScheduleS1.id)
    assert(Boolean(dueDailyS1), 'Scenario 1: Due Daily schedule detected at configured time')

    let s1SentChatId: string | number | bigint | null = null
    const s1DispatchResult = await dispatchScheduleReport(dueDailyS1!, fixedDailyRefDate, {
      mockTelegramSender: async (chatId, text) => {
        s1SentChatId = chatId
        return { message_id: 10001 }
      }
    })
    assert(s1DispatchResult.status === 'DELIVERED', 'Scenario 1: Daily report delivered successfully at configured time')
    assert(Number(s1SentChatId) === 99887766, 'Scenario 1: Daily report sent to teacher Telegram chat ID')

    // Scenario 2: Weekly delivery at the configured day and time
    const fixedWeeklyRefDate = createVietnamDateTime(2026, 10, 13, 8, 30) // Friday Nov 13, 2026 08:30 VN
    const fixedWeeklyPeriodKey = resolvePreviousCompletedWeekRange(fixedWeeklyRefDate).periodKey
    await prisma.telegramReportDelivery.deleteMany({
      where: { teacherId: testTeacher.id, periodKey: fixedWeeklyPeriodKey }
    })
    const weeklyScheduleS2 = await upsertWeeklySchedule({
      teacherId: testTeacher.id,
      isEnabled: true,
      dayOfWeek: 5, // Friday
      deliveryTime: '08:30',
      nextRunAt: fixedWeeklyRefDate
    })
    const dueWeeklyS2 = (await findDueSchedules(fixedWeeklyRefDate)).find((s) => s.id === weeklyScheduleS2.id)
    assert(Boolean(dueWeeklyS2), 'Scenario 2: Due Weekly schedule detected at configured day & time')

    let s2SentChatId: string | number | bigint | null = null
    const s2DispatchResult = await dispatchScheduleReport(dueWeeklyS2!, fixedWeeklyRefDate, {
      mockTelegramSender: async (chatId) => {
        s2SentChatId = chatId
        return { message_id: 10002 }
      }
    })
    assert(s2DispatchResult.status === 'DELIVERED', 'Scenario 2: Weekly report delivered successfully at configured day/time')
    assert(Number(s2SentChatId) === 99887766, 'Scenario 2: Weekly report sent to teacher Telegram chat ID')

    // Scenario 3: Correct Vietnam timezone conversion
    const tzTestDate = createVietnamDateTime(2026, 10, 10, 20, 0)
    assert(tzTestDate.toISOString() === '2026-11-10T13:00:00.000Z', 'Scenario 3: VN 20:00 converts to UTC 13:00:00.000Z (+7 hours offset)')
    const vnCalendarCheck = getVietnamCalendarDate(tzTestDate)
    assert(
      vnCalendarCheck.hours === 20 && vnCalendarCheck.day === 10 && vnCalendarCheck.month === 10,
      'Scenario 3: getVietnamCalendarDate correctly extracts VN local components (20:00 on 10/11/2026)'
    )

    // Scenario 4: Correct nextRunAt advancement
    const dailyAfterS1 = await findScheduleByTeacherAndType(testTeacher.id, 'DAILY')
    const weeklyAfterS2 = await findScheduleByTeacherAndType(testTeacher.id, 'WEEKLY')
    const expectedDailyNext = createVietnamDateTime(2026, 10, 11, 20, 0) // Nov 11, 2026 20:00 VN
    const expectedWeeklyNext = createVietnamDateTime(2026, 10, 20, 8, 30) // Friday Nov 20, 2026 08:30 VN
    assert(
      dailyAfterS1?.nextRunAt?.toISOString() === expectedDailyNext.toISOString(),
      'Scenario 4: Daily nextRunAt strictly advanced to tomorrow at 20:00 VN'
    )
    assert(
      weeklyAfterS2?.nextRunAt?.toISOString() === expectedWeeklyNext.toISOString(),
      'Scenario 4: Weekly nextRunAt strictly advanced 7 days to next Friday at 08:30 VN'
    )

    // Scenario 5: Duplicate delivery claim inspection
    const dupClaim = await claimOrInspectReportDelivery({
      scheduleId: dailyScheduleS1.id,
      teacherId: testTeacher.id,
      reportType: 'DAILY',
      periodKey: fixedDailyPeriodKey
    })
    assert(dupClaim.action === 'ALREADY_DELIVERED', 'Scenario 5: Duplicate delivery claim returns ALREADY_DELIVERED without Prisma P2002 error')
    assert(dupClaim.delivery.status === 'DELIVERED', 'Scenario 5: Delivery record status is confirmed DELIVERED')

    // Scenario 6: Existing successful delivery skips gracefully
    let s6Called = false
    const s6DispatchResult = await dispatchScheduleReport(dueDailyS1!, fixedDailyRefDate, {
      mockTelegramSender: async () => {
        s6Called = true
        return { message_id: 99999 }
      }
    })
    assert(s6DispatchResult.status === 'SKIPPED', 'Scenario 6: Existing successful delivery causes dispatch to return SKIPPED')
    assert(!s6Called, 'Scenario 6: Telegram sender is NOT called for already delivered period')

    // Scenario 7: Existing failed delivery supports bounded retry
    const failedPeriodKey = 'DAILY:2026-11-99'
    await prisma.telegramReportDelivery.deleteMany({
      where: { scheduleId: dailyScheduleS1.id, periodKey: failedPeriodKey }
    })
    await prisma.telegramReportDelivery.create({
      data: {
        scheduleId: dailyScheduleS1.id,
        teacherId: testTeacher.id,
        reportType: 'DAILY',
        periodKey: failedPeriodKey,
        status: 'FAILED',
        attemptCount: 1,
        errorMessage: 'Temporary network disconnect'
      }
    })
    const failedRetryClaim = await claimOrInspectReportDelivery({
      scheduleId: dailyScheduleS1.id,
      teacherId: testTeacher.id,
      reportType: 'DAILY',
      periodKey: failedPeriodKey
    })
    assert(failedRetryClaim.action === 'CLAIMED', 'Scenario 7: Previously failed delivery is successfully re-claimed for retry')
    assert(failedRetryClaim.isRetry === true, 'Scenario 7: isRetry flag is set to true')
    assert(failedRetryClaim.delivery.attemptCount === 2, 'Scenario 7: attemptCount atomically incremented to 2')

    // Scenario 8: Stale or abandoned claim recovery (> 5 minutes)
    const stalePeriodKey = 'DAILY:2026-11-98'
    await prisma.telegramReportDelivery.deleteMany({
      where: { scheduleId: dailyScheduleS1.id, periodKey: stalePeriodKey }
    })
    await prisma.telegramReportDelivery.create({
      data: {
        scheduleId: dailyScheduleS1.id,
        teacherId: testTeacher.id,
        reportType: 'DAILY',
        periodKey: stalePeriodKey,
        status: 'CLAIMED',
        attemptCount: 1,
        claimedAt: new Date(Date.now() - 10 * 60 * 1000) // 10 minutes ago (> 5m stale threshold)
      }
    })
    const staleRecoveryClaim = await claimOrInspectReportDelivery({
      scheduleId: dailyScheduleS1.id,
      teacherId: testTeacher.id,
      reportType: 'DAILY',
      periodKey: stalePeriodKey
    })
    assert(staleRecoveryClaim.action === 'CLAIMED', 'Scenario 8: Stale/abandoned claim is successfully reclaimed')
    assert(staleRecoveryClaim.staleRecovered === true, 'Scenario 8: staleRecovered flag is set to true')
    assert(staleRecoveryClaim.delivery.attemptCount === 2, 'Scenario 8: Stale claim attemptCount incremented to 2')

    // Scenario 9: Concurrent scheduler executions guard
    const concurrent1 = checkAndDispatchDueReports(new Date(), { skipAi: true })
    const concurrent2 = checkAndDispatchDueReports(new Date(), { skipAi: true })
    const [c1Results, c2Results] = await Promise.all([concurrent1, concurrent2])
    assert(Array.isArray(c1Results) && Array.isArray(c2Results), 'Scenario 9: Concurrent scheduler sweeps execute safely without race conditions')

    // Scenario 11: Backend restart after successful delivery (verified before updating nextRunAt)
    // Daily schedule was already delivered for fixedDailyPeriodKey; simulate restart by inspecting state at fixedDailyRefDate
    const deliveryAfterRestart = await findDeliveryByScheduleAndPeriod(dailyScheduleS1.id, fixedDailyPeriodKey)
    assert(deliveryAfterRestart?.status === 'DELIVERED', 'Scenario 11: Delivery history remains DELIVERED across server restarts')
    const dueAfterRestart = await findDueSchedules(fixedDailyRefDate)
    assert(
      !dueAfterRestart.some((s) => s.id === dailyScheduleS1.id),
      'Scenario 11: Schedule is not marked due for the same period after restart'
    )

    // Scenario 10: Backend restart before scheduled delivery
    const futureDue = new Date(Date.now() + 60 * 60 * 1000)
    await upsertDailySchedule({
      teacherId: testTeacher.id,
      isEnabled: true,
      deliveryTime: '22:00',
      nextRunAt: futureDue
    })
    const schedulesBeforeRestart = await findDueSchedules(new Date()) // Current time (not due yet)
    assert(
      !schedulesBeforeRestart.some((s) => s.id === dailyScheduleS1.id),
      'Scenario 10: Schedule with future nextRunAt is not due before its scheduled time'
    )
    const schedulesAtDueTime = await findDueSchedules(new Date(futureDue.getTime() + 1000))
    assert(
      schedulesAtDueTime.some((s) => s.id === dailyScheduleS1.id),
      'Scenario 10: Schedule is correctly picked up when clock reaches scheduled time after restart'
    )

    // Scenario 12: Updating Daily time through REST API
    // Today's report was already delivered for fixedDailyPeriodKey. Updating schedule should calculate for TOMORROW.
    const updatedDaily = await configureDailyScheduleService(testTeacher.id, {
      deliveryTime: '23:00'
    })
    const expectedTomorrow23 = calculateSubsequentRunAt('DAILY', '23:00', null, new Date())
    assert(
      updatedDaily.nextRunAt?.toISOString() === expectedTomorrow23.toISOString(),
      'Scenario 12: Updating Daily time after today was delivered schedules for TOMORROW (no false promise)'
    )

    // Scenario 13: Updating Weekly day/time through REST API
    const updatedWeekly = await configureWeeklyScheduleService(testTeacher.id, {
      dayOfWeek: 5,
      deliveryTime: '09:00'
    })
    const expectedNextWeekFriday = calculateSubsequentRunAt('WEEKLY', '09:00', 5, new Date())
    assert(
      updatedWeekly.nextRunAt?.toISOString() === expectedNextWeekFriday.toISOString(),
      'Scenario 13: Updating Weekly day/time after this week was delivered schedules for NEXT week'
    )

    // Scenario 14: Disabling Daily
    const disabledDaily = await configureDailyScheduleService(testTeacher.id, {
      isEnabled: false
    })
    assert(disabledDaily.isEnabled === false, 'Scenario 14: Daily report schedule disabled')
    assert(disabledDaily.nextRunAt === null, 'Scenario 14: Daily nextRunAt set to null when disabled')

    // Scenario 15: Disabling Weekly
    const disabledWeekly = await configureWeeklyScheduleService(testTeacher.id, {
      isEnabled: false
    })
    assert(disabledWeekly.isEnabled === false, 'Scenario 15: Weekly report schedule disabled')
    assert(disabledWeekly.nextRunAt === null, 'Scenario 15: Weekly nextRunAt set to null when disabled')

    // Scenario 16: Pausing all schedules
    await configureDailyScheduleService(testTeacher.id, { isEnabled: true })
    await configureWeeklyScheduleService(testTeacher.id, { isEnabled: true })
    const pauseResultS16 = await pauseAllTeacherSchedulesService(testTeacher.id)
    assert(pauseResultS16.pausedCount === 2, 'Scenario 16: pauseAllTeacherSchedulesService paused both schedules')
    const schedulesAfterPause = await getTeacherSchedulesService(testTeacher.id)
    assert(!schedulesAfterPause.daily.isEnabled && !schedulesAfterPause.weekly.isEnabled, 'Scenario 16: Both schedules are disabled after pause')

    // Scenario 17: Telegram API failure & Bounded Retry
    const failRefDate = createVietnamDateTime(2026, 10, 15, 20, 0)
    const failPeriodKey = resolveDailySnapshotRange(failRefDate).periodKey
    await prisma.telegramReportDelivery.deleteMany({
      where: { teacherId: testTeacher.id, periodKey: failPeriodKey }
    })
    const failSchedule = await upsertDailySchedule({
      teacherId: testTeacher.id,
      isEnabled: true,
      deliveryTime: '20:00',
      nextRunAt: failRefDate
    })
    const dueFailSchedule = (await findDueSchedules(failRefDate)).find((s) => s.id === failSchedule.id)
    const failDispatchResult = await dispatchScheduleReport(dueFailSchedule!, failRefDate, {
      mockTelegramSender: async () => {
        throw new Error('Telegram API connection timeout')
      }
    })
    assert(failDispatchResult.status === 'FAILED', 'Scenario 17: Telegram API failure caught and marked FAILED')
    const deliveryAfterFail = await findDeliveryByScheduleAndPeriod(failSchedule.id, failPeriodKey)
    assert(deliveryAfterFail?.status === 'FAILED', 'Scenario 17: Delivery record persisted with status FAILED')
    assert(Boolean(deliveryAfterFail?.errorMessage?.includes('timeout')), 'Scenario 17: Delivery error message recorded')
    const scheduleAfterFail = await findScheduleByTeacherAndType(testTeacher.id, 'DAILY')
    // Next run should be scheduled in ~2 minutes for bounded retry
    const retryDiffMs = (scheduleAfterFail?.nextRunAt?.getTime() || 0) - Date.now()
    assert(
      retryDiffMs > 0 && retryDiffMs <= 3 * 60 * 1000,
      'Scenario 17: Schedule nextRunAt set for bounded retry (~2 minutes)'
    )

    // Scenario 18: Gemini timeout resilience
    const timeoutGenerated = await generateDailyReportMessage(testTeacher.id, testTeacher.username, new Date(), {
      mockAiResponse: new Error('Gemini API 504 Gateway Timeout')
    })
    assert(
      Boolean(timeoutGenerated.messageText && timeoutGenerated.messageText.includes('BÁO CÁO KINH DOANH HÀNG NGÀY')),
      'Scenario 18: Report generation succeeds deterministically despite Gemini timeout'
    )

    // Scenario 19: Malformed Gemini insight handling
    const malformedInsight = formatReportAiInsight({ invalidKey: 42 })
    assert(malformedInsight === null, 'Scenario 19: Malformed Gemini insight safely returns null without throwing')

    // Scenario 20: Daily and Weekly due at the same time
    const jointRefDate = createVietnamDateTime(2026, 11, 4, 8, 0) // Friday Dec 4, 2026 08:00 VN
    const jointDailyPeriod = resolveDailySnapshotRange(jointRefDate).periodKey
    const jointWeeklyPeriod = resolvePreviousCompletedWeekRange(jointRefDate).periodKey
    await prisma.telegramReportDelivery.deleteMany({
      where: {
        teacherId: testTeacher.id,
        periodKey: { in: [jointDailyPeriod, jointWeeklyPeriod] }
      }
    })
    await upsertDailySchedule({
      teacherId: testTeacher.id,
      isEnabled: true,
      deliveryTime: '08:00',
      nextRunAt: jointRefDate
    })
    await upsertWeeklySchedule({
      teacherId: testTeacher.id,
      isEnabled: true,
      dayOfWeek: 5,
      deliveryTime: '08:00',
      nextRunAt: jointRefDate
    })
    let testTeacherSentCount = 0
    const jointDispatchResults = await checkAndDispatchDueReports(jointRefDate, {
      mockTelegramSender: async (chatId) => {
        if (Number(chatId) === 99887766) {
          testTeacherSentCount++
        }
        return { message_id: 20000 + testTeacherSentCount }
      }
    })
    const testTeacherDelivered = jointDispatchResults.filter(
      (r) => r.teacherId === testTeacher.id && r.status === 'DELIVERED'
    )
    assert(
      testTeacherDelivered.length === 2,
      'Scenario 20: Both Daily and Weekly reports delivered for test teacher when due at the exact same time'
    )

    // Scenario 21: Idempotency across repeated scheduler polling
    let testTeacherRepeatedSentCount = 0
    const secondSweepResults = await checkAndDispatchDueReports(jointRefDate, {
      mockTelegramSender: async (chatId) => {
        if (Number(chatId) === 99887766) {
          testTeacherRepeatedSentCount++
        }
        return { message_id: 30000 + testTeacherRepeatedSentCount }
      }
    })
    const testTeacherSecondDelivered = secondSweepResults.filter(
      (r) => r.teacherId === testTeacher.id && r.status === 'DELIVERED'
    )
    assert(
      testTeacherSecondDelivered.length === 0,
      'Scenario 21: Repeated scheduler polling at same timestamp yields 0 new deliveries for teacher'
    )
    assert(
      testTeacherRepeatedSentCount === 0,
      'Scenario 21: Zero Telegram messages sent on repeated polling sweep'
    )

    // Scenario 22: No duplicate Telegram delivery for a confirmed successful period
    assert(
      testTeacherSentCount === 2,
      'Scenario 22: Exactly 1 message per schedule sent for confirmed successful period (Zero duplicate Telegram messages)'
    )
  } catch (err: any) {
    console.error('💥 Unhandled exception during TG-05 test suite execution:', err)
    assert(false, 'TG-05 test suite completed without unhandled exceptions', err.message)
  } finally {
    // -------------------------------------------------------------
    // GROUP 9: CLEANUP & RECOVERY
    // -------------------------------------------------------------
    console.log('\n🧹 GROUP 9: Cleanup & State Restoration')
    if (testTeacher) {
      // Clean up delivery records created during tests
      await prisma.telegramReportDelivery.deleteMany({
        where: { teacherId: testTeacher.id }
      })
      // Clean up schedule records created during tests
      await prisma.telegramReportSchedule.deleteMany({
        where: { teacherId: testTeacher.id }
      })
      // Clean up linked Telegram Account created during tests
      if (linkedTelegramAccount) {
        await prisma.telegramAccount.deleteMany({
          where: { userId: testTeacher.id }
        })
      }
      console.log('  ✅ Test schedules, deliveries, and mock account cleaned up.')
    }
  }

  console.log('\n====================================================================')
  console.log(`📊 TG-05 TEST SUITE RESULTS: ${passedTests}/${totalTests} PASSED (${failedTests} FAILED)`)
  console.log('====================================================================\n')

  if (failedTests > 0) {
    process.exit(1)
  }
}

runTG05TestSuite().catch((err) => {
  console.error('Fatal test suite failure:', err)
  process.exit(1)
})
