import { Types } from 'mongoose'
import LessonModel from '~/models/lesson.model'
import CourseModel from '~/models/course.model'
import ChapterModel from '~/models/chapter.model'
import { ENotificationType, LessonType, UserRole } from '~/types/enum'
import slugify from 'slugify'
import EnrollmentModel from '~/models/enrollment.model'
import { pushNotificationService } from './notification.service'

export const createLessonService = async ({
  payload,
  userId,
  role
}: {
  payload: Record<string, any>
  userId: string
  role: string
}) => {
  const {
    title,
    chapter,
    course,
    type = LessonType.VIDEO,
    duration = 0,
    content = '',
    isDemo = false,
    videoUrl = ''
  } = payload

  const courseDoc = await CourseModel.findById(course)
  if (!courseDoc) {
    return { success: false, statusCode: 404, message: 'Course not found' }
  }

  if (role === UserRole.TEACHER && courseDoc.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  const chapterDoc = await ChapterModel.findById(chapter)
  if (!chapterDoc) {
    return { success: false, statusCode: 404, message: 'Chapter not found' }
  }

  let slug = slugify(title, { lower: true, strict: true })
  const exists = await LessonModel.findOne({ slug, course })
  if (exists) {
    slug = `${slug}-${Date.now().toString(16).slice(2)}`
  }

  let order = payload.order
  if (order === undefined) {
    const lastLesson = await LessonModel.findOne({ chapter }).sort({ order: -1 })
    order = lastLesson ? lastLesson.order + 1 : 1
  }

  const lesson = await LessonModel.create({
    title,
    slug,
    chapter: new Types.ObjectId(chapter),
    course: new Types.ObjectId(course),
    order,
    duration,
    type,
    content,
    isDemo,
    videoUrl,
    author: new Types.ObjectId(userId)
  })

  chapterDoc.lessons.push(lesson._id)
  await chapterDoc.save()
  const enrollments = await EnrollmentModel.find({ course: courseDoc._id, status: 'active' }).select('user')

  for (const enrollment of enrollments) {
    await pushNotificationService({
      senderId: userId,
      receiverId: enrollment.user.toString(),
      type: ENotificationType.LESSON,
      message: `Có bài học mới "${lesson.title}" trong khóa học "${courseDoc.title}"`,
      relatedId: lesson._id.toString()
    })
  }
  return {
    success: true,
    message: 'Lesson created successfully!',
    data: lesson
  }
}
// update lesson
export const updateLessonService = async ({
  lessonId,
  payload,
  userId,
  role
}: {
  lessonId: string
  payload: Record<string, any>
  userId: string
  role: string
}) => {
  const lesson = await LessonModel.findById(lessonId).populate('course')
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = lesson.course as any
  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  if (payload.title) {
    lesson.title = payload.title
    lesson.slug = slugify(payload.title, { lower: true, strict: true })
  }
  if (payload.type) lesson.type = payload.type
  if (payload.duration !== undefined) lesson.duration = payload.duration
  if (payload.content) lesson.content = payload.content
  if (payload.videoUrl) lesson.videoUrl = payload.videoUrl
  if (payload.isDemo !== undefined) lesson.isDemo = payload.isDemo

  await lesson.save()

  return {
    success: true,
    message: 'Lesson updated successfully!',
    data: lesson
  }
}

//   delete lesson
export const deleteLessonService = async ({
  lessonId,
  userId,
  role
}: {
  lessonId: string
  userId: string
  role: string
}) => {
  const lesson = await LessonModel.findById(lessonId).populate('course')
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found' }
  }

  const course = lesson.course as any
  if (role === UserRole.TEACHER && course.author.toString() !== userId) {
    return { success: false, statusCode: 403, message: 'You are not the owner of this course' }
  }

  await ChapterModel.updateOne({ _id: lesson.chapter }, { $pull: { lessons: lesson._id } })

  await LessonModel.deleteOne({ _id: lessonId })

  return {
    success: true,
    message: 'Lesson deleted successfully!'
  }
}

// get lesson by chapter
export const getLessonsByChapterService = async (chapterId: string) => {
  const lessons = await LessonModel.find({ chapter: chapterId })
    .select('_id title slug order duration type isDemo createdAt')
    .sort({ order: 1 })

  if (!lessons || lessons.length === 0) {
    return { success: false, statusCode: 404, message: 'No lessons found for this chapter' }
  }

  return {
    success: true,
    message: 'Fetched lessons successfully',
    data: lessons
  }
}
