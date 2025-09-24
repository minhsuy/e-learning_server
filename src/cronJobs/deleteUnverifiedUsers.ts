import cron from 'node-cron'
import UserModel from '~/models/user.model'
import dotenv from 'dotenv'

dotenv.config()

const expireMinutes = parseInt(process.env.UNVERIFIED_USER_EXPIRE_MINUTES || '1440', 10)

const cronExpression = process.env.UNVERIFIED_USER_CRON_EXPRESSION || '0 0 * * *'

console.log(`🟢 Cron job scheduled with expression "${cronExpression}", expireMinutes = ${expireMinutes}`)

cron.schedule(cronExpression, async () => {
  try {
    const expireTime = new Date(Date.now() - expireMinutes * 60 * 1000)

    const result = await UserModel.deleteMany({
      isVerified: { $ne: '' },
      createdAt: { $lt: expireTime }
    })

    if (result.deletedCount && result.deletedCount > 0) {
      console.log(`⏰ Cron job: Deleted ${result.deletedCount} unverified users`)
    } else {
      console.log('✅ Cron job: No unverified users to delete')
    }
  } catch (error) {
    console.error('❌ Cron job failed:', error)
  }
})
