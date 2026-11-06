import { Bot, BotConfig, HttpError, GrammyError } from 'grammy'
import { getTelegramConfig, maskTelegramToken } from '~/config/telegram.config'
import {
  handleCoursesCommand,
  handleOrdersCommand,
  handleReportCommand,
  handleRevenueCommand,
  handleStudentsCommand
} from './handlers/analytics.handler'
import { handleScheduleCommand } from './handlers/schedule.handler'
import {
  handleAccountCommand,
  handleHelpCommand,
  handleLinkCommand,
  handleStartCommand,
  handleStatusCommand,
  handleUnlinkCancelCallback,
  handleUnlinkCommand,
  handleUnlinkConfirmCallback
} from './handlers/commands.handler'
import { handleDefaultMessage } from './handlers/message.handler'
import { requirePrivateChat } from './middleware/privateChat.middleware'
import { requireTeacherAuth } from './middleware/teacherAuth.middleware'
import { TeacherBotContext } from './types'

/**
 * TMDEMY — TELEGRAM TEACHER BOT LIFECYCLE & CORE SERVICE (TG-01, TG-02A, TG-03B)
 *
 * Implements the Grammy-based Telegram Bot lifecycle, configuration loading,
 * middleware attachment, error boundary isolation, and graceful shutdown.
 *
 * RESILIENCE INVARIANTS:
 * 1. Express API Isolation: Any Telegram network failure, polling timeout,
 *    or Bot API error is trapped and logged safely. It must NEVER crash Express.
 * 2. Duplicate Prevention: Prevents concurrent long-polling instances when
 *    running under hot-reload dev servers (nodemon).
 * 3. Secret Masking: TELEGRAM_BOT_TOKEN is never printed or exposed in logs.
 * 4. Multi-Tenant Teacher Security: All analytics commands strictly protected by requireTeacherAuth.
 */

export const TELEGRAM_BOT_COMMANDS = [
  { command: 'report', description: 'Báo cáo tổng hợp kinh doanh toàn diện (Executive Summary)' },
  { command: 'revenue', description: 'Báo cáo doanh thu khóa học (mặc định: tháng này)' },
  { command: 'orders', description: 'Thống kê chi tiết đơn hàng (thành công, hủy, pending)' },
  { command: 'students', description: 'Thống kê học viên & tình trạng ghi danh' },
  { command: 'courses', description: 'Danh mục khóa học & tỷ lệ phát sinh doanh số' },
  { command: 'schedule', description: 'Cài đặt lịch nhận báo cáo tự động (hàng ngày / hàng tuần)' },
  { command: 'account', description: 'Xem tài khoản Giảng viên TMdemy đã liên kết' },
  { command: 'status', description: 'Kiểm tra trạng thái kết nối và định danh' },
  { command: 'help', description: 'Hướng dẫn sử dụng chi tiết' }
] as const

let activeBotInstance: Bot<TeacherBotContext> | null = null
let isStarting = false
let isRunning = false
let shutdownHooksRegistered = false

/**
 * Factory function to construct and configure a Grammy Bot instance.
 * Exposed for testing and modularity.
 */
export function createTelegramBot(
  token: string,
  options?: BotConfig<TeacherBotContext>
): Bot<TeacherBotContext> {
  const bot = new Bot<TeacherBotContext>(token, options)

  // 1. Error Boundary — Traps all update processing & network errors
  bot.catch((err) => {
    const ctx = err.ctx
    const error = err.error

    console.error(`[TelegramBot Error] Update ID ${ctx?.update?.update_id || 'unknown'} encountered an error:`)

    if (error instanceof GrammyError) {
      console.error(`[TelegramBot GrammyError] (${error.error_code}): ${error.description}`)
    } else if (error instanceof HttpError) {
      console.error(`[TelegramBot HttpError] Upstream network error: ${error.message}`)
    } else {
      const msg = error instanceof Error ? error.message : String(error)
      console.error(`[TelegramBot UnexpectedError] ${msg}`)
    }
  })

  // 2. Security Middleware — Restrict interactions strictly to private 1-on-1 chats
  bot.use(requirePrivateChat)

  // 3. Command Handlers
  bot.command('start', handleStartCommand)
  bot.command('link', handleLinkCommand)
  bot.command('account', handleAccountCommand)
  bot.command('unlink', handleUnlinkCommand)
  bot.command('help', handleHelpCommand)
  bot.command('status', handleStatusCommand)

  // 3.1 Analytics Commands (Protected by Teacher Authorization & Scoped Isolation)
  bot.command('revenue', requireTeacherAuth, handleRevenueCommand)
  bot.command('orders', requireTeacherAuth, handleOrdersCommand)
  bot.command('students', requireTeacherAuth, handleStudentsCommand)
  bot.command('courses', requireTeacherAuth, handleCoursesCommand)
  bot.command('report', requireTeacherAuth, handleReportCommand)
  bot.command('schedule', requireTeacherAuth, handleScheduleCommand)

  // 4. Callback Query Handlers (Inline Keyboard Confirmations)
  bot.callbackQuery('unlink_confirm', handleUnlinkConfirmCallback)
  bot.callbackQuery('unlink_cancel', handleUnlinkCancelCallback)

  // 5. Default Text Message Fallback
  bot.on('message:text', handleDefaultMessage)

  return bot
}

/**
 * Gracefully stops the Telegram bot long polling runner.
 */
export async function stopTelegramBot(): Promise<void> {
  if (!activeBotInstance || !isRunning) {
    isRunning = false
    isStarting = false
    return
  }

  try {
    console.log('[TelegramBot] Initiating graceful shutdown of Telegram Bot...')
    const botToStop = activeBotInstance
    isRunning = false
    isStarting = false
    activeBotInstance = null

    if (botToStop.isRunning()) {
      await botToStop.stop()
    }
    console.log('[TelegramBot] Telegram Bot successfully stopped.')
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramBot] Error during bot shutdown: ${msg}`)
  }
}

/**
 * Registers process signal handlers to ensure clean shutdown during hot-reloads and process exits.
 */
function registerShutdownHooks(): void {
  if (shutdownHooksRegistered) return
  shutdownHooksRegistered = true

  const handleSignal = async (signal: string) => {
    console.log(`[TelegramBot] Received ${signal}. Stopping bot...`)
    await stopTelegramBot()
  }

  process.once('SIGINT', () => handleSignal('SIGINT'))
  process.once('SIGTERM', () => handleSignal('SIGTERM'))
  // nodemon sends SIGUSR2 on reload
  process.once('SIGUSR2', async () => {
    await handleSignal('SIGUSR2')
    process.kill(process.pid, 'SIGUSR2')
  })
}

/**
 * Initializes and starts the Telegram Teacher Bot via long polling.
 * Returns true if the bot was started, or false if disabled/not configured.
 *
 * NOTE: Non-blocking; long-polling runs asynchronously in the background.
 */
export async function initTelegramBot(): Promise<boolean> {
  const config = getTelegramConfig()

  // 1. Check feature flag and token availability
  if (!config.enabled) {
    if (!config.botToken) {
      console.log('[TelegramBot] TELEGRAM_BOT_TOKEN is not configured. Telegram Bot is disabled.')
    } else {
      console.log('[TelegramBot] TELEGRAM_BOT_ENABLED is false. Telegram Bot is disabled.')
    }
    return false
  }

  if (!config.isValid) {
    console.warn(
      `[TelegramBot Warning] Invalid TELEGRAM_BOT_TOKEN syntax (${maskTelegramToken(config.botToken)}). Telegram Bot will not start.`
    )
    return false
  }

  // 2. Prevent duplicate bot instances (e.g. during development hot-reloads)
  if (isRunning || isStarting) {
    console.log('[TelegramBot] Telegram Bot is already running or starting. Duplicate launch skipped.')
    return true
  }

  isStarting = true

  try {
    const bot = createTelegramBot(config.botToken)
    activeBotInstance = bot

    registerShutdownHooks()

    // 3. Start long polling in background without awaiting completion
    bot
      .start({
        timeout: config.pollingTimeoutSeconds,
        onStart: (botInfo) => {
          isRunning = true
          isStarting = false
          console.log(
            `[TelegramBot] TMdemy Teacher Bot @${botInfo.username} (ID: ${botInfo.id}) started successfully via long polling.`
          )
          // Asynchronously register command menu with Telegram client UI
          bot.api
            .setMyCommands([...TELEGRAM_BOT_COMMANDS])
            .catch((err: unknown) => {
              const msg = err instanceof Error ? err.message : String(err)
              console.warn(`[TelegramBot Warning] Failed to update bot command menu: ${msg}`)
            })
        }
      })
      .catch((err: unknown) => {
        isRunning = false
        isStarting = false
        activeBotInstance = null
        const msg = err instanceof Error ? err.message : String(err)
        console.error(`[TelegramBot] Long polling terminated with error: ${msg}`)
      })

    return true
  } catch (err: unknown) {
    isRunning = false
    isStarting = false
    activeBotInstance = null
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramBot] Failed to initialize Telegram Bot: ${msg}`)
    return false
  }
}

/**
 * Returns whether the Telegram bot is actively running.
 */
export function isTelegramBotRunning(): boolean {
  return isRunning && activeBotInstance !== null && activeBotInstance.isRunning()
}

/**
 * Retrieves the currently active Bot instance (if any).
 */
export function getTelegramBotInstance(): Bot<TeacherBotContext> | null {
  return activeBotInstance
}

