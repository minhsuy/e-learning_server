import mongoose, { models, Schema } from 'mongoose'

export enum EOrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}
export interface IOrder {
  _id: string
  code: string
  amount: number
  total: number
  discount: number
  coupon: Schema.Types.ObjectId
  course: Schema.Types.ObjectId
  user: Schema.Types.ObjectId
  status: EOrderStatus
}
const orderSchema = new mongoose.Schema<IOrder>(
  {
    code: {
      type: String,
      unique: true,
      required: true
    },
    amount: {
      type: Number
    },
    total: {
      type: Number
    },
    discount: {
      type: Number
    },
    coupon: {
      type: Schema.Types.ObjectId,
      ref: 'Coupon'
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: Object.values(EOrderStatus),
      default: EOrderStatus.PENDING
    }
  },
  { timestamps: true }
)

const Order = models.Order || mongoose.model('Order', orderSchema)
export default Order
