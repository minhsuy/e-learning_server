import { Schema, model, Types } from 'mongoose'
import { EEnrollmentStatus } from '~/types/enum'

export interface IEnrollment {
  _id: string
  user: Types.ObjectId
  course: Types.ObjectId
  progress: number
  status: EEnrollmentStatus
  enrolledAt: Date
  completedAt?: Date
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: Object.values(EEnrollmentStatus),
      default: EEnrollmentStatus.ACTIVE
    },
    enrolledAt: {
      type: Date,
      default: Date.now
    },
    completedAt: {
      type: Date
    }
  },
  { timestamps: true }
)

const EnrollmentModel = model<IEnrollment>('Enrollment', EnrollmentSchema)
export default EnrollmentModel
