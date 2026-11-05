import { param, query } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

/**
 * TMDEMY — TEACHER STATISTIC VALIDATION MIDDLEWARES
 *
 * Validates query parameters for Teacher Statistics endpoints using express-validator.
 */

export const validateRevenueStatsQuery = [
  query('period')
    .optional()
    .toLowerCase()
    .isIn(['7days', '30days', '12months', 'custom'])
    .withMessage('period must be one of: 7days, 30days, 12months, custom'),

  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('startDate must be in format YYYY-MM-DD'),

  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('endDate must be in format YYYY-MM-DD'),

  query('courseId')
    .optional()
    .custom((val) => isValidUUID(val))
    .withMessage('courseId must be a valid UUID')
]

export const validateCoursesStatsQuery = [
  query('page').optional().isInt({ min: 1 }).withMessage('page must be an integer >= 1'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit must be between 1 and 100'),
  query('sortBy')
    .optional()
    .isIn(['revenue', 'students', 'rating', 'createdAt'])
    .withMessage('sortBy must be one of: revenue, students, rating, createdAt'),
  query('order')
    .optional()
    .toLowerCase()
    .isIn(['asc', 'desc'])
    .withMessage('order must be either asc or desc'),
  query('status')
    .optional()
    .toLowerCase()
    .isIn(['approved', 'pending', 'rejected'])
    .withMessage('status must be one of: approved, pending, rejected')
]

export const validateEnrollmentStatsQuery = [
  query('period')
    .optional()
    .toLowerCase()
    .isIn(['7days', '30days', '12months'])
    .withMessage('period must be one of: 7days, 30days, 12months'),

  query('startDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('startDate must be in format YYYY-MM-DD'),

  query('endDate')
    .optional()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('endDate must be in format YYYY-MM-DD'),

  query('courseId')
    .optional()
    .custom((val) => isValidUUID(val))
    .withMessage('courseId must be a valid UUID')
]

export const validateLearningStatsQuery = [
  query('courseId')
    .optional()
    .custom((val) => isValidUUID(val))
    .withMessage('courseId must be a valid UUID')
]

export const validateCoursePerformanceParam = [
  param('courseId')
    .notEmpty()
    .withMessage('courseId is required')
    .custom((val) => isValidUUID(val))
    .withMessage('Invalid Course ID')
]
