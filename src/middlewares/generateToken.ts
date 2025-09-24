import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config()
export const generateVerificationToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET_VERIFIED_EMAIL as string, {
    expiresIn: '1m'
  })
}
export const generateAccessToken = ({ userId, role }: { userId: string; role: string }) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRECT_ACCESS_TOKEN as string, { expiresIn: '15m' })
}

export const generateRefreshToken = ({ userId }: { userId: string }) => {
  return jwt.sign({ userId }, process.env.JWT_SECRECT_REFRESH_TOKEN as string, { expiresIn: '7d' })
}
