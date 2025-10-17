import { model, Schema, Document } from 'mongoose'

export interface Quiz extends Document {
  _id: Schema.Types.ObjectId
  title: string
  duration?: number
  passing_grade?: number
  description?: string
  questions: Schema.Types.ObjectId[]
  lesson: Schema.Types.ObjectId
  created_by: Schema.Types.ObjectId
  courseId: Schema.Types.ObjectId
}

const QuizSchema = new Schema<Quiz>(
  {
    title: {
      type: String,
      required: true
    },
    duration: {
      type: Number
    },
    passing_grade: {
      type: Number
    },
    description: {
      type: String
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Question'
      }
    ],
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    }
  },
  { timestamps: true }
)

const QuizModel = model<Quiz>('Quiz', QuizSchema)
export default QuizModel
