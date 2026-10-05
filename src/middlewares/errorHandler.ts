import { Request, Response, NextFunction } from 'express'
import { mapPrismaError } from '~/utils/prismaError'

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Check if error is a known Prisma database error
  const prismaError = mapPrismaError(err)
  if (prismaError) {
    res.status(prismaError.statusCode).json({
      success: false,
      error: prismaError.message,
      errorCode: prismaError.errorCode
    })
    return
  }

  const status = err.status || err.statusCode || 500
  const message = err.message || 'Internal Server Error'
  res.status(status).json({
    success: false,
    error: message
  })
}

