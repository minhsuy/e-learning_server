import { body, param } from 'express-validator'
import { Types } from 'mongoose'

export const submitQuizValidator = [
  body('quizId')
    .notEmpty()
    .withMessage('Quiz ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid quiz ID'),

  body('answers').isArray({ min: 1 }).withMessage('Answers array is required'),

  body('answers.*.question')
    .notEmpty()
    .withMessage('Question ID is required')
    .custom((value) => Types.ObjectId.isValid(value))
    .withMessage('Invalid question ID'),

  body('answers.*.selectedAnswer').notEmpty().withMessage('Selected answer is required')
]
