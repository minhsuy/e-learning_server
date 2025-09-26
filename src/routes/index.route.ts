import adminRouter from './admin.route'
import categoryRouter from './category.route'
import courseRouter from './course.route'
import teacherRouter from './teacher.route'
import usersRouter from './user.route'

export const indexRoutes = (app: any) => {
  app.use('/api/users', usersRouter)
  app.use('/api/admin', adminRouter)
  app.use('/api/teacher', teacherRouter)
  app.use('/api/courses', courseRouter)
  app.use('/api/categories', categoryRouter)
}
