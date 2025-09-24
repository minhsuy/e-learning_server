import { model, Schema } from 'mongoose'

export interface Course extends Document {
  _id: Schema.Types.ObjectId
  title: string
  image: string
  is_published: boolean
  intro_url: string
  description: string
  category: Schema.Types.ObjectId
  price: number
  old_price: number
  slug: string
  type: CourseType
  status: CourseStatus
  level: CourseLevel
  view: number
  sold: number
  info: {
    requirements: string[]
    benefits: string[]
    qa: {
      question: string
      answer: string
    }[]
  }
  chapters: Schema.Types.ObjectId[]
  author: Schema.Types.ObjectId
  rating: Schema.Types.ObjectId[]
  created_by: Schema.Types.ObjectId
  _destroy: boolean
}

export enum CourseStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}
export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}
export enum CourseType {
  PAID = 'paid',
  FREE = 'free'
}
const courseSchema = new Schema<Course>(
  {
    title: {
      type: String,
      required: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    image: {
      type: String,
      default: ''
    },
    is_published: { type: Boolean, default: false },
    intro_url: {
      type: String,
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    price: {
      type: Number,
      default: 0
    },
    old_price: {
      type: Number,
      default: 0
    },
    type: {
      type: String,
      enum: Object.values(CourseType),
      default: CourseType.PAID
    },
    status: {
      type: String,
      enum: Object.values(CourseStatus),
      default: CourseStatus.PENDING
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    chapters: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Chapter'
      }
    ],
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category'
    },
    rating: {
      type: [Schema.Types.ObjectId],
      ref: 'Rating'
    },
    view: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    info: {
      requirements: {
        type: [String]
      },
      benefits: {
        type: [String]
      },
      techniques: {
        type: [String]
      },
      documents: {
        type: [String]
      },
      qa: [
        {
          question: {
            type: String
          },
          answer: {
            type: String
          }
        }
      ]
    },
    level: {
      type: String,
      enum: Object.values(CourseLevel),
      default: CourseLevel.BEGINNER
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
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

const CourseModel = model<Course>('Course', courseSchema)

export default CourseModel
