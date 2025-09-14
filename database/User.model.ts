import { model, Schema } from 'mongoose'

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  EXPERT = 'expert'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

interface SocialLinks {
  facebook?: string
  instagram?: string
  github?: string
}
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
      facebook: { type: String },
      instagram: { type: String },
      github: { type: String }
    }
  },
  {
    timestamps: true
  }
)

const UserModel = model<User>('User', userSchema)

export default UserModel
