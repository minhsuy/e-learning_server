import { PrismaClient } from '@prisma/client'
import dotenv from 'dotenv'

dotenv.config()

/**
 * Global declaration for development hot-reloading (prevents creating multiple
 * Prisma Client connections in Node.js when nodemon restarts).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prismaInstance: PrismaClient | undefined
}

const createPrismaClient = (): PrismaClient => {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    errorFormat: 'minimal'
  })
  return client
}

export const prisma: PrismaClient = global.__prismaInstance || createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  global.__prismaInstance = prisma
}

/**
 * Type helper for transactional Prisma operations.
 * Allows repository functions to accept either the root Prisma client or an active transaction context.
 */
export type PrismaTransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Connect to PostgreSQL and log status without exposing sensitive credentials.
 */
export async function connectPrisma(): Promise<void> {
  try {
    await prisma.$connect()
    // Mask sensitive credentials from DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || ''
    const maskedUrl = dbUrl.replace(/:\/\/[^@]+@/, '://***:***@')
    console.log(` Connected to PostgreSQL database via Prisma [${maskedUrl}]`)
  } catch (error: any) {
    console.error(' Failed to connect to PostgreSQL database via Prisma:', error.message)
    throw error
  }
}

/**
 * Disconnect cleanly from PostgreSQL.
 */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect()
  console.log(' Disconnected from PostgreSQL database via Prisma')
}

export default prisma
