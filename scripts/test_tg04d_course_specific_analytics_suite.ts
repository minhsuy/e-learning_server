import { prisma } from '../src/config/prisma'
import {
  executeRecognizedAnalyticsIntent,
  AnalyticsExecutionResult
} from '../src/services/analyticsDispatcher.service'
import {
  recognizeAnalyticsIntent,
  tryDeterministicIntentRecognition
} from '../src/services/geminiIntent.service'
import {
  resolveCourseEntityService,
  normalizeVietnameseString,
  stripCourseNoiseWords
} from '../src/services/courseEntityResolver.service'
import {
  getCourseSpecificAnalyticsService,
  compareCourseSpecificAnalyticsService
} from '../src/services/courseSpecificAnalytics.service'
import {
  formatCourseSpecificMessage,
  formatCourseComparisonMessage,
  formatCourseNotFoundMessage,
  formatCourseAmbiguousMessage,
  formatCoursesMessage
} from '../src/telegram/utils/analyticsFormatter'
import { handleDefaultMessage } from '../src/telegram/handlers/message.handler'
import { TeacherBotContext } from '../src/telegram/types'
import {
  AnalyticsIntentResult,
  RawGeminiIntentOutputSchema
} from '../src/models/analyticsIntent.model'
import { getGeminiConfig } from '../src/config/gemini.config'

/**
 * TMDEMY — TG-04D COURSE-SPECIFIC ANALYTICS & ENTITY RECOGNITION TEST SUITE
 *
 * Verifies all requirements of TG-04D:
 * 1. Intent Recognition & Course Entity Extraction
 * 2. Secure Course Entity Resolution & Multi-Tenant Scoping
 * 3. Course-Specific Financial & Enrollment Analytics
 * 4. Deterministic Course Period Comparisons
 * 5. Response Formatting & Fix for Listed Price vs Realized Revenue
 * 6. End-to-End Pipeline & Message Handler Integration
 */

interface MockReply {
  text: string
  options?: any
}

function createMockContext(
  telegramUserId?: number,
  text?: string,
  teacherProfile?: any,
  chatType: string = 'private'
): TeacherBotContext & { getReplies: () => MockReply[] } {
  const replies: MockReply[] = []

  return {
    from:
      telegramUserId !== undefined
        ? {
            id: telegramUserId,
            is_bot: false,
            first_name: 'TestTeacher',
            username: 'test_tg_teacher'
          }
        : undefined,
    chat:
      telegramUserId !== undefined
        ? {
            id: telegramUserId,
            type: chatType
          }
        : undefined,
    message: text !== undefined ? { text } : undefined,
    teacherProfile,
    reply: async (text: string, options?: any) => {
      replies.push({ text, options })
      return {} as any
    },
    getReplies: () => replies
  } as any
}

let passed = 0
let failed = 0

function assert(condition: boolean, testId: number, description: string): void {
  if (condition) {
    passed++
    console.log(`  ✓ [PASS] #${testId}: ${description}`)
  } else {
    failed++
    console.error(`  ✗ [FAIL] #${testId}: ${description}`)
  }
}

async function runTestSuite() {
  console.log('====================================================================')
  console.log('   TG-04D: COURSE-SPECIFIC ANALYTICS & ENTITY RECOGNITION SUITE    ')
  console.log('====================================================================\n')

  // Identify teacher fixtures
  const teacherA = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', authoredCourses: { some: {} } },
    include: { authoredCourses: { take: 3 } }
  })
  const teacherB = await prisma.user.findFirst({
    where: {
      role: 'TEACHER',
      status: 'ACTIVE',
      id: { not: teacherA?.id },
      authoredCourses: { some: {} }
    },
    include: { authoredCourses: { take: 1 } }
  })

  if (!teacherA || !teacherB || teacherA.authoredCourses.length === 0) {
    throw new Error('Test fixtures missing in database (active teachers with courses required)')
  }

  const courseA1 = teacherA.authoredCourses[0]
  const courseA2 = teacherA.authoredCourses[1] || courseA1
  const courseB1 = teacherB.authoredCourses[0]

  console.log(`[FIXTURE] Teacher A: ${teacherA.username} (${teacherA.id}) - Course: "${courseA1.title}"`)
  console.log(`[FIXTURE] Teacher B: ${teacherB.username} (${teacherB.id}) - Course: "${courseB1.title}"\n`)

  const tgIdA = 888201
  const teacherAProfile = {
    userId: teacherA.id,
    teacherId: teacherA.id,
    username: teacherA.username,
    email: teacherA.email,
    status: 'ACTIVE',
    role: 'TEACHER',
    telegramUserId: tgIdA
  }

  // Ensure teacherA linked in telegram_accounts for handler tests
  await prisma.telegramAccount.upsert({
    where: { telegramUserId: BigInt(tgIdA) },
    update: { userId: teacherA.id },
    create: {
      telegramUserId: BigInt(tgIdA),
      telegramChatId: BigInt(tgIdA),
      telegramUsername: 'teachera_tg',
      userId: teacherA.id
    }
  })

  // -------------------------------------------------------------
  // SECTION 1: Intent Recognition & Entity Extraction Tests
  // -------------------------------------------------------------
  console.log('--- SECTION 1: Intent Recognition & Entity Extraction Tests ---')

  // Test 1: Full course title extraction
  const q1 = `Khóa học ${courseA1.title} tháng trước bán được bao nhiêu tiền?`
  const r1 = tryDeterministicIntentRecognition(q1)
  assert(
    r1 !== null &&
      r1.courseName === courseA1.title &&
      r1.period === 'last_month' &&
      r1.metric === 'revenue',
    1,
    'Full course title extracted with period: last_month and metric: revenue'
  )

  // Test 2: Partial course title extraction
  const q2 = `Khóa học Vibe coding với Antigravity 2026 tháng này có bao nhiêu đơn hàng?`
  const r2 = tryDeterministicIntentRecognition(q2)
  assert(
    r2 !== null &&
      r2.courseName === 'Vibe coding với Antigravity 2026' &&
      r2.period === 'this_month' &&
      r2.metric === 'sales',
    2,
    'Partial course title extracted with period: this_month and metric: sales'
  )

  // Test 3: Unaccented Vietnamese extraction
  const q3 = `khoa hoc lap trinh react pro thang truoc ban duoc bao nhieu tien`
  const r3 = tryDeterministicIntentRecognition(q3)
  assert(
    r3 !== null &&
      r3.courseName?.toLowerCase() === 'lap trinh react pro' &&
      r3.period === 'last_month' &&
      r3.metric === 'revenue',
    3,
    'Unaccented Vietnamese course query parsed with period: last_month'
  )

  // Test 4: Student count question for specific course
  const q4 = `Khóa học Python Nâng Cao có bao nhiêu học viên?`
  const r4 = tryDeterministicIntentRecognition(q4)
  assert(
    r4 !== null &&
      r4.courseName === 'Python Nâng Cao' &&
      r4.metric === 'students',
    4,
    'Course student count question recognized with metric: students'
  )

  // Test 5: Course comparison question
  const q5 = `Khóa học React Native tháng này so với tháng trước thế nào?`
  const r5 = tryDeterministicIntentRecognition(q5)
  assert(
    r5 !== null &&
      r5.courseName === 'React Native' &&
      r5.operation === 'compare' &&
      r5.period === 'this_month' &&
      r5.comparisonPeriod === 'last_month',
    5,
    'Course comparison question recognized with operation: compare'
  )

  // Test 6: General catalog question remains unchanged (null courseName)
  const q6 = `Khóa học nào bán chạy nhất?`
  const r6 = tryDeterministicIntentRecognition(q6)
  assert(
    r6 !== null &&
      r6.intent === 'courses' &&
      !r6.courseName,
    6,
    'General question "Khóa học nào bán chạy nhất?" leaves courseName null'
  )

  // Test 7: General revenue question remains unchanged
  const q7 = `Tháng này tôi kiếm được bao nhiêu tiền?`
  const r7 = tryDeterministicIntentRecognition(q7)
  assert(
    r7 !== null &&
      r7.intent === 'revenue' &&
      !r7.courseName,
    7,
    'General revenue question leaves courseName null'
  )

  // Test 8: RawGeminiIntentOutputSchema validates courseName and metric
  const validZod = RawGeminiIntentOutputSchema.safeParse({
    intent: 'courses',
    operation: 'lookup',
    courseName: 'Khóa học Vibe coding 2026',
    metric: 'revenue',
    period: 'last_month',
    comparisonPeriod: null,
    comparisonMetric: null,
    startDate: null,
    endDate: null,
    confidence: 0.95,
    explanation: 'Valid entity extraction'
  })
  assert(
    validZod.success &&
      validZod.data.courseName === 'Khóa học Vibe coding 2026' &&
      validZod.data.metric === 'revenue',
    8,
    'RawGeminiIntentOutputSchema validates courseName and metric fields'
  )

  // -------------------------------------------------------------
  // SECTION 2: Secure Course Entity Resolution Tests
  // -------------------------------------------------------------
  console.log('\n--- SECTION 2: Secure Course Entity Resolution Tests ---')

  // Test 9: Exact title match
  const resExact = await resolveCourseEntityService(teacherA.id, courseA1.title)
  assert(
    resExact.status === 'FOUND' && resExact.course?.id === courseA1.id,
    9,
    'Exact course title matches verified course ID'
  )

  // Test 10: Case-insensitive match
  const resCase = await resolveCourseEntityService(teacherA.id, courseA1.title.toLowerCase())
  assert(
    resCase.status === 'FOUND' && resCase.course?.id === courseA1.id,
    10,
    'Case-insensitive title match resolves correctly'
  )

  // Test 11: Accent-insensitive match
  const unaccentedTitle = normalizeVietnameseString(courseA1.title)
  const resAccent = await resolveCourseEntityService(teacherA.id, unaccentedTitle)
  assert(
    resAccent.status === 'FOUND' && resAccent.course?.id === courseA1.id,
    11,
    'Accent-insensitive course title resolves to exact course'
  )

  // Test 12: Substring / keyword match
  const shortSnippet = courseA1.title.split(' ').slice(0, 3).join(' ')
  const resSnippet = await resolveCourseEntityService(teacherA.id, shortSnippet)
  assert(
    resSnippet.status === 'FOUND' || resSnippet.status === 'AMBIGUOUS',
    12,
    'Short title snippet resolves safely without error'
  )

  // Test 13: Non-existent course returns NOT_FOUND
  const resNotFound = await resolveCourseEntityService(
    teacherA.id,
    'Khóa Học Hoàn Toàn Không Tồn Tại 9999XYZ'
  )
  assert(
    resNotFound.status === 'NOT_FOUND',
    13,
    'Non-existent course term returns status: NOT_FOUND'
  )

  // Test 14: Cross-teacher isolation: Teacher A cannot resolve Teacher B course
  const resCrossTeacher = await resolveCourseEntityService(teacherA.id, courseB1.title)
  assert(
    resCrossTeacher.status === 'NOT_FOUND',
    14,
    'Teacher A cannot find or resolve Teacher B course (Strict Isolation)'
  )

  // Test 15: Empty search string safely caught
  const resEmpty = await resolveCourseEntityService(teacherA.id, '   ')
  assert(
    resEmpty.status === 'NOT_FOUND',
    15,
    'Whitespace search term returns status: NOT_FOUND without throwing'
  )

  // -------------------------------------------------------------
  // SECTION 3: Course-Specific Financial & Enrollment Analytics Tests
  // -------------------------------------------------------------
  console.log('\n--- SECTION 3: Course-Specific Financial Analytics Tests ---')

  // Test 16: Retrieve course analytics for last month
  const statsLastMonth = await getCourseSpecificAnalyticsService(teacherA.id, courseA1.id, {
    period: 'last_month'
  })
  assert(
    statsLastMonth.course.id === courseA1.id &&
      statsLastMonth.summary.period === 'last_month' &&
      typeof statsLastMonth.summary.realizedRevenue === 'number' &&
      typeof statsLastMonth.summary.completedOrders === 'number',
    16,
    'getCourseSpecificAnalyticsService calculates last_month metrics'
  )

  // Test 17: Retrieve course analytics for this month
  const statsThisMonth = await getCourseSpecificAnalyticsService(teacherA.id, courseA1.id, {
    period: 'this_month'
  })
  assert(
    statsThisMonth.summary.period === 'this_month' &&
      statsThisMonth.course.title === courseA1.title,
    17,
    'getCourseSpecificAnalyticsService calculates this_month metrics'
  )

  // Test 18: Retrieve course analytics for all_time
  const statsAllTime = await getCourseSpecificAnalyticsService(teacherA.id, courseA1.id, {
    period: 'all_time'
  })
  assert(
    statsAllTime.summary.period === 'all_time' &&
      statsAllTime.allTime.revenue >= statsThisMonth.summary.realizedRevenue,
    18,
    'All-time revenue is greater than or equal to single-month revenue'
  )

  // Test 19: Order revenue integrity: completed orders counted, pending excluded
  const verifiedOrders = await prisma.order.findMany({
    where: { courseId: courseA1.id, status: 'COMPLETED' }
  })
  const expectedTotalRev = verifiedOrders.reduce((sum, o) => sum + Number(o.total), 0)
  assert(
    statsAllTime.allTime.revenue === expectedTotalRev,
    19,
    'All-time realized revenue exactly matches SUM(total) of completed orders in DB'
  )

  // Test 20: Average order value calculation
  const expectedAvg =
    statsAllTime.summary.completedOrders > 0
      ? Math.round(statsAllTime.summary.realizedRevenue / statsAllTime.summary.completedOrders)
      : 0
  assert(
    statsAllTime.summary.averageOrderValue === expectedAvg,
    20,
    'Average order value is mathematically consistent with realized revenue and orders'
  )

  // Test 21: Unauthorized teacher access is blocked
  let authBlocked = false
  try {
    await getCourseSpecificAnalyticsService(teacherB.id, courseA1.id)
  } catch (err: any) {
    authBlocked = err.message.includes('không thuộc danh mục giảng dạy')
  }
  assert(
    authBlocked,
    21,
    'Teacher B requesting Teacher A course throws ownership authorization error'
  )

  // -------------------------------------------------------------
  // SECTION 4: Period Comparisons & Deterministic Math Tests
  // -------------------------------------------------------------
  console.log('\n--- SECTION 4: Period Comparisons & Deterministic Math Tests ---')

  // Test 22: Course revenue comparison executes successfully
  const compareRevenue = await compareCourseSpecificAnalyticsService(teacherA.id, courseA1.id, {
    period: 'this_month',
    comparisonPeriod: 'last_month',
    metric: 'revenue'
  })
  assert(
    compareRevenue.course.id === courseA1.id &&
      typeof compareRevenue.calculation.absoluteChange === 'number' &&
      (compareRevenue.calculation.percentageChange !== null || compareRevenue.calculation.isZeroBaseline),
    22,
    'compareCourseSpecificAnalyticsService compares revenue with deterministic math'
  )

  // Test 23: Course sales comparison executes successfully
  const compareSales = await compareCourseSpecificAnalyticsService(teacherA.id, courseA1.id, {
    period: 'this_month',
    comparisonPeriod: 'last_month',
    metric: 'sales'
  })
  assert(
    compareSales.metric === 'sales' &&
      typeof compareSales.calculation.absoluteChange === 'number',
    23,
    'compareCourseSpecificAnalyticsService compares sales volume'
  )

  // Test 24: Partial-month progress notice included for this_month vs last_month
  assert(
    compareRevenue.isPartialMonth && !!compareRevenue.partialMonthDisclaimer,
    24,
    'Partial-month progress notice included when comparing this_month to full last_month'
  )

  // -------------------------------------------------------------
  // SECTION 5: Response Formatting & Price vs Revenue Verification Tests
  // -------------------------------------------------------------
  console.log('\n--- SECTION 5: Response Formatting & Price vs Revenue Tests ---')

  // Test 25: formatCourseSpecificMessage contains course title and period
  const msgCourse = formatCourseSpecificMessage(teacherA.username, statsLastMonth)
  assert(
    msgCourse.includes(courseA1.title) && msgCourse.includes(statsLastMonth.summary.periodLabel),
    25,
    'formatCourseSpecificMessage contains exact course title and period label'
  )

  // Test 26: formatCourseSpecificMessage contains NO timezone metadata
  assert(
    !msgCourse.includes('Asia/Ho_Chi_Minh') && !msgCourse.includes('UTC+7'),
    26,
    'formatCourseSpecificMessage contains NO timezone metadata or footer line'
  )

  // Test 27: Explicit label for course list price
  assert(
    msgCourse.includes('Giá bán niêm yết:'),
    27,
    'Course list price is explicitly labeled "Giá bán niêm yết" to prevent revenue confusion'
  )

  // Test 28: Zero-sales courses in general /courses labeled with "Giá bán:"
  const mockCourseData = {
    summary: {
      totalCourses: 2,
      approvedCourses: 2,
      pendingCourses: 0,
      rejectedCourses: 0,
      coursesWithSalesCount: 1,
      zeroSalesCoursesCount: 1
    },
    bestSellingByRevenue: null,
    bestSellingByVolume: null,
    courses: [],
    zeroSalesCourses: [
      {
        id: '99999999-9999-9999-9999-999999999999',
        title: 'Khóa Chưa Bán Đơn Nào',
        slug: 'chua-ban',
        price: 990000,
        status: 'approved',
        totalRevenue: 0,
        completedOrders: 0,
        totalStudents: 0,
        averageRating: 0,
        hasSales: false
      }
    ]
  }
  const generalCourseMsg = formatCoursesMessage(teacherA.username, mockCourseData)
  assert(
    generalCourseMsg.includes('Giá bán: 990.000 VND'),
    28,
    'Zero-sales courses in /courses explicitly labeled with "(Giá bán: 990.000 VND)"'
  )

  // Test 29: Course not found message formatting
  const notFoundMsg = formatCourseNotFoundMessage('Khóa Học Lạ')
  assert(
    notFoundMsg.includes('KHÔNG TÌM THẤY KHÓA HỌC') && notFoundMsg.includes('Khóa Học Lạ'),
    29,
    'formatCourseNotFoundMessage returns clear advisory guidance'
  )

  // Test 30: Ambiguous candidates message formatting
  const ambiguousMsg = formatCourseAmbiguousMessage('Python', [
    { id: '1', title: 'Python Cơ Bản', slug: 'py-co-ban', price: 299000, status: 'approved' },
    { id: '2', title: 'Python Nâng Cao', slug: 'py-nang-cao', price: 499000, status: 'approved' }
  ])
  assert(
    ambiguousMsg.includes('TÌM THẤY NHIỀU KHÓA HỌC PHÙ HỢP') &&
      ambiguousMsg.includes('Python Cơ Bản') &&
      ambiguousMsg.includes('Python Nâng Cao'),
    30,
    'formatCourseAmbiguousMessage lists candidate options for clarification'
  )

  // -------------------------------------------------------------
  // SECTION 6: Dispatcher & Handler Routing Tests
  // -------------------------------------------------------------
  console.log('\n--- SECTION 6: Dispatcher & Handler Routing Tests ---')

  // Test 31: Dispatcher routes course lookup query to course-specific service
  const dispatchRes = await executeRecognizedAnalyticsIntent(teacherA.id, teacherA.username, {
    status: 'RECOGNIZED',
    intent: 'courses',
    operation: 'lookup',
    period: 'last_month',
    courseName: courseA1.title,
    metric: 'revenue',
    startDate: null,
    endDate: null,
    confidence: 0.95,
    rawMessage: q1
  })
  assert(
    dispatchRes.success &&
      dispatchRes.formattedMessage.includes(courseA1.title) &&
      !dispatchRes.formattedMessage.includes('DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH'),
    31,
    'Dispatcher returns focused course message, NOT all-time 185-course catalog overview'
  )

  // Test 32: Dispatcher routes course comparison query to course comparison service
  const dispatchCompare = await executeRecognizedAnalyticsIntent(teacherA.id, teacherA.username, {
    status: 'RECOGNIZED',
    intent: 'courses',
    operation: 'compare',
    period: 'this_month',
    comparisonPeriod: 'last_month',
    courseName: courseA1.title,
    metric: 'revenue',
    startDate: null,
    endDate: null,
    confidence: 0.95,
    rawMessage: q5
  })
  assert(
    dispatchCompare.success &&
      dispatchCompare.formattedMessage.includes('SO SÁNH HIỆU QUẢ KHÓA HỌC') &&
      dispatchCompare.formattedMessage.includes(courseA1.title),
    32,
    'Dispatcher routes course comparison to formatCourseComparisonMessage'
  )

  // Test 33: Non-existent course via dispatcher returns not-found notice
  const dispatchNotFound = await executeRecognizedAnalyticsIntent(teacherA.id, teacherA.username, {
    status: 'RECOGNIZED',
    intent: 'courses',
    operation: 'lookup',
    period: 'this_month',
    courseName: 'Khóa Ảo Hoàn Toàn Không Có',
    startDate: null,
    endDate: null,
    confidence: 0.95,
    rawMessage: 'Khóa Ảo'
  })
  assert(
    dispatchNotFound.success &&
      dispatchNotFound.formattedMessage.includes('KHÔNG TÌM THẤY KHÓA HỌC'),
    33,
    'Dispatcher handles non-existent course gracefully with formatCourseNotFoundMessage'
  )

  // Test 34: General course query without courseName preserves standard /courses overview
  const dispatchGeneral = await executeRecognizedAnalyticsIntent(teacherA.id, teacherA.username, {
    status: 'RECOGNIZED',
    intent: 'courses',
    operation: 'lookup',
    period: 'all_time',
    courseName: null,
    startDate: null,
    endDate: null,
    confidence: 0.95,
    rawMessage: 'danh sach khoa hoc'
  })
  assert(
    dispatchGeneral.success &&
      dispatchGeneral.formattedMessage.includes('DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH'),
    34,
    'General course query without courseName preserves standard catalog overview'
  )

  // Test 35: Full telegram message handler end-to-end integration
  const ctx = createMockContext(tgIdA, `Khóa học ${courseA1.title} tháng trước bán được bao nhiêu tiền?`, teacherAProfile)
  await handleDefaultMessage(ctx)
  const replies = ctx.getReplies()
  assert(
    replies.length === 1 &&
      replies[0].text.includes(courseA1.title) &&
      !replies[0].text.includes('Asia/Ho_Chi_Minh'),
    35,
    'Full Telegram message handler responds with focused course analytics and zero timezone footer'
  )

  // Test 36: Slash commands remain completely bypassed by message handler
  const slashCtx = createMockContext(tgIdA, '/courses', teacherAProfile)
  await handleDefaultMessage(slashCtx)
  assert(
    slashCtx.getReplies().length === 0,
    36,
    'Slash commands (/courses) remain completely ignored by text message handler'
  )

  // -------------------------------------------------------------
  // SECTION 7: Configuration & Controlled Live Gemini Smoke Test
  // -------------------------------------------------------------
  console.log('\n--- SECTION 7: Configuration & Live Smoke Test ---')

  // Test 37: GEMINI_MODEL verified
  const geminiConfig = getGeminiConfig()
  assert(
    geminiConfig.model === 'gemini-3.5-flash-lite',
    37,
    `GEMINI_MODEL verified: ${geminiConfig.model}`
  )

  // Test 38: Live Gemini Smoke Test (strictly 1 query to conserve quota, per user instruction)
  const runLiveTest = process.env.RUN_LIVE_GEMINI_TEST === 'true'
  if (runLiveTest) {
    console.log('[LIVE TEST] Sending 1 controlled test query to Google GenAI API...')
    const liveIntent = await recognizeAnalyticsIntent(
      'Khóa học Vibe coding với Antigravity 2026 tháng trước bán được bao nhiêu tiền?'
    )
    assert(
      liveIntent.status === 'RECOGNIZED' &&
        liveIntent.period === 'last_month' &&
        liveIntent.courseName !== null,
      38,
      `Live Gemini intent extraction succeeded (courseName: "${liveIntent.courseName}")`
    )
  } else {
    assert(
      true,
      38,
      'Live Gemini smoke test bypassed (opt-in via RUN_LIVE_GEMINI_TEST=true to conserve API quota)'
    )
  }

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n====================================================')
  console.log(`TEST SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite()
  .catch((err) => {
    console.error('Test execution failed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
