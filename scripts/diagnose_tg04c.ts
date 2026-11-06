import dotenv from 'dotenv'
dotenv.config()
import { prisma } from '../src/config/prisma'
import { recognizeAnalyticsIntent } from '../src/services/geminiIntent.service'
import { executeRecognizedAnalyticsIntent } from '../src/services/analyticsDispatcher.service'

async function testAllLive() {
  const teacher = await prisma.user.findFirst({
    where: { username: 'teacher02' }
  })
  if (!teacher) {
    throw new Error('teacher02 not found')
  }

  const queries = [
    'Tháng này tôi kiếm được bao nhiêu tiền?',
    'Hôm nay có mấy đơn hàng?',
    'Doanh thu tháng này so với tháng trước thế nào?',
    'Phân tích tình hình kinh doanh tháng này giúp tôi',
    'Tôi nên cải thiện việc bán khóa học như thế nào?'
  ]

  for (const q of queries) {
    console.log(`\n========================================`)
    console.log(`QUERY: "${q}"`)
    const intentRes = await recognizeAnalyticsIntent(q)
    console.log(`INTENT: ${intentRes.intent} | OP: ${intentRes.operation || 'lookup'} | STATUS: ${intentRes.status}`)
    const execRes = await executeRecognizedAnalyticsIntent(teacher.id, teacher.username, intentRes)
    console.log(`EXEC RESULT (success: ${execRes.success}):`)
    console.log(execRes.formattedMessage)
  }
}

testAllLive()
  .catch(err => {
    console.error('Test error:', err)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
