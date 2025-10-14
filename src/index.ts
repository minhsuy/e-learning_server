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
    origin: 'http://localhost:5173',
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
