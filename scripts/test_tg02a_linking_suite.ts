import { Bot } from 'grammy'
import { prisma } from '../src/config/prisma'
import {
  consumeLinkTokenAndBindService,
  generateTeacherLinkTokenService,
  getTeacherProfileByTelegramIdService,
  getTeacherTelegramStatusService,
  maskEmail,
  unlinkFromTelegramService,
  unlinkTeacherTelegramService
} from '../src/services/telegramTeacher.service'
import {
  findActiveLinkTokenByHash,
  findTelegramAccountByTelegramId,
  findTelegramAccountByUserId
} from '../src/repositories/telegramAccount.repository'
import { TeacherBotContext } from '../src/telegram/types'
import { requirePrivateChat } from '../src/telegram/middleware/privateChat.middleware'
import {
  handleAccountCommand,
  handleHelpCommand,
  handleLinkCommand,
  handleStartCommand,
  handleStatusCommand,
  handleUnlinkCancelCallback,
  handleUnlinkCommand,
  handleUnlinkConfirmCallback
} from '../src/telegram/handlers/commands.handler'
import express from 'express'
import http from 'http'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import teacherRouter from '../src/routes/teacher.route'

/**
 * TMDEMY — TG-02A TEACHER ACCOUNT LINKING AUTOMATED TEST SUITE
 *
 * Covers all 13 core scenarios mandated by the TG-02A specification:
 * 1. Valid teacher linking
 * 2. Invalid or expired token rejection
 * 3. Reused token rejection
 * 4. Non-teacher account rejection
 * 5. Duplicate Telegram account linking prevention
 * 6. Duplicate TMdemy account linking prevention
 * 7. Concurrent token consumption race-safety
 * 8. Unauthorized REST requests (401/403)
 * 9. Cross-teacher isolation
 * 10. /account command for linked and unlinked users
 * 11. /unlink confirmation and successful removal
 * 12. Telegram group chat restrictions
 * 13. Backend REST stability when Telegram is offline
 */

interface MockSentMessage {
  method: string
  chat_id: number | string
  text?: string
  parse_mode?: string
  reply_markup?: any
}

function createMockLinkingBot() {
  const sentMessages: MockSentMessage[] = []
  const mockToken = '123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_test'
  const bot = new Bot<TeacherBotContext>(mockToken, {
    botInfo: {
      id: 123456789,
      is_bot: true,
      first_name: 'TMdemyTeacherBot',
      username: 'tmdemy_teacher_bot',
      can_join_groups: true,
      can_read_all_group_messages: false,
      supports_inline_queries: false,
      can_connect_to_business: false,
      has_main_web_app: false
    }
  })

  bot.api.config.use(async (prev, method, payload: any) => {
    sentMessages.push({
      method,
      chat_id: payload?.chat_id,
      text: payload?.text,
      parse_mode: payload?.parse_mode,
      reply_markup: payload?.reply_markup
    })

    return {
      ok: true,
      result: {
        message_id: Math.floor(Math.random() * 10000) + 1,
        date: Math.floor(Date.now() / 1000),
        chat: { id: payload?.chat_id || 1001, type: 'private' },
        text: payload?.text || ''
      }
    } as any
  })

  bot.use(requirePrivateChat)
  bot.command('start', handleStartCommand)
  bot.command('link', handleLinkCommand)
  bot.command('account', handleAccountCommand)
  bot.command('unlink', handleUnlinkCommand)
  bot.command('help', handleHelpCommand)
  bot.command('status', handleStatusCommand)
  bot.callbackQuery('unlink_confirm', handleUnlinkConfirmCallback)
  bot.callbackQuery('unlink_cancel', handleUnlinkCancelCallback)

  return { bot, sentMessages }
}

async function runTestSuite() {
  console.log('====================================================')
  console.log('     TG-02A: TEACHER ACCOUNT LINKING TEST SUITE     ')
  console.log('====================================================\n')

  let passed = 0
  let failed = 0
  let blocked = 0
  let notTested = 0

  const assert = (condition: boolean, testNum: number, name: string, detail?: string) => {
    if (condition) {
      passed++
      console.log(`  ✓ [PASS] #${testNum}: ${name}`)
    } else {
      failed++
      console.error(`  ✗ [FAIL] #${testNum}: ${name}${detail ? ` (${detail})` : ''}`)
    }
  }

  // Find or create test users in PostgreSQL
  let teacherUser = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE' }
  })

  if (!teacherUser) {
    teacherUser = await prisma.user.create({
      data: {
        username: 'test_teacher_tg02a',
        email: 'test_teacher_tg02a@example.com',
        password: 'hashed_password',
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    })
  }

  let teacherUser2 = await prisma.user.findFirst({
    where: { role: 'TEACHER', status: 'ACTIVE', id: { not: teacherUser.id } }
  })

  if (!teacherUser2) {
    teacherUser2 = await prisma.user.create({
      data: {
        username: 'test_teacher2_tg02a',
        email: 'test_teacher2_tg02a@example.com',
        password: 'hashed_password',
        role: 'TEACHER',
        status: 'ACTIVE'
      }
    })
  }

  let studentUser = await prisma.user.findFirst({
    where: { role: 'USER', status: 'ACTIVE' }
  })

  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        username: 'test_student_tg02a',
        email: 'test_student_tg02a@example.com',
        password: 'hashed_password',
        role: 'USER',
        status: 'ACTIVE'
      }
    })
  }

  // Clean up any existing telegram bindings for these test users
  await prisma.telegramAccount.deleteMany({
    where: {
      userId: { in: [teacherUser.id, teacherUser2.id, studentUser.id] }
    }
  })
  await prisma.telegramLinkToken.deleteMany({
    where: {
      userId: { in: [teacherUser.id, teacherUser2.id, studentUser.id] }
    }
  })

  // ----------------------------------------------------
  // TEST 1: Valid Teacher Token Generation & Linking
  // ----------------------------------------------------
  console.log('--- TEST 1: Valid Teacher Linking Flow ---')
  const tokenRes = await generateTeacherLinkTokenService(teacherUser.id)
  assert(tokenRes.success && Boolean(tokenRes.data?.token), 1, 'Teacher successfully generated link token')
  assert(tokenRes.data?.expiresInMinutes === 15, 1, 'Token expiration is configured to 15 minutes')
  assert(tokenRes.data?.deepLink.includes('start=link_'), 1, 'Deep link includes start=link_<token> parameter')

  const rawToken = tokenRes.data!.token
  const mockTelegramId = 888123456
  const bindRes = await consumeLinkTokenAndBindService({
    rawToken,
    telegramUserId: mockTelegramId,
    telegramChatId: mockTelegramId,
    telegramUsername: 'prof_smith',
    telegramFirstName: 'Professor Smith'
  })

  assert(bindRes.success, 1, 'consumeLinkTokenAndBindService returns success')
  const accountInDb = await findTelegramAccountByUserId(teacherUser.id)
  assert(
    accountInDb !== null && accountInDb.telegramUserId.toString() === mockTelegramId.toString(),
    1,
    'TelegramAccount record persisted with matching Telegram numeric ID'
  )

  // Verify token is now consumed
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
  const tokenInDb = await prisma.telegramLinkToken.findUnique({ where: { tokenHash } })
  assert(tokenInDb?.isConsumed === true, 1, 'Link token is marked isConsumed = true')

  // ----------------------------------------------------
  // TEST 2: Invalid or Expired Token Rejection
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Invalid & Expired Token Rejection ---')
  const fakeToken = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  const fakeRes = await consumeLinkTokenAndBindService({
    rawToken: fakeToken,
    telegramUserId: 9990001,
    telegramChatId: 9990001
  })
  assert(!fakeRes.success, 2, 'Non-existent token is rejected with error message')

  // Create an already-expired token directly in DB
  const expiredRaw = crypto.randomBytes(32).toString('hex')
  const expiredHash = crypto.createHash('sha256').update(expiredRaw).digest('hex')
  await prisma.telegramLinkToken.create({
    data: {
      userId: teacherUser2.id,
      tokenHash: expiredHash,
      expiresAt: new Date(Date.now() - 1000) // 1 second in the past
    }
  })
  const expiredRes = await consumeLinkTokenAndBindService({
    rawToken: expiredRaw,
    telegramUserId: 9990002,
    telegramChatId: 9990002
  })
  assert(!expiredRes.success, 2, 'Expired token is rejected')

  // ----------------------------------------------------
  // TEST 3: Reused Token Rejection
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Reused Token Rejection ---')
  const reuseRes = await consumeLinkTokenAndBindService({
    rawToken, // already consumed in Test 1
    telegramUserId: 9990003,
    telegramChatId: 9990003
  })
  assert(!reuseRes.success, 3, 'Reused token is strictly rejected')

  // ----------------------------------------------------
  // TEST 4: Non-Teacher Account Rejection
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Non-Teacher Role Rejection ---')
  const studentTokenRes = await generateTeacherLinkTokenService(studentUser.id)
  assert(
    !studentTokenRes.success && studentTokenRes.statusCode === 403,
    4,
    'Student account is rejected from generating Telegram link tokens (403 Forbidden)'
  )

  // ----------------------------------------------------
  // TEST 5: Duplicate Telegram Account Linking
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Duplicate Telegram Account Linking Prevention ---')
  const teacher2TokenRes = await generateTeacherLinkTokenService(teacherUser2.id)
  assert(teacher2TokenRes.success, 5, 'Teacher 2 generates valid link token')

  // Attempt to link Teacher 2 to the same telegram ID as Teacher 1 (mockTelegramId)
  const dupTelegramRes = await consumeLinkTokenAndBindService({
    rawToken: teacher2TokenRes.data!.token,
    telegramUserId: mockTelegramId, // Already bound to Teacher 1!
    telegramChatId: mockTelegramId
  })
  assert(
    !dupTelegramRes.success && dupTelegramRes.message.includes('liên kết với một Giảng viên khác'),
    5,
    'Attempt to link an already-linked Telegram ID to a second teacher is rejected'
  )

  // ----------------------------------------------------
  // TEST 6: Duplicate TMdemy Account Linking
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Duplicate TMdemy Account Linking Prevention ---')
  // Teacher 1 is already linked to mockTelegramId. Attempt to generate token for Teacher 1:
  const teacher1ReToken = await generateTeacherLinkTokenService(teacherUser.id)
  assert(
    !teacher1ReToken.success && teacher1ReToken.statusCode === 409,
    6,
    'Teacher 1 cannot generate new link token while an active Telegram account is linked (409 Conflict)'
  )

  // ----------------------------------------------------
  // TEST 7: Concurrent Token Consumption Race-Safety
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Concurrent Token Consumption Race-Safety ---')
  // Clean up Teacher 2
  await prisma.telegramAccount.deleteMany({ where: { userId: teacherUser2.id } })
  const raceTokenRes = await generateTeacherLinkTokenService(teacherUser2.id)
  const raceToken = raceTokenRes.data!.token

  const p1 = consumeLinkTokenAndBindService({
    rawToken: raceToken,
    telegramUserId: 7771111,
    telegramChatId: 7771111
  })
  const p2 = consumeLinkTokenAndBindService({
    rawToken: raceToken,
    telegramUserId: 7772222,
    telegramChatId: 7772222
  })

  const [res1, res2] = await Promise.all([p1, p2])
  const successes = [res1.success, res2.success].filter(Boolean).length
  const failures = [res1.success, res2.success].filter((s) => !s).length
  assert(
    successes === 1 && failures === 1,
    7,
    'Atomic transaction guarantees exactly one consumer succeeds and one fails under race conditions'
  )

  // ----------------------------------------------------
  // TEST 8: Unauthorized REST Requests (401/403)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Unauthorized REST Request Protection ---')
  const app = express()
  app.use(express.json())
  app.use('/api/teacher', teacherRouter)

  const testServer = http.createServer(app)
  await new Promise<void>((resolve) => testServer.listen(0, resolve))
  const port = (testServer.address() as any).port

  // 1. Missing Authorization Header -> 401
  const noAuthRes = await fetch(`http://127.0.0.1:${port}/api/teacher/telegram/status`)
  assert(noAuthRes.status === 401, 8, 'Request without Authorization header returns 401')

  // 2. Student JWT -> 403 Forbidden
  const studentJwt = jwt.sign(
    { userId: studentUser.id, role: studentUser.role },
    process.env.JWT_SECRECT_ACCESS_TOKEN || 'thaiminh061206',
    { expiresIn: '1h' }
  )
  const studentHttpRes = await fetch(`http://127.0.0.1:${port}/api/teacher/telegram/status`, {
    headers: { Authorization: `Bearer ${studentJwt}` }
  })
  assert(studentHttpRes.status === 403, 8, 'Student JWT accessing teacher Telegram status returns 403 Forbidden')

  // 3. Valid Teacher JWT -> 200 OK
  const teacherJwt = jwt.sign(
    { userId: teacherUser.id, role: teacherUser.role },
    process.env.JWT_SECRECT_ACCESS_TOKEN || 'thaiminh061206',
    { expiresIn: '1h' }
  )
  const teacherHttpRes = await fetch(`http://127.0.0.1:${port}/api/teacher/telegram/status`, {
    headers: { Authorization: `Bearer ${teacherJwt}` }
  })
  const statusBody = await teacherHttpRes.json()
  assert(
    teacherHttpRes.status === 200 && statusBody.data?.isLinked === true,
    8,
    'Teacher JWT receives 200 OK with isLinked: true'
  )

  await new Promise<void>((resolve) => testServer.close(() => resolve()))

  // ----------------------------------------------------
  // TEST 9: Cross-Teacher Isolation
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Cross-Teacher Isolation ---')
  const teacher1Status = await getTeacherTelegramStatusService(teacherUser.id)
  const teacher2Status = await getTeacherTelegramStatusService(teacherUser2.id)
  assert(
    teacher1Status.data?.account?.telegramUserId !== teacher2Status.data?.account?.telegramUserId,
    9,
    'Teacher 1 and Teacher 2 retrieve strictly isolated Telegram account records'
  )

  // ----------------------------------------------------
  // TEST 10: /account Command for Linked and Unlinked Users
  // ----------------------------------------------------
  console.log('\n--- TEST 10: /account Command Handling ---')
  const mockBot = createMockLinkingBot()
  await mockBot.bot.init()

  // 1. Linked Teacher (mockTelegramId)
  await mockBot.bot.handleUpdate({
    update_id: 201,
    message: {
      message_id: 201,
      date: Math.floor(Date.now() / 1000),
      chat: { id: mockTelegramId, type: 'private' },
      from: { id: mockTelegramId, is_bot: false, first_name: 'Prof Smith' },
      text: '/account',
      entities: [{ type: 'bot_command', offset: 0, length: 8 }]
    } as any
  })

  const linkedAccMsg = mockBot.sentMessages[mockBot.sentMessages.length - 1]?.text || ''
  assert(
    linkedAccMsg.includes('THÔNG TIN TÀI KHOẢN GIẢNG VIÊN ĐÃ LIÊN KẾT') &&
      linkedAccMsg.includes(teacherUser.username) &&
      linkedAccMsg.includes(maskEmail(teacherUser.email)),
    10,
    '/account for linked teacher returns teacher username and masked email'
  )

  // 2. Unlinked User
  const unlinkedTelegramId = 555999888
  await mockBot.bot.handleUpdate({
    update_id: 202,
    message: {
      message_id: 202,
      date: Math.floor(Date.now() / 1000),
      chat: { id: unlinkedTelegramId, type: 'private' },
      from: { id: unlinkedTelegramId, is_bot: false, first_name: 'Guest' },
      text: '/account',
      entities: [{ type: 'bot_command', offset: 0, length: 8 }]
    } as any
  })

  const unlinkedAccMsg = mockBot.sentMessages[mockBot.sentMessages.length - 1]?.text || ''
  assert(
    unlinkedAccMsg.includes('TÀI KHOẢN CHƯA ĐƯỢC LIÊN KẾT'),
    10,
    '/account for unlinked user returns unlinked advisory notice'
  )

  // ----------------------------------------------------
  // TEST 11: /unlink Confirmation and Removal
  // ----------------------------------------------------
  console.log('\n--- TEST 11: /unlink Confirmation & Removal ---')
  // 1. /unlink prompts confirmation
  await mockBot.bot.handleUpdate({
    update_id: 203,
    message: {
      message_id: 203,
      date: Math.floor(Date.now() / 1000),
      chat: { id: mockTelegramId, type: 'private' },
      from: { id: mockTelegramId, is_bot: false, first_name: 'Prof Smith' },
      text: '/unlink',
      entities: [{ type: 'bot_command', offset: 0, length: 7 }]
    } as any
  })

  const unlinkPrompt = mockBot.sentMessages[mockBot.sentMessages.length - 1]
  assert(
    unlinkPrompt?.text?.includes('XÁC NHẬN HỦY LIÊN KẾT') && Boolean(unlinkPrompt?.reply_markup),
    11,
    '/unlink displays confirmation prompt with inline keyboard options'
  )

  // 2. /unlink confirm removes the link
  await mockBot.bot.handleUpdate({
    update_id: 204,
    message: {
      message_id: 204,
      date: Math.floor(Date.now() / 1000),
      chat: { id: mockTelegramId, type: 'private' },
      from: { id: mockTelegramId, is_bot: false, first_name: 'Prof Smith' },
      text: '/unlink confirm',
      entities: [{ type: 'bot_command', offset: 0, length: 7 }]
    } as any
  })

  const unlinkDone = mockBot.sentMessages[mockBot.sentMessages.length - 1]?.text || ''
  assert(unlinkDone.includes('ĐÃ HỦY LIÊN KẾT THÀNH CÔNG'), 11, '/unlink confirm performs successful unlinking')

  // Verify removed from database
  const checkRemoved = await findTelegramAccountByUserId(teacherUser.id)
  assert(checkRemoved === null, 11, 'TelegramAccount record deleted from PostgreSQL')

  // ----------------------------------------------------
  // TEST 12: Telegram Group Chat Restrictions
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Group Chat Privacy Restriction ---')
  await mockBot.bot.handleUpdate({
    update_id: 205,
    message: {
      message_id: 205,
      date: Math.floor(Date.now() / 1000),
      chat: { id: -100987654321, type: 'supergroup', title: 'TMdemy Public Group' },
      from: { id: 7771111, is_bot: false, first_name: 'Teacher 2' },
      text: '/account',
      entities: [{ type: 'bot_command', offset: 0, length: 8 }]
    } as any
  })

  const groupMsg = mockBot.sentMessages[mockBot.sentMessages.length - 1]?.text || ''
  assert(
    groupMsg.includes('chỉ hoạt động trong tin nhắn riêng tư'),
    12,
    '/account executed in group chat is blocked with privacy warning'
  )

  // ----------------------------------------------------
  // TEST 13: Backend Stability When Telegram Is Offline
  // ----------------------------------------------------
  console.log('\n--- TEST 13: Backend REST Stability Offline ---')
  // Call generateTeacherLinkTokenService when Telegram Bot is not connected
  const offlineTokenRes = await generateTeacherLinkTokenService(teacherUser.id)
  assert(
    offlineTokenRes.success && Boolean(offlineTokenRes.data?.token),
    13,
    'REST link-token generation operates independently of Telegram connectivity'
  )

  // Clean up test records
  await prisma.telegramAccount.deleteMany({
    where: { userId: { in: [teacherUser.id, teacherUser2.id] } }
  })
  await prisma.telegramLinkToken.deleteMany({
    where: { userId: { in: [teacherUser.id, teacherUser2.id] } }
  })

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================')
  console.log(
    `RESULTS: PASSED: ${passed} | FAILED: ${failed} | BLOCKED: ${blocked} | NOT TESTED: ${notTested}`
  )
  console.log('====================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal test suite error:', err)
  process.exit(1)
})

