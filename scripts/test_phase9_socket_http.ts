import { createServer } from 'http'
import { prisma } from '../src/config/prisma'
import { generateAccessToken } from '../src/middlewares/generateToken'
import { initSocket, getIO } from '../src/socket/initSocket'
import dotenv from 'dotenv'

dotenv.config()

const BASE_URL = process.env.URL_SERVER || 'http://localhost:3002'

async function runHttpAndSocketTests() {
  console.log('====================================================')
  console.log('PHASE 9: LIVE HTTP & SOCKET.IO INTEGRATION TESTS')
  console.log(`Server URL: ${BASE_URL}`)
  console.log('====================================================')

  let passCount = 0
  let failCount = 0

  function assert(condition: boolean, message: string) {
    if (condition) {
      console.log(`  [PASS] ${message}`)
      passCount++
    } else {
      console.error(`  [FAIL] ${message}`)
      failCount++
    }
  }

  // 1. Initial Baseline Count Check
  console.log('\n--- 1. DATABASE BASELINE CHECK ---')
  const initialConvCount = await prisma.conversation.count()
  const initialPartCount = await prisma.conversationParticipant.count()
  const initialMsgCount = await prisma.message.count()

  console.log(`Initial conversations: ${initialConvCount}`)
  console.log(`Initial participants: ${initialPartCount}`)
  console.log(`Initial messages: ${initialMsgCount}`)

  assert(initialConvCount === 2, 'Initial conversations equals 2')
  assert(initialPartCount === 6, 'Initial participants equals 6')
  assert(initialMsgCount === 12, 'Initial messages equals 12')

  // Find user fixtures
  const users = await prisma.user.findMany({ take: 3 })
  const userA = users[0]
  const userB = users[1]
  const userC = users[2]

  const tokenA = generateAccessToken({ userId: userA.id, role: 'user' })
  const tokenB = generateAccessToken({ userId: userB.id, role: 'user' })
  const tokenC = generateAccessToken({ userId: userC.id, role: 'user' })

  console.log(`User A: ${userA.username} (${userA.id})`)
  console.log(`User B: ${userB.username} (${userB.id})`)
  console.log(`User C: ${userC.username} (${userC.id})`)

  let createdConvId: string | null = null

  // 2. HTTP POST /api/conversations Tests
  console.log('\n--- 2. HTTP POST /api/conversations TESTS ---')

  // Test self-chat
  const resSelf = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      receiverId: userA.id,
      isGroup: false
    })
  })
  const bodySelf = await resSelf.json()
  assert(resSelf.status === 400, 'Self-chat rejected with status 400')
  assert(bodySelf.message === 'Cannot create conversation with yourself', 'Self-chat error message matches')

  // Test missing receiverId
  const resMissing = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      isGroup: false
    })
  })
  const bodyMissing = await resMissing.json()
  assert(resMissing.status === 400, 'Missing receiverId rejected with status 400')

  // Test valid 1-on-1 conversation creation
  const resCreate = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenA}`
    },
    body: JSON.stringify({
      receiverId: userB.id,
      isGroup: false
    })
  })
  const bodyCreate = await resCreate.json()
  assert(resCreate.status === 200, 'Valid conversation creation returns status 200')
  assert(bodyCreate.data?.id !== undefined, 'Conversation ID returned')
  assert(bodyCreate.data?._id === bodyCreate.data?.id, 'Response includes compatible _id alias')
  createdConvId = bodyCreate.data?.id

  // Test duplicate conversation reuse
  const resReuse = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${tokenB}`
    },
    body: JSON.stringify({
      receiverId: userA.id,
      isGroup: false
    })
  })
  const bodyReuse = await resReuse.json()
  assert(resReuse.status === 200, 'Duplicate conversation request returns status 200')
  assert(bodyReuse.data?.id === createdConvId, 'Reuses existing conversation ID')

  // 3. HTTP GET /api/conversations Tests
  console.log('\n--- 3. HTTP GET /api/conversations TESTS ---')
  const resGetConvs = await fetch(`${BASE_URL}/api/conversations`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${tokenA}`
    }
  })
  const bodyGetConvs = await resGetConvs.json()
  assert(resGetConvs.status === 200, 'GET /api/conversations returns 200')
  assert(Array.isArray(bodyGetConvs.data), 'Conversations list is an array')
  const foundInList = bodyGetConvs.data.find((c: any) => c.id === createdConvId)
  assert(foundInList !== undefined, 'User A conversation list includes the created conversation')
  assert(foundInList?.displayName === userB.username, '1-on-1 chat displayName is peer username')

  // 4. HTTP GET /api/messages/:conversationId Authorization Tests
  console.log('\n--- 4. HTTP GET /api/messages/:conversationId AUTHORIZATION TESTS ---')

  // Invalid UUID param
  const resInvalidUUID = await fetch(`${BASE_URL}/api/messages/not-a-valid-uuid`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  })
  assert(resInvalidUUID.status === 400, 'Invalid UUID parameter returns 400 Bad Request')

  // Non-participant tries to access messages
  const resNonPart = await fetch(`${BASE_URL}/api/messages/${createdConvId}`, {
    headers: { Authorization: `Bearer ${tokenC}` }
  })
  const bodyNonPart = await resNonPart.json()
  assert(resNonPart.status === 403, 'Non-participant reading message history returns 403 Forbidden')
  assert(
    bodyNonPart.message === 'You are not authorized to view messages in this conversation',
    'Correct 403 authorization message returned'
  )

  // Participant accesses messages
  const resPart = await fetch(`${BASE_URL}/api/messages/${createdConvId}`, {
    headers: { Authorization: `Bearer ${tokenA}` }
  })
  const bodyPart = await resPart.json()
  assert(resPart.status === 200, 'Participant reading message history returns 200 OK')
  assert(Array.isArray(bodyPart.data), 'Messages history is returned as an array')

  // 5. Socket.IO Authentication Middleware Tests (Direct & Protocol)
  console.log('\n--- 5. SOCKET.IO AUTHENTICATION TESTS ---')
  const dummyServer = createServer()
  const io = initSocket(dummyServer)

  // Helper to extract registered middleware
  const getAuthMiddleware = (serverIO: any) => {
    return serverIO._fns?.[0] || serverIO.sockets?._fns?.[0] || serverIO.of('/')?._fns?.[0] || serverIO.sockets?.fns?.[0] || serverIO.of('/')?.fns?.[0]
  }
  const middleware = getAuthMiddleware(io)

  // Test 5.1: Missing token rejection
  let missingTokenError: string | null = null
  const mockSocketMissing: any = {
    handshake: { auth: {}, headers: {}, query: {} },
    data: {}
  }
  await new Promise<void>((resolve) => {
    middleware(mockSocketMissing, (err: any) => {
      missingTokenError = err?.message
      resolve()
    })
  })
  assert(
    missingTokenError === 'Authentication error: Access token required',
    'Socket connection without token is rejected with "Access token required"'
  )

  // Test 5.2: Fake query.userId without token rejection (NO FALLBACK)
  let fakeQueryError: string | null = null
  const mockSocketFakeQuery: any = {
    handshake: { auth: {}, headers: {}, query: { userId: userA.id } },
    data: {}
  }
  await new Promise<void>((resolve) => {
    middleware(mockSocketFakeQuery, (err: any) => {
      fakeQueryError = err?.message
      resolve()
    })
  })
  assert(
    fakeQueryError === 'Authentication error: Access token required',
    'Fake query.userId without token is STRICTLY REJECTED (no fallback allowed)'
  )

  // Test 5.3: Corrupted token rejection
  let corruptedTokenError: string | null = null
  const mockSocketCorrupted: any = {
    handshake: { auth: { token: 'invalid.corrupted.token' }, headers: {}, query: {} },
    data: {}
  }
  await new Promise<void>((resolve) => {
    middleware(mockSocketCorrupted, (err: any) => {
      corruptedTokenError = err?.message
      resolve()
    })
  })
  assert(
    corruptedTokenError !== null && corruptedTokenError.includes('Authentication error:'),
    'Corrupted JWT token is rejected by Socket.IO middleware'
  )

  // Test 5.4: Valid JWT token authentication
  let validTokenSuccess = false
  const mockSocketValid: any = {
    handshake: { auth: { token: tokenA }, headers: {}, query: {} },
    data: {}
  }
  await new Promise<void>((resolve) => {
    middleware(mockSocketValid, (err: any) => {
      if (!err) validTokenSuccess = true
      resolve()
    })
  })
  assert(validTokenSuccess === true, 'Valid JWT token successfully authenticates socket connection')
  assert(mockSocketValid.data.user?.userId === userA.id, 'Socket context attaches authenticated userId from JWT')

  // 6. Socket.IO Authorization Handlers Tests
  console.log('\n--- 6. SOCKET.IO AUTHORIZATION HANDLERS TESTS ---')

  // Create mock sockets with listeners
  function createMockSocket(userId: string) {
    const events: Record<string, Function[]> = {}
    const emitted: { event: string; data: any }[] = []
    const rooms = new Set<string>()

    const sock: any = {
      id: `mock-sock-${userId}`,
      data: { user: { userId } },
      join: (room: string) => rooms.add(room),
      emit: (event: string, data: any) => emitted.push({ event, data }),
      on: (event: string, handler: Function) => {
        events[event] = events[event] || []
        events[event].push(handler)
      },
      trigger: async (event: string, data: any) => {
        const handlers = events[event] || []
        for (const h of handlers) {
          await h(data)
        }
      },
      hasJoined: (room: string) => rooms.has(room),
      getLastEmit: (event: string) => {
        const found = emitted.filter((e) => e.event === event)
        return found.length > 0 ? found[found.length - 1].data : undefined
      }
    }

    // Attach server connection handlers from initSocket
    const connectionHandlers =
      (io.sockets as any)?.listeners?.('connection') ||
      (io.of('/') as any)?.listeners?.('connection') ||
      (io as any)?.listeners?.('connection') ||
      []
    for (const handler of connectionHandlers) {
      handler(sock)
    }

    return sock
  }

  const socketUserA = createMockSocket(userA.id)
  const socketUserC = createMockSocket(userC.id)

  assert(socketUserA.hasJoined(userA.id), 'Socket automatically joins personal room for authenticated user')

  // 6.1. Test join event
  await socketUserC.trigger('join', createdConvId)
  assert(
    socketUserC.getLastEmit('errorMessage') === 'Access denied to conversation',
    'User C (non-participant) join event receives errorMessage: "Access denied to conversation"'
  )
  assert(!socketUserC.hasJoined(createdConvId!), 'User C is NOT joined to conversation room')

  await socketUserA.trigger('join', createdConvId)
  assert(socketUserA.hasJoined(createdConvId!), 'User A (participant) successfully joins conversation room')

  // 6.2. Test sendMessage event (with fake client senderId)
  await socketUserC.trigger('sendMessage', {
    conversationId: createdConvId,
    content: 'Malicious attempt'
  })
  assert(
    socketUserC.getLastEmit('errorMessage') === 'You are not a participant in this conversation',
    'User C sendMessage receives 403 errorMessage'
  )

  // User A sends message with client trying to forge senderId = userC.id
  await socketUserA.trigger('sendMessage', {
    conversationId: createdConvId,
    senderId: userC.id, // Evil client tries to impersonate user C!
    content: 'Legitimate message from User A',
    type: 'text'
  })

  // Verify message created in PostgreSQL has senderId = userA.id (IGNORED fake senderId!)
  const sentMsg = await prisma.message.findFirst({
    where: { conversationId: createdConvId! },
    orderBy: { createdAt: 'desc' }
  })
  assert(sentMsg !== null, 'Message saved in PostgreSQL')
  assert(sentMsg?.senderId === userA.id, 'Server FORCED authenticated senderId, ignoring client-forged senderId')
  assert(sentMsg?.content === 'Legitimate message from User A', 'Content saved correctly')

  // 6.3. Test editMessage event
  await socketUserC.trigger('editMessage', {
    messageId: sentMsg?.id,
    content: 'User C tries to edit User A message'
  })
  assert(
    socketUserC.getLastEmit('errorMessage') === 'You can only edit your own message',
    'Non-owner editMessage receives errorMessage: "You can only edit your own message"'
  )

  await socketUserA.trigger('editMessage', {
    messageId: sentMsg?.id,
    content: 'User A edited own message'
  })
  const editedMsg = await prisma.message.findUnique({ where: { id: sentMsg?.id } })
  assert(editedMsg?.content === 'User A edited own message', 'Owner editMessage successfully updates content')
  assert(editedMsg?.isEdited === true, 'Owner editMessage sets isEdited = true')

  // 6.4. Test deleteMessage event
  await socketUserC.trigger('deleteMessage', {
    messageId: sentMsg?.id
  })
  assert(
    socketUserC.getLastEmit('errorMessage') === 'You can only delete your own message',
    'Non-owner deleteMessage receives errorMessage: "You can only delete your own message"'
  )

  await socketUserA.trigger('deleteMessage', {
    messageId: sentMsg?.id
  })
  const deletedMsg = await prisma.message.findUnique({ where: { id: sentMsg?.id } })
  assert(deletedMsg === null, 'Owner deleteMessage successfully deletes message from PostgreSQL')

  // 7. Cleanup & Baseline Restoration
  console.log('\n--- 7. CLEANUP & BASELINE RESTORATION ---')
  if (createdConvId) {
    await prisma.conversation.delete({ where: { id: createdConvId } })
  }

  const finalConvCount = await prisma.conversation.count()
  const finalPartCount = await prisma.conversationParticipant.count()
  const finalMsgCount = await prisma.message.count()

  console.log(`Final conversations: ${finalConvCount} (baseline: ${initialConvCount})`)
  console.log(`Final participants: ${finalPartCount} (baseline: ${initialPartCount})`)
  console.log(`Final messages: ${finalMsgCount} (baseline: ${initialMsgCount})`)

  assert(finalConvCount === initialConvCount, 'Final conversations match initial baseline')
  assert(finalPartCount === initialPartCount, 'Final participants match initial baseline')
  assert(finalMsgCount === initialMsgCount, 'Final messages match initial baseline')

  console.log('\n====================================================')
  console.log(`INTEGRATION TESTS: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('====================================================')

  await prisma.$disconnect()
  return failCount === 0
}

runHttpAndSocketTests()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Integration tests encountered error:', err)
    process.exit(1)
  })
