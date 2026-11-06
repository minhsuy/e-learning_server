import { z } from 'zod'

/**
 * TMDEMY — TELEGRAM REPORT SCHEDULING APPLICATION MODELS (TG-05)
 *
 * Defines Zod schemas, validation contracts, and TypeScript interfaces for:
 * - Daily and weekly automated report scheduling
 * - Time validation (HH:mm in 24h format)
 * - Day-of-week parsing (1 = Monday ... 7 = Sunday) with Vietnamese & English aliases
 * - Schedule DTOs for Telegram commands and REST APIs
 */

export const TelegramReportTypeSchema = z.enum(['DAILY', 'WEEKLY'])
export type TelegramReportType = z.infer<typeof TelegramReportTypeSchema>

export const DeliveryTimeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ gửi báo cáo phải theo định dạng HH:mm (00:00 - 23:59)')

export const DayOfWeekSchema = z.number().int().min(1).max(7)

export const ConfigureDailyScheduleSchema = z.object({
  isEnabled: z.boolean().optional(),
  deliveryTime: DeliveryTimeSchema.optional()
})

export const ConfigureWeeklyScheduleSchema = z.object({
  isEnabled: z.boolean().optional(),
  deliveryTime: DeliveryTimeSchema.optional(),
  dayOfWeek: DayOfWeekSchema.optional()
})

export type ConfigureDailyScheduleInput = z.infer<typeof ConfigureDailyScheduleSchema>
export type ConfigureWeeklyScheduleInput = z.infer<typeof ConfigureWeeklyScheduleSchema>

export interface TelegramReportScheduleItem {
  id: string
  teacherId: string
  reportType: TelegramReportType
  isEnabled: boolean
  deliveryTime: string
  dayOfWeek: number | null
  dayOfWeekLabel?: string
  timezone: string
  nextRunAt: Date | null
  lastRunAt: Date | null
  lastStatus: string | null
  failureReason: string | null
  createdAt: Date
  updatedAt: Date
}

export interface TeacherSchedulesSummary {
  teacherId: string
  isTelegramLinked: boolean
  telegramUsername?: string | null
  daily: TelegramReportScheduleItem
  weekly: TelegramReportScheduleItem
}

/**
 * Parses day of week string in Vietnamese or English into 1 (Mon) .. 7 (Sun).
 * Returns null if invalid.
 */
export function parseDayOfWeek(input: string | number | undefined | null): number | null {
  if (input === undefined || input === null) return null

  if (typeof input === 'number') {
    return input >= 1 && input <= 7 ? input : null
  }

  const raw = String(input).toLowerCase().trim().replace(/[\s_-]+/g, '')

  // Mapping: 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday, 7 = Sunday
  const mapping: Record<string, number> = {
    // Monday
    '1': 1,
    mon: 1,
    monday: 1,
    t2: 1,
    thu2: 1,
    thuhai: 1,
    thứ2: 1,
    thứhai: 1,
    // Tuesday
    '2': 2,
    tue: 2,
    tues: 2,
    tuesday: 2,
    t3: 2,
    thu3: 2,
    thuba: 2,
    thứ3: 2,
    thứba: 2,
    // Wednesday
    '3': 3,
    wed: 3,
    wednesday: 3,
    t4: 3,
    thu4: 3,
    thutu: 3,
    thứ4: 3,
    thứtư: 3,
    // Thursday
    '4': 4,
    thu: 4,
    thur: 4,
    thursday: 4,
    t5: 4,
    thu5: 4,
    thunam: 4,
    thứ5: 4,
    thứnăm: 4,
    // Friday
    '5': 5,
    fri: 5,
    friday: 5,
    t6: 5,
    thu6: 5,
    thusau: 5,
    thứ6: 5,
    thứsáu: 5,
    // Saturday
    '6': 6,
    sat: 6,
    saturday: 6,
    t7: 6,
    thu7: 6,
    thubay: 6,
    thứ7: 6,
    thứbảy: 6,
    // Sunday
    '7': 7,
    sun: 7,
    sunday: 7,
    cn: 7,
    chunhat: 7,
    chủnhật: 7
  }

  return mapping[raw] ?? null
}

/**
 * Returns localized Vietnamese label for a day-of-week integer (1 = Thứ Hai .. 7 = Chủ Nhật).
 */
export function formatDayOfWeek(day: number | null | undefined): string {
  switch (day) {
    case 1:
      return 'Thứ Hai'
    case 2:
      return 'Thứ Ba'
    case 3:
      return 'Thứ Tư'
    case 4:
      return 'Thứ Năm'
    case 5:
      return 'Thứ Sáu'
    case 6:
      return 'Thứ Bảy'
    case 7:
      return 'Chủ Nhật'
    default:
      return 'Chưa đặt'
  }
}

