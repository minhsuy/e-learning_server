import { z } from 'zod'
import {
  AnalyticsIntentResult,
  AnalyticsIntentType,
  AnalyticsPeriod
} from '~/models/analyticsIntent.model'
import {
  getCourseAnalyticsService,
  getOrderAnalyticsService,
  getRevenueAnalyticsService,
  getStudentAnalyticsService,
  getTeacherDashboardSummaryService
} from './teacherAnalytics.service'
import {
  generateGeminiInsightExplanation,
  GeminiCallOptions
} from './geminiClient.service'
import {
  escapeMarkdown,
  formatCount,
  formatVND
} from '~/telegram/utils/analyticsFormatter'
import { getVietnamCalendarDate } from '~/utils/analyticsDateRange'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — AI ANALYTICS INSIGHT ORCHESTRATION SERVICE (TG-04C)
 *
 * Coordinates multi-period data retrieval, deterministic mathematical comparisons,
 * grounded Gemini qualitative analysis, and hallucination-free response generation.
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. DETERMINISTIC MATH: All differences and percentage calculations happen in TypeScript, never in AI.
 * 2. ZERO-BASELINE SAFETY: Handles zero denominators safely without NaN or Infinity.
 * 3. STRICT GROUNDING: Gemini is restricted to qualitative interpretation of verified facts.
 * 4. HALLUCINATION DEFENSE: Discards ungrounded or contradictory AI text and uses deterministic fallbacks.
 * 5. NO TIMEZONE FOOTER: Responses strictly omit any timezone footers.
 */

export interface AnalyticsInsightOptions extends GeminiCallOptions {}

export interface AnalyticsInsightResult {
  success: boolean
  formattedMessage: string
  evidence?: Record<string, unknown>
  error?: string
}

const InsightOutputSchema = z.object({
  observation: z.string().min(1),
  recommendation: z.string().nullable().optional()
})

type InsightOutput = z.infer<typeof InsightOutputSchema>

/**
 * Strips markdown code blocks if the model wrapped its output in ```json ... ```.
 */
function extractJsonString(raw: string): string {
  const trimmed = raw.trim()
  if (trimmed.startsWith('```')) {
    const lines = trimmed.split('\n')
    return lines.slice(1, -1).join('\n').trim()
  }
  return trimmed
}

/**
 * Returns human-readable Vietnamese label for canonical period.
 */
function getPeriodLabel(period: AnalyticsPeriod | null | undefined): string {
  switch (period) {
    case 'today':
      return 'Hôm nay'
    case 'yesterday':
      return 'Hôm qua'
    case 'this_week':
      return 'Tuần này'
    case 'last_7_days':
      return '7 ngày qua'
    case 'this_month':
      return 'Tháng này'
    case 'last_month':
      return 'Tháng trước'
    case 'all_time':
      return 'Toàn thời gian'
    default:
      return 'Kỳ này'
  }
}

/**
 * Resolves standard comparison period when teacher asks to compare without specifying prior window.
 */
function resolveDefaultComparisonPeriod(period: AnalyticsPeriod | null | undefined): AnalyticsPeriod {
  switch (period) {
    case 'today':
      return 'yesterday'
    case 'this_week':
      return 'last_7_days'
    case 'this_month':
    default:
      return 'last_month'
  }
}

/**
 * Safe percentage change calculation.
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): {
  absoluteChange: number
  percentageChange: number | null
  isZeroBaseline: boolean
  displayText: string
} {
  const absoluteChange = current - previous

  if (previous === 0) {
    if (current === 0) {
      return {
        absoluteChange: 0,
        percentageChange: 0,
        isZeroBaseline: false,
        displayText: 'Không đổi (0%)'
      }
    }
    return {
      absoluteChange,
      percentageChange: null,
      isZeroBaseline: true,
      displayText: 'Kỳ trước bằng 0 (không xác định tỷ lệ % tăng trưởng)'
    }
  }

  const percentage = ((current - previous) / previous) * 100
  const sign = percentage > 0 ? '+' : ''
  return {
    absoluteChange,
    percentageChange: percentage,
    isZeroBaseline: false,
    displayText: `${sign}${percentage.toFixed(1)}%`
  }
}

/**
 * Detects whether comparing this_month to last_month is a partial-month progress comparison.
 */
function checkPartialMonthWarning(
  currentPeriod: AnalyticsPeriod | null | undefined,
  comparePeriod: AnalyticsPeriod | null | undefined
): string | null {
  if (currentPeriod === 'this_month' && comparePeriod === 'last_month') {
    const vnDate = getVietnamCalendarDate(new Date())
    // If not the very end of month (e.g. day < 28), it's partial month progress
    if (vnDate.day < 28) {
      return `Lưu ý: Tháng này hiện mới ghi nhận dữ liệu đến ngày ${vnDate.day}, so sánh với toàn bộ tháng trước mang tính chất đối chiếu tiến độ.`
    }
  }
  return null
}

/**
 * Scans text for ungrounded numbers not present in the verified evidence payload.
 */
function verifyNumericGrounding(
  text: string,
  allowedNumbers: number[]
): boolean {
  if (!text) return true

  // Extract all digit sequences with optional dot/comma separators (e.g. 399.000, 399000, 33%)
  const matches = text.match(/\b\d+(?:[\.,]\d+)*%?\b/g)
  if (!matches) return true

  // Normalize allowed numbers to simple strings (both with and without dot separators)
  const allowedSet = new Set<string>()
  for (const num of allowedNumbers) {
    const rounded = Math.round(num)
    allowedSet.add(String(rounded))
    allowedSet.add(rounded.toLocaleString('vi-VN'))
    allowedSet.add(rounded.toLocaleString('en-US'))
    // percentage variants
    allowedSet.add(`${num.toFixed(0)}%`)
    allowedSet.add(`${num.toFixed(1)}%`)
    allowedSet.add(`${Math.abs(num).toFixed(0)}%`)
    allowedSet.add(`${Math.abs(num).toFixed(1)}%`)
  }

  // Common harmless integers that are safe to appear (ranks, counts under 10)
  for (let i = 1; i <= 10; i++) {
    allowedSet.add(String(i))
  }

  for (const match of matches) {
    const cleaned = match.replace(/%/g, '')
    const parsed = parseFloat(cleaned.replace(/[,\.]/g, ''))
    // If large number (> 10) and not in allowed set, flag as hallucination
    if (parsed > 10) {
      const matchFound =
        allowedSet.has(match) ||
        allowedSet.has(cleaned) ||
        allowedNumbers.some((n) => Math.abs(n - parsed) < 1)
      if (!matchFound) {
        return false // Ungrounded number detected
      }
    }
  }

  return true
}

/**
 * Primary public handler for analytical insight requests.
 */
export async function executeAnalyticsInsight(
  teacherId: string,
  teacherUsername: string,
  intentResult: AnalyticsIntentResult,
  options: AnalyticsInsightOptions = {}
): Promise<AnalyticsInsightResult> {
  // 1. Guard: Teacher ID validation
  if (!teacherId || !isValidUUID(teacherId)) {
    return {
      success: false,
      formattedMessage: 'Mã định danh Giảng viên không hợp lệ (Invalid UUID).'
    }
  }

  const operation = intentResult.operation || 'insight'
  const domain = intentResult.intent

  try {
    switch (operation) {
      case 'compare':
        return await handleCompareOperation(teacherId, teacherUsername, intentResult, options)

      case 'recommendation':
        return await handleRecommendationOperation(teacherId, teacherUsername, intentResult, options)

      case 'insight':
      default:
        return await handleInsightOperation(teacherId, teacherUsername, intentResult, options)
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      formattedMessage: `Không thể hoàn tất phân tích dữ liệu: ${errorMsg}`,
      error: errorMsg
    }
  }
}

/**
 * Handles comparative analysis between two time windows.
 */
async function handleCompareOperation(
  teacherId: string,
  teacherUsername: string,
  intentResult: AnalyticsIntentResult,
  options: AnalyticsInsightOptions
): Promise<AnalyticsInsightResult> {
  const currentPeriod = intentResult.period || 'this_month'
  const comparePeriod = intentResult.comparisonPeriod || resolveDefaultComparisonPeriod(currentPeriod)
  const currentLabel = getPeriodLabel(currentPeriod)
  const compareLabel = getPeriodLabel(comparePeriod)

  const partialWarning = checkPartialMonthWarning(currentPeriod, comparePeriod)

  // 1. Retrieve data for both periods based on intent
  if (intentResult.intent === 'students') {
    const [currData, prevData] = await Promise.all([
      getStudentAnalyticsService(teacherId, { period: currentPeriod }),
      getStudentAnalyticsService(teacherId, { period: comparePeriod })
    ])

    const currStudents = currData.summary.newStudents
    const prevStudents = prevData.summary.newStudents
    const calc = calculatePercentageChange(currStudents, prevStudents)

    const evidence = {
      domain: 'students',
      operation: 'compare',
      metric: 'Học viên mới',
      currentPeriod: currentLabel,
      currentValue: currStudents,
      comparePeriod: compareLabel,
      compareValue: prevStudents,
      absoluteChange: calc.absoluteChange,
      percentageChange: calc.percentageChange,
      isZeroBaseline: calc.isZeroBaseline,
      partialWarning
    }

    const deterministicObservation = calc.isZeroBaseline
      ? `Số học viên mới ${currentLabel.toLowerCase()} ghi nhận ${formatCount(currStudents)} học viên, trong khi ${compareLabel.toLowerCase()} không có học viên mới phát sinh.`
      : calc.absoluteChange > 0
        ? `Số học viên mới ${currentLabel.toLowerCase()} tăng ${formatCount(calc.absoluteChange)} học viên (${calc.displayText}) so với ${compareLabel.toLowerCase()}.`
        : calc.absoluteChange < 0
          ? `Số học viên mới ${currentLabel.toLowerCase()} giảm ${formatCount(Math.abs(calc.absoluteChange))} học viên (${calc.displayText}) so với ${compareLabel.toLowerCase()}.`
          : `Số học viên mới ${currentLabel.toLowerCase()} tương đương với ${compareLabel.toLowerCase()} (${formatCount(currStudents)} học viên).`

    const { observation, recommendation } = await generateGroundedExplanation(
      intentResult.rawMessage,
      evidence,
      deterministicObservation,
      [currStudents, prevStudents, Math.abs(calc.absoluteChange), calc.percentageChange || 0],
      options
    )

    const lines = [
      '📊 *PHÂN TÍCH KINH DOANH — TĂNG TRƯỞNG HỌC VIÊN*',
      `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherUsername)}*`,
      '',
      '👥 *Số liệu thực tế:*',
      `• Học viên mới ${currentLabel}: *${formatCount(currStudents)}* người (Tổng lượt ghi danh: ${formatCount(currData.summary.periodEnrollments)})`,
      `• Học viên mới ${compareLabel}: *${formatCount(prevStudents)}* người (Tổng lượt ghi danh: ${formatCount(prevData.summary.periodEnrollments)})`,
      `• Chênh lệch: *${calc.absoluteChange >= 0 ? '+' : ''}${formatCount(calc.absoluteChange)}* người (${calc.displayText})`,
      ...(partialWarning ? ['', `⚠️ _${escapeMarkdown(partialWarning)}_`] : []),
      '',
      '🧠 *Nhận xét:*',
      observation,
      ...(recommendation ? ['', '💡 *Gợi ý:*', recommendation] : [])
    ]

    return {
      success: true,
      formattedMessage: lines.join('\n'),
      evidence
    }
  }

  // Default to Revenue & Orders comparison
  const [currData, prevData] = await Promise.all([
    getRevenueAnalyticsService(teacherId, { period: currentPeriod }),
    getRevenueAnalyticsService(teacherId, { period: comparePeriod })
  ])

  const currRevenue = currData.summary.netRevenue
  const prevRevenue = prevData.summary.netRevenue
  const currOrders = currData.summary.completedOrders
  const prevOrders = prevData.summary.completedOrders

  const calc = calculatePercentageChange(currRevenue, prevRevenue)

  const evidence = {
    domain: 'revenue',
    operation: 'compare',
    metric: 'Doanh thu thực nhận (Net)',
    currentPeriod: currentLabel,
    currentValue: currRevenue,
    currentOrders: currOrders,
    comparePeriod: compareLabel,
    compareValue: prevRevenue,
    compareOrders: prevOrders,
    absoluteChange: calc.absoluteChange,
    percentageChange: calc.percentageChange,
    isZeroBaseline: calc.isZeroBaseline,
    partialWarning
  }

  const deterministicObservation = calc.isZeroBaseline
    ? `Doanh thu ${currentLabel.toLowerCase()} đạt ${formatVND(currRevenue)} từ ${formatCount(currOrders)} đơn hàng, trong khi ${compareLabel.toLowerCase()} chưa có doanh thu thực nhận.`
    : calc.absoluteChange > 0
      ? `Doanh thu ${currentLabel.toLowerCase()} của bạn là ${formatVND(currRevenue)}, so với ${compareLabel.toLowerCase()} là ${formatVND(prevRevenue)}, tăng ${formatVND(calc.absoluteChange)} (${calc.displayText}).`
      : calc.absoluteChange < 0
        ? `Doanh thu ${currentLabel.toLowerCase()} của bạn là ${formatVND(currRevenue)}, so với ${compareLabel.toLowerCase()} là ${formatVND(prevRevenue)}, giảm ${formatVND(Math.abs(calc.absoluteChange))} (${calc.displayText}).`
        : `Doanh thu ${currentLabel.toLowerCase()} tương đương với ${compareLabel.toLowerCase()}, duy trì ở mức ${formatVND(currRevenue)}.`

  const { observation, recommendation } = await generateGroundedExplanation(
    intentResult.rawMessage,
    evidence,
    deterministicObservation,
    [currRevenue, prevRevenue, Math.abs(calc.absoluteChange), calc.percentageChange || 0, currOrders, prevOrders],
    options
  )

  const lines = [
    '📊 *PHÂN TÍCH KINH DOANH — SO SÁNH DOANH THU*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherUsername)}*`,
    '',
    '💰 *Số liệu thực tế:*',
    `• Doanh thu ${currentLabel}: *${formatVND(currRevenue)}* (${formatCount(currOrders)} đơn)`,
    `• Doanh thu ${compareLabel}: *${formatVND(prevRevenue)}* (${formatCount(prevOrders)} đơn)`,
    `• Chênh lệch: *${calc.absoluteChange >= 0 ? '+' : ''}${formatVND(calc.absoluteChange)}* (${calc.displayText})`,
    ...(partialWarning ? ['', `⚠️ _${escapeMarkdown(partialWarning)}_`] : []),
    '',
    '🧠 *Nhận xét:*',
    observation,
    ...(recommendation ? ['', '💡 *Gợi ý:*', recommendation] : [])
  ]

  return {
    success: true,
    formattedMessage: lines.join('\n'),
    evidence
  }
}

/**
 * Handles in-depth qualitative evaluation and performance diagnostics.
 */
async function handleInsightOperation(
  teacherId: string,
  teacherUsername: string,
  intentResult: AnalyticsIntentResult,
  options: AnalyticsInsightOptions
): Promise<AnalyticsInsightResult> {
  if (intentResult.intent === 'courses') {
    const courseData = await getCourseAnalyticsService(teacherId)
    const summary = courseData.summary
    const bestRev = courseData.bestSellingByRevenue
    const bestVol = courseData.bestSellingByVolume

    if (summary.totalCourses === 0) {
      return {
        success: true,
        formattedMessage: [
          '📚 *PHÂN TÍCH DANH MỤC KHÓA HỌC*',
          `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherUsername)}*`,
          '',
          'ℹ️ Hiện tại bạn chưa tạo khóa học nào trên hệ thống TMdemy.',
          'Hãy truy cập cổng giảng viên trên website để tạo khóa học đầu tiên nhé!'
        ].join('\n')
      }
    }

    const evidence = {
      domain: 'courses',
      operation: 'insight',
      totalCourses: summary.totalCourses,
      approvedCourses: summary.approvedCourses,
      coursesWithSales: summary.coursesWithSalesCount,
      zeroSalesCount: summary.zeroSalesCoursesCount,
      bestSellingRevenue: bestRev
        ? {
            title: bestRev.title,
            revenue: bestRev.totalRevenue,
            orders: bestRev.completedOrders
          }
        : null,
      bestSellingVolume: bestVol
        ? {
            title: bestVol.title,
            revenue: bestVol.totalRevenue,
            orders: bestVol.completedOrders
          }
        : null
    }

    const deterministicObservation = bestRev
      ? `Khóa học hoạt động tốt nhất về doanh thu là "${bestRev.title}" mang về ${formatVND(bestRev.totalRevenue)} với ${formatCount(bestRev.completedOrders)} đơn hàng thành công, đóng góp tỷ trọng chính vào tổng thu nhập.`
      : `Bạn hiện có ${formatCount(summary.totalCourses)} khóa học nhưng chưa phát sinh đơn hàng thành công nào.`

    const allowedNums = [
      summary.totalCourses,
      summary.approvedCourses,
      summary.coursesWithSalesCount,
      summary.zeroSalesCoursesCount,
      bestRev?.totalRevenue || 0,
      bestRev?.completedOrders || 0,
      bestVol?.completedOrders || 0
    ]

    const { observation, recommendation } = await generateGroundedExplanation(
      intentResult.rawMessage,
      evidence,
      deterministicObservation,
      allowedNums,
      options
    )

    const lines = [
      '📚 *PHÂN TÍCH KINH DOANH — HIỆU QUẢ KHÓA HỌC*',
      `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherUsername)}*`,
      '',
      '📊 *Hiện trạng danh mục:*',
      `• Tổng số khóa học: *${formatCount(summary.totalCourses)}* khóa (Đã duyệt: ${formatCount(summary.approvedCourses)})`,
      `• Khóa học đã bán được: *${formatCount(summary.coursesWithSalesCount)}* khóa`,
      `• Khóa học chưa có doanh thu: *${formatCount(summary.zeroSalesCoursesCount)}* khóa`,
      '',
      '🏆 *Khóa học tiêu biểu:*',
      `• Doanh thu cao nhất: ${
        bestRev
          ? `*${escapeMarkdown(bestRev.title)}* (${formatVND(bestRev.totalRevenue)} - ${formatCount(bestRev.completedOrders)} đơn)`
          : '_Chưa có dữ liệu_'
      }`,
      `• Bán chạy nhất theo số lượng: ${
        bestVol
          ? `*${escapeMarkdown(bestVol.title)}* (${formatCount(bestVol.completedOrders)} đơn)`
          : '_Chưa có dữ liệu_'
      }`,
      '',
      '🧠 *Nhận xét:*',
      observation,
      ...(recommendation ? ['', '💡 *Gợi ý:*', recommendation] : [])
    ]

    return {
      success: true,
      formattedMessage: lines.join('\n'),
      evidence
    }
  }

  // General business summary diagnostics
  const summaryData = await getTeacherDashboardSummaryService(teacherId)
  const allTime = summaryData.allTime
  const month = summaryData.thisMonth
  const topCourse = summaryData.topCourse

  const evidence = {
    domain: 'report',
    operation: 'insight',
    thisMonthRevenue: month.revenue,
    thisMonthOrders: month.orders,
    thisMonthNewStudents: month.newStudents,
    allTimeRevenue: allTime.totalRevenue,
    allTimeOrders: allTime.completedOrders,
    allTimeStudents: allTime.uniqueStudents,
    topCourse: topCourse ? { title: topCourse.title, revenue: topCourse.revenue, orders: topCourse.soldCount } : null
  }

  const deterministicObservation = `Tháng này bạn đã đạt doanh thu ${formatVND(month.revenue)} từ ${formatCount(month.orders)} đơn hàng với ${formatCount(month.newStudents)} học viên mới đăng ký. Tổng doanh thu tích lũy toàn thời gian đạt ${formatVND(allTime.totalRevenue)}.`

  const allowedNums = [
    month.revenue,
    month.orders,
    month.newStudents,
    allTime.totalRevenue,
    allTime.completedOrders,
    allTime.uniqueStudents,
    topCourse?.revenue || 0,
    topCourse?.soldCount || 0
  ]

  const { observation, recommendation } = await generateGroundedExplanation(
    intentResult.rawMessage,
    evidence,
    deterministicObservation,
    allowedNums,
    options
  )

  const lines = [
    '📊 *PHÂN TÍCH TỔNG QUAN TÌNH HÌNH KINH DOANH*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherUsername)}*`,
    '',
    '💰 *Chỉ số hoạt động chính:*',
    `• Doanh thu tháng này: *${formatVND(month.revenue)}* (${formatCount(month.orders)} đơn)`,
    `• Học viên mới tháng này: *${formatCount(month.newStudents)}* người`,
    `• Doanh thu tích lũy: *${formatVND(allTime.totalRevenue)}* (${formatCount(allTime.completedOrders)} đơn)`,
    `• Tổng số học viên: *${formatCount(allTime.uniqueStudents)}* học viên`,
    ...(topCourse ? [`• Khóa học chủ lực: *${escapeMarkdown(topCourse.title)}* (${formatVND(topCourse.revenue)})`] : []),
    '',
    '🧠 *Nhận xét chuyên sâu:*',
    observation,
    ...(recommendation ? ['', '💡 *Gợi ý:*', recommendation] : [])
  ]

  return {
    success: true,
    formattedMessage: lines.join('\n'),
    evidence
  }
}

/**
 * Handles grounded business recommendations and improvement advice.
 */
async function handleRecommendationOperation(
  teacherId: string,
  teacherUsername: string,
  intentResult: AnalyticsIntentResult,
  options: AnalyticsInsightOptions
): Promise<AnalyticsInsightResult> {
  const [courseData, summaryData] = await Promise.all([
    getCourseAnalyticsService(teacherId),
    getTeacherDashboardSummaryService(teacherId)
  ])

  const courseSummary = courseData.summary
  const zeroSales = courseData.zeroSalesCourses || []
  const topCourse = summaryData.topCourse

  const evidence = {
    domain: 'recommendation',
    operation: 'recommendation',
    totalCourses: courseSummary.totalCourses,
    coursesWithSales: courseSummary.coursesWithSalesCount,
    zeroSalesCount: courseSummary.zeroSalesCoursesCount,
    zeroSalesSample: zeroSales.slice(0, 3).map((c) => ({ title: c.title, price: c.price })),
    monthRevenue: summaryData.thisMonth.revenue,
    monthOrders: summaryData.thisMonth.orders,
    topCourse: topCourse ? { title: topCourse.title, revenue: topCourse.revenue } : null
  }

  const deterministicObservation = courseSummary.zeroSalesCoursesCount > 0
    ? `Bạn hiện có ${formatCount(courseSummary.zeroSalesCoursesCount)} trên tổng số ${formatCount(courseSummary.totalCourses)} khóa học chưa ghi nhận lượt bán nào.`
    : `Tất cả ${formatCount(courseSummary.totalCourses)} khóa học của bạn đều đã ghi nhận lượt bán thành công.`

  const deterministicRecommendation = courseSummary.zeroSalesCoursesCount > 0
    ? 'Bạn có thể xem xét cập nhật lại hình ảnh đại diện, tối ưu tiêu đề bài học và cân nhắc áp dụng chương trình ưu đãi hoặc coupon giảm giá cho các khóa học chưa phát sinh doanh số.'
    : 'Bạn nên tiếp tục duy trì cập nhật nội dung cho khóa học dẫn đầu và tham khảo mở rộng thêm các chuyên đề bài giảng nâng cao.'

  const allowedNums = [
    courseSummary.totalCourses,
    courseSummary.coursesWithSalesCount,
    courseSummary.zeroSalesCoursesCount,
    summaryData.thisMonth.revenue,
    summaryData.thisMonth.orders
  ]

  const { observation, recommendation } = await generateGroundedExplanation(
    intentResult.rawMessage,
    evidence,
    deterministicObservation,
    allowedNums,
    options,
    deterministicRecommendation
  )

  const zeroSalesSection = zeroSales.length > 0
    ? [
        '',
        '📌 *Các khóa học cần thúc đẩy doanh số:*',
        ...zeroSales.slice(0, 3).map((c) => `• ${escapeMarkdown(c.title)} (Giá bán: ${formatVND(c.price)})`)
      ]
    : []

  const lines = [
    '💡 *TƯ VẤN & GỢI Ý PHÁT TRIỂN KHOÁ HỌC*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherUsername)}*`,
    '',
    '📊 *Hiện trạng tổng quan:*',
    `• Tổng số khóa học: *${formatCount(courseSummary.totalCourses)}* khóa`,
    `• Khóa học đã có doanh số: *${formatCount(courseSummary.coursesWithSalesCount)}* khóa`,
    `• Khóa học chưa có doanh thu: *${formatCount(courseSummary.zeroSalesCoursesCount)}* khóa`,
    ...zeroSalesSection,
    '',
    '🧠 *Đánh giá hiện trạng:*',
    observation,
    '',
    '💡 *Đề xuất hành động:*',
    recommendation || deterministicRecommendation
  ]

  return {
    success: true,
    formattedMessage: lines.join('\n'),
    evidence
  }
}

/**
 * Dispatches evidence to Gemini, validates grounding against allowed numbers,
 * and falls back deterministically if Gemini is unavailable, invalid, or hallucinating.
 */
async function generateGroundedExplanation(
  userQuestion: string,
  evidence: Record<string, unknown>,
  fallbackObservation: string,
  allowedNumbers: number[],
  options: AnalyticsInsightOptions,
  fallbackRecommendation?: string
): Promise<{ observation: string; recommendation?: string }> {
  try {
    const evidencePrompt = [
      `Câu hỏi của giảng viên: "${userQuestion}"`,
      '',
      'Bằng chứng thống kê thực tế (Evidence Payload):',
      JSON.stringify(evidence, null, 2)
    ].join('\n')

    const rawResponse = await generateGeminiInsightExplanation(evidencePrompt, options)
    const cleanedJson = extractJsonString(rawResponse.rawText)
    const parsed = JSON.parse(cleanedJson)

    const zodResult = InsightOutputSchema.safeParse(parsed)
    if (!zodResult.success) {
      return {
        observation: fallbackObservation,
        recommendation: fallbackRecommendation
      }
    }

    const { observation, recommendation } = zodResult.data

    // Check numerical grounding
    const obsGrounded = verifyNumericGrounding(observation, allowedNumbers)
    const recGrounded = !recommendation || verifyNumericGrounding(recommendation, allowedNumbers)

    if (!obsGrounded || !recGrounded) {
      // Hallucination detected: ungrounded numbers found in output. Discard and use fallback.
      return {
        observation: fallbackObservation,
        recommendation: fallbackRecommendation
      }
    }

    return {
      observation,
      recommendation: recommendation || fallbackRecommendation
    }
  } catch (err: unknown) {
    // Graceful fallback: return mathematically verified deterministic text
    return {
      observation: fallbackObservation,
      recommendation: fallbackRecommendation
    }
  }
}

