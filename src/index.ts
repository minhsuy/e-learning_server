import express from 'express'
import connectDB from './config/dbConnect'
import { indexRoutes } from './routes/index.route'
import dotenv from 'dotenv'
import { errorHandler } from './middlewares/errorHandler'
import './cronJobs/deleteUnverifiedUsers'
import http from 'http'
import { initSocket } from './socket/initSocket'
import cors from 'cors'
dotenv.config()
const app = express()
connectDB()

const port = process.env.PORT

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true)
      if (origin.includes('localhost') || origin.includes('192.168.')) {
        return callback(null, true)
      }
      callback(new Error('Not allowed by CORS'))
    },
    credentials: true
  })
)

app.use(express.json())
indexRoutes(app)
app.use(errorHandler)

const server = http.createServer(app)

const io = initSocket(server)
server.listen(port, () => {
  console.log(`Server is running on port : http://localhost:${port}`)
})
