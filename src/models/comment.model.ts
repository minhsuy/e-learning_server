import { model, Schema, Types } from 'mongoose'
import { CommentStatus } from '~/types/enum'

export interface Comment extends Document {
  _id: Schema.Types.ObjectId
  content: string
  lesson: Schema.Types.ObjectId
  user: Schema.Types.ObjectId
  status: CommentStatus
  parentId?: Schema.Types.ObjectId
  level: number
  course: Schema.Types.ObjectId
  likes: Types.ObjectId[]
  dislikes: Types.ObjectId[]
}

const commentSchema = new Schema<Comment>(
  {
    content: {
      type: String,
      required: true
    },
    lesson: {
      type: Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      default: CommentStatus.APPROVED,
      enum: Object.values(CommentStatus)
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    level: {
      type: Number,
      default: 0
    },
    likes: {
      type: [Schema.Types.ObjectId],
      default: []
    },
    dislikes: {
      type: [Schema.Types.ObjectId],
      default: []
    }
  },
  {
    timestamps: true
  }
)
const CommentModel = model<Comment>('Comment', commentSchema)

export default CommentModel
