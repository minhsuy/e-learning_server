import mongoose, { Document } from 'mongoose'
import { ENotificationType } from '~/types/enum'

export interface INotification extends Document {
  sender?: mongoose.Types.ObjectId
  receiver: mongoose.Types.ObjectId
  type: ENotificationType
  message: string
  relatedId?: mongoose.Types.ObjectId
  read: boolean
}

const NotificationSchema = new mongoose.Schema<INotification>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ENotificationType,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId
    },
    read: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const NotificationModel = mongoose.model<INotification>('Notification', NotificationSchema)
export default NotificationModel
