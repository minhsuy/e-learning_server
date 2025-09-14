import { Schema, model } from 'mongoose'

export interface IUserQuizResult {
  quizId: Schema.Types.ObjectId
  userId: Schema.Types.ObjectId
  answers: {
    question: Schema.Types.ObjectId
    selected_answers: Schema.Types.ObjectId
    code_answer?: string
    passed_test_cases?: number
    total_test_cases?: number
    is_correct?: boolean
  }[]
  earned_point: number
  total_point: number
  is_passed: boolean
  time_taken: number
  start_time: Date
  end_time: Date
  is_submitted: boolean
}

const UserQuizResultSchema = new Schema<IUserQuizResult>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: [
      {
        question: {
          type: Schema.Types.ObjectId,
          ref: 'Question',
          required: true
        },
        selected_answer: {
          type: Schema.Types.ObjectId
        },
        code_answer: {
          type: String
        },
        is_correct: {
          type: Boolean
        }
      }
    ],

    earned_point: {
      type: Number,
      default: 0
    },
    total_point: {
      type: Number,
      default: 0
    },
    is_passed: {
      type: Boolean,
      default: false
    },
    time_taken: {
      type: Number,
      default: 0
    },
    start_time: {
      type: Date,
      required: true
    },
    end_time: {
      type: Date
    },
    is_submitted: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

export default model<IUserQuizResult>('UserQuizResult', UserQuizResultSchema)
