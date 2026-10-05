import { Prisma, User, UserRole, UserStatus } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'
import {
  userPublicSchema,
  userInternalSchema,
  UserPublic,
  UserInternal
} from '~/models/user.model'

// ==========================================
// 1. PRISMA SELECT CONSTANTS (PROJECTIONS)
// ==========================================

/**
 * Public projection aligned with userPublicSchema.
 * Excludes sensitive fields (password, tokens, OTPs) at database engine level.
 */
export const USER_PUBLIC_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
}

/**
 * Compact projection for embedding user identity into courses, lessons, and comments.
 */
export const USER_COMPACT_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  avatar: true,
  role: true
}

/**
 * Admin view projection for user management dashboards.
 */
export const USER_ADMIN_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  isVerified: true,
  createdAt: true,
  updatedAt: true
}

/**
 * Teacher public directory projection.
 */
export const TEACHER_PUBLIC_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  avatar: true,
  bio: true,
  phone: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  createdAt: true
}

/**
 * Authentication projection containing credential and status fields for verification.
 * Only intended for internal service-layer authentication routines.
 */
export const USER_AUTH_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  password: true,
  status: true,
  role: true,
  isVerified: true,
  refreshToken: true
}

/**
 * Complete internal projection with all authentication and recovery tokens.
 */
export const USER_INTERNAL_SELECT: Prisma.UserSelect = {
  id: true,
  username: true,
  email: true,
  password: true,
  status: true,
  role: true,
  avatar: true,
  phone: true,
  bio: true,
  socialFacebook: true,
  socialInstagram: true,
  socialGithub: true,
  isVerified: true,
  otpCode: true,
  otpExpires: true,
  refreshToken: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
  createdAt: true,
  updatedAt: true
}

/**
 * Migration cutoff timestamp for Phase 2 data protection.
 * Used by cleanup routines to prevent accidental purging of historical unverified records.
 */
export const MIGRATION_CUTOFF_DATE = new Date('2026-10-01T00:00:00.000Z')

// Helper to resolve client and options polymorphic arguments
function resolveUserClientAndOptions(
  optionsOrTx?: { include?: Prisma.UserInclude; select?: Prisma.UserSelect } | PrismaTransactionClient,
  explicitTx?: PrismaTransactionClient
): { client: PrismaTransactionClient | typeof prisma; options?: { include?: Prisma.UserInclude; select?: Prisma.UserSelect } } {
  if (!optionsOrTx) {
    return { client: explicitTx || prisma }
  }
  if ('user' in optionsOrTx) {
    return { client: optionsOrTx as PrismaTransactionClient }
  }
  return {
    client: explicitTx || prisma,
    options: optionsOrTx
  }
}

// ==========================================
// 2. USER MUTATION FUNCTIONS
// ==========================================

/**
 * Insert a new user into PostgreSQL.
 */
export const addUser = async (
  data: Prisma.UserCreateInput,
  tx?: PrismaTransactionClient
): Promise<User> => {
  const client = tx || prisma
  return client.user.create({ data })
}

export const createUser = addUser

/**
 * Update an existing user by primary key UUID.
 */
export const updateUser = async (
  id: string,
  data: Prisma.UserUpdateInput,
  tx?: PrismaTransactionClient
): Promise<User> => {
  const client = tx || prisma
  return client.user.update({
    where: { id },
    data
  })
}

/**
 * Update a user's stored refresh token.
 */
export const updateRefreshToken = async (
  id: string,
  refreshToken: string | null,
  tx?: PrismaTransactionClient
): Promise<User> => {
  const client = tx || prisma
  return client.user.update({
    where: { id },
    data: { refreshToken }
  })
}

/**
 * Mark a user as verified and clear OTP credentials.
 */
export const markUserAsVerified = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<User> => {
  const client = tx || prisma
  return client.user.update({
    where: { id },
    data: {
      isVerified: true,
      otpCode: null,
      otpExpires: null
    }
  })
}

/**
 * Hard delete a user by primary key UUID.
 */
export const deleteUser = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<User> => {
  const client = tx || prisma
  return client.user.delete({
    where: { id }
  })
}

// ==========================================
// 3. USER SINGLE-RECORD QUERY FUNCTIONS
// ==========================================

/**
 * Find a user by primary key UUID with optional include/select projections or transaction client.
 */
export const findUserById = async (
  id: string,
  optionsOrTx?: {
    include?: Prisma.UserInclude
    select?: Prisma.UserSelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<any | null> => {
  const { client, options } = resolveUserClientAndOptions(optionsOrTx, tx)
  return client.user.findUnique({
    where: { id },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  })
}

/**
 * Find a user by UUID and sanitize through Zod userPublicSchema.
 */
export const findUserPublicById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<UserPublic | null> => {
  const client = tx || prisma
  const record = await client.user.findUnique({
    where: { id },
    select: USER_PUBLIC_SELECT
  })
  return record ? userPublicSchema.parse(record) : null
}

/**
 * Find a user by UUID including all internal/sensitive credential fields.
 */
export const findUserInternalById = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<UserInternal | null> => {
  const client = tx || prisma
  const record = await client.user.findUnique({
    where: { id },
    select: USER_INTERNAL_SELECT
  })
  return record ? userInternalSchema.parse(record) : null
}

/**
 * Find a user by unique email address.
 * Supports both findUserByEmail(email, tx) and findUserByEmail(email, options, tx).
 */
export const findUserByEmail = async <T = User>(
  email: string,
  optionsOrTx?: { select?: Prisma.UserSelect } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveUserClientAndOptions(optionsOrTx, tx)
  return client.user.findUnique({
    where: { email },
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find a user by email and sanitize through Zod userPublicSchema.
 */
export const findUserPublicByEmail = async (
  email: string,
  tx?: PrismaTransactionClient
): Promise<UserPublic | null> => {
  const client = tx || prisma
  const record = await client.user.findUnique({
    where: { email },
    select: USER_PUBLIC_SELECT
  })
  return record ? userPublicSchema.parse(record) : null
}

/**
 * Find a user by username.
 * Supports both findUserByUsername(username, tx) and findUserByUsername(username, options, tx).
 */
export const findUserByUsername = async <T = User>(
  username: string,
  optionsOrTx?: { select?: Prisma.UserSelect } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveUserClientAndOptions(optionsOrTx, tx)
  return client.user.findFirst({
    where: { username },
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find a user by matching either email or username.
 */
export const findUserByEmailOrUsername = async <T = User>(
  identifier: string,
  optionsOrTx?: { select?: Prisma.UserSelect } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveUserClientAndOptions(optionsOrTx, tx)
  return client.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier }
      ]
    },
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Retrieve user credentials required for login and authentication.
 */
export const findUserWithCredentials = async (
  email: string,
  tx?: PrismaTransactionClient
): Promise<{
  id: string
  username: string
  email: string
  password: string
  status: UserStatus
  role: UserRole
  isVerified: boolean
  refreshToken: string | null
} | null> => {
  const client = tx || prisma
  return client.user.findUnique({
    where: { email },
    select: USER_AUTH_SELECT
  }) as any
}

/**
 * Find an active user by a valid, unexpired password reset token.
 */
export const findUserByResetToken = async (
  hashedToken: string,
  tx?: PrismaTransactionClient
): Promise<User | null> => {
  const client = tx || prisma
  return client.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: new Date()
      }
    }
  })
}

// ==========================================
// 4. UNIQUENESS & CONFLICT CHECKING FUNCTIONS
// ==========================================

/**
 * Check if a username is already taken by another user.
 */
export const isUsernameTaken = async (
  username: string,
  excludeUserId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const count = await client.user.count({
    where: {
      username,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    }
  })
  return count > 0
}

/**
 * Check if an email is already taken by another user.
 */
export const isEmailTaken = async (
  email: string,
  excludeUserId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const count = await client.user.count({
    where: {
      email,
      ...(excludeUserId ? { id: { not: excludeUserId } } : {})
    }
  })
  return count > 0
}

/**
 * Simultaneously check for existing email or username conflicts.
 */
export const findUserConflict = async (
  params: { email?: string; username?: string; excludeUserId?: string },
  tx?: PrismaTransactionClient
): Promise<{ emailConflict: boolean; usernameConflict: boolean }> => {
  const client = tx || prisma
  const conditions: Prisma.UserWhereInput[] = []
  if (params.email) conditions.push({ email: params.email })
  if (params.username) conditions.push({ username: params.username })

  if (conditions.length === 0) {
    return { emailConflict: false, usernameConflict: false }
  }

  const matches = await client.user.findMany({
    where: {
      OR: conditions,
      ...(params.excludeUserId ? { id: { not: params.excludeUserId } } : {})
    },
    select: { email: true, username: true }
  })

  let emailConflict = false
  let usernameConflict = false

  for (const match of matches) {
    if (params.email && match.email.toLowerCase() === params.email.toLowerCase()) {
      emailConflict = true
    }
    if (params.username && match.username.toLowerCase() === params.username.toLowerCase()) {
      usernameConflict = true
    }
  }

  return { emailConflict, usernameConflict }
}

// ==========================================
// 5. USER LIST & PAGINATION FUNCTIONS
// ==========================================

/**
 * Find multiple users matching given query criteria.
 */
export const findAllUsers = async (
  options?: {
    where?: Prisma.UserWhereInput
    skip?: number
    take?: number
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]
    include?: Prisma.UserInclude
    select?: Prisma.UserSelect
  },
  tx?: PrismaTransactionClient
): Promise<User[]> => {
  const client = tx || prisma
  return client.user.findMany({
    where: options?.where,
    skip: options?.skip,
    take: options?.take,
    orderBy: options?.orderBy,
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  })
}

/**
 * Find users with pagination, text search, and role/status filtering for admin dashboard.
 */
export const findUsersWithPagination = async (
  options: {
    page?: number
    limit?: number
    search?: string
    role?: UserRole
    status?: UserStatus
    isVerified?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    select?: Prisma.UserSelect
  },
  tx?: PrismaTransactionClient
): Promise<{ users: any[]; total: number; page: number; limit: number; totalPages: number }> => {
  const client = tx || prisma
  const page = Math.max(1, options.page || 1)
  const limit = Math.max(1, options.limit || 10)
  const skip = (page - 1) * limit

  const where: Prisma.UserWhereInput = {}
  if (options.role) where.role = options.role
  if (options.status) where.status = options.status
  if (typeof options.isVerified === 'boolean') where.isVerified = options.isVerified
  if (options.search) {
    where.OR = [
      { username: { contains: options.search, mode: 'insensitive' } },
      { email: { contains: options.search, mode: 'insensitive' } }
    ]
  }

  const orderBy: Prisma.UserOrderByWithRelationInput = {
    [options.sortBy || 'createdAt']: options.sortOrder || 'desc'
  }

  const [users, total] = await Promise.all([
    client.user.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: options.select || USER_ADMIN_SELECT
    }),
    client.user.count({ where })
  ])

  return {
    users,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Count total users matching filter criteria.
 */
export const countUsers = async (
  where?: Prisma.UserWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.user.count({ where })
}

/**
 * Count active administrator accounts excluding a target user ID.
 * Protects against accidental deletion of the last system administrator.
 */
export const countAdminsExcluding = async (
  excludeUserId: string,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.user.count({
    where: {
      role: UserRole.ADMIN,
      id: { not: excludeUserId }
    }
  })
}

/**
 * Find active teachers with pagination and search.
 */
export const findActiveTeachers = async (
  options: {
    search?: string
    page?: number
    limit?: number
    skip?: number
    take?: number
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    orderBy?: Prisma.UserOrderByWithRelationInput | Prisma.UserOrderByWithRelationInput[]
  },
  tx?: PrismaTransactionClient
): Promise<{ teachers: any[]; total: number; page?: number; limit?: number; totalPages?: number }> => {
  const client = tx || prisma
  const page =
    options.page ||
    (options.skip !== undefined && options.take
      ? Math.floor(options.skip / options.take) + 1
      : 1)
  const limit = options.limit || options.take || 10
  const skip = options.skip !== undefined ? options.skip : (page - 1) * limit
  const take = options.take !== undefined ? options.take : limit

  const where: Prisma.UserWhereInput = {
    role: UserRole.TEACHER,
    status: UserStatus.ACTIVE,
    isVerified: true,
    ...(options.search
      ? {
          OR: [
            { username: { contains: options.search, mode: 'insensitive' } },
            { email: { contains: options.search, mode: 'insensitive' } }
          ]
        }
      : {})
  }

  const orderBy = options.orderBy || {
    [options.sortBy || 'createdAt']: options.sortOrder || 'desc'
  }

  const [teachers, total] = await Promise.all([
    client.user.findMany({
      where,
      skip,
      take,
      orderBy,
      select: TEACHER_PUBLIC_SELECT
    }),
    client.user.count({ where })
  ])

  return {
    teachers,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

export const findTeachersWithPagination = findActiveTeachers

// ==========================================
// 6. CLEANUP & CRON REPOSITORY FUNCTIONS
// ==========================================

/**
 * Delete unverified accounts created after the migration cutoff and older than a specified threshold.
 * Specifically protects historical migrated accounts (created prior to MIGRATION_CUTOFF_DATE)
 * and administrator/teacher accounts from accidental deletion.
 */
export const deleteUnverifiedUsersBeforeCutoff = async (
  params: {
    expireThreshold: Date
    cutoffDate?: Date
  },
  tx?: PrismaTransactionClient
): Promise<{ count: number }> => {
  const client = tx || prisma
  const cutoff = params.cutoffDate || MIGRATION_CUTOFF_DATE
  return client.user.deleteMany({
    where: {
      role: { notIn: [UserRole.ADMIN, UserRole.TEACHER] },
      isVerified: false,
      createdAt: {
        gt: cutoff,
        lt: params.expireThreshold
      }
    }
  })
}

/**
 * Delete unverified accounts older than a specified threshold.
 * Maintained for legacy compatibility.
 */
export const deleteUnverifiedUsersOlderThan = async (
  expireThreshold: Date,
  tx?: PrismaTransactionClient
): Promise<{ count: number }> => {
  const client = tx || prisma
  return client.user.deleteMany({
    where: {
      isVerified: false,
      createdAt: {
        lt: expireThreshold
      }
    }
  })
}
