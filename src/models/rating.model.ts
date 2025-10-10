import mongoose, { Schema } from 'mongoose'
import { models } from 'mongoose'
import { ERatingStatus } from '~/types/enum'
export interface IRating extends Document {
  _id: string
  rate: number
  content: string
  user: Schema.Types.ObjectId
  course: Schema.Types.ObjectId
  status: ERatingStatus
}

const ratingSchema = new mongoose.Schema<IRating>(
  {
    rate: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    content: {
      type: String,
      required: true,
      maxlength: 100
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    status: {
      type: String,
      enum: Object.values(ERatingStatus),
      default: ERatingStatus.INACTIVE
    }
  },
  { timestamps: true }
)

ratingSchema.index({ user: 1, course: 1 }, { unique: true })
const RatingModel = models.Rating || mongoose.model('Rating', ratingSchema)
export default RatingModel
