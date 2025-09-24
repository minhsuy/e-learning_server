import adminRouter from './admin.route'
import usersRouter from './user.route'

export const indexRoutes = (app: any) => {
  app.use('/api/users', usersRouter)
  app.use('/api/admin', adminRouter)
}
