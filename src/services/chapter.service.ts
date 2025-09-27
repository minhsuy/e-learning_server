import { Types } from 'mongoose'
import ChapterModel from '~/models/chapter.model'
import CourseModel from '~/models/course.model'
import { UserRole } from '~/types/enum'

export const createChapterService = async ({
  courseId,
  title,
  order,
  userId,
  role
}: {
  courseId: string
  title: string
  order?: number
  userId: string
  role: string
}) => {
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }
  if (order === undefined) {
    const lastChapter = await ChapterModel.findOne({ course: courseId }).sort({ order: -1 })
    order = lastChapter ? lastChapter.order + 1 : 1
  }
  const chapter = await ChapterModel.create({
    title,
    course: new Types.ObjectId(courseId),
    order
  })

  course.chapters.push(chapter._id)
  await course.save()

  return {
    success: true,
    message: 'Chapter created successfully!',
    data: chapter
  }
}

// update chapter

export const updateChapterService = async ({
  chapterId,
  userId,
  role,
  payload
}: {
  chapterId: string
  userId: string
  role: string
  payload: { title?: string; order?: number; _destroy?: boolean }
}) => {
  const chapter = await ChapterModel.findById(chapterId).populate('course')
  if (!chapter) {
    return { success: false, statusCode: 404, message: 'Chapter not found' }
  }

  const course: any = chapter.course
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  if (payload.title) chapter.title = payload.title
  if (payload.order !== undefined) chapter.order = payload.order
  if (payload._destroy !== undefined) chapter._destroy = payload._destroy

  await chapter.save()

  return {
    success: true,
    message: 'Chapter updated successfully!',
    data: chapter
  }
}

// delete chapter
export const deleteChapterService = async ({
  chapterId,
  userId,
  role
}: {
  chapterId: string
  userId: string
  role: string
}) => {
  const chapter = await ChapterModel.findById(chapterId).populate('course')
  if (!chapter) {
    return { success: false, statusCode: 404, message: 'Chapter not found' }
  }

  const course: any = chapter.course
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  chapter.set('_destroy', true)
  await chapter.save()

  return {
    success: true,
    message: 'Chapter deleted successfully!',
    data: chapter
  }
}

// get chapters by course
export const getChaptersByCourseService = async ({
  courseId,
  userId,
  role
}: {
  courseId: string
  userId: string
  role: string
}) => {
  const course = await CourseModel.findById(courseId)
  if (!course) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const chapters = await ChapterModel.find({ course: courseId, _destroy: false }).sort({ order: 1 })

  return {
    success: true,
    message: 'Fetched chapters successfully!',
    data: chapters
  }
}
