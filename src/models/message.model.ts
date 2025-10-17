import { Schema, model, Document, Types } from 'mongoose'
import { EMessageType } from '~/types/enum'

export interface IMessage extends Document {
  conversation: Types.ObjectId
  sender: Types.ObjectId
  content: string
  type: EMessageType
  readBy: Types.ObjectId[]
  isEdited: boolean
}

const MessageSchema = new Schema<IMessage>(
  {
    conversation: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: EMessageType,
      default: EMessageType.TEXT
    },
    readBy: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    isEdited: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
)

const MessageModel = model<IMessage>('Message', MessageSchema)
export default MessageModel
