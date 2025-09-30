import adminRouter from './admin.route'
import categoryRouter from './category.route'
import chapterRouter from './chapter.route'
import couponRouter from './coupon.route'
import courseRouter from './course.route'
import lessonRouter from './lesson.route'
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
}
