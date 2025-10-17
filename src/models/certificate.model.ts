import { Schema, model, Document } from 'mongoose'

export interface Certificate extends Document {
  user: Schema.Types.ObjectId
  course: Schema.Types.ObjectId
  issuedAt: Date
  grade: number
  certificateUrl: string
}

const CertificateSchema = new Schema<Certificate>(
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
    issuedAt: {
      type: Date,
      default: Date.now
    },
    grade: {
      type: Number,
      required: true
    },
    certificateUrl: {
      type: String
    }
  },
  { timestamps: true }
)

const CertificateModel = model<Certificate>('Certificate', CertificateSchema)
export default CertificateModel
