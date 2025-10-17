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

Database: MongoDB (Mongoose ODM)

Realtime Communication: Socket.IO

Cloud Storage: Cloudinary for PDF certificates

Authentication: JWT + Role-based Access Control

Architecture: Service-controller-middleware structure with async handlers

Deployment Ready: Modular setup for AWS / Docker integration
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
