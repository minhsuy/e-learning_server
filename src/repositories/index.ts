/**
 * Functional Repository Module Exports.
 *
 * Supports both namespace exports:
 *   import { userRepository, categoryRepository, courseRepository, chapterRepository, lessonRepository } from '~/repositories';
 *   await courseRepository.findCourseById(id, tx);
 *
 * And direct named function imports:
 *   import { findCourseById, addCourse } from '~/repositories';
 *   await findCourseById(id, tx);
 */

export * as userRepository from './user.repository'
export * as categoryRepository from './category.repository'
export * as courseRepository from './course.repository'
export * as chapterRepository from './chapter.repository'
export * as lessonRepository from './lesson.repository'
export * as quizRepository from './quiz.repository'
export * as questionRepository from './question.repository'
export * as quizSubmissionRepository from './quizSubmission.repository'
export * as orderRepository from './order.repository'
export * as couponRepository from './coupon.repository'
export * as enrollmentRepository from './enrollment.repository'
export * as progressRepository from './progress.repository'
export * as certificateRepository from './certificate.repository'
export * as favoriteCourseRepository from './favoriteCourse.repository'
export * as ratingRepository from './rating.repository'
export * as commentRepository from './comment.repository'
export * as commentReactionRepository from './commentReaction.repository'

export * from './user.repository'
export * from './category.repository'
export * from './course.repository'
export * from './chapter.repository'
export * from './lesson.repository'
export * from './quiz.repository'
export * from './question.repository'
export * from './quizSubmission.repository'
export * from './order.repository'
export * from './coupon.repository'
export * from './enrollment.repository'
export * from './progress.repository'
export * from './certificate.repository'
export * from './favoriteCourse.repository'
export * from './rating.repository'
export * from './comment.repository'
export * from './commentReaction.repository'

