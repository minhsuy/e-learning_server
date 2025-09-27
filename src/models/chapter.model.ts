import { model, Schema } from 'mongoose'
export interface Chapter extends Document {
  _id: Schema.Types.ObjectId
  title: string
  course: Schema.Types.ObjectId
  lessons: Schema.Types.ObjectId[]
  order: number
  _destroy: boolean
}
const ChapterSchema = new Schema<Chapter>(
  {
    title: {
      type: String,
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    lessons: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Lesson'
      }
    ],
    order: {
      type: Number,
      default: 0
    },
    _destroy: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
)

const ChapterModel = model<Chapter>('Chapter', ChapterSchema)

export default ChapterModel
