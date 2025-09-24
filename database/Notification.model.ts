import mongoose, { Schema, models, Document } from 'mongoose'

export interface INotification extends Document {
  _id: string
  title: string
  content: string
  users: Schema.Types.ObjectId[]
  createdBy: Schema.Types.ObjectId
  type: 'system' | 'course'
}

const notificationSchema = new Schema<INotification>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    users: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    type: {
      type: String,
      enum: ['system', 'course'],
      default: 'course'
    }
  },
  { timestamps: true }
)

const Notification = models.Notification || mongoose.model<INotification>('Notification', notificationSchema)

export default Notification

// cart , category , chapter , comment , coupon , course , favoritecourse , lesson , noti , order ,progress , question , quiz , rating , user , userquiz