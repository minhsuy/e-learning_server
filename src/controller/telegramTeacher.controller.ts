import { Request, Response } from 'express'
import asyncHandler from 'express-async-handler'
import {
  generateTeacherLinkTokenService,
  getTeacherTelegramStatusService,
  unlinkTeacherTelegramService
} from '~/services/telegramTeacher.service'
import {
  configureDailyScheduleService,
  configureWeeklyScheduleService,
  getTeacherSchedulesService,
  pauseAllTeacherSchedulesService
} from '~/services/telegramReportSchedule.service'

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

/**
 * Retrieves automated report schedules for the authenticated teacher.
 * GET /api/teacher/telegram/schedules
 */
export const getTeacherSchedulesController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    const summary = await getTeacherSchedulesService(userId)
    return res.status(200).json({
      success: true,
      data: summary
    })
  }
)

/**
 * Configures or toggles the Daily Report schedule.
 * PUT /api/teacher/telegram/schedules/daily
 */
export const configureDailyScheduleController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    try {
      const schedule = await configureDailyScheduleService(userId, req.body)
      return res.status(200).json({
        success: true,
        message: 'Cập nhật lịch báo cáo hàng ngày thành công.',
        data: schedule
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return res.status(400).json({
        success: false,
        message: msg
      })
    }
  }
)

/**
 * Configures or toggles the Weekly Report schedule.
 * PUT /api/teacher/telegram/schedules/weekly
 */
export const configureWeeklyScheduleController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    try {
      const schedule = await configureWeeklyScheduleService(userId, req.body)
      return res.status(200).json({
        success: true,
        message: 'Cập nhật lịch báo cáo hàng tuần thành công.',
        data: schedule
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      return res.status(400).json({
        success: false,
        message: msg
      })
    }
  }
)

/**
 * Pauses all automated schedules for the authenticated teacher.
 * POST /api/teacher/telegram/schedules/pause
 */
export const pauseTeacherSchedulesController = asyncHandler(
  async (req: Request, res: Response): Promise<any> => {
    const userId = (req.user as any)?.userId

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'UNAUTHORIZED - User identity missing from access token'
      })
    }

    const result = await pauseAllTeacherSchedulesService(userId)
    return res.status(200).json({
      success: true,
      message: result.message,
      data: { pausedCount: result.pausedCount }
    })
  }
)


