import mongoose, { models, Schema } from 'mongoose'

export interface IProgress extends Document {
  _id: string
  course: Schema.Types.ObjectId
  lesson: Schema.Types.ObjectId
  user: Schema.Types.ObjectId
  completed: boolean
}
const progressSchema = new mongoose.Schema<IProgress>(
  {
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    completed: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const ProgressModel = models.Progress || mongoose.model('Progress', progressSchema)
export default ProgressModel
