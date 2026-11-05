import { query } from 'express-validator'
import { XPTransactionType } from '~/models/xp.model'

/**
 * TMDEMY — GAMIFICATION & LEADERBOARD VALIDATORS
 *
 * Validates pagination parameters and filter options for Gamification read APIs.
 */

export const leaderboardQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1'),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100'),

  query('includeMe').optional().isBoolean().withMessage('includeMe must be a boolean')
]

export const xpHistoryQueryValidator = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1'),

  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be an integer between 1 and 100'),

  query('type').optional().isIn(Object.values(XPTransactionType)).withMessage('Invalid XP transaction type')
]
