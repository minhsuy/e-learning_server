import express from 'express'
import {
  createCourseByTeacherController,
  deleteCourseByTeacherController,
  getCoursesByTeacherController,
  updateCourseByTeacherController
} from '~/controller/teacher.controller'
import {
  getCoursePerformanceController,
  getTeacherCoursesStatsController,
  getTeacherEnrollmentStatsController,
  getTeacherLearningStatsController,
  getTeacherOverviewController,
  getTeacherRevenueController
} from '~/controller/teacherStatistic.controller'
import {
  configureDailyScheduleController,
  configureWeeklyScheduleController,
  generateTeacherLinkTokenController,
  getTeacherSchedulesController,
  getTeacherTelegramStatusController,
  pauseTeacherSchedulesController,
  unlinkTeacherTelegramController
} from '~/controller/telegramTeacher.controller'
import { linkTokenRateLimiter } from '~/middlewares/telegramTeacher.middleware'
import {
  courseIdValidator,
  createCourseValidator,
  listPublicCoursesValidator,
  updateCourseValidator
} from '~/middlewares/course.middleware'
import {
  validateCoursePerformanceParam,
  validateCoursesStatsQuery,
  validateEnrollmentStatsQuery,
  validateLearningStatsQuery,
  validateRevenueStatsQuery
} from '~/middlewares/teacherStatistic.middleware'
import { handleValidationErrors } from '~/middlewares/validate'
import { isTeacher } from '~/middlewares/verifyRole'
import { verifyAccessToken } from '~/middlewares/verifyToken'

const teacherRouter = express.Router()

// ==========================================
// TEACHER TELEGRAM BOT LINKING ENDPOINTS (TG-02A)
// ==========================================

// 1. POST /api/teacher/telegram/link-token (Generate 15-min linking token & deep link)
teacherRouter.post(
  '/telegram/link-token',
  verifyAccessToken,
  isTeacher,
  linkTokenRateLimiter,
  generateTeacherLinkTokenController
)

// 2. GET /api/teacher/telegram/status (Check linking status)
teacherRouter.get(
  '/telegram/status',
  verifyAccessToken,
  isTeacher,
  getTeacherTelegramStatusController
)

// 3. DELETE /api/teacher/telegram/unlink (Unlink Telegram account)
teacherRouter.delete(
  '/telegram/unlink',
  verifyAccessToken,
  isTeacher,
  unlinkTeacherTelegramController
)

// ==========================================
// TEACHER TELEGRAM REPORT SCHEDULING (TG-05)
// ==========================================

// 4. GET /api/teacher/telegram/schedules (Get all schedules & link summary)
teacherRouter.get(
  '/telegram/schedules',
  verifyAccessToken,
  isTeacher,
  getTeacherSchedulesController
)

// 5. PUT /api/teacher/telegram/schedules/daily (Configure / toggle Daily Report)
teacherRouter.put(
  '/telegram/schedules/daily',
  verifyAccessToken,
  isTeacher,
  configureDailyScheduleController
)

// 6. PUT /api/teacher/telegram/schedules/weekly (Configure / toggle Weekly Report)
teacherRouter.put(
  '/telegram/schedules/weekly',
  verifyAccessToken,
  isTeacher,
  configureWeeklyScheduleController
)

// 7. POST /api/teacher/telegram/schedules/pause (Pause all schedules)
teacherRouter.post(
  '/telegram/schedules/pause',
  verifyAccessToken,
  isTeacher,
  pauseTeacherSchedulesController
)

// ==========================================
// TEACHER STATISTICS ENDPOINTS
// ==========================================

// 1. GET /api/teacher/statistics/overview
teacherRouter.get(
  '/statistics/overview',
  verifyAccessToken,
  isTeacher,
  getTeacherOverviewController
)

// 2. GET /api/teacher/statistics/revenue
teacherRouter.get(
  '/statistics/revenue',
  verifyAccessToken,
  isTeacher,
  validateRevenueStatsQuery,
  handleValidationErrors,
  getTeacherRevenueController
)

// 3. GET /api/teacher/statistics/courses
teacherRouter.get(
  '/statistics/courses',
  verifyAccessToken,
  isTeacher,
  validateCoursesStatsQuery,
  handleValidationErrors,
  getTeacherCoursesStatsController
)

// 4. GET /api/teacher/statistics/enrollments
teacherRouter.get(
  '/statistics/enrollments',
  verifyAccessToken,
  isTeacher,
  validateEnrollmentStatsQuery,
  handleValidationErrors,
  getTeacherEnrollmentStatsController
)

// 5. GET /api/teacher/statistics/learning
teacherRouter.get(
  '/statistics/learning',
  verifyAccessToken,
  isTeacher,
  validateLearningStatsQuery,
  handleValidationErrors,
  getTeacherLearningStatsController
)

// 6. GET /api/teacher/statistics/course-performance/:courseId
teacherRouter.get(
  '/statistics/course-performance/:courseId',
  verifyAccessToken,
  isTeacher,
  validateCoursePerformanceParam,
  handleValidationErrors,
  getCoursePerformanceController
)

// ==========================================
// TEACHER COURSE MANAGEMENT ENDPOINTS
// ==========================================

// Create new course (Teacher) POST /api/teacher/courses/
teacherRouter.post(
  '/courses/',
  verifyAccessToken,
  isTeacher,
  createCourseValidator,
  handleValidationErrors,
  createCourseByTeacherController
)

// Update course (Teacher) PUT /api/teacher/courses/:id
teacherRouter.put(
  '/courses/:id',
  verifyAccessToken,
  isTeacher,
  updateCourseValidator,
  handleValidationErrors,
  updateCourseByTeacherController
)

// Delete course (Teacher) DELETE /api/teacher/courses/:id
teacherRouter.delete(
  '/courses/:id',
  verifyAccessToken,
  isTeacher,
  courseIdValidator,
  handleValidationErrors,
  deleteCourseByTeacherController
)

// Get list course by teacher GET /api/teacher/courses/
teacherRouter.get(
  '/courses/',
  verifyAccessToken,
  isTeacher,
  listPublicCoursesValidator,
  handleValidationErrors,
  getCoursesByTeacherController
)

export default teacherRouter
