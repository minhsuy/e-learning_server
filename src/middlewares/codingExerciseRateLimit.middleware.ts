import { Request, Response, NextFunction } from 'express'

/**
 * TMDEMY — CODING EXERCISE RATE LIMITING MIDDLEWARE
 * 
 * In-memory sliding-window rate limiter to protect E2B Cloud Sandbox execution
 * and prevent abuse or resource exhaustion.
 * 
 * Default limits:
 * - RUN: 10 requests per 60 seconds per user
 * - SUBMIT: 5 requests per 60 seconds per user
 */

interface RateLimitRecord {
  timestamps: number[]
}

class SlidingWindowRateLimiter {
  private readonly hits = new Map<string, RateLimitRecord>()
  private readonly windowMs: number
  private readonly maxRequests: number
  private readonly cleanupInterval: NodeJS.Timeout

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs
    this.maxRequests = maxRequests

    // Periodic sweep to evict inactive user entries every 2 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now()
      for (const [key, record] of this.hits.entries()) {
        const valid = record.timestamps.filter((ts) => now - ts < this.windowMs)
        if (valid.length === 0) {
          this.hits.delete(key)
        } else {
          record.timestamps = valid
        }
      }
    }, 120000)

    // Unref timer so it doesn't block process exit
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref()
    }
  }

  public check(key: string): { allowed: boolean; remaining: number; retryAfterSec: number } {
    const now = Date.now()
    const record = this.hits.get(key) || { timestamps: [] }

    // Filter hits within the sliding window
    const validTimestamps = record.timestamps.filter((ts) => now - ts < this.windowMs)

    if (validTimestamps.length >= this.maxRequests) {
      const oldestHit = validTimestamps[0]
      const retryAfterMs = oldestHit + this.windowMs - now
      const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000))

      return {
        allowed: false,
        remaining: 0,
        retryAfterSec
      }
    }

    // Add current timestamp
    validTimestamps.push(now)
    this.hits.set(key, { timestamps: validTimestamps })

    return {
      allowed: true,
      remaining: this.maxRequests - validTimestamps.length,
      retryAfterSec: 0
    }
  }

  public reset(key?: string) {
    if (key) {
      this.hits.delete(key)
    } else {
      this.hits.clear()
    }
  }
}

// 10 requests per 60 seconds for RUN
export const runRateLimiter = new SlidingWindowRateLimiter(60000, 10)

// 5 requests per 60 seconds for SUBMIT
export const submitRateLimiter = new SlidingWindowRateLimiter(60000, 5)

/**
 * Middleware factory for applying rate limits to coding exercise endpoints.
 */
export const createRateLimitMiddleware = (
  limiter: SlidingWindowRateLimiter,
  actionName: 'run' | 'submit'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Resolve user ID from authenticated request; fall back to client IP
    const user = (req as any).user
    const key = user?.id || req.ip || 'anonymous'

    const { allowed, remaining, retryAfterSec } = limiter.check(key)

    res.setHeader('X-RateLimit-Limit', actionName === 'run' ? 10 : 5)
    res.setHeader('X-RateLimit-Remaining', remaining)

    if (!allowed) {
      res.setHeader('Retry-After', retryAfterSec)
      res.status(429).json({
        success: false,
        statusCode: 429,
        message: `Too many ${actionName} requests. Please wait ${retryAfterSec} seconds before trying again.`
      })
      return
    }

    next()
  }
}

export const runCodeRateLimiter = createRateLimitMiddleware(runRateLimiter, 'run')
export const submitCodeRateLimiter = createRateLimitMiddleware(submitRateLimiter, 'submit')
