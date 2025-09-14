import { model, Schema, Types } from 'mongoose'

export interface Category extends Document {
  _id: string
  name: string
  slug: string
  created_by?: Types.ObjectId
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
    }
  },

  {
    timestamps: true
  }
)

const CategoryModel = model<Category>('Category', CategorySchema)

export default CategoryModel
