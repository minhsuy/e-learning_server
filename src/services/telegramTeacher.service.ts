import crypto from 'crypto'
import { prisma } from '~/config/prisma'
import { getTelegramBotInstance } from '~/telegram/bot'
import { findUserById } from '~/repositories/user.repository'
import {
  consumeLinkToken,
  createTelegramAccount,
  createTelegramLinkToken,
  deleteTelegramAccountByTelegramId,
  deleteTelegramAccountByUserId,
  findActiveLinkTokenByHash,
  findTelegramAccountByTelegramId,
  findTelegramAccountByUserId,
  invalidateActiveTokensByUserId
} from '~/repositories/telegramAccount.repository'
import { ServiceResponse } from '~/types/type'
import {
  TelegramAccountDTO,
  TelegramLinkingStatus,
  TelegramLinkTokenResponse,
  TelegramTeacherProfile
} from '~/models/telegramAccount.model'

/**
 * TMDEMY — TELEGRAM TEACHER SERVICE (TG-02A)
 *
 * Implements business rules, cryptographic token operations, and multi-teacher
 * account linking for TMdemy Teacher Analytics Bot.
 *
 * SECURITY INVARIANTS:
 * 1. Tokens are single-use, 15-minute lifespan, stored strictly as SHA-256 hashes.
 * 2. Only active users with role === 'TEACHER' can generate tokens or link accounts.
 * 3. 1-to-1 relationship enforced: one TMdemy teacher <=> one Telegram numeric ID.
 * 4. Concurrent token consumption is protected via atomic Prisma transactions.
 */

/**
 * Masks an email for privacy in Telegram messages (e.g., alex.rivers@domain.com -> a***s@domain.com).
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '***'
  const [local, domain] = email.split('@')
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`
}

/**
 * Generates a one-time cryptographic linking token and Telegram deep link for an authenticated teacher.
 */
export const generateTeacherLinkTokenService = async (
  userId: string
): Promise<ServiceResponse<TelegramLinkTokenResponse>> => {
  // 1. Verify user existence and active teacher role
  const user = await findUserById(userId)
  if (!user || user.status !== 'ACTIVE') {
    return {
      success: false,
      statusCode: 404,
      message: 'Teacher account not found or is inactive'
    }
  }

  const role = (user.role || '').toLowerCase()
  if (role !== 'teacher') {
    return {
      success: false,
      statusCode: 403,
      message: 'FORBIDDEN - Only verified teacher accounts can link Telegram'
    }
  }

  // 2. Check if already linked
  const existingAccount = await findTelegramAccountByUserId(userId)
  if (existingAccount) {
    return {
      success: false,
      statusCode: 409,
      message: 'Tài khoản Giảng viên đã được liên kết với một tài khoản Telegram. Vui lòng hủy liên kết trước khi tạo mã mới.'
    }
  }

  // 3. Invalidate previous active unconsumed tokens for this teacher
  await invalidateActiveTokensByUserId(userId)

  // 4. Generate 256-bit cryptographically secure token (64 hex chars)
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')

  // 5. Expiration: strictly 15 minutes
  const expiresInMinutes = 15
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000)

  // 6. Persist token hash in database
  await createTelegramLinkToken({
    userId,
    tokenHash,
    expiresAt
  })

  // 7. Resolve Telegram Bot username for deep link
  const botInstance = getTelegramBotInstance()
  const botUsername =
    botInstance?.botInfo?.username ||
    process.env.TELEGRAM_BOT_USERNAME?.trim() ||
    'TMdemyTeacherBot'

  const deepLink = `https://t.me/${botUsername}?start=link_${rawToken}`

  return {
    success: true,
    statusCode: 201,
    data: {
      token: rawToken,
      deepLink,
      expiresAt: expiresAt.toISOString(),
      expiresInMinutes
    }
  }
}

/**
 * Retrieves the Telegram linking status for an authenticated teacher.
 */
export const getTeacherTelegramStatusService = async (
  userId: string
): Promise<ServiceResponse<TelegramLinkingStatus>> => {
  const account = await findTelegramAccountByUserId(userId)

  if (!account) {
    return {
      success: true,
      statusCode: 200,
      data: {
        isLinked: false,
        account: null
      }
    }
  }

  const accountDTO: TelegramAccountDTO = {
    id: account.id,
    userId: account.userId,
    telegramUserId: account.telegramUserId.toString(),
    telegramChatId: account.telegramChatId.toString(),
    telegramUsername: account.telegramUsername,
    telegramFirstName: account.telegramFirstName,
    linkedAt: account.linkedAt,
    updatedAt: account.updatedAt
  }

  return {
    success: true,
    statusCode: 200,
    data: {
      isLinked: true,
      account: accountDTO
    }
  }
}

/**
 * Unlinks the Telegram account for an authenticated teacher via REST API.
 */
export const unlinkTeacherTelegramService = async (
  userId: string
): Promise<ServiceResponse<null>> => {
  const existing = await findTelegramAccountByUserId(userId)
  if (!existing) {
    return {
      success: false,
      statusCode: 404,
      message: 'Tài khoản Giảng viên chưa liên kết với tài khoản Telegram nào'
    }
  }

  await deleteTelegramAccountByUserId(userId)

  return {
    success: true,
    statusCode: 200,
    message: 'Hủy liên kết tài khoản Telegram thành công'
  }
}

/**
 * Consumes a one-time link token and atomically binds the Telegram account to the TMdemy teacher.
 * Executed when the teacher sends `/link <token>` or `/start link_<token>`.
 */
export const consumeLinkTokenAndBindService = async (params: {
  rawToken: string
  telegramUserId: bigint | number | string
  telegramChatId: bigint | number | string
  telegramUsername?: string | null
  telegramFirstName?: string | null
}): Promise<{
  success: boolean
  message: string
  teacher?: {
    id: string
    username: string
    email: string
  }
}> => {
  const { rawToken, telegramUserId, telegramChatId, telegramUsername, telegramFirstName } = params

  // 1. Syntactic validation of raw token (must be 64-char hex string)
  const trimmed = rawToken.trim()
  if (!/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return {
      success: false,
      message: 'Mã liên kết không hợp lệ. Vui lòng kiểm tra lại hoặc tạo mã liên kết mới từ trang web TMdemy.'
    }
  }

  const tokenHash = crypto.createHash('sha256').update(trimmed).digest('hex')
  const numericTelegramUserId = typeof telegramUserId === 'bigint' ? telegramUserId : BigInt(telegramUserId)
  const numericTelegramChatId = typeof telegramChatId === 'bigint' ? telegramChatId : BigInt(telegramChatId)

  // 2. Atomic transaction to prevent race conditions & duplicate consumption
  try {
    return await prisma.$transaction(async (tx) => {
      // Find active unconsumed token
      const tokenRecord = await findActiveLinkTokenByHash(tokenHash, tx)
      if (!tokenRecord) {
        return {
          success: false,
          message: 'Mã liên kết không tồn tại, đã được sử dụng hoặc đã hết hạn (thời hạn 15 phút).'
        }
      }

      const user = tokenRecord.user
      if (!user || user.status !== 'ACTIVE') {
        return {
          success: false,
          message: 'Tài khoản TMdemy liên quan không tồn tại hoặc đã bị khóa.'
        }
      }

      const role = (user.role || '').toLowerCase()
      if (role !== 'teacher') {
        return {
          success: false,
          message: 'Tài khoản TMdemy này không có vai trò Giảng viên (Teacher). Chỉ Giảng viên mới được liên kết Bot thống kê.'
        }
      }

      // Check if this Telegram account is already linked to ANY teacher
      const existingTelegramBinding = await findTelegramAccountByTelegramId(numericTelegramUserId, tx)
      if (existingTelegramBinding) {
        return {
          success: false,
          message: 'Tài khoản Telegram này đã được liên kết với một Giảng viên khác trên TMdemy. Vui lòng dùng lệnh /unlink để hủy liên kết cũ trước.'
        }
      }

      // Check if this TMdemy user is already linked to ANY Telegram account
      const existingTeacherBinding = await findTelegramAccountByUserId(user.id, tx)
      if (existingTeacherBinding) {
        return {
          success: false,
          message: 'Tài khoản Giảng viên TMdemy này đã liên kết với một tài khoản Telegram khác. Vui lòng hủy liên kết trên tài khoản cũ trước.'
        }
      }

      // Mark token as consumed
      await consumeLinkToken(tokenRecord.id, numericTelegramUserId, tx)

      // Bind Telegram account
      await createTelegramAccount(
        {
          userId: user.id,
          telegramUserId: numericTelegramUserId,
          telegramChatId: numericTelegramChatId,
          telegramUsername: telegramUsername || null,
          telegramFirstName: telegramFirstName || null
        },
        tx
      )

      return {
        success: true,
        message: 'Liên kết tài khoản Giảng viên thành công!',
        teacher: {
          id: user.id,
          username: user.username,
          email: user.email
        }
      }
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[TelegramTeacherService Error] Linking transaction failed: ${msg}`)
    return {
      success: false,
      message: 'Có lỗi xảy ra trong quá trình liên kết tài khoản. Vui lòng thử lại sau.'
    }
  }
}

/**
 * Unlinks a Telegram account directly from the Telegram bot interface (/unlink).
 */
export const unlinkFromTelegramService = async (
  telegramUserId: bigint | number | string
): Promise<{ success: boolean; message: string }> => {
  const numericId = typeof telegramUserId === 'bigint' ? telegramUserId : BigInt(telegramUserId)

  const existing = await findTelegramAccountByTelegramId(numericId)
  if (!existing) {
    return {
      success: false,
      message: 'Tài khoản Telegram này hiện chưa được liên kết với bất kỳ tài khoản Giảng viên TMdemy nào.'
    }
  }

  await deleteTelegramAccountByTelegramId(numericId)

  return {
    success: true,
    message: 'Đã hủy liên kết tài khoản Telegram với hệ thống TMdemy thành công.'
  }
}

/**
 * Retrieves a teacher's profile and verification status by Telegram numeric User ID.
 * Returns null if the Telegram user is not linked or not an active teacher.
 */
export const getTeacherProfileByTelegramIdService = async (
  telegramUserId: bigint | number | string
): Promise<TelegramTeacherProfile | null> => {
  const numericId = typeof telegramUserId === 'bigint' ? telegramUserId : BigInt(telegramUserId)

  const account = await findTelegramAccountByTelegramId(numericId)
  if (!account || !account.user) return null

  const user = account.user
  const role = (user.role || '').toLowerCase()
  if (role !== 'teacher' || user.status !== 'ACTIVE') {
    return null
  }

  return {
    userId: user.id,
    username: user.username,
    maskedEmail: maskEmail(user.email),
    role: user.role,
    status: user.status,
    telegramUserId: account.telegramUserId.toString(),
    telegramUsername: account.telegramUsername,
    linkedAt: account.linkedAt
  }
}

