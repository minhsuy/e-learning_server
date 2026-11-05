/**
 * TMDEMY — ANALYTICS DATE RANGE UTILITY (TG-03A)
 *
 * Implements high-precision, timezone-aware date range calculation for TMdemy analytics.
 *
 * TIMEZONE SPECIFICATION:
 * - Reporting timezone: `Asia/Ho_Chi_Minh` (UTC+07:00, fixed offset, no Daylight Saving Time).
 * - All reporting boundaries (start of day, start of week, start of month) are computed
 *   in Vietnam local time and converted to UTC Date objects for PostgreSQL timestamp queries.
 *
 * BOUNDARY SPECIFICATION:
 * - Inclusive start: `createdAt >= startDate`
 * - Exclusive end:   `createdAt < endDate`
 */

export type AnalyticsPeriod =
  | 'today'
  | 'yesterday'
  | 'this_week'
  | 'last_7_days'
  | 'this_month'
  | 'last_month'
  | 'custom'
  | 'all_time'

export interface DateRangeOptions {
  period?: AnalyticsPeriod | string
  startDate?: string | Date
  endDate?: string | Date
}

export interface ResolvedDateRange {
  period: AnalyticsPeriod
  startDate: Date
  endDate: Date
  isMonthly: boolean
  label: string
  timezone: string
}

// Vietnam is strictly UTC+07:00 with no daylight saving shifts
export const VIETNAM_OFFSET_HOURS = 7
export const VIETNAM_OFFSET_MS = VIETNAM_OFFSET_HOURS * 60 * 60 * 1000

/**
 * Converts a UTC Date instant into Vietnam local calendar components (year, month, day, dayOfWeek).
 */
export function getVietnamCalendarDate(date: Date = new Date()): {
  year: number
  month: number // 0-indexed (0 = Jan, 11 = Dec)
  day: number // 1-31
  dayOfWeek: number // 0 = Sun, 1 = Mon, ..., 6 = Sat
  hours: number
  minutes: number
  seconds: number
} {
  const vnTime = new Date(date.getTime() + VIETNAM_OFFSET_MS)
  return {
    year: vnTime.getUTCFullYear(),
    month: vnTime.getUTCMonth(),
    day: vnTime.getUTCDate(),
    dayOfWeek: vnTime.getUTCDay(),
    hours: vnTime.getUTCHours(),
    minutes: vnTime.getUTCMinutes(),
    seconds: vnTime.getUTCSeconds()
  }
}

/**
 * Creates a UTC Date representing 00:00:00.000 Vietnam time on the given calendar date.
 */
export function createVietnamDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - VIETNAM_OFFSET_MS)
}

/**
 * Resolves date boundaries for any supported analytics period in Asia/Ho_Chi_Minh.
 * Throws an Error if custom dates are invalid or violate sanity bounds.
 */
export function resolveAnalyticsDateRange(
  options: DateRangeOptions = {},
  referenceDate: Date = new Date()
): ResolvedDateRange {
  const period = (options.period?.toLowerCase().trim() || 'this_month') as AnalyticsPeriod
  const vn = getVietnamCalendarDate(referenceDate)

  switch (period) {
    case 'today': {
      const start = createVietnamDate(vn.year, vn.month, vn.day)
      const end = createVietnamDate(vn.year, vn.month, vn.day + 1)
      return {
        period: 'today',
        startDate: start,
        endDate: end,
        isMonthly: false,
        label: 'Hôm nay',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'yesterday': {
      const start = createVietnamDate(vn.year, vn.month, vn.day - 1)
      const end = createVietnamDate(vn.year, vn.month, vn.day)
      return {
        period: 'yesterday',
        startDate: start,
        endDate: end,
        isMonthly: false,
        label: 'Hôm qua',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'this_week': {
      // Vietnam & ISO week starts on Monday (1). If Sunday (0), distance is 6 days back.
      const diffToMonday = vn.dayOfWeek === 0 ? 6 : vn.dayOfWeek - 1
      const start = createVietnamDate(vn.year, vn.month, vn.day - diffToMonday)
      // End is next Monday 00:00:00 VN time (exclusive)
      const end = createVietnamDate(vn.year, vn.month, vn.day - diffToMonday + 7)
      return {
        period: 'this_week',
        startDate: start,
        endDate: end,
        isMonthly: false,
        label: 'Tuần này',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'last_7_days': {
      // Rolling 7 days: 7 days ago to tomorrow 00:00:00 VN time
      const start = createVietnamDate(vn.year, vn.month, vn.day - 6)
      const end = createVietnamDate(vn.year, vn.month, vn.day + 1)
      return {
        period: 'last_7_days',
        startDate: start,
        endDate: end,
        isMonthly: false,
        label: '7 ngày qua',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'this_month': {
      const start = createVietnamDate(vn.year, vn.month, 1)
      const end = createVietnamDate(vn.year, vn.month + 1, 1)
      return {
        period: 'this_month',
        startDate: start,
        endDate: end,
        isMonthly: true,
        label: 'Tháng này',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'last_month': {
      const start = createVietnamDate(vn.year, vn.month - 1, 1)
      const end = createVietnamDate(vn.year, vn.month, 1)
      return {
        period: 'last_month',
        startDate: start,
        endDate: end,
        isMonthly: true,
        label: 'Tháng trước',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'all_time': {
      const start = new Date(Date.UTC(2020, 0, 1)) // TMdemy inception boundary
      const end = createVietnamDate(vn.year, vn.month, vn.day + 1)
      return {
        period: 'all_time',
        startDate: start,
        endDate: end,
        isMonthly: true,
        label: 'Toàn thời gian',
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    case 'custom': {
      if (!options.startDate || !options.endDate) {
        throw new Error('Both startDate and endDate are required for custom period.')
      }

      const parseDate = (val: string | Date): { year: number; month: number; day: number } => {
        if (val instanceof Date) {
          if (isNaN(val.getTime())) throw new Error('Invalid Date object provided.')
          const v = getVietnamCalendarDate(val)
          return { year: v.year, month: v.month, day: v.day }
        }
        const str = String(val).trim()
        const match = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(str)
        if (!match) {
          throw new Error(`Invalid date format "${str}". Expected YYYY-MM-DD.`)
        }
        const y = parseInt(match[1], 10)
        const m = parseInt(match[2], 10) - 1
        const d = parseInt(match[3], 10)

        // Sanity check calendar day
        const testDate = new Date(Date.UTC(y, m, d))
        if (
          testDate.getUTCFullYear() !== y ||
          testDate.getUTCMonth() !== m ||
          testDate.getUTCDate() !== d
        ) {
          throw new Error(`Invalid calendar date "${str}".`)
        }

        return { year: y, month: m, day: d }
      }

      const startParts = parseDate(options.startDate)
      const endParts = parseDate(options.endDate)

      const start = createVietnamDate(startParts.year, startParts.month, startParts.day)
      // Include the entire end date by shifting end boundary to next day 00:00:00 VN time
      const end = createVietnamDate(endParts.year, endParts.month, endParts.day + 1)

      if (start.getTime() >= end.getTime()) {
        throw new Error('startDate must be before or equal to endDate.')
      }

      // Maximum span sanity guard: 5 years
      const MAX_SPAN_MS = 5 * 365.25 * 24 * 60 * 60 * 1000
      if (end.getTime() - start.getTime() > MAX_SPAN_MS) {
        throw new Error('Date range cannot exceed 5 years.')
      }

      // Check whether monthly or daily grouping is more appropriate
      const spanDays = (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)
      const isMonthly = spanDays > 62

      const startStr = `${startParts.year}-${String(startParts.month + 1).padStart(2, '0')}-${String(startParts.day).padStart(2, '0')}`
      const endStr = `${endParts.year}-${String(endParts.month + 1).padStart(2, '0')}-${String(endParts.day).padStart(2, '0')}`

      return {
        period: 'custom',
        startDate: start,
        endDate: end,
        isMonthly,
        label: `${startStr} đến ${endStr}`,
        timezone: 'Asia/Ho_Chi_Minh'
      }
    }

    default:
      throw new Error(`Unsupported analytics period "${options.period}". Supported: today, yesterday, this_week, last_7_days, this_month, last_month, custom, all_time.`)
  }
}

