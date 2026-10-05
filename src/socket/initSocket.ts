import { Server as IOServer, Socket } from 'socket.io'
import { verifyToken } from '~/middlewares/verifyToken'
import { isValidUUID } from '~/utils/uuid'
import { isUserInConversation } from '~/repositories/conversationParticipant.repository'
import {
  createMessageService,
  deleteMessageService,
  updateMessageService
} from '~/services/message.service'

let io: IOServer

export const initSocket = (server: any) => {
  io = new IOServer(server, {
    cors: { origin: '*' }
  })

  // =========================================================================
  // 1. STRICT JWT AUTHENTICATION MIDDLEWARE — SECURITY CRITICAL (NO FALLBACK)
  // =========================================================================
  io.use(async (socket: Socket, next) => {
    try {
      let token: string | undefined = socket.handshake.auth?.token

      if (!token && socket.handshake.headers?.authorization) {
        const authHeader = socket.handshake.headers.authorization
        if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.slice(7).trim()
        } else if (typeof authHeader === 'string') {
          token = authHeader.trim()
        }
      }

      if (!token) {
        return next(new Error('Authentication error: Access token required'))
      }

      const decoded = await verifyToken({
        token,
        privateKey: process.env.JWT_SECRECT_ACCESS_TOKEN as string
      })

      if (!decoded || !decoded.userId) {
        return next(new Error('Authentication error: Invalid token payload'))
      }

      // Attach verified identity to socket context
      socket.data.user = decoded
      next()
    } catch (err: any) {
      return next(new Error('Authentication error: ' + (err.message || 'Invalid or expired token')))
    }
  })

  // =========================================================================
  // 2. AUTHENTICATED REALTIME CONNECTION & EVENT HANDLERS
  // =========================================================================
  io.on('connection', (socket: Socket) => {
    const userId = socket.data?.user?.userId

    if (!userId) {
      socket.disconnect(true)
      return
    }

    // Automatically join personal room using authenticated user identity
    socket.join(String(userId))
    console.log(`📡 Authenticated user ${userId} connected on socket ${socket.id}`)

    // -----------------------------------------------------------------------
    // Room Join Event with Participant Authorization
    // -----------------------------------------------------------------------
    socket.on('join', async (room) => {
      try {
        const conversationId = String(room)
        if (!isValidUUID(conversationId)) {
          socket.emit('errorMessage', 'Invalid conversation ID')
          return
        }

        const isMember = await isUserInConversation(conversationId, userId)
        if (!isMember) {
          socket.emit('errorMessage', 'Access denied to conversation')
          return
        }

        socket.join(conversationId)
        console.log(`Socket ${socket.id} (user ${userId}) joined room ${conversationId}`)
      } catch (err) {
        console.error('Error in socket join:', err)
        socket.emit('errorMessage', 'Failed to join conversation room')
      }
    })

    // -----------------------------------------------------------------------
    // Send Message Event (Authenticated senderId enforced)
    // -----------------------------------------------------------------------
    socket.on('sendMessage', async (data) => {
      try {
        const { conversationId, content, type } = data || {}

        if (!conversationId || !isValidUUID(conversationId)) {
          socket.emit('errorMessage', 'Invalid conversation ID')
          return
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          socket.emit('errorMessage', 'Message content is required')
          return
        }

        // Ignore client-supplied senderId, enforce authenticated identity
        const result = await createMessageService({
          conversationId,
          senderId: userId,
          content,
          type
        })

        if (!result.success) {
          socket.emit('errorMessage', result.message || 'Failed to send message')
        }
      } catch (error) {
        console.error('Error while sending message via socket:', error)
        socket.emit('errorMessage', 'Internal server error while sending message')
      }
    })

    // -----------------------------------------------------------------------
    // Edit Message Event (Ownership verified at Service layer)
    // -----------------------------------------------------------------------
    socket.on('editMessage', async (data) => {
      try {
        const { messageId, content } = data || {}

        if (!messageId || !isValidUUID(messageId)) {
          socket.emit('errorMessage', 'Invalid message ID')
          return
        }

        if (!content || typeof content !== 'string' || content.trim().length === 0) {
          socket.emit('errorMessage', 'Message content is required')
          return
        }

        // Ignore client-supplied senderId, enforce authenticated identity
        const result = await updateMessageService({
          messageId,
          senderId: userId,
          content
        })

        if (!result.success) {
          socket.emit('errorMessage', result.message || 'Failed to edit message')
        }
      } catch (error) {
        console.error('Error while editing message via socket:', error)
        socket.emit('errorMessage', 'Internal server error while editing message')
      }
    })

    // -----------------------------------------------------------------------
    // Delete Message Event (Ownership verified at Service layer)
    // -----------------------------------------------------------------------
    socket.on('deleteMessage', async (data) => {
      try {
        const { messageId } = data || {}

        if (!messageId || !isValidUUID(messageId)) {
          socket.emit('errorMessage', 'Invalid message ID')
          return
        }

        // Ignore client-supplied senderId, enforce authenticated identity
        const result = await deleteMessageService({
          messageId,
          senderId: userId
        })

        if (!result.success) {
          socket.emit('errorMessage', result.message || 'Failed to delete message')
        }
      } catch (error) {
        console.error('Error while deleting message via socket:', error)
        socket.emit('errorMessage', 'Internal server error while deleting message')
      }
    })

    // -----------------------------------------------------------------------
    // WebRTC Signaling Events (Authenticated identity enforced)
    // -----------------------------------------------------------------------
    socket.on('callUser', ({ receiverId, userToCall, signalData, name }) => {
      const targetId = receiverId || userToCall
      if (!targetId) {
        socket.emit('errorMessage', 'Receiver ID is required')
        return
      }
      console.log(`☎️ Authenticated call from ${userId} to ${targetId}`)
      io.to(String(targetId)).emit('incomingCall', {
        callerId: userId,
        from: userId,
        signalData,
        name
      })
    })

    socket.on('answerCall', ({ receiverId, to, signal }) => {
      const targetId = receiverId || to
      if (!targetId) return
      console.log(`✅ Call accepted by ${userId} for ${targetId}`)
      io.to(String(targetId)).emit('callAccepted', { signal, answeredBy: userId })
    })

    // WebRTC Offer
    socket.on('webrtc-offer', ({ receiverId, target, offer, sdp }) => {
      const targetId = receiverId || target
      if (!targetId) return
      io.to(String(targetId)).emit('webrtc-offer', { offer: offer || sdp, from: userId })
    })

    // WebRTC Answer
    socket.on('webrtc-answer', ({ receiverId, target, answer, sdp }) => {
      const targetId = receiverId || target
      if (!targetId) return
      io.to(String(targetId)).emit('webrtc-answer', { answer: answer || sdp, from: userId })
    })

    // ICE candidates exchange
    socket.on('webrtc-ice-candidate', ({ receiverId, target, candidate }) => {
      const targetId = receiverId || target
      if (!targetId) return
      io.to(String(targetId)).emit('webrtc-ice-candidate', { candidate, from: userId })
    })

    socket.on('disconnect', () => {
      console.log(`User ${userId} disconnected (socket ${socket.id})`)
    })
  })

  return io
}

export const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized!')
  return io
}
