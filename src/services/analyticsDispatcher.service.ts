import {
  AnalyticsIntentResult,
  AnalyticsIntentType,
  AnalyticsPeriod
} from '~/models/analyticsIntent.model'
import {
  TeacherCourseAnalytics,
  TeacherDashboardSummary,
  TeacherOrderAnalytics,
  TeacherRevenueAnalytics,
  TeacherStudentAnalytics
} from '~/models/teacherAnalytics.model'
import {
  getCourseAnalyticsService,
  getOrderAnalyticsService,
  getRevenueAnalyticsService,
  getStudentAnalyticsService,
  getTeacherDashboardSummaryService
} from './teacherAnalytics.service'
import {
  formatCourseAmbiguousMessage,
  formatCourseComparisonMessage,
  formatCourseNotFoundMessage,
  formatCourseSpecificMessage,
  formatCoursesMessage,
  formatOrdersMessage,
  formatReportMessage,
  formatRevenueMessage,
  formatStudentsMessage
} from '~/telegram/utils/analyticsFormatter'
import { DateRangeOptions } from '~/utils/analyticsDateRange'
import { isValidUUID } from '~/utils/uuid'
import { executeAnalyticsInsight } from './analyticsInsight.service'
import { resolveCourseEntityService } from './courseEntityResolver.service'
import {
  compareCourseSpecificAnalyticsService,
  getCourseSpecificAnalyticsService
} from './courseSpecificAnalytics.service'

/**
 * TMDEMY — AI ANALYTICS DISPATCHER SERVICE (TG-04B)
 *
 * Dispatches recognized analytics intents to existing TG-03A core analytics services
 * and formats the results using existing TG-03B Telegram Markdown formatters.
 *
 * ARCHITECTURAL INVARIANTS:
 * 1. STRICT ALLOWLIST: Dispatches only explicitly allowed intents via static switch.
 * 2. RECOGNIZED STATUS ONLY: Rejects ambiguous, unsupported, or error intent states.
 * 3. NO DYNAMIC EVALUATION: Never executes arbitrary function names or AI-generated SQL.
 * 4. STRICT MULTI-TENANT ISOLATION: teacherId is strictly validated and passed to backend services.
 * 5. PERIOD SEMANTICS: Preserves date-range logic and rejects unsupported periods for courses/report.
 */

export interface AnalyticsExecutionSuccess {
  success: true
  intent: AnalyticsIntentType
  period: AnalyticsPeriod | null
  formattedMessage: string
  data:
    | TeacherRevenueAnalytics
    | TeacherOrderAnalytics
    | TeacherStudentAnalytics
    | TeacherCourseAnalytics
    | TeacherDashboardSummary
    | Record<string, unknown>
}

export interface AnalyticsExecutionFailure {
  success: false
  intent: AnalyticsIntentType
  errorMessage: string
}

export type AnalyticsExecutionResult = AnalyticsExecutionSuccess | AnalyticsExecutionFailure

/**
 * Dispatches and executes a recognized analytics intent for an authenticated teacher.
 */
export async function executeRecognizedAnalyticsIntent(
  teacherId: string,
  teacherUsername: string,
  intentResult: AnalyticsIntentResult
): Promise<AnalyticsExecutionResult> {
  // 1. Guard: Only accept 'RECOGNIZED' status
  if (intentResult.status !== 'RECOGNIZED') {
    return {
      success: false,
      intent: intentResult.intent,
      errorMessage: `Không thể điều phối ý định có trạng thái "${intentResult.status}". Yêu cầu trạng thái RECOGNIZED.`
    }
  }

  // 2. Guard: Teacher ID validation
  if (!teacherId || !isValidUUID(teacherId)) {
    return {
      success: false,
      intent: intentResult.intent,
      errorMessage: 'Mã định danh Giảng viên không hợp lệ (Invalid UUID).'
    }
  }

  // 3. Dispatch Course-Specific inquiries (TG-04D)
  if (intentResult.courseName) {
    const resolution = await resolveCourseEntityService(teacherId, intentResult.courseName)

    if (resolution.status === 'NOT_FOUND') {
      return {
        success: true,
        intent: intentResult.intent,
        period: intentResult.period || null,
        formattedMessage: formatCourseNotFoundMessage(intentResult.courseName),
        data: { status: 'NOT_FOUND', searchTerm: intentResult.courseName }
      }
    }

    if (resolution.status === 'AMBIGUOUS') {
      return {
        success: true,
        intent: intentResult.intent,
        period: intentResult.period || null,
        formattedMessage: formatCourseAmbiguousMessage(
          intentResult.courseName,
          resolution.candidates || []
        ),
        data: { status: 'AMBIGUOUS', candidates: resolution.candidates || [] }
      }
    }

    const course = resolution.course!

    // A. Course comparison across two periods
    if (intentResult.operation === 'compare') {
      const compareData = await compareCourseSpecificAnalyticsService(teacherId, course.id, {
        period: intentResult.period || 'this_month',
        comparisonPeriod: intentResult.comparisonPeriod || 'last_month',
        metric: intentResult.metric || 'revenue'
      })
      const formattedMessage = formatCourseComparisonMessage(teacherUsername, compareData)
      return {
        success: true,
        intent: intentResult.intent,
        period: (intentResult.period || 'this_month') as AnalyticsPeriod,
        formattedMessage,
        data: compareData as any
      }
    }

    // B. Course period lookup
    const options: DateRangeOptions = {
      period: intentResult.period || 'this_month'
    }
    if (intentResult.period === 'custom') {
      if (!intentResult.startDate || !intentResult.endDate) {
        return {
          success: false,
          intent: intentResult.intent,
          errorMessage: 'Khoảng ngày tùy chỉnh cho khóa học thiếu ngày bắt đầu hoặc ngày kết thúc.'
        }
      }
      options.startDate = intentResult.startDate
      options.endDate = intentResult.endDate
    }

    const data = await getCourseSpecificAnalyticsService(teacherId, course.id, options)
    const formattedMessage = formatCourseSpecificMessage(
      teacherUsername,
      data,
      intentResult.metric
    )
    return {
      success: true,
      intent: intentResult.intent,
      period: (intentResult.period || 'this_month') as AnalyticsPeriod,
      formattedMessage,
      data: data as any
    }
  }

  // 4. Dispatch analytical operations (compare, insight, recommendation) to TG-04C service
  if (intentResult.operation && intentResult.operation !== 'lookup') {
    const insightResult = await executeAnalyticsInsight(teacherId, teacherUsername, intentResult)
    if (insightResult.success) {
      return {
        success: true,
        intent: intentResult.intent,
        period: intentResult.period || null,
        formattedMessage: insightResult.formattedMessage,
        data: (insightResult.evidence as any) || {}
      }
    } else {
      return {
        success: false,
        intent: intentResult.intent,
        errorMessage: insightResult.formattedMessage || 'Lỗi xử lý phân tích dữ liệu chuyên sâu.'
      }
    }
  }

  try {
    switch (intentResult.intent) {
      case 'revenue': {
        const options: DateRangeOptions = {
          period: intentResult.period || 'this_month'
        }
        if (intentResult.period === 'custom') {
          if (!intentResult.startDate || !intentResult.endDate) {
            return {
              success: false,
              intent: 'revenue',
              errorMessage: 'Khoảng ngày tùy chỉnh cho doanh thu thiếu ngày bắt đầu hoặc ngày kết thúc.'
            }
          }
          options.startDate = intentResult.startDate
          options.endDate = intentResult.endDate
        }

        const data = await getRevenueAnalyticsService(teacherId, options)
        const formattedMessage = formatRevenueMessage(teacherUsername, data)
        return {
          success: true,
          intent: 'revenue',
          period: (intentResult.period || 'this_month') as AnalyticsPeriod,
          formattedMessage,
          data
        }
      }

      case 'orders': {
        const options: DateRangeOptions = {
          period: intentResult.period || 'this_month'
        }
        if (intentResult.period === 'custom') {
          if (!intentResult.startDate || !intentResult.endDate) {
            return {
              success: false,
              intent: 'orders',
              errorMessage: 'Khoảng ngày tùy chỉnh cho đơn hàng thiếu ngày bắt đầu hoặc ngày kết thúc.'
            }
          }
          options.startDate = intentResult.startDate
          options.endDate = intentResult.endDate
        }

        const data = await getOrderAnalyticsService(teacherId, options)
        const formattedMessage = formatOrdersMessage(teacherUsername, data)
        return {
          success: true,
          intent: 'orders',
          period: (intentResult.period || 'this_month') as AnalyticsPeriod,
          formattedMessage,
          data
        }
      }

      case 'students': {
        const options: DateRangeOptions = {
          period: intentResult.period || 'this_month'
        }
        if (intentResult.period === 'custom') {
          if (!intentResult.startDate || !intentResult.endDate) {
            return {
              success: false,
              intent: 'students',
              errorMessage: 'Khoảng ngày tùy chỉnh cho học viên thiếu ngày bắt đầu hoặc ngày kết thúc.'
            }
          }
          options.startDate = intentResult.startDate
          options.endDate = intentResult.endDate
        }

        const data = await getStudentAnalyticsService(teacherId, options)
        const formattedMessage = formatStudentsMessage(teacherUsername, data)
        return {
          success: true,
          intent: 'students',
          period: (intentResult.period || 'this_month') as AnalyticsPeriod,
          formattedMessage,
          data
        }
      }

      case 'courses': {
        // Courses service does not take date ranges; only supports all-time catalog
        if (intentResult.period && intentResult.period !== 'all_time') {
          return {
            success: false,
            intent: 'courses',
            errorMessage:
              'Thống kê danh mục khóa học hiện chỉ hỗ trợ toàn thời gian (All-Time). Vui lòng không chỉ định khoảng thời gian cho câu hỏi khóa học.'
          }
        }

        const data = await getCourseAnalyticsService(teacherId)
        const formattedMessage = formatCoursesMessage(teacherUsername, data)
        return {
          success: true,
          intent: 'courses',
          period: 'all_time',
          formattedMessage,
          data
        }
      }

      case 'report': {
        // Executive report aggregates all-time, today, week, and month; custom ranges not supported
        if (intentResult.period === 'custom') {
          return {
            success: false,
            intent: 'report',
            errorMessage:
              'Báo cáo tổng hợp kinh doanh (Executive Report) cung cấp chỉ số tổng hợp đa kỳ (All-Time, hôm nay, tuần này, tháng này). Không hỗ trợ lọc theo ngày tùy chỉnh.'
          }
        }

        const data = await getTeacherDashboardSummaryService(teacherId)
        const formattedMessage = formatReportMessage(teacherUsername, data)
        return {
          success: true,
          intent: 'report',
          period: 'all_time',
          formattedMessage,
          data
        }
      }

      default: {
        return {
          success: false,
          intent: intentResult.intent,
          errorMessage: `Ý định "${intentResult.intent}" không được hỗ trợ để thực thi thống kê.`
        }
      }
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      success: false,
      intent: intentResult.intent,
      errorMessage: `Lỗi truy xuất dữ liệu thống kê: ${errorMsg}`
    }
  }
}

