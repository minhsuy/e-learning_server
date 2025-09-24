import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.mongodbURL as string, {
      dbName: 'e-learning'
    })
    console.log('Database connected successfully')
  } catch (error) {
    console.log('Database connection failed', error)
  }
}

export default connectDB
