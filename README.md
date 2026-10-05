🎓 E-Learning Platform — Realtime Courses, Chat & Certification

A modern e-learning web platform built with Node.js + Express + TypeScript, designed to connect teachers and students in a dynamic learning environment.
The system supports course management, interactive quizzes, automatic certificate generation (Cloudinary PDF integration), and realtime Q&A chat via Socket.IO.

🚀 Core Features :

```
👩‍🏫 For Teachers

Create, manage and publish online courses.

Monitor student enrollments and progress in realtime.

Auto-generate course completion certificates uploaded to Cloudinary.

Engage students through group chat and instant notifications.

🎓 For Students

Enroll and track progress through modular lessons.

Take quizzes with scoring and feedback.

Instantly receive digital certificates when course requirements are met.

Realtime messaging with teachers for direct Q&A.
```

⚙️ Technical Highlights

```
Backend: Node.js, Express, TypeScript

Target Database: PostgreSQL 16.11

Target ORM: Prisma ORM 6.4.1 (Prisma Client Singleton)

Validation: Express Validator (HTTP Transport) + Zod (Application Domain Models)

Architecture: Strict Layered Architecture (Router -> Middleware -> Controller -> Service -> Functional Repository -> Prisma Client -> PostgreSQL)

Realtime Communication: Socket.IO

Cloud Storage: Cloudinary for PDF certificates

Authentication: JWT (Access Token & Refresh Token) + Role-based Access Control (ADMIN, USER, TEACHER)
```

🛠️ Setup & Installation

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
# Copy .env.example to .env and configure your PostgreSQL DATABASE_URL and secrets
cp .env.example .env

# 3. Generate Prisma Client
npx prisma generate

# 4. Verify Database Migration Status
npx prisma migrate status

# 5. Run Development Server
npm run dev
```

💬 Realtime Chat System

```
The platform includes a full conversation/message system:

One-to-one and group chat models (Conversation, Message)

Realtime message delivery via Socket.IO rooms (io.to(conversationId).emit(...))

Message editing, deletion, and synchronization across clients

Automatic enrollment sync: when a student joins a course, they are auto-added to the course Q&A chat group.
```

🧾 Certificate Generation

```
Students automatically receive a certificate PDF once progress ≥ 70 % and quiz score ≥ 60 %.

Certificates are generated with PDFKit and stored on Cloudinary — downloadable anytime.
```
