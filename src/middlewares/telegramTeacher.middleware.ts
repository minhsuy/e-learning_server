import { Request, Response, NextFunction } from 'express'

/**
 * TMDEMY — TELEGRAM TEACHER RATE LIMITER (TG-02A)
 *
 * Implements a lightweight sliding-window rate limiter for token generation
 * to protect against abuse and rapid automated token spamming.
 * Allows at most 10 link-token generations per 15-minute window per teacher.
 */

interface RateLimitRecord {
  timestamps: number[]
}

const rateLimitMap = new Map<string, RateLimitRecord>()

const WINDOW_MS = 15 * 60 * 1000 // 15 minutes
const MAX_REQUESTS = 10 // max 10 link requests per 15 mins per teacher

export const linkTokenRateLimiter = (req: Request, res: Response, next: NextFunction): any => {
  const userId = (req.user as any)?.userId
  if (!userId) {
    return next()
  }

  const now = Date.now()
  let record = rateLimitMap.get(userId)

  if (!record) {
    record = { timestamps: [] }
    rateLimitMap.set(userId, record)
  }

  // Filter timestamps within the rolling window
  record.timestamps = record.timestamps.filter((ts) => now - ts < WINDOW_MS)

  if (record.timestamps.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Quá nhiều yêu cầu tạo mã liên kết Telegram. Vui lòng thử lại sau 15 phút.'
    })
  }

  record.timestamps.push(now)
  next()
}

