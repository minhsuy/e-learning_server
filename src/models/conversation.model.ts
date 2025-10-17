import { Schema, model, Document, Types } from 'mongoose'

export interface IConversation extends Document {
  participants: Types.ObjectId[]
  isGroup: boolean
  name?: string
  course?: Types.ObjectId
  lastMessage?: Types.ObjectId
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
      }
    ],
    isGroup: {
      type: Boolean,
      default: false
    },
    name: {
      type: String
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course'
    }
  },
  { timestamps: true }
)

const ConversationModel = model<IConversation>('Conversation', ConversationSchema)

export default ConversationModel
