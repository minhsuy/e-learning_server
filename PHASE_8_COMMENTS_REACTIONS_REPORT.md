# Phase 8 Migration Report: Comments & Comment Reactions

> **Execution Date/Time**: 2026-10-01T18:17:45+07:00  
> **Duration**: 1254ms  
> **Final Verdict**: **PASS**  
> **Status**: Completed successfully with 100% data integrity, reply hierarchy preservation, and database isolation.

---

## A. Scope

Phase 8 migrated exclusively:
1. `comments` (PostgreSQL table: `comments`)
2. `comment_reactions` (PostgreSQL table: `comment_reactions`)

All other tables belonging to Phase 1–7 were preserved without modification.  
All tables belonging to Phase 9 and Phase 10 (`conversations`, `conversation_participants`, `messages`, `message_reads`, `notifications`) were strictly untouched.

---

## B. Source / Target Counts

| Entity / Table | MongoDB (Source) | PostgreSQL (Before) | PostgreSQL (After) | Status |
|:---|:---:|:---:|:---:|:---:|
| **comments** | 8 | 0 | **8** | ✅ 100% MATCH |
| **comment_reactions** | 1 (embedded) | 0 | **1** | ✅ 100% MATCH |
| **Pre-migrated records** (Phase 1–7) | 104 | 104 | **104** | ✅ UNCHANGED |
| **Unmigrated tables** (Phase 9–10) | 15 | 0 | **0** | ✅ STRICTLY ISOLATED |
| **Total database rows** | — | **104** | **113** | ✅ EXACT MATCH (+9 rows) |

---

## C. Schema Mapping Decisions

### 1. MongoDB Source Schema
```typescript
interface Comment {
  _id: Schema.Types.ObjectId;
  content: string;
  lesson: Schema.Types.ObjectId;   // Ref: 'Lesson'
  course: Schema.Types.ObjectId;   // Ref: 'Course'
  user: Schema.Types.ObjectId;     // Ref: 'User'
  status: CommentStatus;           // 'approved' | 'pending' | 'rejected'
  parentId?: Schema.Types.ObjectId;// Ref: 'Comment'
  level: number;                   // 0 for root, 1+ for replies
  likes: Types.ObjectId[];         // Array of User ObjectIds
  dislikes: Types.ObjectId[];      // Array of User ObjectIds
  createdAt: Date;
  updatedAt: Date;
}
```

### 2. PostgreSQL / Prisma Target Schema
```prisma
model Comment {
  id        String        @id @default(uuid()) @db.Uuid
  content   String        @db.Text
  lessonId  String        @map("lesson_id") @db.Uuid
  courseId  String        @map("course_id") @db.Uuid
  userId    String        @map("user_id") @db.Uuid
  parentId  String?       @map("parent_id") @db.Uuid
  level     Int           @default(0)
  status    CommentStatus @default(APPROVED)
  createdAt DateTime      @default(now()) @map("created_at")
  updatedAt DateTime      @updatedAt @map("updated_at")

  lesson    Lesson            @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  course    Course            @relation(fields: [courseId], references: [id], onDelete: Cascade)
  user      User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent    Comment?          @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[]         @relation("CommentReplies")
  reactions CommentReaction[]

  @@index([lessonId, status])
  @@index([courseId])
  @@index([parentId])
  @@map("comments")
}

model CommentReaction {
  id        String              @id @default(uuid()) @db.Uuid
  commentId String              @map("comment_id") @db.Uuid
  userId    String              @map("user_id") @db.Uuid
  type      CommentReactionType
  createdAt DateTime            @default(now()) @map("created_at")

  comment   Comment             @relation(fields: [commentId], references: [id], onDelete: Cascade)
  user      User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([commentId, userId])
  @@map("comment_reactions")
}
```

### 3. Field Mapping Details

#### `comments`
- `_id` $\rightarrow$ `id`: Deterministic UUID v5 via `toPostgresUuid("comments", raw._id)`.
- `content` $\rightarrow$ `content`: Trimmed non-empty string.
- `lesson` $\rightarrow$ `lesson_id`: Foreign key mapped via `toPostgresUuid("lessons", raw.lesson)`.
- `course` $\rightarrow$ `course_id`: Foreign key mapped via `toPostgresUuid("courses", raw.course)`.
- `user` $\rightarrow$ `user_id`: Foreign key mapped via `toPostgresUuid("users", raw.user)`.
- `parentId` $\rightarrow$ `parent_id`: Nullable foreign key mapped via `toPostgresUuid("comments", raw.parentId)`.
- `level` $\rightarrow$ `level`: Preserved integer (`0` for roots, `1` for replies).
- `status` $\rightarrow$ `status`: Mapped to Prisma enum `CommentStatus.APPROVED` (`approved` in Mongo source).
- `createdAt` $\rightarrow$ `created_at`: Preserved UTC timestamp.
- `updatedAt` $\rightarrow$ `updated_at`: Preserved UTC timestamp.

#### `comment_reactions`
- Flattened from MongoDB `comment.likes` and `comment.dislikes` arrays.
- `id`: Deterministic UUID v5 via `toSubEntityUuid("comment_reactions", commentSourceId, userSourceId)`.
- `comment_id`: Foreign key mapped via `toPostgresUuid("comments", commentSourceId)`.
- `user_id`: Foreign key mapped via `toPostgresUuid("users", userSourceId)`.
- `type`: `CommentReactionType.LIKE` (for elements from `likes`) and `CommentReactionType.DISLIKE` (for elements from `dislikes`).
- `created_at`: Inherited from `comment.updatedAt` (the timestamp when reaction was persisted in MongoDB).

### 4. Reaction Primary Key Strategy
- Prisma model `CommentReaction` defines `id String @id @default(uuid()) @db.Uuid` alongside `@@unique([commentId, userId])`.
- In `id-mapper.ts`, `'comment_reactions'` is registered in `MIGRATION_ENTITIES`.
- Strategy: Generated a deterministic UUID v5 sub-entity key: `toSubEntityUuid('comment_reactions', commentSourceId, userSourceId)`.
- Canonical key: `comment_reactions:<comment_mongo_id>:<user_mongo_id>`.
- Fully collision-safe, deterministic, idempotent, and verified by unit test `Test 8b` in `scripts/migration-utils/id-mapper.test.ts`.

### 5. Parent / Reply Strategy
- Self-referencing foreign key constraint: `parentId -> comments(id)`.
- Migration split comments into:
  1. Root comments (`parentId === null`, `level === 0`): 7 records inserted first.
  2. Reply comments (`parentId !== null`, sorted by `level ASC`): 1 record inserted second.
- Verified that parent comment exists before child comment insertion within the transaction.

---

## D. UUID Mapping

- Total Comment UUIDs generated: **8 / 8** (100% deterministic RFC 4122 v5)
- Total Comment Reaction UUIDs generated: **1 / 1** (100% deterministic RFC 4122 v5 via `toSubEntityUuid`)
- Security note: No sensitive credentials, tokens, or hashes are exposed in any mapping or identifier.

### Sample Deterministic UUID Mapping Verification
| MongoDB Source ID | Entity | PostgreSQL Target UUID | Verification |
|:---|:---|:---|:---:|
| `68eccc8b1ad0a8e2a36f98f0` | `comments` (root) | `57cba382-72f3-5246-a05e-85191c9535bf` | ✅ Verified |
| `68ecccf11ad0a8e2a36f9913` | `comments` (reply) | `d4b53631-ecf4-5507-9a6a-2bf9fe6dc2f9` | ✅ Verified |
| `68ecccf11ad0a8e2a36f9913` + `68dcf8f9e3617ec76053b4d7` | `comment_reactions` | `b6f32a83-5844-56e9-a4c0-faba0c4a1331` | ✅ Verified |

---

## E. Relationships

| Relationship | Source Reference | PostgreSQL Reference | Integrity Check |
|:---|:---|:---|:---:|
| `Comment.userId` $\rightarrow$ `users.id` | 3 distinct users (`68dcf8f9...`, `68cbde25...`, `68d3f707...`) | `users` table | ✅ 8/8 Valid |
| `Comment.courseId` $\rightarrow$ `courses.id` | Course `68d3f7db...` ("ReactJS Advanced - Update 2025") | `courses` table (`f0dde7bb-1bf6-5602-a489-cd324132c68a`) | ✅ 8/8 Valid |
| `Comment.lessonId` $\rightarrow$ `lessons.id` | Lesson `68db37aa...` ("Giới thiệu về ReactJS") | `lessons` table (`96362244-88aa-5e36-96fb-fe7d968bdf4f`) | ✅ 8/8 Valid |
| `Lesson.courseId` $\rightarrow$ `courses.id` | Lesson belongs to target Course | Verified matching course UUID | ✅ 8/8 Matched |
| `Comment.parentId` $\rightarrow$ `comments.id` | Reply points to `68eccc8b1ad0a8e2a36f98f0` | `comments` table (`57cba382-72f3-5246-a05e-85191c9535bf`) | ✅ 1/1 Valid |
| `CommentReaction.commentId` $\rightarrow$ `comments.id` | Reaction on `68ecccf11ad0a8e2a36f9913` | `comments` table (`d4b53631-ecf4-5507-9a6a-2bf9fe6dc2f9`) | ✅ 1/1 Valid |
| `CommentReaction.userId` $\rightarrow$ `users.id` | Liking user `68dcf8f9e3617ec76053b4d7` | `users` table (`c55de839-f059-519c-8820-b16aa17fb9c3`) | ✅ 1/1 Valid |

---

## F. Data Integrity

1. **Count Mismatches**: 0. Exactly 8 comments and 1 comment reaction migrated.
2. **Foreign Key Violations**: 0. Every referenced User, Course, Lesson, and Parent Comment verified.
3. **Unique Constraint Violations**: 0. `(commentId, userId)` unique constraint strictly satisfied.
4. **Enum Mismatches**: 0. `CommentStatus` (APPROVED) and `CommentReactionType` (LIKE) cleanly mapped.
5. **Nullability Issues**: 0. Only `parentId` is null for root comments; all required attributes populated.
6. **Content Preservation**: 100%. All UTF-8 Vietnamese and English comment text preserved without truncation.
7. **Reply Hierarchy Verification**: 100%. 1 reply comment correctly references root comment `57cba382-72f3-5246-a05e-85191c9535bf` with `level: 1`.

---

## G. MongoDB Read-Only

```text
MongoDB writes executed: 0
```
- Only `find({}).toArray()` and `countDocuments()` were executed on MongoDB Atlas.
- Post-migration count on MongoDB Atlas `comments` confirmed unchanged: **8**.

---

## H. Database Isolation

### PostgreSQL Table Counts Before & After Phase 8

| Table Name | Phase | Before Phase 8 | After Phase 8 | Expected | Isolation Status |
|:---|:---:|:---:|:---:|:---:|:---:|
| `users` | 1 | 7 | 7 | 7 | ✅ UNCHANGED |
| `categories` | 1 | 3 | 3 | 3 | ✅ UNCHANGED |
| `courses` | 2 | 8 | 8 | 8 | ✅ UNCHANGED |
| `course_faqs` | 2 | 8 | 8 | 8 | ✅ UNCHANGED |
| `chapters` | 3 | 12 | 12 | 12 | ✅ UNCHANGED |
| `lessons` | 3 | 7 | 7 | 7 | ✅ UNCHANGED |
| `quizzes` | 4 | 3 | 3 | 3 | ✅ UNCHANGED |
| `questions` | 4 | 5 | 5 | 5 | ✅ UNCHANGED |
| `question_options` | 4 | 20 | 20 | 20 | ✅ UNCHANGED |
| `quiz_submissions` | 5 | 2 | 2 | 2 | ✅ UNCHANGED |
| `quiz_submission_answers` | 5 | 4 | 4 | 4 | ✅ UNCHANGED |
| `orders` | 6 | 8 | 8 | 8 | ✅ UNCHANGED |
| `coupons` | 6 | 2 | 2 | 2 | ✅ UNCHANGED |
| `coupon_courses` | 6 | 2 | 2 | 2 | ✅ UNCHANGED |
| `enrollments` | 6 | 5 | 5 | 5 | ✅ UNCHANGED |
| `progress` | 7 | 4 | 4 | 4 | ✅ UNCHANGED |
| `certificates` | 7 | 1 | 1 | 1 | ✅ UNCHANGED |
| `ratings` | 7 | 1 | 1 | 1 | ✅ UNCHANGED |
| `favorite_courses` | 7 | 2 | 2 | 2 | ✅ UNCHANGED |
| **`comments`** | **8** | **0** | **8** | **8** | ✅ **MIGRATED** |
| **`comment_reactions`** | **8** | **0** | **1** | **1** | ✅ **MIGRATED** |
| `conversations` | 9 | 0 | 0 | 0 | ✅ UNCHANGED |
| `conversation_participants` | 9 | 0 | 0 | 0 | ✅ UNCHANGED |
| `messages` | 9 | 0 | 0 | 0 | ✅ UNCHANGED |
| `message_reads` | 9 | 0 | 0 | 0 | ✅ UNCHANGED |
| `notifications` | 10 | 0 | 0 | 0 | ✅ UNCHANGED |
| **TOTAL ROWS** | | **104** | **113** | **113** | ✅ **PERFECT ISOLATION** |

---

## I. Errors / Warnings

- **Errors**: None.
- **Warnings**: None.
- All pre-flight checks, atomic transactions, post-migration verifications, and cross-checks passed on first execution.

---

## J. Final Verdict

# **PASS**

All critical checks, foreign keys, reply hierarchy dependencies, unique constraints, and isolation rules succeeded completely.

Migration has been **STRICTLY STOPPED** after Phase 8 as requested. Phase 9 has not been started.
