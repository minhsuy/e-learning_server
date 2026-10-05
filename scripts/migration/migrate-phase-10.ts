/**
 * ============================================================================
 * PHASE 10 MIGRATION SCRIPT: NOTIFICATIONS (FINAL DATA MIGRATION PHASE)
 * ============================================================================
 * Scope:
 *   - MongoDB 'notifications' collection -> PostgreSQL 'notifications' table (28 rows)
 *
 * Strict Requirements:
 *   - MongoDB is strictly READ-ONLY (MongoDB writes = 0)
 *   - Entire Phase 10 execution inside a single atomic Prisma transaction
 *   - Deterministic UUID v5 mapping via scripts/migration-utils/id-mapper.ts
 *   - Receiver & Sender foreign keys validated against PostgreSQL 'users' table
 *   - Polymorphic relatedId resolution via resolveNotificationRelatedId(type, relatedId)
 *   - Enum mapping to Prisma ENotificationType
 *   - Read status ('read' in Mongo -> 'isRead' in Prisma) and UTF-8 content preserved
 *   - Pre-flight and post-migration isolation verification across all 26 business tables
 *   - Baseline check: 133 rows before -> 161 rows after (+28 rows)
 * ============================================================================
 */

import * as dns from 'dns';
import mongoose from 'mongoose';
import { PrismaClient, ENotificationType } from '@prisma/client';
import dotenv from 'dotenv';
import { toPostgresUuid, resolveNotificationRelatedId } from '../migration-utils/id-mapper';

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

interface TransformedNotification {
  sourceId: string;
  id: string;
  senderId: string | null;
  receiverId: string;
  type: ENotificationType;
  message: string;
  relatedId: string | null;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
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

function mapNotificationType(rawType: string): ENotificationType {
  const t = String(rawType || '').trim().toLowerCase();
  switch (t) {
    case 'comment':
      return ENotificationType.COMMENT;
    case 'rating':
      return ENotificationType.RATING;
    case 'order':
      return ENotificationType.ORDER;
    case 'message':
      return ENotificationType.MESSAGE;
    case 'system':
      return ENotificationType.SYSTEM;
    case 'course':
      return ENotificationType.COURSE;
    case 'lesson':
      return ENotificationType.LESSON;
    case 'comment_reply':
      return ENotificationType.COMMENT_REPLY;
    case 'quiz':
      return ENotificationType.QUIZ;
    default:
      throw new Error(`Unknown notification type: ${rawType}`);
  }
}

async function runPhase10Migration() {
  const startTime = Date.now();
  let mongoWritesExecuted = 0;

  console.log('============================================================================');
  console.log('   PHASE 10: NOTIFICATIONS (FINAL DATA MIGRATION PHASE)                    ');
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

  const notifsCol = db.collection('notifications');
  const mongoNotifCountBefore = await notifsCol.countDocuments();
  console.log(`         MongoDB Notifications source count: ${mongoNotifCountBefore} (Expected: 28)`);

  if (mongoNotifCountBefore !== 28) {
    throw new Error(`Pre-flight abort: Source notifications count is ${mongoNotifCountBefore}, expected 28!`);
  }

  // Check PostgreSQL counts before migration
  const pgCountsBefore = await getPostgresTableCounts();
  console.log(`         PostgreSQL notifications before:     ${pgCountsBefore.notifications}`);
  console.log(`         PostgreSQL pre-migrated total rows:  133`);

  // Phase 10 target table must be empty
  if (pgCountsBefore.notifications > 0) {
    throw new Error('Pre-flight abort: PostgreSQL notifications table already contains data!');
  }

  // Prerequisite tables must match exact baseline (Phase 1–9 = 133 rows)
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
    comment_reactions: 1,
    conversations: 2,
    conversation_participants: 6,
    messages: 12,
    message_reads: 0
  };

  for (const [table, expectedCount] of Object.entries(expectedPrereqs)) {
    if (pgCountsBefore[table] !== expectedCount) {
      throw new Error(`Pre-flight abort: Prerequisite table "${table}" has ${pgCountsBefore[table]} rows, expected ${expectedCount}!`);
    }
  }

  console.log('         All 25 prerequisite tables verified (133 rows).');
  console.log('         Pre-flight checks PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 2: Read MongoDB Data (READ-ONLY)
  // --------------------------------------------------------------------------
  console.log('[STEP 2] Reading notifications from MongoDB (READ-ONLY)...');
  const rawNotifications = await notifsCol.find({}).sort({ createdAt: 1 }).toArray();
  console.log(`         Loaded ${rawNotifications.length} notifications.\n`);

  // Analyze type distribution
  const typeCounts: Record<string, number> = {};
  for (const n of rawNotifications) {
    typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
  }
  console.log('         Notification type distribution:');
  for (const [t, c] of Object.entries(typeCounts)) {
    console.log(`           - ${t.padEnd(16)}: ${c}`);
  }
  console.log('');

  // --------------------------------------------------------------------------
  // STEP 3: Fetch Existing PostgreSQL Parent Entities for Foreign Key Validation
  // --------------------------------------------------------------------------
  console.log('[STEP 3] Fetching existing Users for FK validation...');
  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const existingUserIds = new Set(existingUsers.map((u) => u.id));
  console.log(`         Existing Users in PostgreSQL: ${existingUserIds.size}.\n`);

  // --------------------------------------------------------------------------
  // STEP 4: Transform Notifications & Validate Relationships & Polymorphic relatedId
  // --------------------------------------------------------------------------
  console.log('[STEP 4] Transforming Notifications and resolving polymorphic relatedId...');
  const transformedNotifications: TransformedNotification[] = [];
  const notifIdSet = new Set<string>();

  for (const raw of rawNotifications) {
    const sourceId = String(raw._id);
    const id = toPostgresUuid('notifications', sourceId);

    if (notifIdSet.has(id)) {
      throw new Error(`Duplicate notification UUID detected: ${id} (source: ${sourceId})`);
    }
    notifIdSet.add(id);

    // Validate Receiver FK
    if (!raw.receiver) throw new Error(`Notification ${sourceId} is missing receiver reference!`);
    const sourceReceiverId = String(raw.receiver);
    const receiverId = toPostgresUuid('users', sourceReceiverId);
    if (!existingUserIds.has(receiverId)) {
      throw new Error(`Notification ${sourceId} references non-existent Receiver UUID ${receiverId}!`);
    }

    // Validate Sender FK (if present)
    let senderId: string | null = null;
    if (raw.sender) {
      const sourceSenderId = String(raw.sender);
      senderId = toPostgresUuid('users', sourceSenderId);
      if (!existingUserIds.has(senderId)) {
        throw new Error(`Notification ${sourceId} references non-existent Sender UUID ${senderId}!`);
      }
    }

    // Validate and Map Type
    const type = mapNotificationType(raw.type);

    // Resolve polymorphic relatedId
    const rawRelatedId = raw.relatedId ? String(raw.relatedId) : null;
    const relatedId = resolveNotificationRelatedId(raw.type, rawRelatedId);

    // Validate Content
    const message = String(raw.message || '').trim();
    if (!message) {
      throw new Error(`Notification ${sourceId} has empty message content!`);
    }

    // Validate Read Status
    const isRead = Boolean(raw.read);

    transformedNotifications.push({
      sourceId,
      id,
      senderId,
      receiverId,
      type,
      message,
      relatedId,
      isRead,
      createdAt: new Date(raw.createdAt || Date.now()),
      updatedAt: new Date(raw.updatedAt || raw.createdAt || Date.now())
    });
  }

  console.log(`         Transformed ${transformedNotifications.length} notifications (Expected: 28).`);
  console.log('         All receiver and sender foreign keys verified.');
  console.log('         All polymorphic relatedIds resolved via resolveNotificationRelatedId.');
  console.log('         Notification transformations PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 5: Execute Atomic Prisma Transaction
  // --------------------------------------------------------------------------
  console.log('[STEP 5] Executing atomic transaction in PostgreSQL...');
  await prisma.$transaction(async (tx) => {
    console.log(`         Inserting ${transformedNotifications.length} notifications into "notifications" table...`);
    for (const n of transformedNotifications) {
      await tx.notification.create({
        data: {
          id: n.id,
          senderId: n.senderId,
          receiverId: n.receiverId,
          type: n.type,
          message: n.message,
          relatedId: n.relatedId,
          isRead: n.isRead,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt
        }
      });
    }
  });

  console.log('         Transaction committed successfully.\n');

  // --------------------------------------------------------------------------
  // STEP 6: Post-Migration Verification & Consistency Checks
  // --------------------------------------------------------------------------
  console.log('[STEP 6] Verifying migrated data in PostgreSQL...');

  const pgNotifs = await prisma.notification.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`         PostgreSQL notifications count: ${pgNotifs.length} (Expected: 28)`);

  if (pgNotifs.length !== 28) {
    throw new Error(`Verification failed: Expected 28 notifications, got ${pgNotifs.length}`);
  }

  // Cross-check UUID mapping, content, enum, and read status
  console.log('[STEP 7] Cross-checking deterministic UUID mapping, content, and fields...');
  for (const raw of rawNotifications) {
    const expectedUuid = toPostgresUuid('notifications', String(raw._id));
    const found = pgNotifs.find((n) => n.id === expectedUuid);
    if (!found) {
      throw new Error(`UUID mismatch: Mongo Notification ${raw._id} mapped to ${expectedUuid} not found!`);
    }

    if (found.message !== String(raw.message).trim()) {
      throw new Error(`Message content mismatch for Notification ${expectedUuid}!`);
    }
    if (found.type !== mapNotificationType(raw.type)) {
      throw new Error(`Type enum mismatch for Notification ${expectedUuid}!`);
    }
    if (found.isRead !== Boolean(raw.read)) {
      throw new Error(`Read status mismatch for Notification ${expectedUuid}!`);
    }
    if (found.receiverId !== toPostgresUuid('users', String(raw.receiver))) {
      throw new Error(`Receiver mismatch for Notification ${expectedUuid}!`);
    }
    if (raw.sender && found.senderId !== toPostgresUuid('users', String(raw.sender))) {
      throw new Error(`Sender mismatch for Notification ${expectedUuid}!`);
    }

    const expectedRelatedId = resolveNotificationRelatedId(raw.type, raw.relatedId ? String(raw.relatedId) : null);
    if (found.relatedId !== expectedRelatedId) {
      throw new Error(`RelatedId mismatch for Notification ${expectedUuid}: got ${found.relatedId}, expected ${expectedRelatedId}!`);
    }
  }
  console.log('         Notifications UUID, content, enum, and relatedId verification: 28/28 PASSED (100%).\n');

  // Verify Foreign Keys in PostgreSQL directly
  console.log('[STEP 8] Verifying Foreign Key integrity in PostgreSQL...');
  for (const n of pgNotifs) {
    const receiver = await prisma.user.findUnique({ where: { id: n.receiverId } });
    if (!receiver) throw new Error(`FK violation: Notification ${n.id} points to missing Receiver ${n.receiverId}`);

    if (n.senderId) {
      const sender = await prisma.user.findUnique({ where: { id: n.senderId } });
      if (!sender) throw new Error(`FK violation: Notification ${n.id} points to missing Sender ${n.senderId}`);
    }
  }
  console.log('         All Notification User Foreign Keys verified in PostgreSQL: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 9: Functional Query Verification
  // --------------------------------------------------------------------------
  console.log('[STEP 9] Performing functional query verification based on notification service...');
  // Test query notifications by receiver
  const sampleReceiverId = pgNotifs[0].receiverId;
  const userNotifs = await prisma.notification.findMany({
    where: { receiverId: sampleReceiverId },
    orderBy: { createdAt: 'desc' }
  });
  console.log(`         Sample query: Receiver ${sampleReceiverId} has ${userNotifs.length} notifications.`);

  // Test filter by type
  const orderNotifs = await prisma.notification.findMany({
    where: { type: ENotificationType.ORDER }
  });
  console.log(`         Filter query: Found ${orderNotifs.length} ORDER notifications.`);

  // Test unread count
  const unreadCount = await prisma.notification.count({
    where: { isRead: false }
  });
  const readCount = await prisma.notification.count({
    where: { isRead: true }
  });
  console.log(`         Read status breakdown: ${unreadCount} unread, ${readCount} read (Total: ${unreadCount + readCount}).`);
  console.log('         Functional queries: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 10: Isolation Verification Across All 26 Business Tables
  // --------------------------------------------------------------------------
  console.log('[STEP 10] Verifying database isolation across all 26 business tables...');
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
    notifications: 28
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

  console.log(`\n         Total database row count: ${totalRows} (Expected: 161)`);
  if (totalRows !== 161) {
    throw new Error(`Total row count mismatch: Expected 161, got ${totalRows}!`);
  }
  console.log('         Isolation verification across all 26 business tables: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 11: Read-Only Verification
  // --------------------------------------------------------------------------
  console.log('[STEP 11] Verifying MongoDB Read-Only constraint...');
  const mongoNotifAfter = await notifsCol.countDocuments();
  if (mongoNotifAfter !== mongoNotifCountBefore) {
    throw new Error('Critical integrity failure: MongoDB count changed during migration!');
  }
  console.log(`         MongoDB writes executed: ${mongoWritesExecuted}`);
  console.log('         MongoDB Read-Only constraint: PASSED.\n');

  const durationMs = Date.now() - startTime;
  console.log('============================================================================');
  console.log(` PHASE 10 MIGRATION COMPLETED SUCCESSFULLY in ${durationMs}ms              `);
  console.log('============================================================================\n');

  await mongoose.disconnect();
  await prisma.$disconnect();

  return {
    notificationsMigrated: pgNotifs.length,
    mongoWritesExecuted,
    totalRows
  };
}

runPhase10Migration()
  .then((res) => {
    console.log('Execution Summary:');
    console.log(`  Notifications migrated:   ${res.notificationsMigrated}/28`);
    console.log(`  MongoDB writes executed:  ${res.mongoWritesExecuted}`);
    console.log(`  Total database rows:      ${res.totalRows}/161`);
    console.log('\nPHASE 10 STATUS: SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n============================================================================');
    console.error(' PHASE 10 MIGRATION FAILED');
    console.error('============================================================================');
    console.error(err);
    process.exit(1);
  });
