import { prisma, PrismaTransactionClient } from '~/config/prisma'
import { Prisma } from '@prisma/client'

/**
 * TMDEMY — TELEGRAM ACCOUNT & LINK TOKEN FUNCTIONAL REPOSITORY (TG-02A)
 *
 * Implements pure functional database access for:
 * - telegram_accounts table
 * - telegram_link_tokens table
 *
 * All functions accept an optional PrismaTransactionClient (`tx`) to participate
 * in atomic transactions.
 */

export const TELEGRAM_ACCOUNT_PUBLIC_SELECT = {
  id: true,
  userId: true,
  telegramUserId: true,
  telegramChatId: true,
  telegramUsername: true,
  telegramFirstName: true,
  linkedAt: true,
  updatedAt: true
} as const satisfies Prisma.TelegramAccountSelect

export type TelegramAccountPayload = Prisma.TelegramAccountGetPayload<{
  select: typeof TELEGRAM_ACCOUNT_PUBLIC_SELECT
}>

/**
 * Finds a TelegramAccount by TMdemy User UUID.
 */
export const findTelegramAccountByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<TelegramAccountPayload | null> => {
  const client = tx ?? prisma
  return client.telegramAccount.findUnique({
    where: { userId },
    select: TELEGRAM_ACCOUNT_PUBLIC_SELECT
  })
}

/**
 * Finds a TelegramAccount by numeric Telegram User ID.
 * Optionally includes TMdemy User relation.
 */
export const findTelegramAccountByTelegramId = async (
  telegramUserId: bigint | number | string,
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  const numericId = typeof telegramUserId === 'bigint' ? telegramUserId : BigInt(telegramUserId)

  return client.telegramAccount.findUnique({
    where: { telegramUserId: numericId },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true,
          avatar: true
        }
      }
    }
  })
}

/**
 * Creates a new TelegramAccount record.
 */
export const createTelegramAccount = async (
  data: {
    userId: string
    telegramUserId: bigint | number | string
    telegramChatId: bigint | number | string
    telegramUsername?: string | null
    telegramFirstName?: string | null
  },
  tx?: PrismaTransactionClient
): Promise<TelegramAccountPayload> => {
  const client = tx ?? prisma
  const numericUserId = typeof data.telegramUserId === 'bigint' ? data.telegramUserId : BigInt(data.telegramUserId)
  const numericChatId = typeof data.telegramChatId === 'bigint' ? data.telegramChatId : BigInt(data.telegramChatId)

  return client.telegramAccount.create({
    data: {
      userId: data.userId,
      telegramUserId: numericUserId,
      telegramChatId: numericChatId,
      telegramUsername: data.telegramUsername || null,
      telegramFirstName: data.telegramFirstName || null
    },
    select: TELEGRAM_ACCOUNT_PUBLIC_SELECT
  })
}

/**
 * Deletes a TelegramAccount by TMdemy User UUID.
 */
export const deleteTelegramAccountByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<TelegramAccountPayload | null> => {
  const client = tx ?? prisma
  try {
    return await client.telegramAccount.delete({
      where: { userId },
      select: TELEGRAM_ACCOUNT_PUBLIC_SELECT
    })
  } catch (error: any) {
    if (error.code === 'P2025') return null // Record not found
    throw error
  }
}

/**
 * Deletes a TelegramAccount by numeric Telegram User ID.
 */
export const deleteTelegramAccountByTelegramId = async (
  telegramUserId: bigint | number | string,
  tx?: PrismaTransactionClient
): Promise<TelegramAccountPayload | null> => {
  const client = tx ?? prisma
  const numericId = typeof telegramUserId === 'bigint' ? telegramUserId : BigInt(telegramUserId)

  try {
    return await client.telegramAccount.delete({
      where: { telegramUserId: numericId },
      select: TELEGRAM_ACCOUNT_PUBLIC_SELECT
    })
  } catch (error: any) {
    if (error.code === 'P2025') return null // Record not found
    throw error
  }
}

/**
 * Inserts a new single-use TelegramLinkToken.
 */
export const createTelegramLinkToken = async (
  data: {
    userId: string
    tokenHash: string
    expiresAt: Date
  },
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  return client.telegramLinkToken.create({
    data: {
      userId: data.userId,
      tokenHash: data.tokenHash,
      expiresAt: data.expiresAt
    }
  })
}

/**
 * Finds an unconsumed, unexpired linking token by its SHA-256 hash.
 */
export const findActiveLinkTokenByHash = async (
  tokenHash: string,
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  return client.telegramLinkToken.findFirst({
    where: {
      tokenHash,
      isConsumed: false,
      expiresAt: {
        gt: new Date()
      }
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          status: true
        }
      }
    }
  })
}

/**
 * Marks all active, unconsumed tokens for a specific user as consumed/invalidated.
 */
export const invalidateActiveTokensByUserId = async (
  userId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx ?? prisma
  const result = await client.telegramLinkToken.updateMany({
    where: {
      userId,
      isConsumed: false
    },
    data: {
      isConsumed: true,
      consumedAt: new Date()
    }
  })
  return result.count
}

/**
 * Marks a specific token as consumed by a Telegram User ID.
 */
export const consumeLinkToken = async (
  tokenId: string,
  telegramUserId: bigint | number | string,
  tx?: PrismaTransactionClient
) => {
  const client = tx ?? prisma
  const numericId = typeof telegramUserId === 'bigint' ? telegramUserId : BigInt(telegramUserId)

  return client.telegramLinkToken.update({
    where: { id: tokenId },
    data: {
      isConsumed: true,
      consumedAt: new Date(),
      consumedByTelegramId: numericId
    }
  })
}

