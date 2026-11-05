import cron from 'node-cron'
import dotenv from 'dotenv'
import { reconcileActiveJobsService } from '~/services/aiProcessing.service'

dotenv.config()

/**
 * TMDEMY — BACKGROUND AI JOB RECONCILIATION WORKER
 * 
 * Periodically discovers active or interrupted AI processing jobs
 * (QUEUED, RUNNING, or SUBMITTING pending recovery) across server restarts
 * and reconciles their progress with the FastAPI AI Microservice in bounded batches.
 * 
 * Enforces:
 * - Atomic execution guard (isReconciling) preventing overlapping polling loops
 * - Configurable cron schedule and batch limits
 * - Resilient error handling without process crashes
 */

const isEnabled = process.env.AI_JOB_RECONCILIATION_ENABLED !== 'false'
const cronExpression = process.env.AI_JOB_RECONCILIATION_CRON || '*/30 * * * * *' // Every 30 seconds
const batchSize = parseInt(process.env.AI_JOB_RECONCILIATION_BATCH_SIZE || '10', 10)

let isReconciling = false

if (isEnabled) {
  console.log(`🟢 AI Job Reconciliation scheduled with expression "${cronExpression}", batchSize = ${batchSize}`)

  cron.schedule(cronExpression, async () => {
    // Overlap protection: Never launch concurrent polling loops
    if (isReconciling) {
      return
    }

    isReconciling = true
    try {
      const summary = await reconcileActiveJobsService(batchSize)
      if (summary.processed > 0) {
        console.log(
          `🤖 [AI Reconciliation] Processed: ${summary.processed}, Completed: ${summary.completed}, Failed: ${summary.failed}`
        )
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err)
      console.error(`❌ [AI Reconciliation] Error during periodic reconciliation: ${errMsg}`)
    } finally {
      isReconciling = false
    }
  })
} else {
  console.log('⚪ AI Job Reconciliation is disabled via AI_JOB_RECONCILIATION_ENABLED=false')
}

export function isReconciliationRunning(): boolean {
  return isReconciling
}
