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
    return res.status(401).json({
      success: false,
      error: 'Access Token is missing!'
    })
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = await verifyToken({
      token,
      privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string
    })

    req.user = decoded
    next()
  } catch (err: any) {
    return res.status(401).json({
      success: false,
      error: err.name === 'TokenExpiredError' ? 'jwt expired' : 'invalid token'
    })
  }
})

export const verifyRefreshToken = asyncHandler(
  async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const { refresh_token } = req.body

    if (!refresh_token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is missing'
      })
    }

    try {
      const decoded = await verifyToken({
        token: refresh_token,
        privateKey: process.env.JWT_SECRECT_REFRESH_TOKEN as string
      })

      if (decoded.exp * 1000 < Date.now()) {
        return res.status(401).json({
          success: false,
          message: 'Refresh token expired'
        })
      }

      req.user = decoded
      next()
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      })
    }
  }
)
