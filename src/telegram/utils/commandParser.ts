import { AnalyticsPeriod, DateRangeOptions } from '~/utils/analyticsDateRange'

/**
 * TMDEMY — TELEGRAM COMMAND ARGUMENT PARSER (TG-03B)
 *
 * Parses and validates arguments for Telegram analytics commands:
 * - /revenue [period | custom YYYY-MM-DD YYYY-MM-DD]
 * - /orders [period | custom YYYY-MM-DD YYYY-MM-DD]
 * - /students [period | custom YYYY-MM-DD YYYY-MM-DD]
 *
 * Supported Canonical Periods:
 * - today, yesterday, this_week, last_7_days, this_month (default), last_month, all_time, custom
 *
 * Supported Vietnamese Aliases:
 * - hom_nay / homnay -> today
 * - hom_qua / homqua -> yesterday
 * - tuan_nay / tuannay -> this_week
 * - 7_ngay_qua / 7ngay / 7_ngay -> last_7_days
 * - thang_nay / thangnay -> this_month
 * - thang_truoc / thangtruoc -> last_month
 * - toan_thoi_gian / toanthoigian / tat_ca / tatca -> all_time
 * - tuy_chinh / tuychinh -> custom
 */

export interface ParsedDateRangeSuccess {
  isValid: true
  options: DateRangeOptions
  period: AnalyticsPeriod
}

export interface ParsedDateRangeError {
  isValid: false
  errorMessage: string
}

export type ParsedDateRangeResult = ParsedDateRangeSuccess | ParsedDateRangeError

const PERIOD_ALIASES: Record<string, AnalyticsPeriod> = {
  // Canonical
  today: 'today',
  yesterday: 'yesterday',
  this_week: 'this_week',
  week: 'this_week',
  last_7_days: 'last_7_days',
  '7days': 'last_7_days',
  '7_days': 'last_7_days',
  this_month: 'this_month',
  month: 'this_month',
  last_month: 'last_month',
  all_time: 'all_time',
  all: 'all_time',
  custom: 'custom',

  // Vietnamese Aliases
  hom_nay: 'today',
  homnay: 'today',
  hom_qua: 'yesterday',
  homqua: 'yesterday',
  tuan_nay: 'this_week',
  tuannay: 'this_week',
  tuan: 'this_week',
  '7_ngay_qua': 'last_7_days',
  '7ngayqua': 'last_7_days',
  '7_ngay': 'last_7_days',
  '7ngay': 'last_7_days',
  thang_nay: 'this_month',
  thangnay: 'this_month',
  thang: 'this_month',
  thang_truoc: 'last_month',
  thangtruoc: 'last_month',
  toan_thoi_gian: 'all_time',
  toanthoigian: 'all_time',
  tat_ca: 'all_time',
  tatca: 'all_time',
  tuy_chinh: 'custom',
  tuychinh: 'custom'
}

/**
 * Standard usage guide for invalid date range commands in Vietnamese.
 */
export function getPeriodUsageGuide(commandName: string = 'revenue'): string {
  return [
    `⚠️ *CÚ PHÁP THỜI GIAN KHÔNG HỢP LỆ*`,
    '',
    `Cách dùng lệnh \`/${commandName}\`:`,
    `• \`/${commandName}\` (mặc định: tháng này)`,
    `• \`/${commandName} today\` (hoặc \`hom_nay\`): Hôm nay`,
    `• \`/${commandName} yesterday\` (hoặc \`hom_qua\`): Hôm qua`,
    `• \`/${commandName} this_week\` (hoặc \`tuan_nay\`): Tuần này (bắt đầu từ Thứ 2)`,
    `• \`/${commandName} last_7_days\` (hoặc \`7_ngay\`): 7 ngày qua`,
    `• \`/${commandName} this_month\` (hoặc \`thang_nay\`): Tháng này`,
    `• \`/${commandName} last_month\` (hoặc \`thang_truoc\`): Tháng trước`,
    `• \`/${commandName} all_time\` (hoặc \`toan_thoi_gian\`): Toàn thời gian`,
    `• \`/${commandName} custom YYYY-MM-DD YYYY-MM-DD\`: Khoảng ngày tùy chỉnh`,
    '',
    `💡 *Ví dụ:*`,
    `\`/${commandName} this_week\``,
    `\`/${commandName} custom 2026-01-01 2026-03-31\``
  ].join('\n')
}

/**
 * Validates a YYYY-MM-DD date string.
 */
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10))
  if (m < 1 || m > 12) return false
  if (d < 1 || d > 31) return false
  const date = new Date(Date.UTC(y, m - 1, d))
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}

/**
 * Parses raw command argument string for date range options.
 *
 * @param rawArgs Raw argument string following the command (e.g. "today", "custom 2026-01-01 2026-03-31")
 * @param commandName The name of the command for error help rendering
 */
export function parseDateRangeArgs(
  rawArgs?: string | null,
  commandName: string = 'revenue'
): ParsedDateRangeResult {
  const trimmed = (rawArgs || '').trim()

  // Default to this_month if no arguments provided
  if (!trimmed) {
    return {
      isValid: true,
      options: { period: 'this_month' },
      period: 'this_month'
    }
  }

  const tokens = trimmed.split(/\s+/).filter(Boolean)
  const firstToken = tokens[0].toLowerCase()

  // Case 1: Custom period with explicit keyword "custom" or "tuy_chinh"
  if (firstToken === 'custom' || firstToken === 'tuy_chinh' || firstToken === 'tuychinh') {
    if (tokens.length < 3) {
      return {
        isValid: false,
        errorMessage: [
          `⚠️ *THIẾU KHOẢNG NGÀY TÙY CHỈNH*`,
          '',
          `Cú pháp đúng: \`/${commandName} custom YYYY-MM-DD YYYY-MM-DD\``,
          `Ví dụ: \`/${commandName} custom 2026-01-01 2026-03-31\``
        ].join('\n')
      }
    }

    const startDate = tokens[1]
    const endDate = tokens[2]

    if (!isValidDateString(startDate) || !isValidDateString(endDate)) {
      return {
        isValid: false,
        errorMessage: [
          `⚠️ *ĐỊNH DẠNG NGÀY KHÔNG ĐÚNG*`,
          '',
          `Ngày phải có định dạng \`YYYY-MM-DD\` (ví dụ: \`2026-01-15\`).`,
          `Cú pháp: \`/${commandName} custom YYYY-MM-DD YYYY-MM-DD\``
        ].join('\n')
      }
    }

    if (startDate > endDate) {
      return {
        isValid: false,
        errorMessage: [
          `⚠️ *KHOẢNG NGÀY KHÔNG HỢP LỆ*`,
          '',
          `Ngày bắt đầu (\`${startDate}\`) không được lớn hơn ngày kết thúc (\`${endDate}\`).`
        ].join('\n')
      }
    }

    return {
      isValid: true,
      options: {
        period: 'custom',
        startDate,
        endDate
      },
      period: 'custom'
    }
  }

  // Case 2: Direct two dates without "custom" keyword (e.g. /revenue 2026-01-01 2026-03-31)
  if (tokens.length === 2 && isValidDateString(tokens[0]) && isValidDateString(tokens[1])) {
    const startDate = tokens[0]
    const endDate = tokens[1]

    if (startDate > endDate) {
      return {
        isValid: false,
        errorMessage: [
          `⚠️ *KHOẢNG NGÀY KHÔNG HỢP LỆ*`,
          '',
          `Ngày bắt đầu (\`${startDate}\`) không được lớn hơn ngày kết thúc (\`${endDate}\`).`
        ].join('\n')
      }
    }

    return {
      isValid: true,
      options: {
        period: 'custom',
        startDate,
        endDate
      },
      period: 'custom'
    }
  }

  // Case 3: Standard single period keyword or alias
  const mappedPeriod = PERIOD_ALIASES[firstToken]
  if (mappedPeriod && mappedPeriod !== 'custom') {
    return {
      isValid: true,
      options: { period: mappedPeriod },
      period: mappedPeriod
    }
  }

  // Invalid argument provided
  return {
    isValid: false,
    errorMessage: getPeriodUsageGuide(commandName)
  }
}

