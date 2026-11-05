import { prisma } from '../src/config/prisma'
import {
  handleCoursesCommand,
  handleOrdersCommand,
  handleReportCommand,
  handleRevenueCommand,
  handleStudentsCommand
} from '../src/telegram/handlers/analytics.handler'
import { handleHelpCommand } from '../src/telegram/handlers/commands.handler'
import { requireTeacherAuth } from '../src/telegram/middleware/teacherAuth.middleware'
import { TeacherBotContext } from '../src/telegram/types'
import {
  escapeMarkdown,
  formatCount,
  formatCoursesMessage,
  formatOrdersMessage,
  formatReportMessage,
  formatRevenueMessage,
  formatStudentsMessage,
  formatVND
} from '../src/telegram/utils/analyticsFormatter'
import { parseDateRangeArgs } from '../src/telegram/utils/commandParser'
import { createTelegramBot, TELEGRAM_BOT_COMMANDS } from '../src/telegram/bot'

/**
 * TMDEMY — TG-03B TELEGRAM TEACHER ANALYTICS COMMANDS TEST SUITE
 *
 * Verifies all command parsers, formatters, command execution,
 * security boundaries, multi-tenant isolation, and bot registration.
 */

interface MockReply {
  text: string
  options?: any
}

function createMockContext(
  telegramUserId: number,
  matchText?: string,
  teacherProfile?: any
): TeacherBotContext & { getReplies: () => MockReply[] } {
  const replies: MockReply[] = []

  return {
    from: {
      id: telegramUserId,
      is_bot: false,
      first_name: 'TestTeacher',
      username: 'test_tg_teacher'
    },
    chat: {
      id: telegramUserId,
      type: 'private'
    },
    match: matchText,
    teacherProfile: teacherProfile ?? null,
    reply: async (text: string, options?: any) => {
      replies.push({ text, options })
      return {} as any
    },
    getReplies: () => replies
  } as unknown as TeacherBotContext & { getReplies: () => MockReply[] }
}

async function runTestSuite() {
  console.log('====================================================================')
  console.log('       TG-03B: TELEGRAM TEACHER ANALYTICS COMMANDS TEST SUITE       ')
  console.log('====================================================================\n')

  let passed = 0
  let failed = 0

  const assert = (condition: boolean, testNum: number, name: string, detail?: string) => {
    if (condition) {
      passed++
      console.log(`  ✓ [PASS] #${testNum}: ${name}`)
    } else {
      failed++
      console.error(`  ✗ [FAIL] #${testNum}: ${name}${detail ? ` (${detail})` : ''}`)
    }
  }

  // ----------------------------------------------------
  // SECTION 1: COMMAND ARGUMENT PARSER TESTS
  // ----------------------------------------------------
  console.log('--- SECTION 1: Command Argument Parser Tests ---')

  const p1 = parseDateRangeArgs(undefined, 'revenue')
  assert(p1.isValid && p1.period === 'this_month', 1, 'Default period is this_month when undefined')

  const p2 = parseDateRangeArgs('   ', 'revenue')
  assert(p2.isValid && p2.period === 'this_month', 2, 'Default period is this_month when whitespace only')

  const p3 = parseDateRangeArgs('today')
  assert(p3.isValid && p3.period === 'today', 3, 'Canonical period "today"')

  const p4 = parseDateRangeArgs('yesterday')
  assert(p4.isValid && p4.period === 'yesterday', 4, 'Canonical period "yesterday"')

  const p5 = parseDateRangeArgs('this_week')
  assert(p5.isValid && p5.period === 'this_week', 5, 'Canonical period "this_week"')

  const p6 = parseDateRangeArgs('last_7_days')
  assert(p6.isValid && p6.period === 'last_7_days', 6, 'Canonical period "last_7_days"')

  const p7 = parseDateRangeArgs('this_month')
  assert(p7.isValid && p7.period === 'this_month', 7, 'Canonical period "this_month"')

  const p8 = parseDateRangeArgs('last_month')
  assert(p8.isValid && p8.period === 'last_month', 8, 'Canonical period "last_month"')

  const p9 = parseDateRangeArgs('all_time')
  assert(p9.isValid && p9.period === 'all_time', 9, 'Canonical period "all_time"')

  const p10 = parseDateRangeArgs('hom_nay')
  assert(p10.isValid && p10.period === 'today', 10, 'Vietnamese alias "hom_nay" -> "today"')

  const p11 = parseDateRangeArgs('hom_qua')
  assert(p11.isValid && p11.period === 'yesterday', 11, 'Vietnamese alias "hom_qua" -> "yesterday"')

  const p12 = parseDateRangeArgs('tuan_nay')
  assert(p12.isValid && p12.period === 'this_week', 12, 'Vietnamese alias "tuan_nay" -> "this_week"')

  const p13 = parseDateRangeArgs('7_ngay_qua')
  assert(p13.isValid && p13.period === 'last_7_days', 13, 'Vietnamese alias "7_ngay_qua" -> "last_7_days"')

  const p14 = parseDateRangeArgs('thang_nay')
  assert(p14.isValid && p14.period === 'this_month', 14, 'Vietnamese alias "thang_nay" -> "this_month"')

  const p15 = parseDateRangeArgs('thang_truoc')
  assert(p15.isValid && p15.period === 'last_month', 15, 'Vietnamese alias "thang_truoc" -> "last_month"')

  const p16 = parseDateRangeArgs('toan_thoi_gian')
  assert(p16.isValid && p16.period === 'all_time', 16, 'Vietnamese alias "toan_thoi_gian" -> "all_time"')

  const p17 = parseDateRangeArgs('custom 2026-01-01 2026-03-31')
  assert(
    p17.isValid &&
      p17.period === 'custom' &&
      p17.options.startDate === '2026-01-01' &&
      p17.options.endDate === '2026-03-31',
    17,
    'Custom period with valid start and end dates'
  )

  const p18 = parseDateRangeArgs('2026-01-01 2026-03-31')
  assert(
    p18.isValid &&
      p18.period === 'custom' &&
      p18.options.startDate === '2026-01-01' &&
      p18.options.endDate === '2026-03-31',
    18,
    'Direct two dates without "custom" keyword'
  )

  const p19 = parseDateRangeArgs('tuy_chinh 2026-01-01 2026-03-31')
  assert(p19.isValid && p19.period === 'custom', 19, 'Vietnamese custom keyword "tuy_chinh"')

  const p20 = parseDateRangeArgs('custom 2026-01-01')
  assert(!p20.isValid && p20.errorMessage.includes('THIẾU KHOẢNG NGÀY'), 20, 'Custom period with missing end date returns error')

  const p21 = parseDateRangeArgs('custom 2026/01/01 2026-03-31')
  assert(!p21.isValid && p21.errorMessage.includes('ĐỊNH DẠNG NGÀY'), 21, 'Custom period with invalid date format returns error')

  const p22 = parseDateRangeArgs('custom 2026-03-31 2026-01-01')
  assert(!p22.isValid && p22.errorMessage.includes('KHOẢNG NGÀY KHÔNG HỢP LỆ'), 22, 'Custom period with start > end returns error')

  const p23 = parseDateRangeArgs('invalid_arg_period')
  assert(!p23.isValid && p23.errorMessage.includes('CÚ PHÁP THỜI GIAN KHÔNG HỢP LỆ'), 23, 'Unknown period returns usage guide')

  // ----------------------------------------------------
  // SECTION 2: MESSAGE FORMATTER TESTS
  // ----------------------------------------------------
  console.log('\n--- SECTION 2: Message Formatter Tests ---')

  assert(formatVND(1500000) === '1.500.000 VND', 24, 'formatVND formats integer correctly')
  assert(formatVND(1500000.45) === '1.500.000 VND', 25, 'formatVND rounds decimal amount')
  assert(formatVND(0) === '0 VND', 26, 'formatVND handles zero')
  assert(formatVND(null) === '0 VND', 27, 'formatVND handles null gracefully')
  assert(formatVND(NaN) === '0 VND', 28, 'formatVND handles NaN gracefully')

  assert(formatCount(12345) === '12.345', 29, 'formatCount formats number with thousand separators')
  assert(formatCount(0) === '0', 30, 'formatCount handles 0')

  assert(escapeMarkdown('Hello *World* [2026]') === 'Hello \\*World\\* \\[2026\\]', 31, 'escapeMarkdown escapes special Markdown characters')
  assert(escapeMarkdown(null) === '', 32, 'escapeMarkdown handles null/undefined')

  // Formatter mock checks
  const mockRevenueData: any = {
    summary: {
      period: 'this_month',
      periodLabel: 'Tháng này',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      netRevenue: 8500000,
      grossRevenue: 10000000,
      totalDiscount: 1500000,
      completedOrders: 14,
      averageOrderValue: 607142.86,
      currency: 'VND'
    },
    kpis: {
      allTimeRevenue: 50000000,
      todayRevenue: 500000,
      thisWeekRevenue: 2000000,
      thisMonthRevenue: 8500000,
      lastMonthRevenue: 7000000
    },
    timeline: [],
    byCourse: [],
    topCourses: [
      {
        courseId: '11111111-1111-1111-1111-111111111111',
        title: 'Fullstack Node.js & React',
        price: 1000000,
        soldCount: 8,
        revenue: 8000000
      }
    ]
  }

  const revMsg = formatRevenueMessage('Alex Rivers', mockRevenueData)
  assert(
    revMsg.includes('BÁO CÁO DOANH THU — THÁNG NÀY') &&
      revMsg.includes('Alex Rivers') &&
      revMsg.includes('8.500.000 VND') &&
      !revMsg.includes('undefined') &&
      !revMsg.includes('NaN'),
    33,
    'formatRevenueMessage contains expected fields and no undefined/NaN'
  )

  const emptyRevMsg = formatRevenueMessage('Empty Teacher', {
    ...mockRevenueData,
    topCourses: []
  })
  assert(emptyRevMsg.includes('Chưa có dữ liệu bán khóa học trong kỳ này'), 34, 'formatRevenueMessage handles empty topCourses gracefully')

  const mockOrderData: any = {
    summary: {
      period: 'this_month',
      periodLabel: 'Tháng này',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalOrders: 20,
      completedOrders: 16,
      pendingOrders: 3,
      rejectedOrders: 1,
      realizedRevenue: 9500000,
      pendingRevenue: 1500000,
      conversionRate: 80.0
    },
    allTimeTotalOrders: 150,
    timeline: [],
    salesByCourse: [
      {
        courseId: '11111111-1111-1111-1111-111111111111',
        title: 'Fullstack Node.js',
        totalOrders: 12,
        completedOrders: 10,
        pendingOrders: 2,
        rejectedOrders: 0,
        realizedRevenue: 6000000
      }
    ]
  }

  const ordMsg = formatOrdersMessage('Alex Rivers', mockOrderData)
  assert(
    ordMsg.includes('THỐNG KÊ ĐƠN HÀNG — THÁNG NÀY') &&
      ordMsg.includes('80.0%') &&
      ordMsg.includes('9.500.000 VND') &&
      ordMsg.includes('150') &&
      !ordMsg.includes('undefined'),
    35,
    'formatOrdersMessage contains conversion rate and realized revenue'
  )

  const mockStudentData: any = {
    summary: {
      period: 'this_month',
      periodLabel: 'Tháng này',
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      totalUniqueStudentsAllTime: 120,
      periodUniqueStudents: 25,
      newStudents: 15,
      periodEnrollments: 30,
      activeEnrollments: 20,
      completedEnrollments: 8,
      canceledEnrollments: 2
    },
    timeline: [],
    enrollmentsByCourse: []
  }

  const stuMsg = formatStudentsMessage('Alex Rivers', mockStudentData)
  assert(
    stuMsg.includes('THỐNG KÊ HỌC VIÊN — THÁNG NÀY') &&
      stuMsg.includes('120') &&
      stuMsg.includes('15') &&
      !stuMsg.includes('undefined'),
    36,
    'formatStudentsMessage contains student counts'
  )

  const mockCourseData: any = {
    summary: {
      totalCourses: 5,
      approvedCourses: 4,
      pendingCourses: 1,
      rejectedCourses: 0,
      coursesWithSalesCount: 3,
      zeroSalesCoursesCount: 2
    },
    bestSellingByRevenue: {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Top Course Rev',
      slug: 'top-course-rev',
      price: 500000,
      status: 'approved',
      totalRevenue: 5000000,
      completedOrders: 10,
      totalStudents: 10,
      averageRating: 4.8,
      hasSales: true
    },
    bestSellingByVolume: {
      id: '11111111-1111-1111-1111-111111111111',
      title: 'Top Course Vol',
      slug: 'top-course-vol',
      price: 200000,
      status: 'approved',
      totalRevenue: 3000000,
      completedOrders: 15,
      totalStudents: 15,
      averageRating: 4.9,
      hasSales: true
    },
    courses: [],
    zeroSalesCourses: [
      {
        id: '22222222-2222-2222-2222-222222222222',
        title: 'Zero Sales Course A',
        slug: 'zero-sales-a',
        price: 300000,
        status: 'approved',
        totalRevenue: 0,
        completedOrders: 0,
        totalStudents: 0,
        averageRating: 0,
        hasSales: false
      }
    ]
  }

  const crsMsg = formatCoursesMessage('Alex Rivers', mockCourseData)
  assert(
    crsMsg.includes('DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH') &&
      crsMsg.includes('Zero Sales Course A') &&
      crsMsg.includes('Top Course Rev') &&
      !crsMsg.includes('undefined'),
    37,
    'formatCoursesMessage formats course breakdown and zero sales courses'
  )

  const emptyCourseMsg = formatCoursesMessage('Alex Rivers', {
    ...mockCourseData,
    summary: {
      totalCourses: 0,
      approvedCourses: 0,
      pendingCourses: 0,
      rejectedCourses: 0,
      coursesWithSalesCount: 0,
      zeroSalesCoursesCount: 0
    },
    courses: [],
    zeroSalesCourses: []
  })
  assert(emptyCourseMsg.includes('Bạn hiện chưa tạo khóa học nào'), 38, 'formatCoursesMessage handles empty catalog')

  const mockReportData: any = {
    teacher: {
      id: '11111111-1111-1111-1111-111111111111',
      username: 'Alex Rivers',
      email: 'alex@example.com'
    },
    allTime: {
      totalRevenue: 60000000,
      totalOrders: 100,
      completedOrders: 90,
      uniqueStudents: 80,
      totalCourses: 6,
      averageRating: 4.85
    },
    today: { revenue: 500000, orders: 1, newStudents: 1 },
    thisWeek: { revenue: 3000000, orders: 5, newStudents: 4 },
    thisMonth: { revenue: 12000000, orders: 20, newStudents: 15 },
    topCourse: {
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Fullstack Star',
      revenue: 25000000,
      soldCount: 40
    }
  }

  const repMsg = formatReportMessage('Alex Rivers', mockReportData)
  assert(
    repMsg.includes('BÁO CÁO KINH DOANH TỔNG HỢP') &&
      repMsg.includes('60.000.000 VND') &&
      repMsg.includes('4.85/5.0') &&
      repMsg.includes('Fullstack Star') &&
      !repMsg.includes('undefined'),
    39,
    'formatReportMessage formats executive report with all time KPIs and top course'
  )

  // ----------------------------------------------------
  // SECTION 3: DATABASE FIXTURES & HANDLER INTEGRATION TESTS
  // ----------------------------------------------------
  console.log('\n--- SECTION 3: Database Fixtures & Handler Integration Tests ---')

  // Find Teacher A from database
  const teacherA = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', email: 'teacher_analytics_a@example.com' }
  })

  // Find Teacher B from database
  const teacherB = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', email: 'teacher_analytics_b@example.com' }
  })

  // Find Teacher C (empty catalog)
  const teacherC = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', email: 'teacher_analytics_empty@example.com' }
  })

  if (!teacherA || !teacherB || !teacherC) {
    throw new Error('Test fixtures (teacherA, teacherB, teacherC) not found in PostgreSQL. Please run test_tg03a_analytics_suite.ts first.')
  }

  // Clean up any conflicting telegram accounts for test users or test telegram IDs
  const testTelegramIdA = BigInt(999111001)
  const testTelegramIdB = BigInt(999111002)

  await prisma.telegramAccount.deleteMany({
    where: {
      OR: [
        { telegramUserId: testTelegramIdA },
        { userId: teacherA.id },
        { telegramUserId: testTelegramIdB },
        { userId: teacherB.id }
      ]
    }
  })

  // Create linked accounts
  await prisma.telegramAccount.create({
    data: {
      telegramUserId: testTelegramIdA,
      userId: teacherA.id,
      telegramChatId: testTelegramIdA,
      telegramUsername: 'tg_teacher_a',
      telegramFirstName: 'Teacher A'
    }
  })

  await prisma.telegramAccount.create({
    data: {
      telegramUserId: testTelegramIdB,
      userId: teacherB.id,
      telegramChatId: testTelegramIdB,
      telegramUsername: 'tg_teacher_b',
      telegramFirstName: 'Teacher B'
    }
  })

  const teacherAProfile = {
    userId: teacherA.id,
    username: teacherA.username,
    email: teacherA.email,
    role: teacherA.role,
    status: teacherA.status,
    telegramUserId: Number(testTelegramIdA),
    telegramUsername: 'tg_teacher_a',
    telegramFirstName: 'Teacher A',
    linkedAt: new Date(),
    maskedEmail: teacherA.email
  }

  const teacherBProfile = {
    userId: teacherB.id,
    username: teacherB.username,
    email: teacherB.email,
    role: teacherB.role,
    status: teacherB.status,
    telegramUserId: Number(testTelegramIdB),
    telegramUsername: 'tg_teacher_b',
    telegramFirstName: 'Teacher B',
    linkedAt: new Date(),
    maskedEmail: teacherB.email
  }

  const teacherCProfile = {
    userId: teacherC.id,
    username: teacherC.username,
    email: teacherC.email,
    role: teacherC.role,
    status: teacherC.status,
    telegramUserId: 999111003,
    telegramUsername: 'tg_teacher_c',
    telegramFirstName: 'Teacher C',
    linkedAt: new Date(),
    maskedEmail: teacherC.email
  }

  // TEST 40: /revenue command execution (default this_month)
  const ctxRevDefault = createMockContext(Number(testTelegramIdA), '', teacherAProfile)
  await handleRevenueCommand(ctxRevDefault)
  const revReplies = ctxRevDefault.getReplies()
  assert(
    revReplies.length === 1 &&
      revReplies[0].text.includes('BÁO CÁO DOANH THU — THÁNG NÀY') &&
      revReplies[0].text.includes(escapeMarkdown(teacherA.username)),
    40,
    'handleRevenueCommand returns revenue report for Teacher A'
  )

  // TEST 41: /revenue with invalid argument
  const ctxRevInvalid = createMockContext(Number(testTelegramIdA), 'invalid_period_xyz', teacherAProfile)
  await handleRevenueCommand(ctxRevInvalid)
  const revInvalidReplies = ctxRevInvalid.getReplies()
  assert(
    revInvalidReplies.length === 1 &&
      revInvalidReplies[0].text.includes('CÚ PHÁP THỜI GIAN KHÔNG HỢP LỆ'),
    41,
    'handleRevenueCommand with invalid argument returns helpful usage guide'
  )

  // TEST 42: /orders command execution
  const ctxOrders = createMockContext(Number(testTelegramIdA), 'all_time', teacherAProfile)
  await handleOrdersCommand(ctxOrders)
  const ordReplies = ctxOrders.getReplies()
  assert(
    ordReplies.length === 1 &&
      ordReplies[0].text.includes('THỐNG KÊ ĐƠN HÀNG — TOÀN THỜI GIAN') &&
      ordReplies[0].text.includes(escapeMarkdown(teacherA.username)),
    42,
    'handleOrdersCommand returns order analytics for Teacher A'
  )

  // TEST 43: /students command execution
  const ctxStudents = createMockContext(Number(testTelegramIdA), 'this_month', teacherAProfile)
  await handleStudentsCommand(ctxStudents)
  const stuReplies = ctxStudents.getReplies()
  assert(
    stuReplies.length === 1 &&
      stuReplies[0].text.includes('THỐNG KÊ HỌC VIÊN — THÁNG NÀY') &&
      stuReplies[0].text.includes(escapeMarkdown(teacherA.username)),
    43,
    'handleStudentsCommand returns student analytics for Teacher A'
  )

  // TEST 44: /courses command execution
  const ctxCourses = createMockContext(Number(testTelegramIdA), '', teacherAProfile)
  await handleCoursesCommand(ctxCourses)
  const crsReplies = ctxCourses.getReplies()
  assert(
    crsReplies.length === 1 &&
      crsReplies[0].text.includes('DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH') &&
      crsReplies[0].text.includes(escapeMarkdown(teacherA.username)),
    44,
    'handleCoursesCommand returns course breakdown for Teacher A'
  )

  // TEST 45: /courses for Teacher C (empty catalog)
  const ctxCoursesEmpty = createMockContext(999111003, '', teacherCProfile)
  await handleCoursesCommand(ctxCoursesEmpty)
  const crsEmptyReplies = ctxCoursesEmpty.getReplies()
  assert(
    crsEmptyReplies.length === 1 &&
      crsEmptyReplies[0].text.includes('Bạn hiện chưa tạo khóa học nào'),
    45,
    'handleCoursesCommand returns empty catalog notice for Teacher C'
  )

  // TEST 46: /report command execution
  const ctxReport = createMockContext(Number(testTelegramIdA), '', teacherAProfile)
  await handleReportCommand(ctxReport)
  const repReplies = ctxReport.getReplies()
  assert(
    repReplies.length === 1 &&
      repReplies[0].text.includes('BÁO CÁO KINH DOANH TỔNG HỢP (EXECUTIVE REPORT)') &&
      repReplies[0].text.includes('Toàn thời gian (All-Time)'),
    46,
    'handleReportCommand returns comprehensive executive report'
  )

  // TEST 47: Multi-Tenant Data Isolation (Teacher A vs Teacher B)
  const ctxRevB = createMockContext(Number(testTelegramIdB), 'all_time', teacherBProfile)
  await handleRevenueCommand(ctxRevB)
  const revBReplies = ctxRevB.getReplies()

  assert(
    revBReplies.length === 1 &&
      revBReplies[0].text.includes(escapeMarkdown(teacherB.username)) &&
      !revBReplies[0].text.includes(escapeMarkdown(teacherA.username)),
    47,
    'Teacher B revenue report is strictly scoped and does not leak Teacher A data'
  )

  // TEST 48: requireTeacherAuth middleware blocks unlinked telegram user
  let nextCalled = false
  const unlinkedCtx = createMockContext(88888888, '')
  await requireTeacherAuth(unlinkedCtx, async () => {
    nextCalled = true
  })
  const unlinkedReplies = unlinkedCtx.getReplies()
  assert(
    !nextCalled &&
      unlinkedReplies.length === 1 &&
      unlinkedReplies[0].text.includes('YÊU CẦU XÁC THỰC GIẢNG VIÊN'),
    48,
    'requireTeacherAuth blocks unlinked Telegram ID and halts execution'
  )

  // TEST 49: requireTeacherAuth allows linked teacher and attaches teacherProfile
  let linkedNextCalled = false
  const linkedCtx = createMockContext(Number(testTelegramIdA), '')
  await requireTeacherAuth(linkedCtx, async () => {
    linkedNextCalled = true
  })
  assert(
    linkedNextCalled &&
      linkedCtx.teacherProfile !== null &&
      linkedCtx.teacherProfile?.userId === teacherA.id,
    49,
    'requireTeacherAuth resolves and attaches teacherProfile for linked user'
  )

  // TEST 50: /help command includes all 5 analytics commands
  const ctxHelp = createMockContext(Number(testTelegramIdA), '')
  await handleHelpCommand(ctxHelp)
  const helpReplies = ctxHelp.getReplies()
  const helpText = helpReplies[0]?.text || ''
  assert(
    helpText.includes('/revenue') &&
      helpText.includes('/orders') &&
      helpText.includes('/students') &&
      helpText.includes('/courses') &&
      helpText.includes('/report') &&
      helpText.includes('today') &&
      helpText.includes('custom'),
    50,
    '/help command outputs guide for all 5 analytics commands'
  )

  // TEST 51: Bot Command Definitions & createTelegramBot instantiation
  assert(
    TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'revenue') &&
      TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'orders') &&
      TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'students') &&
      TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'courses') &&
      TELEGRAM_BOT_COMMANDS.some((c) => c.command === 'report'),
    51,
    'TELEGRAM_BOT_COMMANDS registry includes all analytics commands'
  )

  const botInstance = createTelegramBot('123456789:ABCdefGHIjklMNOpqrsTUVwxyz1234567')
  assert(botInstance !== null && typeof botInstance.command === 'function', 52, 'createTelegramBot successfully instantiates with registered commands')

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================')
  console.log(`TEST SUMMARY: Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`)
  console.log('====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite()
  .catch((err) => {
    console.error('Test suite runner crashed:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
