import { createServer } from 'http'
import express from 'express'
import { prisma } from '../src/config/prisma'
import { initSocket, getIO } from '../src/socket/initSocket'
import { pushNotificationService } from '../src/services/notification.service'
import { deleteNotification } from '../src/repositories/notification.repository'
import { ENotificationType } from '@prisma/client'

/**
 * TMDEMY — PHASE 10: REALTIME SOCKET.IO NOTIFICATION TEST
 */

async function testRealtimeNotification() {
  console.log('\n=============================================================')
  console.log('⚡ TMDEMY — PHASE 10: REALTIME SOCKET NOTIFICATION VERIFICATION')
  console.log('=============================================================\n')

  const users = await prisma.user.findMany({ take: 2 })
  if (users.length < 2) {
    throw new Error('Need at least 2 users')
  }
  const student = users[0]
  const instructor = users[1]

  const app = express()
  const server = createServer(app)

  // Initialize Socket.IO
  initSocket(server)
  const io = getIO()

  console.log('Socket.IO successfully initialized.')

  // Capture emitted events
  const capturedEmits: { room: string; event: string; payload: any }[] = []

  const originalTo = io.to.bind(io)
  io.to = ((room: string | string[]) => {
    const roomStr = Array.isArray(room) ? room.join(',') : room
    return {
      emit: (event: string, payload: any) => {
        capturedEmits.push({ room: roomStr, event, payload })
        return true
      }
    } as any
  }) as any

  let createdNotifId: string | null = null

  try {
    // 1. Order Notification to Instructor
    console.log('1. Pushing ORDER notification to instructor...')
    const fakeOrderId = '44444444-5555-6666-7777-888888888888'
    const res1 = await pushNotificationService({
      senderId: student.id,
      receiverId: instructor.id,
      type: ENotificationType.ORDER,
      message: 'Bạn có đơn hàng mới cho khóa học "Test Course".',
      relatedId: fakeOrderId
    })

    if (res1.data) {
      createdNotifId = res1.data.id
    }

    console.log(`Pushed notification ID: ${createdNotifId}`)
    console.log(`Captured emissions count: ${capturedEmits.length}`)

    const emit1 = capturedEmits.find((e) => e.event === 'new_notification')
    if (!emit1) {
      throw new Error('Failed: "new_notification" was not emitted!')
    }

    console.log('Captured emission details:')
    console.log(`  Room: ${emit1.room}`)
    console.log(`  Event: ${emit1.event}`)
    console.log(`  Payload ID: ${emit1.payload.id}`)
    console.log(`  Payload _id: ${emit1.payload._id}`)
    console.log(`  Payload type: ${emit1.payload.type}`)
    console.log(`  Payload relatedId: ${emit1.payload.relatedId}`)
    console.log(`  Payload isRead: ${emit1.payload.isRead}`)
    console.log(`  Payload read: ${emit1.payload.read}`)

    if (
      emit1.room === instructor.id &&
      emit1.payload.id === createdNotifId &&
      emit1.payload._id === createdNotifId &&
      emit1.payload.type === 'ORDER' &&
      emit1.payload.relatedId === fakeOrderId &&
      emit1.payload.receiverId === instructor.id &&
      emit1.payload.sender?.id === student.id
    ) {
      console.log('\n✅ [PASS] Realtime Socket.IO emission to room matches receiver and payload structure perfectly!')
    } else {
      throw new Error('Emission payload verification failed!')
    }

  } finally {
    if (createdNotifId) {
      await deleteNotification(createdNotifId)
      console.log('Cleaned up test notification record from PostgreSQL.')
    }
  }

  console.log('\n=============================================================')
  console.log('🏁 REALTIME SOCKET.IO NOTIFICATION TEST PASSED (1/1)')
  console.log('=============================================================\n')
}

testRealtimeNotification().catch((err) => {
  console.error('Realtime Test Failed:', err)
  process.exit(1)
})
