import slugify from 'slugify'
import { Prisma } from '@prisma/client'
import { PrismaTransactionClient } from '~/config/prisma'
import {
  addCategory,
  findCategoryById,
  findCategoryBySlug,
  findCategoriesWithPagination,
  isCategoryNameTaken,
  isCategorySlugTaken,
  softDeleteCategory,
  updateCategory
} from '~/repositories/category.repository'
import { ListQuery } from '~/types/type'
import { isValidUUID, withCompatId } from '~/utils/uuid'
import { mapPrismaError } from '~/utils/prismaError'
import {
  createCategoryInputSchema,
  updateCategoryInputSchema,
  CreateCategoryInput,
  UpdateCategoryInput
} from '~/models/category.model'

/**
 * Checks if a string is a 24-character hexadecimal MongoDB ObjectId.
 * Used for backward compatibility with legacy user identity tokens.
 */
function isLegacyObjectId(id: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(id)
}

// CREATE CATEGORY
export const createCategoryService = async ({
  payload,
  created_by
}: {
  payload: CreateCategoryInput | Record<string, any>
  created_by: string
}, tx?: PrismaTransactionClient) => {
  if (!created_by || (!isValidUUID(created_by) && !isLegacyObjectId(created_by))) {
    return { success: false, statusCode: 401, message: 'Invalid user' }
  }

  const parseResult = createCategoryInputSchema.safeParse(payload)
  if (!parseResult.success) {
    return { success: false, statusCode: 400, message: parseResult.error.errors[0]?.message || 'Category name is required' }
  }

  const { name, slug, description = '' } = parseResult.data

  const finalSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true })

  try {
    const slugExists = await isCategorySlugTaken(finalSlug, undefined, tx)
    if (slugExists) {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'SLUG_CONFLICT',
        message: 'Slug already exists. Please use another slug or name.'
      }
    }

    const nameExists = await isCategoryNameTaken(name, undefined, tx)
    if (nameExists) {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'NAME_CONFLICT',
        message: 'Category name already exists'
      }
    }

    const createData: Prisma.CategoryCreateInput = {
      name,
      slug: finalSlug,
      description,
      ...(isValidUUID(created_by) ? { createdBy: { connect: { id: created_by } } } : {})
    }

    const category = await addCategory(createData, tx)

    return {
      success: true,
      message: 'Category created successfully!',
      data: withCompatId({
        ...category,
        _destroy: category.isDestroyed
      })
    }
  } catch (error) {
    const mapped = mapPrismaError(error)
    if (mapped) {
      return {
        success: false,
        statusCode: mapped.statusCode,
        errorCode: mapped.errorCode,
        message: mapped.message
      }
    }
    throw error
  }
}

// DELETE CATEGORY (Soft Delete)
export const deleteCategoryService = async (id: string, tx?: PrismaTransactionClient) => {
  if (!isValidUUID(id)) {
    return {
      success: false,
      statusCode: 404,
      message: 'Category not found'
    }
  }

  try {
    const category = await findCategoryById(id, tx)

    if (!category) {
      return {
        success: false,
        statusCode: 404,
        message: 'Category not found'
      }
    }

    if (category.isDestroyed) {
      return {
        success: false,
        statusCode: 400,
        message: 'Category already deleted'
      }
    }

    const updatedCategory = await softDeleteCategory(id, tx)

    return {
      success: true,
      message: 'Category deleted successfully!',
      data: withCompatId({
        ...updatedCategory,
        _destroy: updatedCategory.isDestroyed
      })
    }
  } catch (error) {
    const mapped = mapPrismaError(error)
    if (mapped) {
      return {
        success: false,
        statusCode: mapped.statusCode,
        errorCode: mapped.errorCode,
        message: mapped.message
      }
    }
    throw error
  }
}

// UPDATE CATEGORY
export const updateCategoryService = async ({
  id,
  payload
}: {
  id: string
  payload: UpdateCategoryInput | Record<string, any>
}, tx?: PrismaTransactionClient) => {
  if (!isValidUUID(id)) {
    return { success: false, statusCode: 404, message: 'Category not found' }
  }

  const parseResult = updateCategoryInputSchema.safeParse(payload)
  if (!parseResult.success) {
    return {
      success: false,
      statusCode: 400,
      message: parseResult.error.errors[0]?.message || 'Invalid category update payload'
    }
  }
  const validatedPayload = parseResult.data

  try {
    const category = await findCategoryById(id, tx)
    if (!category) {
      return { success: false, statusCode: 404, message: 'Category not found' }
    }

    const updateData: Prisma.CategoryUpdateInput = {}

    if (validatedPayload.name) {
      const nameConflict = await isCategoryNameTaken(validatedPayload.name, id, tx)
      if (nameConflict) {
        return {
          success: false,
          statusCode: 409,
          errorCode: 'NAME_CONFLICT',
          message: 'Category name already exists'
        }
      }
      updateData.name = validatedPayload.name
    }

    if (validatedPayload.slug) {
      const finalSlug = slugify(validatedPayload.slug, { lower: true, strict: true })
      const slugExists = await isCategorySlugTaken(finalSlug, id, tx)
      if (slugExists) {
        return {
          success: false,
          statusCode: 409,
          errorCode: 'SLUG_CONFLICT',
          message: 'Slug already exists'
        }
      }
      updateData.slug = finalSlug
    }

    if (validatedPayload.description !== undefined) {
      updateData.description = validatedPayload.description
    }

    if (validatedPayload._destroy !== undefined) {
      updateData.isDestroyed = Boolean(validatedPayload._destroy)
    } else if (validatedPayload.isDestroyed !== undefined) {
      updateData.isDestroyed = Boolean(validatedPayload.isDestroyed)
    }

    const updatedCategory = await updateCategory(id, updateData, tx)

    return {
      success: true,
      message: 'Category updated successfully!',
      data: withCompatId({
        ...updatedCategory,
        _destroy: updatedCategory.isDestroyed
      })
    }
  } catch (error) {
    const mapped = mapPrismaError(error)
    if (mapped) {
      return {
        success: false,
        statusCode: mapped.statusCode,
        errorCode: mapped.errorCode,
        message: mapped.message
      }
    }
    throw error
  }
}

// PUBLIC: GET CATEGORIES
export const getCategoriesService = async (params: ListQuery, tx?: PrismaTransactionClient) => {
  const { page = 1, limit = 20, search = '' } = params

  const { categories, total, page: pageNum, limit: limitNum, totalPages } =
    await findCategoriesWithPagination(
      {
        page: Number(page),
        limit: Number(limit),
        search: search ? String(search) : undefined,
        isDestroyed: false
      },
      tx
    )

  const compatCategories = categories.map((cat: any) =>
    withCompatId({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      createdAt: cat.createdAt,
      courseCount: cat._count?.courses ?? 0,
      _destroy: false
    })
  )

  return {
    success: true,
    message: 'Fetched categories successfully!',
    data: {
      categories: compatCategories,
      pagination: {
        page: Number(pageNum),
        limit: Number(limitNum),
        total,
        totalPages
      }
    }
  }
}

// PUBLIC: GET CATEGORY DETAIL
export const getCategoryDetailService = async (slug: string, tx?: PrismaTransactionClient) => {
  const category = await findCategoryBySlug(
    slug,
    {
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        createdAt: true,
        isDestroyed: true,
        _count: {
          select: {
            courses: {
              where: { isDestroyed: false }
            }
          }
        }
      }
    },
    tx
  )

  if (!category || category.isDestroyed) {
    return { success: false, statusCode: 404, message: 'Category not found' }
  }

  const { isDestroyed, _count, ...publicData } = category as any

  return {
    success: true,
    message: 'Fetched category detail successfully!',
    data: withCompatId({
      ...publicData,
      courseCount: _count?.courses ?? 0,
      _destroy: false
    })
  }
}
