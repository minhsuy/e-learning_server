import express, { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { getLeaderboardController, getUserLeaderboardPositionController } from '~/controller/leaderboard.controller'
import { leaderboardQueryValidator } from '~/middlewares/gamification.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const leaderboardRouter = express.Router()

/**
 * Middleware that extracts user if Bearer token is provided, without blocking unauthenticated requests.
 */
const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1]
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRECT_ACCESS_TOKEN as string)
      if (typeof decoded !== 'string') {
        req.user = decoded as jwt.JwtPayload & { userId: string; role?: string }
      }
    } catch {
      // Ignored for optional auth
    }
  }
  next()
}

// GET /api/leaderboard - Global public leaderboard (supports includeMe=true when authenticated)
leaderboardRouter.get('/', optionalAuth, leaderboardQueryValidator, handleValidationErrors, getLeaderboardController)

// GET /api/leaderboard/me - Authenticated user's leaderboard position
leaderboardRouter.get('/me', verifyAccessToken, getUserLeaderboardPositionController)

export default leaderboardRouter
