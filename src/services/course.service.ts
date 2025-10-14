import { FilterQuery, Types } from 'mongoose'
import CourseModel from '~/models/course.model'
import UserModel from '~/models/user.model'
import { CourseLevel, CourseStatus, CourseType, ENotificationType, UserRole } from '~/types/enum'
import { ListQuery } from '~/types/type'
import { toBaseSlug } from '~/utils/ultis'
import { pushNotificationService } from './notification.service'

export const createCourseService = async ({
  author,
  payload,
  role
}: {
  author: string
  payload: Record<string, any>
  role: string
}) => {
  if (!author || !Types.ObjectId.isValid(author)) {
    return { success: false, statusCode: 401, message: 'Invalid author' }
  }

  const {
    title,
    slug: providedSlug,
    image = '',
    intro_url = '',
    description = '',
    category,
    type = CourseType.PAID,
    price = 0,
    old_price = 0,
    level = CourseLevel.BEGINNER,
    info = {}
  } = payload

  const baseSlugSource = providedSlug && String(providedSlug).trim().length > 0 ? String(providedSlug) : String(title)

  const baseSlug = toBaseSlug(baseSlugSource)
  if (!baseSlug) {
    return { success: false, statusCode: 400, message: 'Invalid slug/title' }
  }

  const slugExists = await CourseModel.exists({ slug: baseSlug })
  if (slugExists) {
    return {
      success: false,
      statusCode: 409,
      errorCode: 'SLUG_CONFLICT',
      message: 'Slug already exists. Please provide a different slug or change the title.'
    }
  }

  const normalizedType = type
  const finalPrice = normalizedType === CourseType.FREE ? 0 : Number(price || 0)
  const finalOldPrice = normalizedType === CourseType.FREE ? 0 : Number(old_price || 0)

  const safeInfo = {
    requirements: Array.isArray(info?.requirements) ? info.requirements : [],
    benefits: Array.isArray(info?.benefits) ? info.benefits : [],
    qa: Array.isArray(info?.qa) ? info.qa : []
  }

  const doc = await CourseModel.create({
    title,
    slug: baseSlug,
    image,
    intro_url,
    description,
    category,
    type: normalizedType,
    price: finalPrice,
    old_price: finalOldPrice,
    level,
    status: role === UserRole.ADMIN ? CourseStatus.APPROVED : CourseStatus.PENDING,
    author: new Types.ObjectId(author),
    created_by: new Types.ObjectId(author),
    info: safeInfo
  })
  if (role === UserRole.TEACHER) {
    const admins = await UserModel.find({ role: UserRole.ADMIN }).select('_id username')
    const teacher = await UserModel.findById(author).select('username')
    for (const admin of admins) {
      await pushNotificationService({
        senderId: author,
        receiverId: admin._id.toString(),
        type: ENotificationType.COURSE,
        message: `Teacher ${teacher?.username} vừa tạo khóa học "${doc.title}"`,
        relatedId: doc._id.toString()
      })
    }
  }
  return {
    success: true,
    message: 'Course created (pending approval)',
    data: doc
  }
}

// course detail
export const getCourseDetailPublicService = async ({
  slug,
  increaseView = true
}: {
  slug: string
  increaseView?: boolean
}) => {
  if (!slug || !slug.trim()) {
    return { success: false, statusCode: 400, message: 'Invalid slug' }
  }

  const filter = {
    slug: String(slug).trim().toLowerCase(),
    status: CourseStatus.APPROVED,
    _destroy: false
  }

  const course = await CourseModel.findOneAndUpdate(filter, increaseView ? { $inc: { view: 1 } } : {}, { new: true })
    .select(
      'title slug image intro_url description category price old_price type status level view sold info author createdAt updatedAt'
    )
    .populate({ path: 'author', select: '_id username avatar role' })
    .populate({
      path: 'chapters',
      select: '_id title',
      populate: { path: 'lessons', select: 'title duration isDemo' }
    })

  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  return {
    success: true,
    message: 'Fetched course detail successfully',
    data: course
  }
}

// list course

export const getListCoursesService = async (params: ListQuery) => {
  const { page = 1, limit = 10, search, category, level, type, priceMin, priceMax, sortBy = 'createdAt' } = params

  const filter: FilterQuery<typeof CourseModel> = {
    status: CourseStatus.APPROVED,
    _destroy: false
  }

  if (search) {
    filter.$or = [{ title: { $regex: search, $options: 'i' } }]
  }

  if (category) filter.category = category
  if (level) filter.level = level
  if (type) filter.type = type

  if (priceMin || priceMax) {
    filter.price = {}
    if (priceMin) (filter.price as any).$gte = Number(priceMin)
    if (priceMax) (filter.price as any).$lte = Number(priceMax)
  }

  const skip = (page - 1) * limit

  const [courses, total] = await Promise.all([
    CourseModel.find(filter)
      .select('title slug image price old_price level type sold view createdAt')
      .populate({ path: 'author', select: '_id username email avatar role' })
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(limit),
    CourseModel.countDocuments(filter)
  ])

  return {
    success: true,
    message: 'Fetched courses successfully!',
    data: {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }
  }
}
