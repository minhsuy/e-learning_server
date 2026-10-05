# Phase 9 Migration Report: Conversations, Participants, Messages & Message Reads

> **Execution Date/Time**: 2026-10-01T18:23:45+07:00  
> **Duration**: 1699ms  
> **Final Verdict**: **PASS**  
> **Status**: Completed successfully with 100% data integrity, chat hierarchy preservation, message ordering, and complete database isolation.

---

## 1. Executive Summary

| Entity / Table | MongoDB (Source) | PostgreSQL (Before) | PostgreSQL (After) | Status |
|:---|:---:|:---:|:---:|:---:|
| **conversations** | 2 | 0 | **2** | ✅ 100% MATCH |
| **conversation_participants** | 6 (embedded) | 0 | **6** | ✅ 100% MATCH |
| **messages** | 12 | 0 | **12** | ✅ 100% MATCH |
| **message_reads** | 0 (embedded `readBy`) | 0 | **0** | ✅ 100% MATCH |
| **Pre-migrated records** (Phase 1–8) | 113 | 113 | **113** | ✅ UNCHANGED |
| **Unmigrated tables** (`notifications` Phase 10) | 0 | 0 | **0** | ✅ STRICTLY ISOLATED |
| **Total database rows** | — | **113** | **133** | ✅ EXACT MATCH (+20 rows) |

---

## 2. Environment Information

- **MongoDB Source Database**: `e-learning` (MongoDB Atlas)
- **MongoDB Connection Mode**: `READ_ONLY` (Zero writes executed)
- **PostgreSQL Target Database**: `tmdemy` (localhost:5432)
- **PostgreSQL Schema Status**: Intact, unchanged, using Prisma Client with migrations applied
- **Transaction Scope**: Single atomic transaction covering `conversations`, `conversation_participants`, and `messages` inserts
- **UUID Generator**: RFC 4122 v5 namespace deterministic hashing via `scripts/migration-utils/id-mapper.ts`

---

## 3. Schema Mapping Decisions

### 3.1. MongoDB Source Schemas

#### Conversation Schema
```typescript
interface IConversation {
  _id: Types.ObjectId;
  participants: Types.ObjectId[]; // Ref: 'User'
  isGroup: boolean;
  name?: string;
  course?: Types.ObjectId;        // Ref: 'Course'
  lastMessage?: Types.ObjectId;   // Ref: 'Message'
  createdAt: Date;
  updatedAt: Date;
}
```

#### Message Schema
```typescript
interface IMessage {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;   // Ref: 'Conversation'
  sender: Types.ObjectId;         // Ref: 'User'
  content: string;
  type: EMessageType;             // 'text' | 'image' | 'file'
  readBy: Types.ObjectId[];       // Ref: 'User' (empty in source)
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.2. PostgreSQL / Prisma Target Schemas

```prisma
model Conversation {
  id            String   @id @default(uuid()) @db.Uuid
  isGroup       Boolean  @default(false) @map("is_group")
  name          String?  @db.VarChar(255)
  courseId      String?  @map("course_id") @db.Uuid
  lastMessageId String?  @map("last_message_id") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  course       Course?                   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  participants ConversationParticipant[]
  messages     Message[]

  @@map("conversations")
}

model ConversationParticipant {
  conversationId String   @map("conversation_id") @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  joinedAt       DateTime @default(now()) @map("joined_at")

  conversation Conversation @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  user         User         @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([conversationId, userId])
  @@index([userId])
  @@map("conversation_participants")
}

model Message {
  id             String       @id @default(uuid()) @db.Uuid
  conversationId String       @map("conversation_id") @db.Uuid
  senderId       String       @map("sender_id") @db.Uuid
  content        String       @db.Text
  type           EMessageType @default(TEXT)
  isEdited       Boolean      @default(false) @map("is_edited")
  createdAt      DateTime     @default(now()) @map("created_at")
  updatedAt      DateTime     @updatedAt @map("updated_at")

  conversation Conversation  @relation(fields: [conversationId], references: [id], onDelete: Cascade)
  sender       User          @relation("MessageSender", fields: [senderId], references: [id], onDelete: Restrict)
  reads        MessageRead[]

  @@index([conversationId, createdAt])
  @@map("messages")
}

model MessageRead {
  messageId String   @map("message_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  readAt    DateTime @default(now()) @map("read_at")

  message Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  user    User    @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@id([messageId, userId])
  @@map("message_reads")
}
```

### 3.3. Field Mapping Decisions

1. **`conversations`**:
   - `_id` $\rightarrow$ `id`: Deterministic UUID v5 via `toPostgresUuid("conversations", raw._id)`.
   - `isGroup` $\rightarrow$ `is_group`: Preserved boolean.
   - `name` $\rightarrow$ `name`: Preserved title (`"ReactJS Advanced - Update 2025"` for group chat; `null` for 1-1 chat).
   - `course` $\rightarrow$ `course_id`: Foreign key mapped via `toPostgresUuid("courses", raw.course)` for group chat; `null` for 1-1 chat.
   - `lastMessage` $\rightarrow$ `last_message_id`: Mapped via `toPostgresUuid("messages", raw.lastMessage)`. Verified points to existing message.
   - `createdAt` $\rightarrow$ `created_at`: Preserved UTC timestamp.
   - `updatedAt` $\rightarrow$ `updated_at`: Preserved UTC timestamp.

2. **`conversation_participants`**:
   - Flattened from `conversation.participants` array.
   - `conversationId`: Foreign key mapped via `toPostgresUuid("conversations", rawConv._id)`.
   - `userId`: Foreign key mapped via `toPostgresUuid("users", rawUserId)`.
   - Primary Key: Composite `@@id([conversationId, userId])`. **No UUID generated**.
   - `joinedAt` $\rightarrow$ `joined_at`: Set to `conversation.createdAt` to reflect accurate membership time.

3. **`messages`**:
   - `_id` $\rightarrow$ `id`: Deterministic UUID v5 via `toPostgresUuid("messages", raw._id)`.
   - `conversation` $\rightarrow$ `conversation_id`: Foreign key mapped via `toPostgresUuid("conversations", raw.conversation)`.
   - `sender` $\rightarrow$ `sender_id`: Foreign key mapped via `toPostgresUuid("users", raw.sender)`.
   - `content` $\rightarrow$ `content`: UTF-8 text string preserved completely without truncation.
   - `type` $\rightarrow$ `type`: Mapped to Prisma enum `EMessageType.TEXT` (`"text"` in source).
   - `isEdited` $\rightarrow$ `is_edited`: Preserved boolean (`false` for all 12 messages).
   - `createdAt` $\rightarrow$ `created_at`: Preserved exact millisecond-precision UTC timestamp.
   - `updatedAt` $\rightarrow$ `updated_at`: Preserved exact millisecond-precision UTC timestamp.

4. **`message_reads`**:
   - MongoDB source documents contain `readBy: []` for all 12 messages.
   - 0 records inserted, exactly matching source reality.

---

## 4. UUID & Primary Key Verification

- **Conversations UUIDs generated**: **2 / 2** (100% deterministic RFC 4122 v5)
- **Messages UUIDs generated**: **12 / 12** (100% deterministic RFC 4122 v5)
- **Conversation Participants Composite PKs**: **6 / 6** `(conversationId, userId)` verified unique.
- **Message Reads Composite PKs**: **0 / 0** (No reads in source data).

### Sample Mappings
| MongoDB Source ID | Entity | PostgreSQL Target Identifier | Type |
|:---|:---|:---|:---:|
| `68f1dcdb0052411ea7c73a5b` | `conversations` (group) | `c44f9756-f63a-5e29-982e-cb647bf92ec3` | UUID v5 |
| `68f1db483cd33f224e5d8d3a` | `conversations` (1-1) | `3dcaa9d2-72c4-5a34-b0d0-13089075352e` | UUID v5 |
| `68f1dcdb...` + `68d3f707...` | `conversation_participants` | `(c44f9756..., 13608f92...)` | Composite PK |
| `690607d998424643f32adcf6` | `messages` | `c0c16ae4-2037-58f7-873d-9a6ca03e06a3` | UUID v5 |
| `690e9c628f702b1a58b3e476` | `messages` (lastMsg group) | `e1d44111-9252-5a31-b845-866bc163cf5f` | UUID v5 |

---

## 5. Foreign Key & Cross-Entity Integrity

| Foreign Key | Target Table | Validations | Result |
|:---|:---|:---:|:---:|
| `Conversation.courseId` | `courses.id` | 1/1 valid (Group chat points to "ReactJS Advanced - Update 2025") | ✅ PASSED |
| `ConversationParticipant.conversationId` | `conversations.id` | 6/6 valid across both conversations | ✅ PASSED |
| `ConversationParticipant.userId` | `users.id` | 6/6 valid across 4 distinct registered users | ✅ PASSED |
| `Message.conversationId` | `conversations.id` | 12/12 valid (10 in 1-1 chat, 2 in group chat) | ✅ PASSED |
| `Message.senderId` | `users.id` | 12/12 valid | ✅ PASSED |
| **Sender $\in$ Participants** | `conversation_participants` | **12/12 senders are active members of the conversation** | ✅ PASSED |

---

## 6. Message Ordering & Content Preservation

1. **Ordering**:
   - Messages were sorted by MongoDB `createdAt` ascending prior to insertion.
   - Post-migration query `ORDER BY created_at ASC` returned all 12 messages in the exact chronological sequence as source.
2. **Chronological Range**:
   - First message: `2025-11-01T13:15:05.877Z` (`"hello"`)
   - Last message: `2025-11-08T01:26:58.346Z` (`"asdasd"`)
3. **Content Integrity**:
   - Vietnamese and English text (`"hello"`, `"chao ban"`, `"xin chao ban nhe"`, `"hello ban"`, `"hi ban nhe"`, `"ok"`, `"asdasd"`, `"sdasd"`) preserved with 100% character fidelity.
4. **Duplicate Prevention**:
   - No duplicate messages or participants detected.

---

## 7. MongoDB Read-Only Verification

```text
MongoDB writes executed: 0
```
- Only `find({}).toArray()`, `sort()`, and `countDocuments()` operations were executed on MongoDB Atlas.
- Post-migration count on MongoDB Atlas `conversations` confirmed unchanged: **2**.
- Post-migration count on MongoDB Atlas `messages` confirmed unchanged: **12**.

---

## 8. Database Isolation

### Complete 26 Business Tables Status Before & After Phase 9

| Table Name | Phase | Before Phase 9 | After Phase 9 | Expected | Isolation Status |
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
| `comments` | 8 | 8 | 8 | 8 | ✅ UNCHANGED |
| `comment_reactions` | 8 | 1 | 1 | 1 | ✅ UNCHANGED |
| **`conversations`** | **9** | **0** | **2** | **2** | ✅ **MIGRATED** |
| **`conversation_participants`** | **9** | **0** | **6** | **6** | ✅ **MIGRATED** |
| **`messages`** | **9** | **0** | **12** | **12** | ✅ **MIGRATED** |
| **`message_reads`** | **9** | **0** | **0** | **0** | ✅ **VERIFIED (0 reads)** |
| `notifications` | 10 | 0 | 0 | 0 | ✅ UNCHANGED |
| **TOTAL ROWS** | | **113** | **133** | **133** | ✅ **PERFECT ISOLATION (+20 rows)** |

---

## 9. Errors / Warnings

- **Errors**: None.
- **Warnings**: None.
- All pre-flight checks, atomic transactions, post-migration verifications, sender-as-participant validations, and cross-checks passed completely.

---

## 10. Security Compliance

- No passwords, password hashes, refresh tokens, JWTs, OTPs, reset tokens, API keys, or connection credentials are leaked in this report or repository logs.

---

## 11. Final Verdict

# **PASS**

All critical checks, foreign keys, sender-membership constraints, message ordering, composite primary keys, and database isolation rules succeeded completely.

Migration has been **STRICTLY STOPPED** after Phase 9 as requested. Phase 10 has not been started.
