import { Document, model, Schema } from 'mongoose'
import { UserRole, UserStatus } from '~/types/enum'
import { SocialLinks } from '~/types/type'

export interface User extends Document {
  _id: string
  username: string
  email: string
  password: string
  avatar: string
  courses: Schema.Types.ObjectId[]
  favorites: Schema.Types.ObjectId[]
  status: UserStatus
  role: UserRole
  phone: string
  bio: string
  socialLinks?: SocialLinks
  isVerified: string
  refresh_token?: string
  reset_password_token?: string
  reset_password_expires?: Date
}
const userSchema = new Schema<User>(
  {
    username: {
      type: String,
      required: true
    },
    email: {
      type: String,
      unique: true,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: Object.values(UserStatus),
      default: UserStatus.ACTIVE
    },
    avatar: {
      type: String
    },
    phone: {
      type: String
    },
    bio: {
      type: String
    },
    courses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Course'
      }
    ],
    favorites: [{ type: Schema.Types.ObjectId, ref: 'Course' }],
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER
    },
    socialLinks: {
      facebook: { type: String, default: '' },
      instagram: { type: String, default: '' },
      github: { type: String, default: '' }
    },
    isVerified: {
      type: String
    },
    refresh_token: {
      type: String
    },
    reset_password_token: {
      type: String
    },
    reset_password_expires: {
      type: Date
    }
  },
  {
    timestamps: true
  }
)

const UserModel = model<User>('User', userSchema)

export default UserModel
