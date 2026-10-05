/**
 * ============================================================================
 * PHASE 9 MIGRATION SCRIPT: CONVERSATIONS, PARTICIPANTS, MESSAGES & READS
 * ============================================================================
 * Scope:
 *   - MongoDB 'conversations' collection -> PostgreSQL 'conversations' table (2 rows)
 *   - MongoDB embedded 'participants'     -> PostgreSQL 'conversation_participants' table (6 rows)
 *   - MongoDB 'messages' collection      -> PostgreSQL 'messages' table (12 rows)
 *   - MongoDB embedded 'readBy'          -> PostgreSQL 'message_reads' table (0 rows)
 *
 * Strict Requirements:
 *   - MongoDB is strictly READ-ONLY (MongoDB writes = 0)
 *   - Entire Phase 9 execution inside a single atomic Prisma transaction
 *   - Dependency ordering: Conversations -> Participants -> Messages -> Reads
 *   - Deterministic UUID v5 mapping via scripts/migration-utils/id-mapper.ts
 *   - Composite PK for conversation_participants: (conversationId, userId) - NO UUID
 *   - Composite PK for message_reads: (messageId, userId) - NO UUID
 *   - Foreign Key integrity: Conversation -> Course, Participant -> Conv/User, Message -> Conv/Sender
 *   - Message ordering and UTF-8 content preservation
 *   - Pre-flight and post-migration isolation verification across all 26 tables
 *   - Baseline check: 113 rows before -> 133 rows after (+20 rows)
 * ============================================================================
 */

import * as dns from 'dns';
import mongoose from 'mongoose';
import { PrismaClient, EMessageType } from '@prisma/client';
import dotenv from 'dotenv';
import { toPostgresUuid } from '../migration-utils/id-mapper';

// Configure DNS for MongoDB Atlas SRV resolution on Windows
dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const prisma = new PrismaClient();

const ALL_BUSINESS_TABLES = [
  'users',
  'categories',
  'courses',
  'course_faqs',
  'chapters',
  'lessons',
  'quizzes',
  'questions',
  'question_options',
  'quiz_submissions',
  'quiz_submission_answers',
  'orders',
  'coupons',
  'coupon_courses',
  'enrollments',
  'progress',
  'certificates',
  'ratings',
  'favorite_courses',
  'comments',
  'comment_reactions',
  'conversations',
  'conversation_participants',
  'messages',
  'message_reads',
  'notifications'
];

interface TransformedConversation {
  sourceId: string;
  id: string;
  isGroup: boolean;
  name: string | null;
  courseId: string | null;
  lastMessageId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface TransformedParticipant {
  sourceConversationId: string;
  sourceUserId: string;
  conversationId: string;
  userId: string;
  joinedAt: Date;
}

interface TransformedMessage {
  sourceId: string;
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: EMessageType;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface TransformedMessageRead {
  sourceMessageId: string;
  sourceUserId: string;
  messageId: string;
  userId: string;
  readAt: Date;
}

async function getPostgresTableCounts(): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};
  for (const table of ALL_BUSINESS_TABLES) {
    const res: Array<{ count: number }> = await prisma.$queryRawUnsafe(
      `SELECT COUNT(*)::int as count FROM "${table}"`
    );
    counts[table] = res[0].count;
  }
  return counts;
}

function mapMessageType(rawType?: string): EMessageType {
  const t = String(rawType || '').toLowerCase();
  switch (t) {
    case 'text':
      return EMessageType.TEXT;
    case 'image':
      return EMessageType.IMAGE;
    case 'file':
      return EMessageType.FILE;
    default:
      return EMessageType.TEXT;
  }
}

async function runPhase9Migration() {
  const startTime = Date.now();
  let mongoWritesExecuted = 0;

  console.log('============================================================================');
  console.log('   PHASE 9: CONVERSATIONS, PARTICIPANTS, MESSAGES & MESSAGE READS           ');
  console.log('============================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 1: Connect to Databases & Perform Pre-flight Verifications
  // --------------------------------------------------------------------------
  console.log('[STEP 1] Connecting to MongoDB and verifying pre-flight status...');
  const mongoUri = process.env.mongodbURL || process.env.MONGODB_URL || process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('Missing mongodbURL / MONGODB_URL in environment variables.');
  }

  await mongoose.connect(mongoUri, { dbName: 'e-learning' });
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Failed to connect to MongoDB database "e-learning".');
  }

  const convsCol = db.collection('conversations');
  const msgsCol = db.collection('messages');

  const mongoConvCountBefore = await convsCol.countDocuments();
  const mongoMsgCountBefore = await msgsCol.countDocuments();

  console.log(`         MongoDB Conversations source count: ${mongoConvCountBefore} (Expected: 2)`);
  console.log(`         MongoDB Messages source count:      ${mongoMsgCountBefore} (Expected: 12)`);

  if (mongoConvCountBefore !== 2) {
    throw new Error(`Pre-flight abort: Source conversations count is ${mongoConvCountBefore}, expected 2!`);
  }
  if (mongoMsgCountBefore !== 12) {
    throw new Error(`Pre-flight abort: Source messages count is ${mongoMsgCountBefore}, expected 12!`);
  }

  // Check embedded participants count in MongoDB
  const rawConvsBefore = await convsCol.find({}).toArray();
  let totalParticipantsBefore = 0;
  for (const c of rawConvsBefore) {
    if (Array.isArray(c.participants)) totalParticipantsBefore += c.participants.length;
  }
  console.log(`         MongoDB Conversation Participants (embedded): ${totalParticipantsBefore} (Expected: 6)`);
  if (totalParticipantsBefore !== 6) {
    throw new Error(`Pre-flight abort: Expected exactly 6 conversation participants, found ${totalParticipantsBefore}!`);
  }

  // Check embedded readBy count in MongoDB
  const rawMsgsBefore = await msgsCol.find({}).toArray();
  let totalReadsBefore = 0;
  for (const m of rawMsgsBefore) {
    if (Array.isArray(m.readBy)) totalReadsBefore += m.readBy.length;
  }
  console.log(`         MongoDB Message Reads (embedded readBy): ${totalReadsBefore} (Expected: 0)`);
  if (totalReadsBefore !== 0) {
    throw new Error(`Pre-flight abort: Expected exactly 0 message reads, found ${totalReadsBefore}!`);
  }

  // Check PostgreSQL counts before migration
  const pgCountsBefore = await getPostgresTableCounts();
  console.log(`         PostgreSQL conversations before:             ${pgCountsBefore.conversations}`);
  console.log(`         PostgreSQL conversation_participants before: ${pgCountsBefore.conversation_participants}`);
  console.log(`         PostgreSQL messages before:                  ${pgCountsBefore.messages}`);
  console.log(`         PostgreSQL message_reads before:             ${pgCountsBefore.message_reads}`);
  console.log(`         PostgreSQL pre-migrated total rows:          113`);

  // Phase 9 target tables must be empty
  if (
    pgCountsBefore.conversations > 0 ||
    pgCountsBefore.conversation_participants > 0 ||
    pgCountsBefore.messages > 0 ||
    pgCountsBefore.message_reads > 0
  ) {
    throw new Error('Pre-flight abort: PostgreSQL already contains data in Phase 9 tables!');
  }

  // Prerequisite tables must match exact baseline (Phase 1–8 = 113 rows)
  const expectedPrereqs: Record<string, number> = {
    users: 7,
    categories: 3,
    courses: 8,
    course_faqs: 8,
    chapters: 12,
    lessons: 7,
    quizzes: 3,
    questions: 5,
    question_options: 20,
    quiz_submissions: 2,
    quiz_submission_answers: 4,
    orders: 8,
    coupons: 2,
    coupon_courses: 2,
    enrollments: 5,
    progress: 4,
    certificates: 1,
    ratings: 1,
    favorite_courses: 2,
    comments: 8,
    comment_reactions: 1
  };

  for (const [table, expectedCount] of Object.entries(expectedPrereqs)) {
    if (pgCountsBefore[table] !== expectedCount) {
      throw new Error(`Pre-flight abort: Prerequisite table "${table}" has ${pgCountsBefore[table]} rows, expected ${expectedCount}!`);
    }
  }

  // Phase 10 table must be 0
  if (pgCountsBefore.notifications !== 0) {
    throw new Error(`Pre-flight abort: Notifications table contains ${pgCountsBefore.notifications} rows, expected 0!`);
  }

  console.log('         All prerequisite tables and target tables verified.');
  console.log('         Pre-flight checks PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 2: Read MongoDB Data (READ-ONLY)
  // --------------------------------------------------------------------------
  console.log('[STEP 2] Reading conversations and messages from MongoDB (READ-ONLY)...');
  const rawConversations = await convsCol.find({}).toArray();
  const rawMessages = await msgsCol.find({}).sort({ createdAt: 1 }).toArray();
  console.log(`         Loaded ${rawConversations.length} conversations and ${rawMessages.length} messages.\n`);

  // --------------------------------------------------------------------------
  // STEP 3: Fetch Existing PostgreSQL Parent Entities for Foreign Key Validation
  // --------------------------------------------------------------------------
  console.log('[STEP 3] Fetching existing Users and Courses for FK validation...');
  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const existingCourses = await prisma.course.findMany({ select: { id: true, title: true } });

  const existingUserIds = new Set(existingUsers.map((u) => u.id));
  const existingCourseIds = new Set(existingCourses.map((c) => c.id));

  console.log(`         Existing Users: ${existingUserIds.size}, Existing Courses: ${existingCourseIds.size}.\n`);

  // --------------------------------------------------------------------------
  // STEP 4: Transform Conversations & Validate Relationships
  // --------------------------------------------------------------------------
  console.log('[STEP 4] Transforming Conversations and verifying relationships...');
  const transformedConversations: TransformedConversation[] = [];
  const rawConvMap = new Map<string, any>();

  for (const raw of rawConversations) {
    const sourceId = String(raw._id);
    rawConvMap.set(sourceId, raw);
    const id = toPostgresUuid('conversations', sourceId);

    // Validate Course FK if group conversation with course
    let courseId: string | null = null;
    if (raw.course) {
      const sourceCourseId = String(raw.course);
      courseId = toPostgresUuid('courses', sourceCourseId);
      if (!existingCourseIds.has(courseId)) {
        throw new Error(`Conversation ${sourceId} references non-existent Course UUID ${courseId} (Mongo course: ${sourceCourseId})!`);
      }
    }

    // Map lastMessageId if present
    let lastMessageId: string | null = null;
    if (raw.lastMessage) {
      const sourceLastMessageId = String(raw.lastMessage);
      lastMessageId = toPostgresUuid('messages', sourceLastMessageId);
    }

    transformedConversations.push({
      sourceId,
      id,
      isGroup: Boolean(raw.isGroup),
      name: raw.name ? String(raw.name).trim() : null,
      courseId,
      lastMessageId,
      createdAt: new Date(raw.createdAt || Date.now()),
      updatedAt: new Date(raw.updatedAt || raw.createdAt || Date.now())
    });
  }

  console.log(`         Transformed ${transformedConversations.length} conversations.`);
  for (const c of transformedConversations) {
    console.log(`         Conversation [${c.id}] isGroup=${c.isGroup} name="${c.name || 'N/A'}" course=${c.courseId || 'N/A'}`);
  }
  console.log('         Conversation transformations PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 5: Transform Conversation Participants & Validate Constraints
  // --------------------------------------------------------------------------
  console.log('[STEP 5] Transforming Conversation Participants...');
  const transformedParticipants: TransformedParticipant[] = [];
  const participantKeySet = new Set<string>();
  const convParticipantMap = new Map<string, Set<string>>();

  for (const raw of rawConversations) {
    const sourceConvId = String(raw._id);
    const conversationId = toPostgresUuid('conversations', sourceConvId);
    const convTimestamp = new Date(raw.createdAt || Date.now());

    if (!convParticipantMap.has(conversationId)) {
      convParticipantMap.set(conversationId, new Set<string>());
    }

    if (Array.isArray(raw.participants)) {
      for (const rawUserId of raw.participants) {
        const sourceUserId = String(rawUserId);
        const userId = toPostgresUuid('users', sourceUserId);

        if (!existingUserIds.has(userId)) {
          throw new Error(`Participant in conversation ${sourceConvId} references non-existent User UUID ${userId} (Mongo user: ${sourceUserId})!`);
        }

        const compositeKey = `${conversationId}:${userId}`;
        if (participantKeySet.has(compositeKey)) {
          throw new Error(`Duplicate participant found for composite PK (${conversationId}, ${userId})!`);
        }
        participantKeySet.add(compositeKey);
        convParticipantMap.get(conversationId)!.add(userId);

        transformedParticipants.push({
          sourceConversationId: sourceConvId,
          sourceUserId,
          conversationId,
          userId,
          joinedAt: convTimestamp
        });
      }
    }
  }

  console.log(`         Transformed ${transformedParticipants.length} conversation participants (Expected: 6).`);
  for (const p of transformedParticipants) {
    console.log(`         Participant: Conv [${p.conversationId}] -> User [${p.userId}]`);
  }
  console.log('         Conversation Participants transformations PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 6: Transform Messages & Validate Relationships, Ordering, Senders
  // --------------------------------------------------------------------------
  console.log('[STEP 6] Transforming Messages and verifying sender participation & ordering...');
  const transformedMessages: TransformedMessage[] = [];
  const messageIdSet = new Set<string>();

  // Ensure messages are sorted by source createdAt ascending
  const sortedRawMessages = [...rawMessages].sort((a, b) => {
    const tA = new Date(a.createdAt || 0).getTime();
    const tB = new Date(b.createdAt || 0).getTime();
    return tA - tB;
  });

  for (const raw of sortedRawMessages) {
    const sourceId = String(raw._id);
    const id = toPostgresUuid('messages', sourceId);

    if (messageIdSet.has(id)) {
      throw new Error(`Duplicate message UUID detected: ${id} (source: ${sourceId})`);
    }
    messageIdSet.add(id);

    // Validate Conversation FK
    if (!raw.conversation) throw new Error(`Message ${sourceId} is missing conversation reference!`);
    const sourceConvId = String(raw.conversation);
    const conversationId = toPostgresUuid('conversations', sourceConvId);
    if (!rawConvMap.has(sourceConvId)) {
      throw new Error(`Message ${sourceId} references non-existent Conversation ${sourceConvId}!`);
    }

    // Validate Sender FK
    if (!raw.sender) throw new Error(`Message ${sourceId} is missing sender reference!`);
    const sourceSenderId = String(raw.sender);
    const senderId = toPostgresUuid('users', sourceSenderId);
    if (!existingUserIds.has(senderId)) {
      throw new Error(`Message ${sourceId} references non-existent User UUID ${senderId}!`);
    }

    // Business check: Sender must be a participant of the conversation
    const participantsOfConv = convParticipantMap.get(conversationId);
    if (!participantsOfConv || !participantsOfConv.has(senderId)) {
      throw new Error(`Integrity violation: Sender ${senderId} of Message ${sourceId} is NOT a participant of Conversation ${conversationId}!`);
    }

    // Validate Content
    const content = String(raw.content || '');
    if (!content) {
      throw new Error(`Message ${sourceId} has empty content!`);
    }

    transformedMessages.push({
      sourceId,
      id,
      conversationId,
      senderId,
      content,
      type: mapMessageType(raw.type),
      isEdited: Boolean(raw.isEdited),
      createdAt: new Date(raw.createdAt || Date.now()),
      updatedAt: new Date(raw.updatedAt || raw.createdAt || Date.now())
    });
  }

  console.log(`         Transformed ${transformedMessages.length} messages (Expected: 12).`);
  console.log('         All 12 senders verified as active participants of their respective conversations.');
  console.log('         Message transformations PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 7: Transform Message Reads (Expected: 0)
  // --------------------------------------------------------------------------
  console.log('[STEP 7] Checking and transforming Message Reads...');
  const transformedReads: TransformedMessageRead[] = [];
  const readKeySet = new Set<string>();

  for (const raw of rawMessages) {
    if (Array.isArray(raw.readBy)) {
      for (const rawUserId of raw.readBy) {
        const sourceMessageId = String(raw._id);
        const sourceUserId = String(rawUserId);
        const messageId = toPostgresUuid('messages', sourceMessageId);
        const userId = toPostgresUuid('users', sourceUserId);

        const compositeKey = `${messageId}:${userId}`;
        if (readKeySet.has(compositeKey)) {
          throw new Error(`Duplicate message read composite PK (${messageId}, ${userId})!`);
        }
        readKeySet.add(compositeKey);

        transformedReads.push({
          sourceMessageId,
          sourceUserId,
          messageId,
          userId,
          readAt: new Date(raw.updatedAt || raw.createdAt || Date.now())
        });
      }
    }
  }

  console.log(`         Transformed ${transformedReads.length} message reads (Expected: 0).\n`);

  // --------------------------------------------------------------------------
  // STEP 8: Execute Atomic Prisma Transaction
  // --------------------------------------------------------------------------
  console.log('[STEP 8] Executing atomic transaction in PostgreSQL...');
  await prisma.$transaction(async (tx) => {
    // 1. Insert Conversations
    console.log(`         Inserting ${transformedConversations.length} conversations into "conversations" table...`);
    for (const c of transformedConversations) {
      await tx.conversation.create({
        data: {
          id: c.id,
          isGroup: c.isGroup,
          name: c.name,
          courseId: c.courseId,
          lastMessageId: c.lastMessageId,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }
      });
    }

    // 2. Insert Conversation Participants
    console.log(`         Inserting ${transformedParticipants.length} participants into "conversation_participants" table...`);
    for (const p of transformedParticipants) {
      await tx.conversationParticipant.create({
        data: {
          conversationId: p.conversationId,
          userId: p.userId,
          joinedAt: p.joinedAt
        }
      });
    }

    // 3. Insert Messages (in chronological order)
    console.log(`         Inserting ${transformedMessages.length} messages into "messages" table...`);
    for (const m of transformedMessages) {
      await tx.message.create({
        data: {
          id: m.id,
          conversationId: m.conversationId,
          senderId: m.senderId,
          content: m.content,
          type: m.type,
          isEdited: m.isEdited,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt
        }
      });
    }

    // 4. Insert Message Reads (if any)
    if (transformedReads.length > 0) {
      console.log(`         Inserting ${transformedReads.length} message reads into "message_reads" table...`);
      for (const r of transformedReads) {
        await tx.messageRead.create({
          data: {
            messageId: r.messageId,
            userId: r.userId,
            readAt: r.readAt
          }
        });
      }
    }
  });

  console.log('         Transaction committed successfully.\n');

  // --------------------------------------------------------------------------
  // STEP 9: Post-Migration Verification & Consistency Checks
  // --------------------------------------------------------------------------
  console.log('[STEP 9] Verifying migrated data in PostgreSQL...');

  const pgConvs = await prisma.conversation.findMany();
  const pgParticipants = await prisma.conversationParticipant.findMany();
  const pgMsgs = await prisma.message.findMany({ orderBy: { createdAt: 'asc' } });
  const pgReads = await prisma.messageRead.findMany();

  console.log(`         PostgreSQL conversations count:             ${pgConvs.length} (Expected: 2)`);
  console.log(`         PostgreSQL conversation_participants count: ${pgParticipants.length} (Expected: 6)`);
  console.log(`         PostgreSQL messages count:                  ${pgMsgs.length} (Expected: 12)`);
  console.log(`         PostgreSQL message_reads count:             ${pgReads.length} (Expected: 0)`);

  if (pgConvs.length !== 2) throw new Error(`Verification failed: Expected 2 conversations, got ${pgConvs.length}`);
  if (pgParticipants.length !== 6) throw new Error(`Verification failed: Expected 6 participants, got ${pgParticipants.length}`);
  if (pgMsgs.length !== 12) throw new Error(`Verification failed: Expected 12 messages, got ${pgMsgs.length}`);
  if (pgReads.length !== 0) throw new Error(`Verification failed: Expected 0 message reads, got ${pgReads.length}`);

  // Cross-check UUID mapping for conversations
  console.log('[STEP 10] Cross-checking deterministic UUID mapping for conversations...');
  for (const raw of rawConversations) {
    const expectedUuid = toPostgresUuid('conversations', String(raw._id));
    const found = pgConvs.find((c) => c.id === expectedUuid);
    if (!found) throw new Error(`UUID mismatch: Mongo Conversation ${raw._id} mapped to ${expectedUuid} not found!`);
    if (found.isGroup !== Boolean(raw.isGroup)) throw new Error(`isGroup mismatch for Conversation ${expectedUuid}!`);
    if (raw.name && found.name !== String(raw.name).trim()) throw new Error(`name mismatch for Conversation ${expectedUuid}!`);
  }
  console.log('         Conversations UUID cross-check: 2/2 PASSED (100%).\n');

  // Cross-check composite PK for participants
  console.log('[STEP 11] Cross-checking composite PK and relations for conversation_participants...');
  for (const tp of transformedParticipants) {
    const found = pgParticipants.find(
      (p) => p.conversationId === tp.conversationId && p.userId === tp.userId
    );
    if (!found) throw new Error(`Participant pair (${tp.conversationId}, ${tp.userId}) not found in PostgreSQL!`);
  }
  console.log('         Participants composite PK cross-check: 6/6 PASSED (100%).\n');

  // Cross-check UUID mapping and content for messages
  console.log('[STEP 12] Cross-checking deterministic UUID mapping, ordering, and content for messages...');
  for (let i = 0; i < sortedRawMessages.length; i++) {
    const raw = sortedRawMessages[i];
    const expectedUuid = toPostgresUuid('messages', String(raw._id));
    const pgMsg = pgMsgs[i];

    if (pgMsg.id !== expectedUuid) {
      throw new Error(`Message order/UUID mismatch at index ${i}: expected ${expectedUuid}, got ${pgMsg.id}!`);
    }
    if (pgMsg.content !== String(raw.content)) {
      throw new Error(`Message content mismatch for ${expectedUuid}: "${pgMsg.content}" vs "${raw.content}"!`);
    }
    if (pgMsg.senderId !== toPostgresUuid('users', String(raw.sender))) {
      throw new Error(`Message sender mismatch for ${expectedUuid}!`);
    }
    if (pgMsg.conversationId !== toPostgresUuid('conversations', String(raw.conversation))) {
      throw new Error(`Message conversation mismatch for ${expectedUuid}!`);
    }
  }
  console.log('         Messages UUID, order, and content verification: 12/12 PASSED (100%).\n');

  // Verify Foreign Keys in PostgreSQL directly
  console.log('[STEP 13] Verifying Foreign Key integrity in PostgreSQL...');
  for (const c of pgConvs) {
    if (c.courseId) {
      const course = await prisma.course.findUnique({ where: { id: c.courseId } });
      if (!course) throw new Error(`FK violation: Conversation ${c.id} points to missing Course ${c.courseId}`);
    }
  }
  for (const p of pgParticipants) {
    const conv = await prisma.conversation.findUnique({ where: { id: p.conversationId } });
    if (!conv) throw new Error(`FK violation: Participant points to missing Conversation ${p.conversationId}`);
    const user = await prisma.user.findUnique({ where: { id: p.userId } });
    if (!user) throw new Error(`FK violation: Participant points to missing User ${p.userId}`);
  }
  for (const m of pgMsgs) {
    const conv = await prisma.conversation.findUnique({ where: { id: m.conversationId } });
    if (!conv) throw new Error(`FK violation: Message ${m.id} points to missing Conversation ${m.conversationId}`);
    const sender = await prisma.user.findUnique({ where: { id: m.senderId } });
    if (!sender) throw new Error(`FK violation: Message ${m.id} points to missing Sender ${m.senderId}`);
  }
  console.log('         All Foreign Key relationships in PostgreSQL verified: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 14: Isolation Verification Across All 26 Business Tables
  // --------------------------------------------------------------------------
  console.log('[STEP 14] Verifying database isolation across all 26 business tables...');
  const pgCountsAfter = await getPostgresTableCounts();

  const expectedCountsAfter: Record<string, number> = {
    users: 7,
    categories: 3,
    courses: 8,
    course_faqs: 8,
    chapters: 12,
    lessons: 7,
    quizzes: 3,
    questions: 5,
    question_options: 20,
    quiz_submissions: 2,
    quiz_submission_answers: 4,
    orders: 8,
    coupons: 2,
    coupon_courses: 2,
    enrollments: 5,
    progress: 4,
    certificates: 1,
    ratings: 1,
    favorite_courses: 2,
    comments: 8,
    comment_reactions: 1,
    conversations: 2,
    conversation_participants: 6,
    messages: 12,
    message_reads: 0,
    notifications: 0
  };

  let totalRows = 0;
  for (const [table, expected] of Object.entries(expectedCountsAfter)) {
    const actual = pgCountsAfter[table];
    totalRows += actual;
    const status = actual === expected ? 'OK' : 'MISMATCH';
    console.log(`         ${table.padEnd(28)}: ${actual} (Expected: ${expected}) [${status}]`);
    if (actual !== expected) {
      throw new Error(`Isolation violation: Table "${table}" has ${actual} rows, expected ${expected}!`);
    }
  }

  console.log(`\n         Total database row count: ${totalRows} (Expected: 133)`);
  if (totalRows !== 133) {
    throw new Error(`Total row count mismatch: Expected 133, got ${totalRows}!`);
  }
  console.log('         Isolation verification across all 26 business tables: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 15: Read-Only Verification
  // --------------------------------------------------------------------------
  console.log('[STEP 15] Verifying MongoDB Read-Only constraint...');
  const mongoConvAfter = await convsCol.countDocuments();
  const mongoMsgAfter = await msgsCol.countDocuments();

  if (mongoConvAfter !== mongoConvCountBefore || mongoMsgAfter !== mongoMsgCountBefore) {
    throw new Error('Critical integrity failure: MongoDB counts changed during migration!');
  }
  console.log(`         MongoDB writes executed: ${mongoWritesExecuted}`);
  console.log('         MongoDB Read-Only constraint: PASSED.\n');

  const durationMs = Date.now() - startTime;
  console.log('============================================================================');
  console.log(` PHASE 9 MIGRATION COMPLETED SUCCESSFULLY in ${durationMs}ms               `);
  console.log('============================================================================\n');

  await mongoose.disconnect();
  await prisma.$disconnect();

  return {
    conversationsMigrated: pgConvs.length,
    participantsMigrated: pgParticipants.length,
    messagesMigrated: pgMsgs.length,
    readsMigrated: pgReads.length,
    mongoWritesExecuted,
    totalRows
  };
}

runPhase9Migration()
  .then((res) => {
    console.log('Execution Summary:');
    console.log(`  Conversations migrated:             ${res.conversationsMigrated}/2`);
    console.log(`  Conversation participants migrated: ${res.participantsMigrated}/6`);
    console.log(`  Messages migrated:                  ${res.messagesMigrated}/12`);
    console.log(`  Message reads migrated:             ${res.readsMigrated}/0`);
    console.log(`  MongoDB writes executed:            ${res.mongoWritesExecuted}`);
    console.log(`  Total database rows:                ${res.totalRows}/133`);
    console.log('\nPHASE 9 STATUS: SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n============================================================================');
    console.error(' PHASE 9 MIGRATION FAILED');
    console.error('============================================================================');
    console.error(err);
    process.exit(1);
  });
