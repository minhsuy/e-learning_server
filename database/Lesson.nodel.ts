import { model, models, Schema } from 'mongoose'

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text'
}
export interface Lesson extends Document {
  _id: Schema.Types.ObjectId
  title: string
  slug: string
  chapter: Schema.Types.ObjectId
  course: Schema.Types.ObjectId
  order: number
  duration: number
  type: LessonType
  content: string
  created_by: Schema.Types.ObjectId
  isDemo: boolean
  videoUrl?: string
}

const lessonSchema = new Schema<Lesson>(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true
    },
    order: {
      type: Number,
      default: 0
    },
    duration: {
      type: Number,
      default: 0
    },
    content: {
      type: String,
      default: ''
    },
    isDemo: {
      type: Boolean,
      default: false
    },
    chapter: {
      type: Schema.Types.ObjectId,
      ref: 'Chapter',
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    type: {
      type: String,
      enum: Object.values(LessonType),
      default: LessonType.VIDEO
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    videoUrl: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
)

const LessonModel = model<Lesson>('LessonModel', lessonSchema)

export default lessonSchema
