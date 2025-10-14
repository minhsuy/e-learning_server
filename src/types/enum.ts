export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  TEACHER = 'teacher'
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum CourseStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}
export enum CourseLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced'
}
export enum CourseType {
  PAID = 'paid',
  FREE = 'free'
}

export enum LessonType {
  VIDEO = 'video',
  TEXT = 'text'
}

export enum ECouponType {
  PERCENTAGE = 'percentage',
  NUMBER = 'number'
}
export enum EOrderStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected'
}
export enum EEnrollmentStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELED = 'canceled'
}
export enum CommentStatus {
  APPROVED = 'approved',
  PENDING = 'pending',
  REJECTED = 'rejected'
}
export enum ERatingStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}
export enum ENotificationType {
  COMMENT = 'comment',
  RATING = 'rating',
  ORDER = 'order',
  MESSAGE = 'message',
  SYSTEM = 'system',
  COURSE = 'course',
  LESSON = 'lesson',
  COMMENT_REPLY = 'comment_reply'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  FILL_IN_BLANK = 'fill_in_blank'
}
