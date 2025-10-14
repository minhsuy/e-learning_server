import { Server as IOServer } from 'socket.io'

let io: IOServer

export const initSocket = (server: any) => {
  io = new IOServer(server, {
    cors: { origin: '*' }
  })

  io.on('connection', (socket) => {
    console.log('A user connected', socket.id)
    socket.on('join', (room) => {
      socket.join(`${room}`)
      console.log(`Socket ${socket.id} joined room ${room}`)
    })

    socket.on('disconnect', () => {
      console.log('A user disconnected', socket.id)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized!')
  return io
}
