import { Schema, model, Document } from 'mongoose'
import { QuestionType } from '~/types/enum'

export interface Question extends Document {
  quiz: Schema.Types.ObjectId
  type: QuestionType
  title: string
  options: string[]
  answer: string
  points?: number
}

const QuestionSchema = new Schema<Question>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(QuestionType),
      default: QuestionType.MULTIPLE_CHOICE,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    options: [
      {
        type: String,
        required: true
      }
    ],
    answer: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      default: 1
    }
  },
  { timestamps: true }
)

const QuestionModel = model<Question>('Question', QuestionSchema)
export default QuestionModel
