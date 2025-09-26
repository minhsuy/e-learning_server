import express from 'express'
import connectDB from './config/dbConnect'
import { indexRoutes } from './routes/index.route'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'
import './cronJobs/deleteUnverifiedUsers'

dotenv.config()
const app = express()
connectDB()

const port = process.env.PORT

app.use(express.json())
indexRoutes(app)
app.use(errorHandler)
app.listen(port, () => {
  console.log(`Server is running on port : http://localhost:${port}`)
})
