import { prisma } from '../src/config/prisma'
import { EMessageType, UserRole } from '@prisma/client'
import {
  createConversationWithParticipants,
  findConversationById,
  findCourseGroupConversation,
  findPrivateConversationBetweenUsers,
  findUserConversations,
  updateConversationLastMessage
} from '../src/repositories/conversation.repository'
import {
  addParticipant,
  addParticipants,
  getConversationParticipants,
  isUserInConversation,
  removeParticipant
} from '../src/repositories/conversationParticipant.repository'
import {
  createMessage,
  deleteMessageWithLastMessageSync,
  findLatestMessageInConversation,
  findMessageById,
  findMessagesByConversationId,
  updateMessageContent
} from '../src/repositories/message.repository'
import {
  createConversationService,
  getUserConversationsService
} from '../src/services/conversation.service'
import {
  createMessageService,
  deleteMessageService,
  getMessagesByConversationService,
  updateMessageService
} from '../src/services/message.service'
import { fromPrismaMessageType, toPrismaMessageType } from '../src/models/chat.model'

async function runTestSuite() {
  console.log('====================================================')
  console.log('PHASE 9: CHAT MIGRATION COMPREHENSIVE TEST SUITE')
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
  const initialReadCount = await prisma.messageRead.count()

  console.log(`Initial conversations: ${initialConvCount}`)
  console.log(`Initial conversation_participants: ${initialPartCount}`)
  console.log(`Initial messages: ${initialMsgCount}`)
  console.log(`Initial message_reads: ${initialReadCount}`)

  assert(initialConvCount === 2, 'Initial conversations count equals 2 historical records')
  assert(initialPartCount === 6, 'Initial participants count equals 6 historical records')
  assert(initialMsgCount === 12, 'Initial messages count equals 12 historical records')
  assert(initialReadCount === 0, 'Initial message_reads count equals 0 historical records')

  // Find test user fixtures
  const users = await prisma.user.findMany({ take: 5 })
  if (users.length < 3) {
    throw new Error('Need at least 3 users for testing')
  }
  const userA = users[0]
  const userB = users[1]
  const userC = users[2]
  console.log(`Test fixtures: userA=${userA.username} (${userA.id}), userB=${userB.username} (${userB.id}), userC=${userC.username} (${userC.id})`)

  // Course fixture
  const course = await prisma.course.findFirst({ select: { id: true, title: true, authorId: true } })
  assert(course !== null, 'Found course fixture for group chat')

  // 2. Enum Mapping & Model Unit Tests
  console.log('\n--- 2. ENUM MAPPING & APPLICATION MODEL TESTS ---')
  assert(toPrismaMessageType('text') === EMessageType.TEXT, 'toPrismaMessageType("text") -> TEXT')
  assert(toPrismaMessageType('IMAGE') === EMessageType.IMAGE, 'toPrismaMessageType("IMAGE") -> IMAGE')
  assert(toPrismaMessageType('file') === EMessageType.FILE, 'toPrismaMessageType("file") -> FILE')
  assert(toPrismaMessageType(undefined) === EMessageType.TEXT, 'toPrismaMessageType(undefined) -> TEXT (default)')
  assert(fromPrismaMessageType(EMessageType.TEXT) === 'text', 'fromPrismaMessageType(TEXT) -> "text"')
  assert(fromPrismaMessageType(EMessageType.IMAGE) === 'image', 'fromPrismaMessageType(IMAGE) -> "image"')
  assert(fromPrismaMessageType(EMessageType.FILE) === 'file', 'fromPrismaMessageType(FILE) -> "file"')

  // 3. Conversation & Participant Repositories
  console.log('\n--- 3. CONVERSATION & PARTICIPANT REPOSITORIES ---')
  const testConv = await createConversationWithParticipants(
    { isGroup: false, name: 'Test Temp Conv' },
    [userA.id, userB.id]
  )
  assert(testConv.id !== undefined, 'createConversationWithParticipants creates conversation')
  assert(testConv.participants.length === 2, 'Conversation has 2 participants')

  const foundConv = await findConversationById(testConv.id)
  assert(foundConv?.id === testConv.id, 'findConversationById returns correct conversation')

  const isMemberA = await isUserInConversation(testConv.id, userA.id)
  const isMemberB = await isUserInConversation(testConv.id, userB.id)
  const isMemberC = await isUserInConversation(testConv.id, userC.id)
  assert(isMemberA === true, 'userA is confirmed participant')
  assert(isMemberB === true, 'userB is confirmed participant')
  assert(isMemberC === false, 'userC is NOT participant')

  // Add participant C
  await addParticipant(testConv.id, userC.id)
  const isMemberCNow = await isUserInConversation(testConv.id, userC.id)
  assert(isMemberCNow === true, 'addParticipant successfully adds userC')

  // Remove participant C
  await removeParticipant(testConv.id, userC.id)
  const isMemberCAfter = await isUserInConversation(testConv.id, userC.id)
  assert(isMemberCAfter === false, 'removeParticipant successfully removes userC')

  // 4. Message Repository & lastMessageId Lifecycle
  console.log('\n--- 4. MESSAGE REPOSITORY & lastMessageId LIFECYCLE ---')
  const msg1 = await createMessage({
    conversationId: testConv.id,
    senderId: userA.id,
    content: 'Hello World 1',
    type: EMessageType.TEXT
  })
  assert(msg1.id !== undefined, 'createMessage creates first message')
  assert(msg1.content === 'Hello World 1', 'Message content matches')

  let updatedConv = await findConversationById(testConv.id)
  assert(updatedConv?.lastMessageId === msg1.id, 'Conversation lastMessageId automatically updated to msg1.id')

  const msg2 = await createMessage({
    conversationId: testConv.id,
    senderId: userB.id,
    content: 'Hello World 2',
    type: EMessageType.TEXT
  })
  updatedConv = await findConversationById(testConv.id)
  assert(updatedConv?.lastMessageId === msg2.id, 'Conversation lastMessageId automatically updated to msg2.id')

  // Edit message
  const editedMsg = await updateMessageContent(msg1.id, 'Hello World 1 (Edited)')
  assert(editedMsg.isEdited === true, 'updateMessageContent marks isEdited = true')
  assert(editedMsg.content === 'Hello World 1 (Edited)', 'updateMessageContent updates content')
  updatedConv = await findConversationById(testConv.id)
  assert(updatedConv?.lastMessageId === msg2.id, 'Editing msg1 did NOT alter lastMessageId')

  // Retrieve messages ASC
  const allMsgs = await findMessagesByConversationId(testConv.id)
  assert(allMsgs.length === 2, 'findMessagesByConversationId returns 2 messages')
  assert(allMsgs[0].id === msg1.id && allMsgs[1].id === msg2.id, 'Messages ordered chronologically (createdAt ASC)')

  // Delete latest message (msg2) -> should re-sync lastMessageId to msg1
  await deleteMessageWithLastMessageSync(msg2.id, testConv.id)
  updatedConv = await findConversationById(testConv.id)
  assert(updatedConv?.lastMessageId === msg1.id, 'Deleting latest message re-syncs lastMessageId to remaining message (msg1.id)')

  // Delete remaining message (msg1) -> should set lastMessageId to null
  await deleteMessageWithLastMessageSync(msg1.id, testConv.id)
  updatedConv = await findConversationById(testConv.id)
  assert(updatedConv?.lastMessageId === null, 'Deleting all messages updates lastMessageId to null')

  // Clean up testConv
  await prisma.conversation.delete({ where: { id: testConv.id } })

  // 5. Conversation Service Tests
  console.log('\n--- 5. CONVERSATION SERVICE TESTS ---')
  // Self-chat prevention
  const selfChat = await createConversationService({
    senderId: userA.id,
    receiverId: userA.id,
    isGroup: false
  })
  assert(selfChat.success === false && selfChat.statusCode === 400, 'createConversationService rejects self-chat with 400')

  // Missing receiverId
  const missingReceiver = await createConversationService({
    senderId: userA.id,
    isGroup: false
  })
  assert(missingReceiver.success === false && missingReceiver.statusCode === 400, 'createConversationService rejects missing receiverId with 400')

  // Create valid private chat
  const newPriv = await createConversationService({
    senderId: userA.id,
    receiverId: userB.id,
    isGroup: false
  })
  assert(newPriv.success === true, 'createConversationService creates private chat')
  assert(newPriv.data?.displayName === userB.username, '1-on-1 chat automatically computes displayName from peer')
  assert(newPriv.data?._id === newPriv.data?.id, 'Conversation response includes compatible _id')

  // Duplicate private chat reuse
  const dupPriv = await createConversationService({
    senderId: userB.id,
    receiverId: userA.id,
    isGroup: false
  })
  assert(dupPriv.success === true, 'Re-creating existing private chat succeeds')
  assert(dupPriv.data?.id === newPriv.data?.id, 'Re-creating existing private chat reuses existing conversation ID')

  // Get user conversations
  const userAConvs = await getUserConversationsService({ userId: userA.id })
  assert(userAConvs.success === true, 'getUserConversationsService succeeds')
  assert(Array.isArray(userAConvs.data), 'Conversations data is an array')
  const hasNewPriv = userAConvs.data.some((c: any) => c.id === newPriv.data.id)
  assert(hasNewPriv === true, 'User A conversation list includes the new conversation')

  // 6. Message Service Authorization & Business Logic Tests
  console.log('\n--- 6. MESSAGE SERVICE AUTHORIZATION & BUSINESS LOGIC ---')
  const testConvId = newPriv.data.id

  // Non-participant tries to send message
  const nonPartSend = await createMessageService({
    conversationId: testConvId,
    senderId: userC.id,
    content: 'Malicious Message'
  })
  assert(nonPartSend.success === false && nonPartSend.statusCode === 403, 'Non-participant sending message is rejected with 403')

  // Participant sends message
  const validSend = await createMessageService({
    conversationId: testConvId,
    senderId: userA.id,
    content: 'Legitimate Message from User A',
    type: 'text'
  })
  assert(validSend.success === true && validSend.statusCode === 200, 'Participant sending message succeeds')
  assert(validSend.data?._id === validSend.data?.id, 'Message response has _id compatible with id')
  assert(validSend.data?.sender?._id === validSend.data?.sender?.id, 'Message sender has _id compatible with id')

  // Non-participant tries to read message history
  const nonPartRead = await getMessagesByConversationService(testConvId, userC.id)
  assert(nonPartRead.success === false && nonPartRead.statusCode === 403, 'Non-participant reading history is rejected with 403')
  assert(nonPartRead.message === 'You are not authorized to view messages in this conversation', 'Correct 403 authorization message')

  // Participant reads message history
  const partRead = await getMessagesByConversationService(testConvId, userA.id)
  assert(partRead.success === true && partRead.statusCode === 200, 'Participant reading history succeeds')
  assert(partRead.data.length >= 1, 'History contains sent message')

  // User B tries to edit User A's message
  const msgToEditId = validSend.data.id
  const unauthorizedEdit = await updateMessageService({
    messageId: msgToEditId,
    senderId: userB.id,
    content: 'Hacked Content'
  })
  assert(unauthorizedEdit.success === false && unauthorizedEdit.statusCode === 403, 'Non-owner editing message is rejected with 403')

  // User A edits own message
  const authorizedEdit = await updateMessageService({
    messageId: msgToEditId,
    senderId: userA.id,
    content: 'Updated Content by Author'
  })
  assert(authorizedEdit.success === true, 'Owner editing own message succeeds')
  assert(authorizedEdit.data?.content === 'Updated Content by Author', 'Message content updated')
  assert(authorizedEdit.data?.isEdited === true, 'Message marked as isEdited = true')

  // User B tries to delete User A's message
  const unauthorizedDelete = await deleteMessageService({
    messageId: msgToEditId,
    senderId: userB.id
  })
  assert(unauthorizedDelete.success === false && unauthorizedDelete.statusCode === 403, 'Non-owner deleting message is rejected with 403')

  // User A deletes own message
  const authorizedDelete = await deleteMessageService({
    messageId: msgToEditId,
    senderId: userA.id
  })
  assert(authorizedDelete.success === true, 'Owner deleting own message succeeds')

  // Clean up private chat fixture
  await prisma.conversation.delete({ where: { id: testConvId } })

  // 7. Group Chat Creation & Order Integration Tests
  console.log('\n--- 7. GROUP CHAT CREATION & ORDER INTEGRATION TESTS ---')
  if (course) {
    // Check if course conversation already exists or create new
    const existingGroup = await findCourseGroupConversation(course.id)
    if (!existingGroup) {
      const courseGroupRes = await createConversationService({
        senderId: userA.id,
        isGroup: true,
        courseId: course.id,
        name: `Q&A - ${course.title}`
      })
      assert(courseGroupRes.success === true, 'createConversationService creates course group chat')
      assert(courseGroupRes.data?.isGroup === true, 'Created conversation isGroup = true')
      assert(courseGroupRes.data?.courseId === course.id, 'Course ID correctly linked')

      // Clean up newly created course group to preserve baseline
      await prisma.conversation.delete({ where: { id: courseGroupRes.data.id } })
    } else {
      console.log(`Course group chat already exists for course ${course.id}: ${existingGroup.id}`)
      assert(existingGroup.isGroup === true, 'Existing group chat isGroup = true')
    }
  }

  // 8. Final Database Integrity Check
  console.log('\n--- 8. FINAL DATABASE INTEGRITY CHECK ---')
  const finalConvCount = await prisma.conversation.count()
  const finalPartCount = await prisma.conversationParticipant.count()
  const finalMsgCount = await prisma.message.count()
  const finalReadCount = await prisma.messageRead.count()

  console.log(`Final conversations: ${finalConvCount} (baseline: ${initialConvCount})`)
  console.log(`Final participants: ${finalPartCount} (baseline: ${initialPartCount})`)
  console.log(`Final messages: ${finalMsgCount} (baseline: ${initialMsgCount})`)
  console.log(`Final message_reads: ${finalReadCount} (baseline: ${initialReadCount})`)

  assert(finalConvCount === initialConvCount, 'Conversations count matches initial baseline exactly')
  assert(finalPartCount === initialPartCount, 'Participants count matches initial baseline exactly')
  assert(finalMsgCount === initialMsgCount, 'Messages count matches initial baseline exactly')
  assert(finalReadCount === initialReadCount, 'MessageReads count matches initial baseline exactly')

  console.log('\n====================================================')
  console.log(`TEST SUITE RESULTS: ${passCount} PASSED, ${failCount} FAILED`)
  console.log('====================================================')

  await prisma.$disconnect()
  return failCount === 0
}

runTestSuite()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((err) => {
    console.error('Test Suite encountered error:', err)
    process.exit(1)
  })
