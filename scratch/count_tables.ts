import { prisma } from '../src/config/prisma'

async function main() {
  const counts = {
    users: await prisma.user.count(),
    categories: await prisma.category.count(),
    courses: await prisma.course.count(),
    chapters: await prisma.chapter.count(),
    lessons: await prisma.lesson.count(),
    quizzes: await prisma.quiz.count(),
    questions: await prisma.question.count(),
    orders: await prisma.order.count(),
    coupons: await prisma.coupon.count(),
    enrollments: await prisma.enrollment.count(),
    progress: await prisma.progress.count(),
    certificates: await prisma.certificate.count(),
    favoriteCourses: await prisma.favoriteCourse.count(),
    ratings: await prisma.rating.count(),
    comments: await prisma.comment.count(),
    commentReactions: await prisma.commentReaction.count(),
    conversations: await prisma.conversation.count(),
    messages: await prisma.message.count(),
    notifications: await prisma.notification.count()
  }
  console.log(JSON.stringify(counts, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
