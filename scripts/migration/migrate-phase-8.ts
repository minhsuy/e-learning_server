/**
 * ============================================================================
 * PHASE 8 MIGRATION SCRIPT: COMMENTS & COMMENT REACTIONS
 * ============================================================================
 * Scope:
 *   - MongoDB 'comments' collection -> PostgreSQL 'comments' table (8 rows)
 *   - MongoDB embedded 'likes' / 'dislikes' -> PostgreSQL 'comment_reactions' table (1 row)
 *
 * Strict Requirements:
 *   - MongoDB is strictly READ-ONLY (MongoDB writes = 0)
 *   - Entire Phase 8 execution inside a single atomic Prisma transaction
 *   - Self-referencing comment hierarchy preserved (parents inserted before replies)
 *   - Deterministic UUID v5 mapping via scripts/migration-utils/id-mapper.ts
 *   - Foreign Key integrity: user, course, lesson, parent comment
 *   - Unique constraint check for comment reactions (commentId, userId)
 *   - Complete pre-flight and post-migration isolation verification
 *   - Idempotency & safety checks
 * ============================================================================
 */

import * as dns from 'dns';
import mongoose from 'mongoose';
import { PrismaClient, CommentStatus, CommentReactionType } from '@prisma/client';
import dotenv from 'dotenv';
import { toPostgresUuid, toSubEntityUuid } from '../migration-utils/id-mapper';

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

interface TransformedComment {
  sourceId: string;
  id: string;
  content: string;
  lessonId: string;
  courseId: string;
  userId: string;
  parentId: string | null;
  sourceParentId: string | null;
  level: number;
  status: CommentStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface TransformedCommentReaction {
  sourceCommentId: string;
  sourceUserId: string;
  id: string;
  commentId: string;
  userId: string;
  type: CommentReactionType;
  createdAt: Date;
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

function mapCommentStatus(rawStatus?: string): CommentStatus {
  const s = String(rawStatus || '').toLowerCase();
  switch (s) {
    case 'approved':
      return CommentStatus.APPROVED;
    case 'pending':
      return CommentStatus.PENDING;
    case 'rejected':
      return CommentStatus.REJECTED;
    default:
      return CommentStatus.APPROVED;
  }
}

async function runPhase8Migration() {
  const startTime = Date.now();
  let mongoWritesExecuted = 0;

  console.log('============================================================================');
  console.log('                 PHASE 8: COMMENTS & COMMENT REACTIONS                      ');
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

  const commentsCol = db.collection('comments');
  const mongoCommentCountBefore = await commentsCol.countDocuments();
  console.log(`         MongoDB Comments source count: ${mongoCommentCountBefore} (Expected: 8)`);

  if (mongoCommentCountBefore !== 8) {
    throw new Error(`Pre-flight abort: Source comments count in MongoDB is ${mongoCommentCountBefore}, expected 8!`);
  }

  // Check embedded reaction counts in MongoDB source
  const rawCommentsBefore = await commentsCol.find({}).toArray();
  let totalLikesBefore = 0;
  let totalDislikesBefore = 0;
  for (const c of rawCommentsBefore) {
    if (Array.isArray(c.likes)) totalLikesBefore += c.likes.length;
    if (Array.isArray(c.dislikes)) totalDislikesBefore += c.dislikes.length;
  }
  const totalReactionsBefore = totalLikesBefore + totalDislikesBefore;
  console.log(`         MongoDB Comment Reactions (embedded likes: ${totalLikesBefore}, dislikes: ${totalDislikesBefore}): ${totalReactionsBefore} (Expected: 1)`);

  if (totalReactionsBefore !== 1) {
    throw new Error(`Pre-flight abort: Expected exactly 1 comment reaction in MongoDB, found ${totalReactionsBefore}!`);
  }

  // Check PostgreSQL counts before migration
  const pgCountsBefore = await getPostgresTableCounts();
  console.log(`         PostgreSQL comments before:          ${pgCountsBefore.comments}`);
  console.log(`         PostgreSQL comment_reactions before: ${pgCountsBefore.comment_reactions}`);
  console.log(`         PostgreSQL pre-migrated total rows: 104`);

  // Target tables must be empty
  if (pgCountsBefore.comments > 0 || pgCountsBefore.comment_reactions > 0) {
    throw new Error('Pre-flight abort: PostgreSQL already contains data in comments or comment_reactions table!');
  }

  // Prerequisite tables must match exact baseline
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
    favorite_courses: 2
  };

  for (const [table, expectedCount] of Object.entries(expectedPrereqs)) {
    if (pgCountsBefore[table] !== expectedCount) {
      throw new Error(`Pre-flight abort: Prerequisite table "${table}" has ${pgCountsBefore[table]} rows, expected ${expectedCount}!`);
    }
  }

  // Future phase tables must be 0
  const futureTables = [
    'conversations',
    'conversation_participants',
    'messages',
    'message_reads',
    'notifications'
  ];
  for (const table of futureTables) {
    if (pgCountsBefore[table] !== 0) {
      throw new Error(`Pre-flight abort: Future table "${table}" contains ${pgCountsBefore[table]} rows, expected 0!`);
    }
  }

  console.log('         All prerequisite tables and target tables verified.');
  console.log('         Pre-flight checks PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 2: Read MongoDB Data (READ-ONLY)
  // --------------------------------------------------------------------------
  console.log('[STEP 2] Reading comments from MongoDB (READ-ONLY)...');
  const rawComments = await commentsCol.find({}).toArray();
  console.log(`         Loaded ${rawComments.length} comments from MongoDB.\n`);

  // --------------------------------------------------------------------------
  // STEP 3: Fetch Existing PostgreSQL Parent Entities for Foreign Key Validation
  // --------------------------------------------------------------------------
  console.log('[STEP 3] Fetching existing Users, Courses, and Lessons for FK validation...');
  const existingUsers = await prisma.user.findMany({ select: { id: true, email: true } });
  const existingCourses = await prisma.course.findMany({ select: { id: true, title: true } });
  const existingLessons = await prisma.lesson.findMany({ select: { id: true, title: true, courseId: true } });

  const existingUserIds = new Set(existingUsers.map((u) => u.id));
  const existingCourseIds = new Set(existingCourses.map((c) => c.id));
  const existingLessonMap = new Map(existingLessons.map((l) => [l.id, l.courseId]));

  console.log(`         Existing Users: ${existingUserIds.size}, Courses: ${existingCourseIds.size}, Lessons: ${existingLessonMap.size}.\n`);

  // --------------------------------------------------------------------------
  // STEP 4: Transform Comments & Validate Foreign Keys and Hierarchy
  // --------------------------------------------------------------------------
  console.log('[STEP 4] Transforming Comments and verifying relationships...');
  const rawCommentMap = new Map<string, any>();
  for (const raw of rawComments) {
    rawCommentMap.set(String(raw._id), raw);
  }

  const transformedComments: TransformedComment[] = [];

  for (const raw of rawComments) {
    const sourceId = String(raw._id);
    const id = toPostgresUuid('comments', sourceId);

    // Validate User FK
    if (!raw.user) throw new Error(`Comment ${sourceId} is missing user reference!`);
    const userId = toPostgresUuid('users', String(raw.user));
    if (!existingUserIds.has(userId)) {
      throw new Error(`Comment ${sourceId} references non-existent User UUID ${userId} (Mongo user: ${raw.user})!`);
    }

    // Validate Course FK
    if (!raw.course) throw new Error(`Comment ${sourceId} is missing course reference!`);
    const courseId = toPostgresUuid('courses', String(raw.course));
    if (!existingCourseIds.has(courseId)) {
      throw new Error(`Comment ${sourceId} references non-existent Course UUID ${courseId} (Mongo course: ${raw.course})!`);
    }

    // Validate Lesson FK
    if (!raw.lesson) throw new Error(`Comment ${sourceId} is missing lesson reference!`);
    const lessonId = toPostgresUuid('lessons', String(raw.lesson));
    const parentCourseOfLesson = existingLessonMap.get(lessonId);
    if (!parentCourseOfLesson) {
      throw new Error(`Comment ${sourceId} references non-existent Lesson UUID ${lessonId} (Mongo lesson: ${raw.lesson})!`);
    }

    // Verify Lesson belongs to the referenced Course
    if (parentCourseOfLesson !== courseId) {
      throw new Error(`Comment ${sourceId} integrity violation: Lesson ${lessonId} belongs to course ${parentCourseOfLesson}, not ${courseId}!`);
    }

    // Validate Parent Comment FK (reply hierarchy)
    let parentId: string | null = null;
    let sourceParentId: string | null = null;
    if (raw.parentId) {
      sourceParentId = String(raw.parentId);
      if (!rawCommentMap.has(sourceParentId)) {
        throw new Error(`Comment ${sourceId} references non-existent parent comment Mongo _id ${sourceParentId}!`);
      }
      parentId = toPostgresUuid('comments', sourceParentId);
    }

    // Validate Content
    const content = String(raw.content || '').trim();
    if (!content) {
      throw new Error(`Comment ${sourceId} has empty content!`);
    }

    // Validate Level
    const level = typeof raw.level === 'number' ? raw.level : 0;
    if (parentId && level < 1) {
      throw new Error(`Comment ${sourceId} has parentId but level is ${level}!`);
    }

    transformedComments.push({
      sourceId,
      id,
      content,
      lessonId,
      courseId,
      userId,
      parentId,
      sourceParentId,
      level,
      status: mapCommentStatus(raw.status),
      createdAt: new Date(raw.createdAt || Date.now()),
      updatedAt: new Date(raw.updatedAt || raw.createdAt || Date.now())
    });
  }

  // Sort comments: root comments (level 0) first, then replies (level >= 1)
  const rootComments = transformedComments.filter((c) => c.parentId === null);
  const replyComments = transformedComments
    .filter((c) => c.parentId !== null)
    .sort((a, b) => a.level - b.level);

  console.log(`         Transformed ${transformedComments.length} comments (${rootComments.length} root, ${replyComments.length} replies).`);

  // Verify reply hierarchy integrity
  for (const reply of replyComments) {
    const parent = transformedComments.find((c) => c.id === reply.parentId);
    if (!parent) {
      throw new Error(`Reply comment ${reply.id} parent ${reply.parentId} not found in transformed comments list!`);
    }
    console.log(`         Verified Reply hierarchy: Comment [${reply.sourceId}] (level ${reply.level}) -> Parent [${parent.sourceId}] (level ${parent.level})`);
  }
  console.log('         Comment transformations and hierarchy validation PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 5: Transform Comment Reactions & Validate Constraints
  // --------------------------------------------------------------------------
  console.log('[STEP 5] Transforming Comment Reactions (flattened from embedded likes/dislikes)...');
  const transformedReactions: TransformedCommentReaction[] = [];
  const reactionKeySet = new Set<string>();

  for (const raw of rawComments) {
    const sourceCommentId = String(raw._id);
    const commentId = toPostgresUuid('comments', sourceCommentId);
    const commentTimestamp = new Date(raw.updatedAt || raw.createdAt || Date.now());

    // Process Likes
    if (Array.isArray(raw.likes)) {
      for (const rawUserId of raw.likes) {
        const sourceUserId = String(rawUserId);
        const userId = toPostgresUuid('users', sourceUserId);

        if (!existingUserIds.has(userId)) {
          throw new Error(`Comment Reaction references non-existent User UUID ${userId} (Mongo user: ${sourceUserId})!`);
        }

        const uniqueKey = `${commentId}:${userId}`;
        if (reactionKeySet.has(uniqueKey)) {
          throw new Error(`Duplicate reaction found for unique constraint (commentId: ${commentId}, userId: ${userId})!`);
        }
        reactionKeySet.add(uniqueKey);

        const reactionId = toSubEntityUuid('comment_reactions', sourceCommentId, sourceUserId);

        transformedReactions.push({
          sourceCommentId,
          sourceUserId,
          id: reactionId,
          commentId,
          userId,
          type: CommentReactionType.LIKE,
          createdAt: commentTimestamp
        });
      }
    }

    // Process Dislikes
    if (Array.isArray(raw.dislikes)) {
      for (const rawUserId of raw.dislikes) {
        const sourceUserId = String(rawUserId);
        const userId = toPostgresUuid('users', sourceUserId);

        if (!existingUserIds.has(userId)) {
          throw new Error(`Comment Reaction references non-existent User UUID ${userId} (Mongo user: ${sourceUserId})!`);
        }

        const uniqueKey = `${commentId}:${userId}`;
        if (reactionKeySet.has(uniqueKey)) {
          throw new Error(`Duplicate reaction found for unique constraint (commentId: ${commentId}, userId: ${userId})!`);
        }
        reactionKeySet.add(uniqueKey);

        const reactionId = toSubEntityUuid('comment_reactions', sourceCommentId, sourceUserId);

        transformedReactions.push({
          sourceCommentId,
          sourceUserId,
          id: reactionId,
          commentId,
          userId,
          type: CommentReactionType.DISLIKE,
          createdAt: commentTimestamp
        });
      }
    }
  }

  console.log(`         Transformed ${transformedReactions.length} comment reactions (Expected: 1).`);
  for (const r of transformedReactions) {
    console.log(`         Reaction ID: [${r.id}] Type: [${r.type}] Comment: [${r.commentId}] User: [${r.userId}]`);
  }
  console.log('         Comment Reaction transformations PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 6: Execute Atomic Prisma Transaction
  // --------------------------------------------------------------------------
  console.log('[STEP 6] Executing atomic transaction in PostgreSQL...');
  await prisma.$transaction(async (tx) => {
    // 1. Insert Root Comments
    console.log(`         Inserting ${rootComments.length} root comments into "comments" table...`);
    for (const c of rootComments) {
      await tx.comment.create({
        data: {
          id: c.id,
          content: c.content,
          lessonId: c.lessonId,
          courseId: c.courseId,
          userId: c.userId,
          parentId: null,
          level: c.level,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }
      });
    }

    // 2. Insert Reply Comments
    console.log(`         Inserting ${replyComments.length} reply comments into "comments" table...`);
    for (const c of replyComments) {
      await tx.comment.create({
        data: {
          id: c.id,
          content: c.content,
          lessonId: c.lessonId,
          courseId: c.courseId,
          userId: c.userId,
          parentId: c.parentId,
          level: c.level,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        }
      });
    }

    // 3. Insert Comment Reactions
    console.log(`         Inserting ${transformedReactions.length} comment reaction into "comment_reactions" table...`);
    for (const r of transformedReactions) {
      await tx.commentReaction.create({
        data: {
          id: r.id,
          commentId: r.commentId,
          userId: r.userId,
          type: r.type,
          createdAt: r.createdAt
        }
      });
    }
  });

  console.log('         Transaction committed successfully.\n');

  // --------------------------------------------------------------------------
  // STEP 7: Post-Migration Verification & Consistency Checks
  // --------------------------------------------------------------------------
  console.log('[STEP 7] Verifying migrated data in PostgreSQL...');

  const pgComments = await prisma.comment.findMany();
  const pgReactions = await prisma.commentReaction.findMany();

  console.log(`         PostgreSQL comments count:          ${pgComments.length} (Expected: 8)`);
  console.log(`         PostgreSQL comment_reactions count: ${pgReactions.length} (Expected: 1)`);

  if (pgComments.length !== 8) {
    throw new Error(`Verification failed: Expected 8 comments in PostgreSQL, got ${pgComments.length}`);
  }
  if (pgReactions.length !== 1) {
    throw new Error(`Verification failed: Expected 1 comment reaction in PostgreSQL, got ${pgReactions.length}`);
  }

  // Cross-check UUID mapping for comments
  console.log('[STEP 8] Cross-checking deterministic UUID mapping for comments...');
  for (const raw of rawComments) {
    const expectedUuid = toPostgresUuid('comments', String(raw._id));
    const found = pgComments.find((c) => c.id === expectedUuid);
    if (!found) {
      throw new Error(`UUID mapping mismatch: Mongo Comment _id ${raw._id} mapped to ${expectedUuid} not found in PostgreSQL!`);
    }
    // Verify content and status match
    if (found.content !== String(raw.content).trim()) {
      throw new Error(`Content mismatch for Comment ${expectedUuid}!`);
    }
    if (found.status !== mapCommentStatus(raw.status)) {
      throw new Error(`Status mismatch for Comment ${expectedUuid}!`);
    }
  }
  console.log('         Comments UUID and content verification: 8/8 PASSED (100%).\n');

  // Cross-check UUID mapping for reactions
  console.log('[STEP 9] Cross-checking deterministic UUID mapping for comment reactions...');
  for (const tr of transformedReactions) {
    const found = pgReactions.find((r) => r.id === tr.id);
    if (!found) {
      throw new Error(`UUID mapping mismatch: Reaction ${tr.id} not found in PostgreSQL!`);
    }
    if (found.commentId !== tr.commentId || found.userId !== tr.userId || found.type !== tr.type) {
      throw new Error(`Field mismatch for CommentReaction ${tr.id}!`);
    }
  }
  console.log('         Comment Reactions UUID and fields verification: 1/1 PASSED (100%).\n');

  // Verify Foreign Keys in PostgreSQL directly
  console.log('[STEP 10] Verifying Foreign Key relationships in PostgreSQL...');
  for (const c of pgComments) {
    const user = await prisma.user.findUnique({ where: { id: c.userId } });
    if (!user) throw new Error(`FK violation: Comment ${c.id} points to missing User ${c.userId}`);

    const course = await prisma.course.findUnique({ where: { id: c.courseId } });
    if (!course) throw new Error(`FK violation: Comment ${c.id} points to missing Course ${c.courseId}`);

    const lesson = await prisma.lesson.findUnique({ where: { id: c.lessonId } });
    if (!lesson) throw new Error(`FK violation: Comment ${c.id} points to missing Lesson ${c.lessonId}`);

    if (c.parentId) {
      const parent = await prisma.comment.findUnique({ where: { id: c.parentId } });
      if (!parent) throw new Error(`FK violation: Comment ${c.id} points to missing Parent Comment ${c.parentId}`);
    }
  }
  console.log('         All Comment Foreign Keys verified in PostgreSQL: PASSED.');

  for (const r of pgReactions) {
    const comment = await prisma.comment.findUnique({ where: { id: r.commentId } });
    if (!comment) throw new Error(`FK violation: Reaction ${r.id} points to missing Comment ${r.commentId}`);

    const user = await prisma.user.findUnique({ where: { id: r.userId } });
    if (!user) throw new Error(`FK violation: Reaction ${r.id} points to missing User ${r.userId}`);
  }
  console.log('         All CommentReaction Foreign Keys verified in PostgreSQL: PASSED.\n');

  // Verify unique constraints on reactions
  console.log('[STEP 11] Verifying Unique Constraints...');
  const reactionPairs = new Set<string>();
  for (const r of pgReactions) {
    const pair = `${r.commentId}:${r.userId}`;
    if (reactionPairs.has(pair)) {
      throw new Error(`Unique constraint violation: Duplicate reaction pair ${pair}!`);
    }
    reactionPairs.add(pair);
  }
  console.log('         Unique constraint (commentId, userId) verified: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 12: Isolation Verification Across All Business Tables
  // --------------------------------------------------------------------------
  console.log('[STEP 12] Verifying database isolation across all 26 business tables...');
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
    conversations: 0,
    conversation_participants: 0,
    messages: 0,
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

  console.log(`\n         Total database row count: ${totalRows} (Expected: 113)`);
  if (totalRows !== 113) {
    throw new Error(`Total row count mismatch: Expected 113, got ${totalRows}!`);
  }
  console.log('         Isolation verification across all 26 business tables: PASSED.\n');

  // --------------------------------------------------------------------------
  // STEP 13: Read-Only Verification
  // --------------------------------------------------------------------------
  console.log('[STEP 13] Verifying MongoDB Read-Only constraint...');
  const mongoCommentCountAfter = await commentsCol.countDocuments();
  if (mongoCommentCountAfter !== mongoCommentCountBefore) {
    throw new Error(`Critical integrity failure: MongoDB comments count changed from ${mongoCommentCountBefore} to ${mongoCommentCountAfter}!`);
  }
  console.log(`         MongoDB writes executed: ${mongoWritesExecuted}`);
  console.log('         MongoDB Read-Only constraint: PASSED.\n');

  const durationMs = Date.now() - startTime;
  console.log('============================================================================');
  console.log(` PHASE 8 MIGRATION COMPLETED SUCCESSFULLY in ${durationMs}ms               `);
  console.log('============================================================================\n');

  await mongoose.disconnect();
  await prisma.$disconnect();

  return {
    commentsMigrated: pgComments.length,
    reactionsMigrated: pgReactions.length,
    mongoWritesExecuted,
    totalRows
  };
}

runPhase8Migration()
  .then((res) => {
    console.log('Execution Summary:');
    console.log(`  Comments migrated:          ${res.commentsMigrated}/8`);
    console.log(`  Comment reactions migrated: ${res.reactionsMigrated}/1`);
    console.log(`  MongoDB writes executed:    ${res.mongoWritesExecuted}`);
    console.log(`  Total database rows:        ${res.totalRows}/113`);
    console.log('\nPHASE 8 STATUS: SUCCESS');
    process.exit(0);
  })
  .catch((err) => {
    console.error('\n============================================================================');
    console.error(' PHASE 8 MIGRATION FAILED');
    console.error('============================================================================');
    console.error(err);
    process.exit(1);
  });
