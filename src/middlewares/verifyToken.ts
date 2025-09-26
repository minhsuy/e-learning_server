import asyncHandler from 'express-async-handler'
import dotenv from 'dotenv'
import { NextFunction, Request, Response } from 'express'
import jwt, { JwtPayload, VerifyOptions } from 'jsonwebtoken'
import { VerifyTokenParams } from '~/types/type'
dotenv.config()

export const verifyToken = async ({ token, privateKey, options }: VerifyTokenParams): Promise<any> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, privateKey, options, (err, decoded) => {
      if (err) return reject(err)
      resolve(decoded!)
    })
  })
}
export const verifyAccessToken = asyncHandler(async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access Token is missing!' })
  }

  const token = authHeader.split(' ')[1]

  const decoded = await verifyToken({
    token,
    privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string
  })
  req.user = decoded
  next()
})
export const verifyRefreshToken = asyncHandler(async (req, res, next) => {
  const token = req.cookies
  if (!token.refreshToken) throw new Error('Refresh token is missing ')
  const decoded = await verifyToken({
    token: token.refreshToken,
    privateKey: process.env.JWT_SECRECT_REFRESH_TOKEN as string
  })
  req.user = decoded
  next()
})
