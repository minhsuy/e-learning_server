import { body, param } from 'express-validator'
import { isValidUUID } from '~/utils/uuid'

/**
 * Validator chain for POST /api/submissions (submit quiz)
 * Strictly verifies UUID format for quizId and answers.*.question
 * Validates presence of answers array and selectedAnswer
 */
export const submitQuizValidator = [
  body('quizId')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid quiz ID'),

  body('answers').isArray({ min: 1 }).withMessage('Answers array is required'),

  body('answers.*.question')
    .notEmpty()
    .withMessage('Question ID is required')
    .custom((value) => isValidUUID(value))
    .withMessage('Invalid question ID'),

  body('answers.*.selectedAnswer').notEmpty().withMessage('Selected answer is required')
]
