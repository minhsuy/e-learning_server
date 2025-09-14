import mongoose, { Schema } from 'mongoose'
import { models } from 'mongoose'
export interface IRating extends Document {
  _id: string
  rate: number
  content: string
  user: Schema.Types.ObjectId
  course: Schema.Types.ObjectId
  status: ERatingStatus
}
export enum ERatingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
const ratingSchema = new mongoose.Schema<IRating>(
  {
    rate: {
      type: Number,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    status: {
      type: String,
      enum: Object.values(ERatingStatus),
      default: ERatingStatus.INACTIVE
    }
  },
  { timestamps: true }
)

const Rating = models.Rating || mongoose.model('Rating', ratingSchema)
export default Rating
