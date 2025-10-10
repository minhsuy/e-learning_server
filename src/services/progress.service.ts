import { Types } from 'mongoose'
import ProgressModel from '~/models/progress.model'
import LessonModel from '~/models/lesson.model'
import EnrollmentModel from '~/models/enrollment.model'
import { ServiceResponse } from '~/types/type'

export const markLessonCompleteService = async ({
  userId,
  courseId,
  lessonId
}: {
  userId: string
  courseId: string
  lessonId: string
}): Promise<ServiceResponse> => {
  const lesson = await LessonModel.findOne({ _id: lessonId, course: courseId })
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found in this course' }
  }

  await ProgressModel.findOneAndUpdate(
    { user: userId, course: courseId, lesson: lessonId },
    { completed: true },
    { upsert: true, new: true }
  )

  const totalLessons = await LessonModel.countDocuments({ course: courseId })
  const completedLessons = await ProgressModel.countDocuments({
    user: userId,
    course: courseId,
    completed: true
  })

  const percent = Math.round((completedLessons / totalLessons) * 100)

  await EnrollmentModel.findOneAndUpdate({ user: userId, course: courseId }, { progress: percent }, { new: true })

  return {
    success: true,
    message: 'Lesson marked as completed',
    data: { progress: percent }
  }
}
// uncomplete

export const unmarkLessonCompleteService = async ({
  userId,
  courseId,
  lessonId
}: {
  userId: string
  courseId: string
  lessonId: string
}): Promise<ServiceResponse> => {
  const lesson = await LessonModel.findOne({ _id: lessonId, course: courseId })
  if (!lesson) {
    return { success: false, statusCode: 404, message: 'Lesson not found in this course' }
  }

  await ProgressModel.findOneAndUpdate({ user: userId, course: courseId, lesson: lessonId }, { completed: false })

  const totalLessons = await LessonModel.countDocuments({ course: courseId })
  const completedLessons = await ProgressModel.countDocuments({
    user: userId,
    course: courseId,
    completed: true
  })

  const percent = Math.round((completedLessons / totalLessons) * 100)

  await EnrollmentModel.findOneAndUpdate({ user: userId, course: courseId }, { progress: percent }, { new: true })

  return {
    success: true,
    message: 'Lesson unmarked as completed',
    data: { progress: percent }
  }
}

// get progress by course
export const getProgressByCourseService = async ({
  userId,
  courseId
}: {
  userId: string
  courseId: string
}): Promise<ServiceResponse> => {
  const lessons = await LessonModel.find({ course: courseId }).select('_id title order')

  const completedLessons = await ProgressModel.find({
    user: userId,
    course: courseId,
    completed: true
  }).select('lesson')

  const completedIds = completedLessons.map((p) => p.lesson.toString())

  const formattedLessons = lessons.map((lesson) => ({
    _id: lesson._id,
    title: lesson.title,
    order: lesson.order,
    completed: completedIds.includes(lesson._id.toString())
  }))

  const percent = Math.round((completedLessons.length / lessons.length) * 100)

  return {
    success: true,
    message: 'Fetched course progress successfully',
    data: {
      totalLessons: lessons.length,
      completedLessons: completedLessons.length,
      percent,
      lessons: formattedLessons
    }
  }
}
