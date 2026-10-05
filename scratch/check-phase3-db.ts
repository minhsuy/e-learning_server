import prisma from '../src/config/prisma'

async function checkCounts() {
  const coursesCount = await prisma.course.count()
  const chaptersCount = await prisma.chapter.count()
  const lessonsCount = await prisma.lesson.count()
  const faqsCount = await prisma.courseFaq.count()

  console.log({
    coursesCount,
    chaptersCount,
    lessonsCount,
    faqsCount
  })

  if (coursesCount > 0) {
    const sampleCourse = await prisma.course.findFirst({
      include: {
        category: true,
        author: { select: { id: true, username: true, role: true } },
        chapters: { include: { lessons: true } },
        faqs: true
      }
    })
    console.log('Sample Course in Postgres:', JSON.stringify(sampleCourse, null, 2))
  }
}

checkCounts().finally(() => prisma.$disconnect())
