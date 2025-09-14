import mongoose from 'mongoose'

const FavoriteCourseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    courses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course'
      }
    ]
  },
  { timestamps: true }
)

const FavoriteCourseModel = mongoose.model('FavoriteCourse', FavoriteCourseSchema)
export default FavoriteCourseModel
