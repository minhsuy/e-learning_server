import { FilterQuery, Types } from 'mongoose'
import slugify from 'slugify'
import CategoryModel from '~/models/category.model'
import { ListQuery } from '~/types/type'

export const createCategoryService = async ({
  payload,
  created_by
}: {
  payload: Record<string, any>
  created_by: string
}) => {
  if (!created_by || !Types.ObjectId.isValid(created_by)) {
    return { success: false, statusCode: 401, message: 'Invalid user' }
  }

  const { name, slug, description = '' } = payload

  const finalSlug = slug ? slugify(slug, { lower: true, strict: true }) : slugify(name, { lower: true, strict: true })

  const slugExists = await CategoryModel.exists({ slug: finalSlug })
  if (slugExists) {
    return {
      success: false,
      statusCode: 409,
      errorCode: 'SLUG_CONFLICT',
      message: 'Slug already exists. Please use another slug or name.'
    }
  }

  const category = await CategoryModel.create({
    name,
    slug: finalSlug,
    description,
    created_by: new Types.ObjectId(created_by)
  })

  return {
    success: true,
    message: 'Category created successfully!',
    data: category
  }
}

// DELETE CATEGORY
export const deleteCategoryService = async (id: string) => {
  const category = await CategoryModel.findById(id)

  if (!category) {
    return {
      success: false,
      statusCode: 404,
      message: 'Category not found'
    }
  }

  if (category._destroy) {
    return {
      success: false,
      statusCode: 400,
      message: 'Category already deleted'
    }
  }

  category._destroy = true
  await category.save()

  return {
    success: true,
    message: 'Category deleted successfully!',
    data: category
  }
}

//  UPDATE CATEGORY
export const updateCategoryService = async ({ id, payload }: { id: string; payload: Record<string, any> }) => {
  const category = await CategoryModel.findById(id)
  if (!category) {
    return { success: false, statusCode: 404, message: 'Category not found' }
  }

  if (payload.name) category.name = payload.name
  if (payload.slug) {
    const finalSlug = slugify(payload.slug, { lower: true, strict: true })
    const slugExists = await CategoryModel.findOne({ slug: finalSlug })
    if (slugExists) {
      return {
        success: false,
        statusCode: 409,
        errorCode: 'SLUG_CONFLICT',
        message: 'Slug already exists'
      }
    }
    category.slug = finalSlug
  }
  if (payload.description !== undefined) category.description = payload.description
  if (payload._destroy !== undefined) category._destroy = payload._destroy

  await category.save()

  return {
    success: true,
    message: 'Category updated successfully!',
    data: category
  }
}

// public --------------------------------------------------
export const getCategoriesService = async (params: ListQuery) => {
  const { page = 1, limit = 20, search = '' } = params
  const skip = (page - 1) * limit

  const filter: FilterQuery<typeof CategoryModel> = { _destroy: false }

  if (search) {
    filter.$or = [{ name: { $regex: search, $options: 'i' } }]
  }
  const [categories, total] = await Promise.all([
    CategoryModel.find(filter)
      .select('name slug description createdAt')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    CategoryModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched categories successfully!',
    data: {
      categories,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}

export const getCategoryDetailService = async (slug: string) => {
  const category = await CategoryModel.findOne({ slug, _destroy: false }).select('name slug description createdAt')

  if (!category) {
    return { success: false, statusCode: 404, message: 'Category not found' }
  }

  return {
    success: true,
    message: 'Fetched category detail successfully!',
    data: category
  }
}
