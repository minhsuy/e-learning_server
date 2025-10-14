import { Schema, model, Document } from 'mongoose'

export interface CodeExercise extends Document {
  lesson: Schema.Types.ObjectId
  title: string
  starterCode: string
  language: string
  testCases: { input: string; expectedOutput: string }[]
  points?: number
  createdBy: Schema.Types.ObjectId
}

const CodeExerciseSchema = new Schema<CodeExercise>(
  {
    lesson: { type: Schema.Types.ObjectId, ref: 'Lesson', required: true },
    title: { type: String, required: true },
    starterCode: { type: String, default: '' },
    language: { type: String, required: true }, // e.g. "javascript", "python"
    testCases: [
      {
        input: { type: String, required: true },
        expectedOutput: { type: String, required: true }
      }
    ],
    points: { type: Number, default: 1 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

const CodeExerciseModel = model<CodeExercise>('CodeExercise', CodeExerciseSchema)
export default CodeExerciseModel
