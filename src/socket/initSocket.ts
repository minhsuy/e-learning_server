import { Server as IOServer } from 'socket.io'
import { createMessageService, deleteMessageService, updateMessageService } from '~/services/message.service'

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
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, senderId, content, type } = data

        if (!conversationId || !senderId || !content) return

        await createMessageService({
          conversationId,
          senderId,
          content,
          type
        })
      } catch (error) {
        console.error('Error while sending message via socket:', error)
      }
    })
    socket.on('editMessage', async (data) => {
      const { messageId, senderId, content } = data
      const result = await updateMessageService({ messageId, senderId, content })
      if (!result.success) {
        socket.emit('errorMessage', result.message)
      }
    })

    socket.on('deleteMessage', async (data) => {
      const { messageId, senderId } = data
      const result = await deleteMessageService({ messageId, senderId })
      if (!result.success) {
        socket.emit('errorMessage', result.message)
      }
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
