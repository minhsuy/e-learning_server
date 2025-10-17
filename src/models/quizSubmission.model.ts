import { Schema, model, Document } from 'mongoose'

export interface QuizSubmission extends Document {
  _id: Schema.Types.ObjectId
  quiz: Schema.Types.ObjectId
  user: Schema.Types.ObjectId
  answers: { question: Schema.Types.ObjectId; selectedAnswer: string }[]
  score: number
  completedAt: Date
  totalPoints: number
  percentage: number
}

const QuizSubmissionSchema = new Schema<QuizSubmission>(
  {
    quiz: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: [
      {
        question: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
        selectedAnswer: { type: Schema.Types.Mixed, required: true }
      }
    ],
    score: {
      type: Number,
      default: 0
    },
    totalPoints: {
      type: Number,
      default: 0
    },
    percentage: {
      type: Number,
      default: 0
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
)

const QuizSubmissionModel = model<QuizSubmission>('QuizSubmission', QuizSubmissionSchema)
export default QuizSubmissionModel
