import { model, Schema } from 'mongoose'

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  CODING = 'CODING'
}

export interface Question extends Document {
  quizId: Schema.Types.ObjectId
  type: QuestionType
  questionName: string
  options?: IOptionQuestion[]
  points: number
  starter_code?: string
  language?: string
  test_cases?: { input: string; expected_output: string }[]
}
export interface IOptionQuestion {
  _id: Schema.Types.ObjectId
  text: string
  is_correct: boolean
}
const OptionQuestionSchema = new Schema<IOptionQuestion>({
  text: {
    type: String,
    required: true
  },
  is_correct: {
    type: Boolean,
    default: false
  }
})
const TestCaseSchema = new Schema({
  input: {
    type: String,
    required: true
  },
  expected_output: {
    type: String,
    required: true
  }
})
const QuestionSchema = new Schema<Question>(
  {
    quizId: {
      type: Schema.Types.ObjectId,
      ref: 'Quiz',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(QuestionType),
      required: true
    },
    questionName: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      default: 1
    },
    options: [OptionQuestionSchema],

    // Cho CODING
    starter_code: {
      type: String,
      required: false
    },
    language: {
      type: String,
      default: 'javascript'
    },
    test_cases: [TestCaseSchema]
  },
  { timestamps: true }
)

const QuestionModel = model<Question>('Question', QuestionSchema)
export default QuestionModel
