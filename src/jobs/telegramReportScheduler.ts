import { findDueSchedules } from '~/repositories/telegramReportSchedule.repository'
import { dispatchScheduleReport, DispatchDeliveryResult } from '~/services/telegramReportDelivery.service'

/**
 * TMDEMY — TELEGRAM REPORT SCHEDULER BACKGROUND JOB (TG-05)
 *
 * Runs periodically (default every 60 seconds) to find and dispatch
 * due automated reports (DAILY and WEEKLY) to TMdemy teachers.
 *
 * RESILIENCE INVARIANTS:
 * 1. OVERLAP GUARD: Prevents overlapping executions on long-running dispatches.
 * 2. TRANSACTIONAL CLAIMING: Relies on atomic PostgreSQL claim to prevent duplicate deliveries.
 * 3. GRACEFUL LIFECYCLE: Controlled start and stop hooked into server startup and shutdown.
 * 4. ERROR ISOLATION: A single teacher failure never halts processing for other teachers.
 */

let schedulerTimer: NodeJS.Timeout | null = null
let isRunning = false
let isChecking = false

/**
 * Executes a single sweep: checks for due schedules and dispatches reports.
 */
export async function checkAndDispatchDueReports(
  referenceDate: Date = new Date(),
  options?: {
    mockTelegramSender?: (chatId: string | number | bigint, text: string) => Promise<{ message_id: number }>
    skipAi?: boolean
    mockAiResponse?: unknown
  }
): Promise<DispatchDeliveryResult[]> {
  if (isChecking) {
    return []
  }

  isChecking = true
  const results: DispatchDeliveryResult[] = []

  try {
    const dueSchedules = await findDueSchedules(referenceDate, 50)

    if (dueSchedules.length === 0) {
      return []
    }

    console.log(
      `[ReportScheduler] Found ${dueSchedules.length} due report schedule(s) at ${referenceDate.toISOString()}. Processing...`
    )

    for (const schedule of dueSchedules) {
      try {
        const result = await dispatchScheduleReport(schedule, referenceDate, options)
        results.push(result)
      } catch (scheduleErr: unknown) {
        const msg = scheduleErr instanceof Error ? scheduleErr.message : String(scheduleErr)
        console.error(
          `[ReportScheduler Error] Failed to process schedule ID ${schedule.id} (Teacher: ${schedule.teacherId}): ${msg}`
        )
      }
    }

    const deliveredCount = results.filter((r) => r.status === 'DELIVERED').length
    const failedCount = results.filter((r) => r.status === 'FAILED').length
    const skippedCount = results.filter((r) => r.status === 'SKIPPED').length

    console.log(
      `[ReportScheduler] Dispatch batch finished: ${deliveredCount} delivered, ${failedCount} failed, ${skippedCount} skipped.`
    )
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[ReportScheduler Sweep Error] ${msg}`)
  } finally {
    isChecking = false
  }

  return results
}

/**
 * Starts the Telegram Report Scheduler loop.
 */
export function startTelegramReportScheduler(intervalMs: number = 60_000): void {
  if (isRunning) {
    return
  }

  isRunning = true
  console.log(`[ReportScheduler] Starting Telegram Report Scheduler (Interval: ${intervalMs / 1000}s)...`)

  // Initial sweep after 5 seconds to let server finish boot
  setTimeout(() => {
    if (isRunning) {
      checkAndDispatchDueReports().catch((err) => {
        console.error('[ReportScheduler Initial Sweep Error]', err)
      })
    }
  }, 5000)

  schedulerTimer = setInterval(() => {
    checkAndDispatchDueReports().catch((err) => {
      console.error('[ReportScheduler Periodic Sweep Error]', err)
    })
  }, intervalMs)

  if (schedulerTimer.unref) {
    schedulerTimer.unref()
  }
}

/**
 * Stops the Telegram Report Scheduler.
 */
export function stopTelegramReportScheduler(): void {
  if (!isRunning) {
    return
  }

  isRunning = false
  if (schedulerTimer) {
    clearInterval(schedulerTimer)
    schedulerTimer = null
  }
  console.log('[ReportScheduler] Telegram Report Scheduler stopped.')
}

/**
 * Status check helper.
 */
export function isTelegramReportSchedulerRunning(): boolean {
  return isRunning
}

