import dotenv from 'dotenv'

dotenv.config()

export interface GoogleUserProfile {
  googleId: string
  email: string
  emailVerified: boolean
  name: string
  picture?: string
  givenName?: string
  familyName?: string
}

export interface VerifyGoogleResult {
  success: boolean
  user?: GoogleUserProfile
  message?: string
}

export interface VerifyGoogleParams {
  idToken?: string
  credential?: string
  token?: string
  code?: string
  redirectUri?: string
  accessToken?: string
}

interface GoogleTokenInfoPayload {
  iss?: string
  sub?: string
  azp?: string
  aud?: string
  email?: string
  email_verified?: string | boolean
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
  error_description?: string
}

interface GoogleTokenEndpointPayload {
  access_token?: string
  id_token?: string
  refresh_token?: string
  error?: string
  error_description?: string
}

interface GoogleUserInfoPayload {
  sub?: string
  name?: string
  given_name?: string
  family_name?: string
  picture?: string
  email?: string
  email_verified?: boolean
}

/**
 * Verifies a Google ID Token (OpenID Connect JWT) using Google's tokeninfo endpoint.
 */
async function verifyIdToken(idToken: string): Promise<VerifyGoogleResult> {
  try {
    const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken.trim())}`
    const response = await fetch(url)

    if (!response.ok) {
      return {
        success: false,
        message: 'Google ID Token không hợp lệ hoặc đã hết hạn'
      }
    }

    const payload = (await response.json()) as GoogleTokenInfoPayload

    if (!payload.email) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin email từ Google Token'
      }
    }

    // Verify Audience if CLIENT_ID is configured
    const configuredClientId = process.env.CLIENT_ID?.trim()
    if (configuredClientId && payload.aud && payload.aud !== configuredClientId) {
      return {
        success: false,
        message: 'Google Token không thuộc về ứng dụng này (Audience Mismatch)'
      }
    }

    // Verify email verification status
    const isEmailVerified = payload.email_verified === 'true' || payload.email_verified === true

    if (!isEmailVerified) {
      return {
        success: false,
        message: 'Email Google chưa được xác thực'
      }
    }

    return {
      success: true,
      user: {
        googleId: payload.sub || '',
        email: payload.email.toLowerCase().trim(),
        emailVerified: true,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture,
        givenName: payload.given_name,
        familyName: payload.family_name
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi khi xác thực Google ID Token'
    return {
      success: false,
      message
    }
  }
}

/**
 * Fetches user profile from Google userinfo endpoint using an access token.
 */
async function verifyAccessToken(accessToken: string): Promise<VerifyGoogleResult> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken.trim()}`
      }
    })

    if (!response.ok) {
      return {
        success: false,
        message: 'Google Access Token không hợp lệ hoặc đã hết hạn'
      }
    }

    const userInfo = (await response.json()) as GoogleUserInfoPayload

    if (!userInfo.email) {
      return {
        success: false,
        message: 'Không tìm thấy thông tin email từ Google'
      }
    }

    if (!userInfo.email_verified) {
      return {
        success: false,
        message: 'Email Google chưa được xác thực'
      }
    }

    return {
      success: true,
      user: {
        googleId: userInfo.sub || '',
        email: userInfo.email.toLowerCase().trim(),
        emailVerified: true,
        name: userInfo.name || userInfo.email.split('@')[0],
        picture: userInfo.picture,
        givenName: userInfo.given_name,
        familyName: userInfo.family_name
      }
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi khi gọi Google Userinfo'
    return {
      success: false,
      message
    }
  }
}

/**
 * Exchanges an Authorization Code for Google tokens, then parses/fetches user profile.
 */
async function verifyAuthCode(code: string, redirectUri?: string): Promise<VerifyGoogleResult> {
  try {
    const clientId = process.env.CLIENT_ID?.trim()
    const clientSecret = process.env.CLIENT_SECRET?.trim()

    if (!clientId || !clientSecret) {
      return {
        success: false,
        message: 'Thiếu cấu hình CLIENT_ID hoặc CLIENT_SECRET trên server'
      }
    }

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        code: code.trim(),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri?.trim() || 'postmessage',
        grant_type: 'authorization_code'
      })
    })

    if (!tokenResponse.ok) {
      const errData = (await tokenResponse.json().catch(() => ({}))) as GoogleTokenEndpointPayload
      return {
        success: false,
        message:
          errData.error_description ||
          errData.error ||
          'Mã xác thực Google (Authorization Code) không hợp lệ hoặc đã hết hạn'
      }
    }

    const tokenData = (await tokenResponse.json()) as GoogleTokenEndpointPayload

    // If id_token returned, verify it
    if (tokenData.id_token) {
      const idResult = await verifyIdToken(tokenData.id_token)
      if (idResult.success && idResult.user) {
        return idResult
      }
    }

    // Fallback: verify with access_token via userinfo endpoint
    if (tokenData.access_token) {
      return verifyAccessToken(tokenData.access_token)
    }

    return {
      success: false,
      message: 'Không nhận được access_token hoặc id_token từ Google'
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Lỗi khi trao đổi Google Authorization Code'
    return {
      success: false,
      message
    }
  }
}

/**
 * Unified entry point to verify any Google credential format provided by frontend:
 * - idToken / credential (JWT from Google One Tap / GIS)
 * - code (Authorization Code from Google OAuth popup / redirect flow)
 * - accessToken (OAuth Bearer Access Token)
 */
export async function verifyGoogleCredential(params: VerifyGoogleParams): Promise<VerifyGoogleResult> {
  const tokenCandidate = params.idToken || params.credential || params.token

  // 1. If explicit authorization code is provided
  if (params.code && params.code.trim()) {
    return verifyAuthCode(params.code, params.redirectUri)
  }

  // 2. If token candidate is provided
  if (tokenCandidate && tokenCandidate.trim()) {
    const trimmed = tokenCandidate.trim()

    // Access tokens typically start with 'ya29.'
    if (trimmed.startsWith('ya29.')) {
      return verifyAccessToken(trimmed)
    }

    // JWT ID Tokens have 3 segments separated by dots
    const parts = trimmed.split('.')
    if (parts.length === 3) {
      return verifyIdToken(trimmed)
    }

    // Attempt ID token verification first, fallback to access token
    const idResult = await verifyIdToken(trimmed)
    if (idResult.success) {
      return idResult
    }
    return verifyAccessToken(trimmed)
  }

  // 3. If explicit accessToken is provided
  if (params.accessToken && params.accessToken.trim()) {
    return verifyAccessToken(params.accessToken)
  }

  return {
    success: false,
    message: 'Không có thông tin xác thực Google nào được cung cấp'
  }
}
