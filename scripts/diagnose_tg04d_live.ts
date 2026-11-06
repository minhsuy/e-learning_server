import dotenv from 'dotenv'
dotenv.config()
import { prisma } from '../src/config/prisma'
import { recognizeAnalyticsIntent } from '../src/services/geminiIntent.service'
import { executeRecognizedAnalyticsIntent } from '../src/services/analyticsDispatcher.service'

async function testSingleLiveCourseQuery() {
  console.log('--- TG-04D: SINGLE LIVE GEMINI TEST QUERY (CONSERVING QUOTA) ---')
  const teacher = await prisma.user.findFirst({
    where: { username: 'teacher02' }
  })
  if (!teacher) {
    throw new Error('teacher02 not found')
  }

  // Find a real course owned by teacher02
  const course = await prisma.course.findFirst({
    where: { authorId: teacher.id, isDestroyed: false }
  })
  if (!course) {
    throw new Error('No course found for teacher02')
  }

  const query = `Khóa học ${course.title} tháng trước bán được bao nhiêu tiền?`
  console.log(`QUERY: "${query}"`)

  const intentRes = await recognizeAnalyticsIntent(query)
  console.log('RECOGNIZED INTENT RESULT:', {
    intent: intentRes.intent,
    operation: intentRes.operation,
    period: intentRes.period,
    courseName: intentRes.courseName,
    metric: intentRes.metric,
    status: intentRes.status,
    modelUsed: intentRes.modelUsed
  })

  const execRes = await executeRecognizedAnalyticsIntent(teacher.id, teacher.username, intentRes)
  console.log(`EXECUTION SUCCESS: ${execRes.success}`)
  console.log('\n--- TELEGRAM FORMATTED MESSAGE ---')
  console.log(execRes.formattedMessage)
  console.log('----------------------------------\n')
}

testSingleLiveCourseQuery()
  .catch((err) => {
    console.error('Live test error:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

