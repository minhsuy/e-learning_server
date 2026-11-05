import { NextFunction, Request, Response } from 'express'
import {
  createCodingExerciseRequestSchema,
  updateCodingExerciseRequestSchema
} from '~/models/codingExercise.model'
import {
  runCodeRequestSchema,
  submitCodeRequestSchema,
  submissionPaginationQuerySchema
} from '~/models/codeExecution.model'
import { validateRouteUUIDParam } from '~/utils/uuid'

/**
 * TMDEMY — MIDDLEWARE: CODING EXERCISE VALIDATION
 * 
 * Syntactic validation chains using express-validator and Zod schemas.
 */

// Route param validators
export const exerciseIdParamValidator = validateRouteUUIDParam('id')
export const lessonIdParamValidator = validateRouteUUIDParam('lessonId')

// Request body validator for POST /api/coding-exercises
export const createCodingExerciseZodValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = createCodingExerciseRequestSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    })
    return
  }
  next()
}

// Request body validator for PUT /api/coding-exercises/:id
export const updateCodingExerciseZodValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = updateCodingExerciseRequestSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    })
    return
  }
  next()
}

// Route param validator for submissionId
export const submissionIdParamValidator = validateRouteUUIDParam('submissionId')

// Request body validator for POST /api/coding-exercises/:id/run
export const runCodeZodValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = runCodeRequestSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    })
    return
  }
  next()
}

// Request body validator for POST /api/coding-exercises/:id/submit
export const submitCodeZodValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = submitCodeRequestSchema.safeParse(req.body)
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    })
    return
  }
  next()
}

// Query validator for GET /api/coding-exercises/:id/submissions
export const submissionPaginationValidator = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const result = submissionPaginationQuerySchema.safeParse(req.query)
  if (!result.success) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: result.error.flatten().fieldErrors
    })
    return
  }
  // Store validated pagination values on req.query
  Object.assign(req.query, result.data)
  next()
}
