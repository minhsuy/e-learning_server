import adminRouter from './admin.route'
import categoryRouter from './category.route'
import chapterRouter from './chapter.route'
import commentRouter from './comment.route'
import couponRouter from './coupon.route'
import courseRouter from './course.route'
import enrollmentRouter from './enrollment.route'
import favoriteCourseRouter from './favoriteCourse.route'
import lessonRouter from './lesson.route'
import notificationRouter from './notification.route'
import orderRouter from './order.route'
import progressRouter from './progress.route'
import questionRouter from './question.route'
import quizRouter from './quiz.route'
import ratingRouter from './rating.route'
import teacherRouter from './teacher.route'
import usersRouter from './user.route'

export const indexRoutes = (app: any) => {
  app.use('/api/users', usersRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/teacher', teacherRouter)
  app.use('/api/courses', courseRouter)
  app.use('/api/categories', categoryRouter)
  app.use('/api/chapters', chapterRouter)
  app.use('/api/lessons', lessonRouter)
  app.use('/api/coupons', couponRouter)
  app.use('/api/orders', orderRouter)
  app.use('/api/progress', progressRouter)
  app.use('/api/enrollments', enrollmentRouter)
  app.use('/api/comments', commentRouter)
  app.use('/api/ratings', ratingRouter)
  app.use('/api/favorites', favoriteCourseRouter)
  app.use('/api/notifications', notificationRouter)
  app.use('/api/quiz', quizRouter)
  app.use('/api/questions', questionRouter)
}
