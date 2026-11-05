import { VerifyOptions } from 'jsonwebtoken'
import type { CreateTeacherInput } from '~/models/user.model'

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
  errors?: Record<string, any>
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

export type ICreateTeacherInput = CreateTeacherInput
export type ListQuery = {
  page?: number
  limit?: number
  search?: string
  category?: string
  level?: string
  type?: string
  priceMin?: number | string
  priceMax?: number | string
  sortBy?: 'createdAt' | 'sold' | 'view' | 'price' | 'rating' | string
  sortOrder?: 'asc' | 'desc'
  status?: string
  author?: string
  _destroy?: boolean
  minRating?: number | string
  durationRange?: 'lt-5' | '5-15' | 'gt-15' | string
  durationMin?: number | string
  durationMax?: number | string
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
    courseId: string
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
