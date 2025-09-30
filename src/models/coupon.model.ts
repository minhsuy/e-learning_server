import mongoose, { Document, Schema } from 'mongoose'
import { ECouponType } from '~/types/enum'

export interface ICoupon extends Document {
  _id: string
  title: string
  code: string
  active: boolean
  startDate: Date
  endDate: Date
  used: number
  limit: number
  courses: Schema.Types.ObjectId[]
  type: ECouponType
  value: number
  author: Schema.Types.ObjectId
}
const couponSchema = new mongoose.Schema<ICoupon>(
  {
    title: {
      type: String,
      required: true
    },
    code: {
      type: String,
      unique: true,
      required: true
    },
    active: {
      type: Boolean,
      default: false
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
    },
    limit: {
      type: Number
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    type: {
      type: String,
      enum: Object.values(ECouponType),
      default: ECouponType.PERCENTAGE
    },
    value: {
      type: Number
    },
    used: {
      type: Number,
      default: 0
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: true }
)

const CouponModel = mongoose.models.Coupon || mongoose.model('Coupon', couponSchema)
export default CouponModel
