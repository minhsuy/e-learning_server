import { model, Schema, Types } from 'mongoose'

export interface Category extends Document {
  _id: string
  name: string
  slug: string
  created_by?: Types.ObjectId
  _destroy: boolean
  description?: string
}
const CategorySchema = new Schema<Category>(
  {
    name: {
      type: String,
      unique: true,
      required: true
    },
    slug: {
      type: String,
      unique: true,
      required: true
    },
    created_by: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    description: {
      type: String
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

const CategoryModel = model<Category>('Category', CategorySchema)

export default CategoryModel
