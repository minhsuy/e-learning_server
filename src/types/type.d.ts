import { VerifyOptions } from 'jsonwebtoken'

export interface SocialLinks {
  facebook?: string
  instagram?: string
  github?: string
}

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

interface VerifyTokenParams {
  token: string
  privateKey: string
  options?: VerifyOptions
}

export interface ServiceResponse<T = any> {
  success: boolean
  message?: string
  data?: T
  access_token?: string
  refresh_token?: string
  statusCode?: number
}

export interface UpdateMeParams {
  userId: string
  username?: string
  avatar?: string
  phone?: string
  bio?: string
  socialLinks?: {
    facebook?: string
    instagram?: string
    github?: string
  }
}

export interface GetAllUsersParams {
  page?: number
  limit?: number
  role?: string
  status?: string
  isVerified?: boolean
  search?: string
  sortBy?: string
}

export interface ICreateTeacherInput {
  payload: {
    username: string
    email: string
    password: string
    avatar?: string
    phone?: string
    bio?: string
    socialLinks?: {
      facebook?: string
      instagram?: string
      github?: string
    }
  }
}
export type ListQuery = {
  page?: number
  limit?: number
  search?: string
  category?: string
  level?: string
  type?: string
  priceMin?: number | string
  priceMax?: number | string
  sortBy?: 'createdAt' | 'sold' | 'view' | 'price' | string
  status?: string
  author?: string
  _destroy?: boolean
}
export interface UpdateQuizParams {
  quizId: string
  userId: string
  role: string
  payload: {
    title?: string
    description?: string
    duration?: number
    passing_grade?: number
  }
}
export interface CreateQuizParams {
  userId: string
  role: string
  payload: {
    lesson: string
    title: string
    description?: string
    duration?: number
    passing_grade?: number
  }
}
export interface CreateQuestionParams {
  userId: string
  role: string
  payload: {
    quiz: string
    type: 'multiple_choice' | 'fill_in_blank'
    title: string
    options?: string[]
    answer: string
    points?: number
  }
}
