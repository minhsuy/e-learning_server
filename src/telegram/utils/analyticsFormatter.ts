import {
  TeacherCourseAnalytics,
  TeacherDashboardSummary,
  TeacherOrderAnalytics,
  TeacherRevenueAnalytics,
  TeacherStudentAnalytics
} from '~/models/teacherAnalytics.model'
import { CourseSpecificAnalytics, CourseComparisonAnalytics } from '~/services/courseSpecificAnalytics.service'
import { ResolvedCourseEntity } from '~/services/courseEntityResolver.service'
import { CourseMetric } from '~/models/analyticsIntent.model'

/**
 * TMDEMY — TELEGRAM ANALYTICS MESSAGE FORMATTER (TG-03B / TG-04D)
 *
 * Provides safe, clean, localized Vietnamese Markdown formatting for Telegram bot analytics responses.
 *
 * RESILIENCE INVARIANTS:
 * 1. Safe Markdown escaping prevents Telegram API parse errors when titles or names include `*`, `_`, etc.
 * 2. Guaranteed zero `undefined`, `null`, or `NaN` outputs.
 * 3. Graceful handling of zero-sales, empty arrays, or newly onboarded teachers.
 * 4. Consistent Vietnam currency formatting (`VND`).
 * 5. MANDATORY: Zero client-facing timezone footers (no Asia/Ho_Chi_Minh or UTC+7 in messages).
 * 6. Explicit label for course list prices (`Giá bán: ...`) to prevent confusion with earned revenue.
 */

/**
 * Escapes characters with special meaning in Telegram Markdown mode.
 */
export function escapeMarkdown(text: string | null | undefined): string {
  if (!text) return ''
  return String(text).replace(/([*_`\[\]()])/g, '\\$1')
}

/**
 * Formats a numeric amount to Vietnamese Dong string (e.g. 1.500.000 VND).
 */
export function formatVND(amount: number | null | undefined): string {
  const safeNumber = typeof amount === 'number' && !isNaN(amount) ? amount : 0
  return `${Math.round(safeNumber).toLocaleString('vi-VN')} VND`
}

/**
 * Formats an integer count safely.
 */
export function formatCount(count: number | null | undefined): string {
  const safeNumber = typeof count === 'number' && !isNaN(count) ? count : 0
  return safeNumber.toLocaleString('vi-VN')
}

/**
 * Formats /revenue response message.
 */
export function formatRevenueMessage(
  teacherName: string,
  data: TeacherRevenueAnalytics
): string {
  const summary = data.summary
  const kpis = data.kpis
  const topCourses = data.topCourses || []

  const topCoursesSection =
    topCourses.length > 0
      ? [
          '🏆 *Top khóa học doanh thu cao nhất:*',
          ...topCourses.slice(0, 5).map((c, idx) => {
            const title = escapeMarkdown(c.title)
            return `${idx + 1}. *${title}*: ${formatVND(c.revenue)} (${formatCount(c.soldCount)} lượt bán)`
          })
        ]
      : ['🏆 *Top khóa học:* _Chưa có dữ liệu bán khóa học trong kỳ này_']

  const lines = [
    `💰 *BÁO CÁO DOANH THU — ${summary.periodLabel.toUpperCase()}*`,
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    `• Doanh thu thực nhận (Net): *${formatVND(summary.netRevenue)}*`,
    `• Doanh thu gốc (Gross): ${formatVND(summary.grossRevenue)}`,
    `• Giảm giá qua Coupon: ${formatVND(summary.totalDiscount)}`,
    `• Đơn hàng thành công: *${formatCount(summary.completedOrders)}* đơn`,
    `• Giá trị trung bình/đơn: ${formatVND(summary.averageOrderValue)}`,
    '',
    ...topCoursesSection,
    '',
    '📊 *Chỉ số đối chiếu các mốc thời gian:*',
    `• Hôm nay: ${formatVND(kpis.todayRevenue)}`,
    `• Tuần này: ${formatVND(kpis.thisWeekRevenue)}`,
    `• Tháng này: ${formatVND(kpis.thisMonthRevenue)}`,
    `• Toàn thời gian: *${formatVND(kpis.allTimeRevenue)}*`
  ]

  return lines.join('\n')
}

/**
 * Formats /orders response message.
 */
export function formatOrdersMessage(
  teacherName: string,
  data: TeacherOrderAnalytics
): string {
  const summary = data.summary
  const salesByCourse = data.salesByCourse || []

  const topCourseSales =
    salesByCourse.length > 0
      ? [
          '📚 *Chi tiết theo khóa học (Top phát sinh đơn):*',
          ...salesByCourse.slice(0, 5).map((c, idx) => {
            const title = escapeMarkdown(c.title)
            return `${idx + 1}. *${title}*: ${formatCount(c.completedOrders)}/${formatCount(c.totalOrders)} đơn thành công (${formatVND(c.realizedRevenue)})`
          })
        ]
      : ['📚 *Chi tiết theo khóa học:* _Chưa có đơn hàng nào phát sinh trong kỳ này_']

  const lines = [
    `📦 *THỐNG KÊ ĐƠN HÀNG — ${summary.periodLabel.toUpperCase()}*`,
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    `• Tổng đơn hàng phát sinh: *${formatCount(summary.totalOrders)}* đơn`,
    `• Hoàn thành: ✅ *${formatCount(summary.completedOrders)}* đơn`,
    `• Chờ xử lý: ⏳ *${formatCount(summary.pendingOrders)}* đơn`,
    `• Đã hủy / Từ chối: ❌ *${formatCount(summary.rejectedOrders)}* đơn`,
    '',
    `• Doanh thu thực nhận: *${formatVND(summary.realizedRevenue)}*`,
    `• Doanh thu đang chờ: ${formatVND(summary.pendingRevenue)}`,
    `• Tỷ lệ chuyển đổi thành công: *${summary.conversionRate.toFixed(1)}%*`,
    '',
    ...topCourseSales,
    '',
    `🌐 *Tổng số đơn hàng toàn thời gian:* *${formatCount(data.allTimeTotalOrders)}* đơn`
  ]

  return lines.join('\n')
}

/**
 * Formats /students response message.
 */
export function formatStudentsMessage(
  teacherName: string,
  data: TeacherStudentAnalytics
): string {
  const summary = data.summary
  const enrollmentsByCourse = data.enrollmentsByCourse || []

  const courseEnrollmentSection =
    enrollmentsByCourse.length > 0
      ? [
          '📚 *Khóa học thu hút nhiều học viên nhất:*',
          ...enrollmentsByCourse.slice(0, 5).map((c, idx) => {
            const title = escapeMarkdown(c.title)
            return `${idx + 1}. *${title}*: ${formatCount(c.totalEnrollments)} lượt (${formatCount(c.activeCount)} đang học, ${formatCount(c.completedCount)} hoàn thành)`
          })
        ]
      : ['📚 *Khóa học thu hút học viên:* _Chưa có lượt đăng ký mới trong kỳ này_']

  const lines = [
    `👥 *THỐNG KÊ HỌC VIÊN — ${summary.periodLabel.toUpperCase()}*`,
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    `• Học viên có hoạt động trong kỳ: *${formatCount(summary.periodUniqueStudents)}* người`,
    `• Học viên mới lần đầu đăng ký: 🆕 *${formatCount(summary.newStudents)}* người`,
    `• Lượt ghi danh trong kỳ: *${formatCount(summary.periodEnrollments)}* lượt`,
    `  ├ Đang học chủ động: 📖 ${formatCount(summary.activeEnrollments)}`,
    `  ├ Đã hoàn thành khóa: 🎓 ${formatCount(summary.completedEnrollments)}`,
    `  └ Đã hủy ghi danh: ⚠️ ${formatCount(summary.canceledEnrollments)}`,
    '',
    ...courseEnrollmentSection,
    '',
    `🌐 *Tổng số học viên duy nhất toàn thời gian:* *${formatCount(summary.totalUniqueStudentsAllTime)}* học viên`
  ]

  return lines.join('\n')
}

/**
 * Formats /courses response message.
 */
export function formatCoursesMessage(
  teacherName: string,
  data: TeacherCourseAnalytics
): string {
  const summary = data.summary
  const bestRev = data.bestSellingByRevenue
  const bestVol = data.bestSellingByVolume
  const zeroSales = data.zeroSalesCourses || []

  if (summary.totalCourses === 0) {
    return [
      '📚 *DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH*',
      `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
      '',
      'ℹ️ Bạn hiện chưa tạo khóa học nào trên nền tảng TMdemy.',
      'Hãy truy cập cổng giảng viên trên website để bắt đầu tạo khóa học mới nhé!'
    ].join('\n')
  }

  const zeroSalesSection =
    zeroSales.length > 0
      ? [
          '💡 *Khóa học cần đẩy mạnh (Chưa có lượt bán):*',
          ...zeroSales.slice(0, 5).map((c) => `• ${escapeMarkdown(c.title)} (Giá bán: ${formatVND(c.price)})`),
          ...(zeroSales.length > 5
            ? [`_...và còn ${zeroSales.length - 5} khóa học khác chưa phát sinh doanh thu_`]
            : [])
        ]
      : ['💡 *Hiệu quả bán:* Tất cả các khóa học đã được duyệt đều đã có học viên đăng ký! 🎉']

  const lines = [
    '📚 *DANH MỤC KHÓA HỌC & HIỆU QUẢ KINH DOANH*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    `• Tổng số khóa học: *${formatCount(summary.totalCourses)}* khóa`,
    `  ├ Đang hoạt động (Approved): ✅ ${formatCount(summary.approvedCourses)}`,
    `  ├ Chờ kiểm duyệt (Pending): ⏳ ${formatCount(summary.pendingCourses)}`,
    `  └ Bị từ chối (Rejected): ❌ ${formatCount(summary.rejectedCourses)}`,
    '',
    `• Khóa học đã phát sinh doanh số: 🎯 *${formatCount(summary.coursesWithSalesCount)}* khóa`,
    `• Khóa học chưa có doanh thu: ⚪ *${formatCount(summary.zeroSalesCoursesCount)}* khóa`,
    '',
    '🌟 *Khóa học tiêu biểu:*',
    `• Doanh thu cao nhất: ${
      bestRev
        ? `*${escapeMarkdown(bestRev.title)}* (${formatVND(bestRev.totalRevenue)} - ${formatCount(bestRev.completedOrders)} đơn)`
        : '_Chưa có dữ liệu_'
    }`,
    `• Số lượng bán nhiều nhất: ${
      bestVol
        ? `*${escapeMarkdown(bestVol.title)}* (${formatCount(bestVol.completedOrders)} đơn - ${formatVND(bestVol.totalRevenue)})`
        : '_Chưa có dữ liệu_'
    }`,
    '',
    ...zeroSalesSection
  ]

  return lines.join('\n')
}

/**
 * Formats /report response message (Executive Dashboard Summary).
 */
export function formatReportMessage(
  teacherName: string,
  data: TeacherDashboardSummary
): string {
  const allTime = data.allTime
  const today = data.today
  const week = data.thisWeek
  const month = data.thisMonth
  const topCourse = data.topCourse

  const topCourseHighlight = topCourse
    ? [
        '🏆 *Khóa học dẫn đầu doanh thu:*',
        `*${escapeMarkdown(topCourse.title)}*`,
        `• Doanh thu mang lại: *${formatVND(topCourse.revenue)}*`,
        `• Lượt bán thành công: *${formatCount(topCourse.soldCount)}* lượt`
      ]
    : ['🏆 *Khóa học dẫn đầu:* _Chưa có dữ liệu bán khóa học_']

  const lines = [
    '📊 *BÁO CÁO KINH DOANH TỔNG HỢP (EXECUTIVE REPORT)*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    '🌐 *Toàn thời gian (All-Time):*',
    `• Doanh thu tích lũy: *${formatVND(allTime.totalRevenue)}*`,
    `• Đơn hàng thành công: *${formatCount(allTime.completedOrders)}* / ${formatCount(allTime.totalOrders)} đơn`,
    `• Học viên độc nhất: *${formatCount(allTime.uniqueStudents)}* học viên`,
    `• Khóa học đã tạo: *${formatCount(allTime.totalCourses)}* khóa`,
    `• Đánh giá trung bình: ⭐ *${allTime.averageRating.toFixed(2)}/5.0*`,
    '',
    '📅 *Diễn biến theo các kỳ gần nhất:*',
    `• Hôm nay: *${formatVND(today.revenue)}* | ${formatCount(today.orders)} đơn | +${formatCount(today.newStudents)} học viên mới`,
    `• Tuần này: *${formatVND(week.revenue)}* | ${formatCount(week.orders)} đơn | +${formatCount(week.newStudents)} học viên mới`,
    `• Tháng này: *${formatVND(month.revenue)}* | ${formatCount(month.orders)} đơn | +${formatCount(month.newStudents)} học viên mới`,
    '',
    ...topCourseHighlight
  ]

  return lines.join('\n')
}

/**
 * Formats focused course-specific analytics message (TG-04D).
 */
export function formatCourseSpecificMessage(
  teacherName: string,
  data: CourseSpecificAnalytics,
  metric?: CourseMetric | null
): string {
  const { course, summary, allTime } = data

  const lines = [
    '💰 *THỐNG KÊ KHÓA HỌC*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    `📚 Khóa học: *${escapeMarkdown(course.title)}*`,
    `📅 Thời gian: *${escapeMarkdown(summary.periodLabel)}*`,
    '',
    '💵 *Chỉ số kinh doanh trong kỳ:*',
    `• Doanh thu thực nhận: *${formatVND(summary.realizedRevenue)}*`,
    `• Đơn hàng thành công: *${formatCount(summary.completedOrders)}* đơn`,
    `• Giá trị trung bình/đơn: *${formatVND(summary.averageOrderValue)}*`,
    `• Học viên mới ghi danh: *${formatCount(summary.periodEnrollments)}* học viên`,
    '',
    '📌 *Thông tin niêm yết & Toàn thời gian:*',
    `• Giá bán niêm yết: *${formatVND(course.price)}*`,
    `• Tổng doanh thu tích lũy: *${formatVND(allTime.revenue)}*`,
    `• Tổng đơn hàng tích lũy: *${formatCount(allTime.completedOrders)}* đơn`,
    `• Tổng học viên toàn thời gian: *${formatCount(allTime.totalEnrollments)}* học viên`
  ]

  if (summary.pendingOrders > 0) {
    lines.push(
      `• Đơn đang chờ thanh toán: ⏳ ${formatCount(summary.pendingOrders)} đơn (${formatVND(summary.pendingRevenue)})`
    )
  }

  return lines.join('\n')
}

/**
 * Formats course comparison across two periods (TG-04D).
 */
export function formatCourseComparisonMessage(
  teacherName: string,
  data: CourseComparisonAnalytics
): string {
  const {
    course,
    metric,
    primaryPeriod,
    comparisonPeriod,
    calculation,
    isPartialMonth,
    partialMonthDisclaimer
  } = data

  let metricName = 'Doanh thu thực nhận'
  let primaryFormatted = formatVND(primaryPeriod.revenue)
  let prevFormatted = formatVND(comparisonPeriod.revenue)
  let diffFormatted = formatVND(Math.abs(calculation.absoluteChange))

  if (metric === 'sales') {
    metricName = 'Số đơn thành công'
    primaryFormatted = `${formatCount(primaryPeriod.completedOrders)} đơn`
    prevFormatted = `${formatCount(comparisonPeriod.completedOrders)} đơn`
    diffFormatted = `${formatCount(Math.abs(calculation.absoluteChange))} đơn`
  } else if (metric === 'students') {
    metricName = 'Học viên ghi danh mới'
    primaryFormatted = `${formatCount(primaryPeriod.enrollments)} học viên`
    prevFormatted = `${formatCount(comparisonPeriod.enrollments)} học viên`
    diffFormatted = `${formatCount(Math.abs(calculation.absoluteChange))} học viên`
  }

  let trendIcon = '⚪'
  let trendText = 'Không đổi (0%)'
  if (calculation.isIncrease) {
    trendIcon = '📈'
    trendText =
      calculation.percentageChange !== null
        ? `Tăng +${calculation.percentageChange}% (+${diffFormatted})`
        : `Tăng +${diffFormatted} (kỳ trước ghi nhận 0)`
  } else if (calculation.isDecrease) {
    trendIcon = '📉'
    trendText =
      calculation.percentageChange !== null
        ? `Giảm ${calculation.percentageChange}% (-${diffFormatted})`
        : `Giảm -${diffFormatted}`
  }

  const lines = [
    '📊 *SO SÁNH HIỆU QUẢ KHÓA HỌC*',
    `👨‍🏫 Giảng viên: *${escapeMarkdown(teacherName)}*`,
    '',
    `📚 Khóa học: *${escapeMarkdown(course.title)}*`,
    `🎯 Chỉ số: *${escapeMarkdown(metricName)}*`,
    '',
    `• ${escapeMarkdown(primaryPeriod.label)}: *${primaryFormatted}*`,
    `• ${escapeMarkdown(comparisonPeriod.label)}: *${prevFormatted}*`,
    `• Biến động: ${trendIcon} *${escapeMarkdown(trendText)}*`
  ]

  if (isPartialMonth && partialMonthDisclaimer) {
    lines.push('', escapeMarkdown(partialMonthDisclaimer))
  }

  return lines.join('\n')
}

/**
 * Formats course not found advisory response.
 */
export function formatCourseNotFoundMessage(
  searchTerm: string
): string {
  return [
    '📚 *KHÔNG TÌM THẤY KHÓA HỌC*',
    '',
    `Không tìm thấy khóa học nào phù hợp với từ khóa "${escapeMarkdown(searchTerm)}" trong danh mục giảng dạy của bạn.`,
    '',
    '💡 *Gợi ý:*',
    '• Kiểm tra lại tên khóa học hoặc từ khóa tìm kiếm.',
    '• Gõ /courses để xem toàn bộ danh mục khóa học của bạn.'
  ].join('\n')
}

/**
 * Formats ambiguous course candidates advisory response.
 */
export function formatCourseAmbiguousMessage(
  searchTerm: string,
  candidates: ResolvedCourseEntity[]
): string {
  const candidateList = candidates
    .map((c, i) => `${i + 1}. *${escapeMarkdown(c.title)}* (Giá bán: ${formatVND(c.price)})`)
    .join('\n')

  return [
    '📚 *TÌM THẤY NHIỀU KHÓA HỌC PHÙ HỢP*',
    '',
    `Hệ thống tìm thấy ${candidates.length} khóa học có tên tương tự "${escapeMarkdown(searchTerm)}":`,
    '',
    candidateList,
    '',
    '👉 *Vui lòng ghi rõ hơn tên khóa học bạn cần xem thống kê.*'
  ].join('\n')
}
