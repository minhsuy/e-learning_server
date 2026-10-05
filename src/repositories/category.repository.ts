import { Category, Prisma } from '@prisma/client'
import { prisma, PrismaTransactionClient } from '~/config/prisma'

// ==========================================
// 1. PRISMA SELECT CONSTANTS (PROJECTIONS)
// ==========================================

/**
 * Public category projection for client storefront and category navigation.
 * Excludes internal administration flags and references.
 */
export const CATEGORY_PUBLIC_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdAt: true
} as const satisfies Prisma.CategorySelect

export type CategoryPublicPayload = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_PUBLIC_SELECT
}>

/**
 * Administrative category projection for backoffice management.
 * Includes audit timestamps and creator attribution.
 */
export const CATEGORY_ADMIN_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  createdById: true,
  isDestroyed: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      username: true,
      email: true
    }
  }
} as const satisfies Prisma.CategorySelect

export type CategoryAdminPayload = Prisma.CategoryGetPayload<{
  select: typeof CATEGORY_ADMIN_SELECT
}>

// Helper to resolve client and options polymorphic arguments
function resolveCategoryClientAndOptions(
  optionsOrTx?: { include?: Prisma.CategoryInclude; select?: Prisma.CategorySelect } | PrismaTransactionClient,
  explicitTx?: PrismaTransactionClient
): { client: PrismaTransactionClient | typeof prisma; options?: { include?: Prisma.CategoryInclude; select?: Prisma.CategorySelect } } {
  if (!optionsOrTx) {
    return { client: explicitTx || prisma }
  }
  if ('category' in optionsOrTx) {
    return { client: optionsOrTx as PrismaTransactionClient }
  }
  return {
    client: explicitTx || prisma,
    options: optionsOrTx
  }
}

// ==========================================
// 2. CATEGORY MUTATION FUNCTIONS
// ==========================================

/**
 * Insert a new category into PostgreSQL.
 */
export const addCategory = async (
  data: Prisma.CategoryCreateInput,
  tx?: PrismaTransactionClient
): Promise<Category> => {
  const client = tx || prisma
  return client.category.create({ data })
}

export const createCategory = addCategory

/**
 * Update an existing category by its primary key UUID.
 */
export const updateCategory = async (
  id: string,
  data: Prisma.CategoryUpdateInput,
  tx?: PrismaTransactionClient
): Promise<Category> => {
  const client = tx || prisma
  return client.category.update({
    where: { id },
    data
  })
}

/**
 * Soft-delete a category by toggling `isDestroyed = true`.
 */
export const softDeleteCategory = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Category> => {
  const client = tx || prisma
  return client.category.update({
    where: { id },
    data: { isDestroyed: true }
  })
}

/**
 * Restore a soft-deleted category by setting `isDestroyed = false`.
 */
export const restoreCategory = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Category> => {
  const client = tx || prisma
  return client.category.update({
    where: { id },
    data: { isDestroyed: false }
  })
}

/**
 * Hard delete a category by its primary key UUID.
 */
export const deleteCategory = async (
  id: string,
  tx?: PrismaTransactionClient
): Promise<Category> => {
  const client = tx || prisma
  return client.category.delete({
    where: { id }
  })
}

// ==========================================
// 3. CATEGORY QUERY FUNCTIONS
// ==========================================

/**
 * Find a category by its primary key UUID.
 * Supports findCategoryById(id, tx) and findCategoryById(id, options, tx).
 */
export const findCategoryById = async <T = Category>(
  id: string,
  optionsOrTx?: {
    include?: Prisma.CategoryInclude
    select?: Prisma.CategorySelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveCategoryClientAndOptions(optionsOrTx, tx)
  return client.category.findUnique({
    where: { id },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find a category by its unique URL slug.
 * Supports findCategoryBySlug(slug, tx) and findCategoryBySlug(slug, options, tx).
 */
export const findCategoryBySlug = async <T = Category>(
  slug: string,
  optionsOrTx?: {
    include?: Prisma.CategoryInclude
    select?: Prisma.CategorySelect
  } | PrismaTransactionClient,
  tx?: PrismaTransactionClient
): Promise<T | null> => {
  const { client, options } = resolveCategoryClientAndOptions(optionsOrTx, tx)
  return client.category.findUnique({
    where: { slug },
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  }) as Promise<T | null>
}

/**
 * Find a category by its unique name.
 */
export const findCategoryByName = async (
  name: string,
  tx?: PrismaTransactionClient
): Promise<Category | null> => {
  const client = tx || prisma
  return client.category.findUnique({
    where: { name }
  })
}

/**
 * Check if a category name is already taken.
 */
export const isCategoryNameTaken = async (
  name: string,
  excludeId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const count = await client.category.count({
    where: {
      name,
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  })
  return count > 0
}

/**
 * Check if a category slug is already taken.
 */
export const isCategorySlugTaken = async (
  slug: string,
  excludeId?: string,
  tx?: PrismaTransactionClient
): Promise<boolean> => {
  const client = tx || prisma
  const count = await client.category.count({
    where: {
      slug,
      ...(excludeId ? { id: { not: excludeId } } : {})
    }
  })
  return count > 0
}

/**
 * Find multiple categories matching filter criteria.
 */
export const findAllCategories = async (
  options?: {
    where?: Prisma.CategoryWhereInput
    skip?: number
    take?: number
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[]
    include?: Prisma.CategoryInclude
    select?: Prisma.CategorySelect
  },
  tx?: PrismaTransactionClient
): Promise<Category[]> => {
  const client = tx || prisma
  return client.category.findMany({
    where: options?.where,
    skip: options?.skip,
    take: options?.take,
    orderBy: options?.orderBy,
    ...(options?.include ? { include: options.include } : {}),
    ...(options?.select ? { select: options.select } : {})
  })
}

/**
 * Find active (non-destroyed) categories with optional text search and pagination.
 */
export const findActiveCategories = async <T = CategoryPublicPayload>(
  options?: {
    search?: string
    skip?: number
    take?: number
    orderBy?: Prisma.CategoryOrderByWithRelationInput | Prisma.CategoryOrderByWithRelationInput[]
    select?: Prisma.CategorySelect
  },
  tx?: PrismaTransactionClient
): Promise<T[]> => {
  const client = tx || prisma
  return client.category.findMany({
    where: {
      isDestroyed: false,
      ...(options?.search
        ? {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } }
          ]
        }
        : {})
    },
    skip: options?.skip,
    take: options?.take,
    orderBy: options?.orderBy || { createdAt: 'desc' },
    ...(options?.select ? { select: options.select } : { select: CATEGORY_PUBLIC_SELECT })
  }) as Promise<T[]>
}

/**
 * Find categories with pagination metadata, text search, and deletion status filtering.
 */
export const findCategoriesWithPagination = async <T = CategoryPublicPayload>(
  options: {
    page?: number
    limit?: number
    search?: string
    isDestroyed?: boolean
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    select?: Prisma.CategorySelect
  },
  tx?: PrismaTransactionClient
): Promise<{ categories: T[]; total: number; page: number; limit: number; totalPages: number }> => {
  const client = tx || prisma
  const page = Math.max(1, options.page || 1)
  const limit = Math.max(1, options.limit || 20)
  const skip = (page - 1) * limit

  const where: Prisma.CategoryWhereInput = {
    ...(options.isDestroyed !== undefined
      ? { isDestroyed: options.isDestroyed }
      : { isDestroyed: false }),
    ...(options.search
      ? {
        OR: [
          { name: { contains: options.search, mode: 'insensitive' } },
          { description: { contains: options.search, mode: 'insensitive' } }
        ]
      }
      : {})
  }

  const orderBy: Prisma.CategoryOrderByWithRelationInput = {
    [options.sortBy || 'createdAt']: options.sortOrder || 'desc'
  }

  const [categories, total] = await Promise.all([
    client.category.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: options.select || CATEGORY_PUBLIC_SELECT
    }) as Promise<T[]>,
    client.category.count({ where })
  ])

  return {
    categories,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * Count total categories matching filter criteria.
 */
export const countCategories = async (
  where?: Prisma.CategoryWhereInput,
  tx?: PrismaTransactionClient
): Promise<number> => {
  const client = tx || prisma
  return client.category.count({ where })
}
