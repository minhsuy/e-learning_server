import mongoose from 'mongoose'

export interface IFavoriteCourse {
  user: mongoose.Schema.Types.ObjectId
  course: mongoose.Schema.Types.ObjectId
}
const FavoriteCourseSchema = new mongoose.Schema<IFavoriteCourse>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    }
  },
  { timestamps: true }
)

FavoriteCourseSchema.index({ user: 1, course: 1 }, { unique: true })

const FavoriteCourseModel = mongoose.model('FavoriteCourse', FavoriteCourseSchema)
export default FavoriteCourseModel
