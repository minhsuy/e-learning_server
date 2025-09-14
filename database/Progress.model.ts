import { response } from 'express'
import mongoose, { models, Schema } from 'mongoose'

export interface IPROGRESS extends Document {
  _id: string
  course: Schema.Types.ObjectId
  lesson: Schema.Types.ObjectId
  user: Schema.Types.ObjectId
}
const progressSchema = new mongoose.Schema<IPROGRESS>(
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
    }
  },
  { timestamps: true }
)

const Progress = models.Progress || mongoose.model('Progress', progressSchema)
export default History
