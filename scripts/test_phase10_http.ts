import { createServer } from 'http'
import express from 'express'
import { prisma } from '../src/config/prisma'
import { generateAccessToken } from '../src/middlewares/generateToken'
import notificationRouter from '../src/routes/notification.route'
import { createNotification, deleteNotification } from '../src/repositories/notification.repository'
import { ENotificationType } from '@prisma/client'

/**
 * TMDEMY — PHASE 10: LIVE HTTP ENDPOINT INTEGRATION TESTS
 */

async function runHttpTests() {
  console.log('\n=============================================================')
  console.log('🌐 TMDEMY — PHASE 10: HTTP API ENDPOINT INTEGRATION TESTS')
  console.log('=============================================================\n')

  const users = await prisma.user.findMany({ take: 2 })
  if (users.length < 2) {
    throw new Error('Need at least 2 users')
  }
  const userA = users[0]
  const userB = users[1]

  const tokenA = generateAccessToken({ userId: userA.id, role: 'user' })
  const tokenB = generateAccessToken({ userId: userB.id, role: 'user' })

  const app = express()
  app.use(express.json())
  app.use('/api/notifications', notificationRouter)

  const server = createServer(app)
  const port = 3097

  await new Promise<void>((resolve) => server.listen(port, resolve))
  const baseUrl = `http://localhost:${port}/api/notifications`

  let passCount = 0
  let failCount = 0

  function assert(condition: boolean, msg: string) {
    if (condition) {
      passCount++
      console.log(`  ✅ [PASS] ${msg}`)
    } else {
      failCount++
      console.error(`  ❌ [FAIL] ${msg}`)
    }
  }

  // Create a test notification for User A
  const testNotif = await createNotification({
    senderId: userB.id,
    receiverId: userA.id,
    type: ENotificationType.COMMENT,
    message: 'Test comment notification for HTTP API',
    relatedId: 'fake-comment-123'
  })

  try {
    // 1. GET /api/notifications without token -> 401
    const resNoAuth = await fetch(baseUrl)
    assert(resNoAuth.status === 401, '1. GET without token returns 401 Unauthorized')

    // 2. GET /api/notifications with User A token -> 200
    const resAuth = await fetch(baseUrl, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resAuth.status === 200, '2. GET with valid token returns 200 OK')
    const bodyAuth = await resAuth.json()
    assert(bodyAuth.success === true, '2. Response has success: true')
    assert(Array.isArray(bodyAuth.data?.notifications), '2. Response data contains notifications array')
    assert(bodyAuth.data?.pagination?.page === 1, '2. Pagination page is 1')

    const foundNotif = bodyAuth.data?.notifications?.find((n: any) => n.id === testNotif.id)
    assert(foundNotif !== undefined, '2. Created notification found in user notification list')
    assert(foundNotif?.id === foundNotif?._id, '2. Compatibility field _id matches id')
    assert(foundNotif?.read === false && foundNotif?.isRead === false, '2. Compatibility fields read and isRead are false')
    assert(foundNotif?.sender?.username === userB.username, '2. Sender details populated')

    // 3. GET /api/notifications?type=COMMENT -> 200
    const resTypeFilter = await fetch(`${baseUrl}?type=COMMENT`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resTypeFilter.status === 200, '3. GET with type filter returns 200 OK')
    const bodyTypeFilter = await resTypeFilter.json()
    assert(
      bodyTypeFilter.data?.notifications?.every((n: any) => n.type === 'COMMENT'),
      '3. Filtered notifications all have type COMMENT'
    )

    // 4. GET /api/notifications?type=invalid_type -> 400
    const resInvalidType = await fetch(`${baseUrl}?type=non_existent_type`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resInvalidType.status === 400, '4. GET with invalid enum type returns 400 Bad Request')

    // 5. PATCH /api/notifications/read/:id with invalid UUID -> 400
    const resInvalidUUID = await fetch(`${baseUrl}/read/invalid-uuid-format`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resInvalidUUID.status === 400, '5. PATCH with invalid UUID format returns 400 Bad Request')

    // 6. PATCH /api/notifications/read/:id with MongoDB ObjectId -> 400
    const resObjectId = await fetch(`${baseUrl}/read/660e5b3f1c8b4d001e3d7a8b`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resObjectId.status === 400, '6. PATCH with legacy MongoDB ObjectId returns 400 Bad Request')

    // 7. PATCH /api/notifications/read/:id as User B (not receiver) -> 403 Forbidden
    const resForbidden = await fetch(`${baseUrl}/read/${testNotif.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenB}` }
    })
    assert(resForbidden.status === 403, '7. PATCH on another user notification returns 403 Forbidden')

    // 8. PATCH /api/notifications/read/:id with non-existent UUID -> 404 Not Found
    const resNotFound = await fetch(`${baseUrl}/read/a0000000-0000-4000-a000-000000000000`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resNotFound.status === 404, '8. PATCH on non-existent UUID returns 404 Not Found')

    // 9. PATCH /api/notifications/read/:id as User A (receiver) -> 200 OK
    const resMarkRead = await fetch(`${baseUrl}/read/${testNotif.id}`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    assert(resMarkRead.status === 200, '9. PATCH on owned notification returns 200 OK')
    const bodyMarkRead = await resMarkRead.json()
    assert(bodyMarkRead.data?.isRead === true, '9. Notification isRead is true')
    assert(bodyMarkRead.data?.read === true, '9. Notification read is true')

  } finally {
    await deleteNotification(testNotif.id)
    await new Promise<void>((resolve) => server.close(() => resolve()))
  }

  console.log('\n=============================================================')
  console.log(`🏁 HTTP API INTEGRATION TESTS COMPLETED`)
  console.log(`   Passed: ${passCount} tests`)
  console.log(`   Failed: ${failCount} tests`)
  console.log('=============================================================\n')

  if (failCount > 0) {
    process.exit(1)
  }
}

runHttpTests().catch((err) => {
  console.error('HTTP Test Failed:', err)
  process.exit(1)
})
