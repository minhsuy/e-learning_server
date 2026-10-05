import prisma from '../src/config/prisma'

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      username: true,
      role: true,
      isVerified: true,
      status: true
    }
  })
  console.log('USERS IN DB:')
  console.log(JSON.stringify(users, null, 2))

  const categories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      isDestroyed: true
    }
  })
  console.log('CATEGORIES IN DB:')
  console.log(JSON.stringify(categories, null, 2))
}

listUsers().finally(() => prisma.$disconnect())
