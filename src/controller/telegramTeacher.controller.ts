import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  generateTeacherLinkTokenService,
  getTeacherTelegramStatusService,
  unlinkTeacherTelegramService
} from '~/services/telegramTeacher.service'

/**
 * TMDEMY — TELEGRAM TEACHER CONTROLLER (TG-02A)
 *
 * Implements REST API handlers for:
 * - POST /api/teacher/telegram/link-token (Generate 15-min single-use linking token)
 * - GET /api/teacher/telegram/status (Check linking status)
 * - DELETE /api/teacher/telegram/unlink (Revoke linked Telegram account)
 */

/**
 * Generates a one-time linking token and Telegram deep link for the authenticated teacher.
 */
export const generateTeacherLinkTokenController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    const result = await generateTeacherLinkTokenService(userId)

    return res.status(result.statusCode || (result.success ? 201 : 400)).json(result)
  }
)

/**
 * Retrieves the current Telegram linking status for the authenticated teacher.
 */
export const getTeacherTelegramStatusController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    const result = await getTeacherTelegramStatusService(userId)

    return res.status(result.statusCode || 200).json(result)
  }
)

/**
 * Unlinks the Telegram account for the authenticated teacher.
 */
export const unlinkTeacherTelegramController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    const result = await unlinkTeacherTelegramService(userId)

    return res.status(result.statusCode || (result.success ? 200 : 400)).json(result)
  }
)

