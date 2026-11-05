import { prisma } from '../../src/config/prisma'
import { TARGET_COURSES, generateCurriculumForCourse } from './curriculum-data'
import { generateDemoUsersList, DemoUserProfile } from './demo-users-data'
import { EEnrollmentStatus, XPTransactionType } from '@prisma/client'

// Precomputed valid bcrypt hash for 'Password123@'
const DEMO_PASSWORD_HASH = '$2b$10$FvSMBEoAlMaKZ3vJPQg/mOcYL2232OMWegcYZ7uAREDuRbL3H/cWy'

/**
 * Format Date to YYYY-MM-DD in Asia/Ho_Chi_Minh (UTC+7)
 */
function toVietnamDateStr(date: Date): string {
  const vnTime = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  return vnTime.toISOString().slice(0, 10)
}

export async function runGamificationDatasetSeed() {
  console.log('====================================================')
  console.log('   TMDEMY PHASE 5: RICH GAMIFICATION DATASET SEED   ')
  console.log('====================================================')

  const now = new Date('2026-10-07T12:00:00.000Z')

  // -----------------------------------------------------------------
  // STAGE 1: CURRICULUM SEEDING (32 COURSES)
  // -----------------------------------------------------------------
  console.log('\n[1/5] Seeding curriculum (Chapters, Lessons, Quizzes) for 32 courses...')

  let chaptersCreated = 0
  let lessonsCreated = 0
  let quizzesCreated = 0

  for (const courseTarget of TARGET_COURSES) {
    const curriculum = generateCurriculumForCourse(courseTarget)

    for (const ch of curriculum.chapters) {
      // Upsert chapter
      await prisma.chapter.upsert({
        where: { id: ch.id },
        update: {
          title: ch.title,
          order: ch.order
        },
        create: {
          id: ch.id,
          title: ch.title,
          courseId: ch.courseId,
          order: ch.order,
          isDestroyed: false,
          createdAt: new Date(now.getTime() - 150 * 86400000),
          updatedAt: new Date(now.getTime() - 150 * 86400000)
        }
      })
      chaptersCreated++

      for (const lesson of ch.lessons) {
        // Upsert lesson
        await prisma.lesson.upsert({
          where: { id: lesson.id },
          update: {
            title: lesson.title,
            slug: lesson.slug,
            order: lesson.order,
            duration: lesson.duration,
            type: lesson.type,
            content: lesson.content,
            isDemo: lesson.isDemo,
            videoUrl: lesson.videoUrl
          },
          create: {
            id: lesson.id,
            title: lesson.title,
            slug: lesson.slug,
            chapterId: lesson.chapterId,
            courseId: lesson.courseId,
            authorId: lesson.authorId,
            order: lesson.order,
            duration: lesson.duration,
            type: lesson.type,
            content: lesson.content,
            isDemo: lesson.isDemo,
            videoUrl: lesson.videoUrl,
            createdAt: new Date(now.getTime() - 145 * 86400000),
            updatedAt: new Date(now.getTime() - 145 * 86400000)
          }
        })
        lessonsCreated++

        if (lesson.quiz) {
          const qz = lesson.quiz
          // Upsert quiz
          await prisma.quiz.upsert({
            where: { id: qz.id },
            update: {
              title: qz.title,
              description: qz.description,
              duration: qz.duration,
              passingGrade: qz.passingGrade
            },
            create: {
              id: qz.id,
              title: qz.title,
              description: qz.description,
              duration: qz.duration,
              passingGrade: qz.passingGrade,
              lessonId: qz.lessonId,
              courseId: qz.courseId,
              createdById: qz.createdById,
              createdAt: new Date(now.getTime() - 140 * 86400000),
              updatedAt: new Date(now.getTime() - 140 * 86400000)
            }
          })
          quizzesCreated++

          for (const q of qz.questions) {
            await prisma.question.upsert({
              where: { id: q.id },
              update: {
                title: q.title,
                answer: q.answer,
                points: q.points
              },
              create: {
                id: q.id,
                quizId: q.quizId,
                type: q.type,
                title: q.title,
                answer: q.answer,
                points: q.points,
                createdAt: new Date(now.getTime() - 140 * 86400000),
                updatedAt: new Date(now.getTime() - 140 * 86400000)
              }
            })

            for (const opt of q.options) {
              await prisma.questionOption.upsert({
                where: { id: opt.id },
                update: {
                  optionText: opt.optionText,
                  order: opt.order
                },
                create: {
                  id: opt.id,
                  questionId: opt.questionId,
                  optionText: opt.optionText,
                  order: opt.order
                }
              })
            }
          }
        }
      }
    }
  }

  console.log(
    `  ✓ Curricula ready: ${chaptersCreated} chapters, ${lessonsCreated} lessons, ${quizzesCreated} quizzes processed.`
  )

  // -----------------------------------------------------------------
  // STAGE 2: GATHER ALL ACTIVE COURSES, LESSONS & QUIZZES
  // -----------------------------------------------------------------
  console.log('\n[2/5] Indexing all active course structures...')

  const allActiveCourses = await prisma.course.findMany({
    where: {
      lessons: { some: {} }
    },
    select: {
      id: true,
      title: true,
      categoryId: true,
      category: { select: { name: true, slug: true } },
      lessons: {
        orderBy: [{ chapter: { order: 'asc' } }, { order: 'asc' }],
        select: {
          id: true,
          title: true,
          courseId: true,
          quiz: {
            select: { id: true, title: true }
          }
        }
      }
    }
  })

  console.log(`  - Total active courses with lessons: ${allActiveCourses.length}`)
  const totalLessonPool = allActiveCourses.reduce((sum, c) => sum + c.lessons.length, 0)
  const totalQuizPool = allActiveCourses.reduce((sum, c) => sum + c.lessons.filter((l) => l.quiz).length, 0)
  console.log(`  - Total lesson pool: ${totalLessonPool}`)
  console.log(`  - Total quiz pool: ${totalQuizPool}`)

  // -----------------------------------------------------------------
  // STAGE 3: SEED 70 DEMO USERS
  // -----------------------------------------------------------------
  console.log('\n[3/5] Seeding 70 realistic demo users...')

  const demoUsers: DemoUserProfile[] = generateDemoUsersList()

  for (const u of demoUsers) {
    const userCreatedAt = new Date(now.getTime() - u.accountAgeDays * 86400000)

    await prisma.user.upsert({
      where: { id: u.id },
      update: {
        username: u.username,
        email: u.email,
        avatar: u.avatar,
        bio: u.bio
      },
      create: {
        id: u.id,
        username: u.username,
        email: u.email,
        password: DEMO_PASSWORD_HASH,
        avatar: u.avatar,
        bio: u.bio,
        role: 'USER',
        status: 'ACTIVE',
        isVerified: true,
        xpTotal: 0,
        currentStreak: u.currentStreak,
        longestStreak: u.longestStreak,
        createdAt: userCreatedAt,
        updatedAt: userCreatedAt
      }
    })
  }

  console.log(`  ✓ 70 demo users created/verified across 5 behavioral tiers.`)

  // -----------------------------------------------------------------
  // STAGE 4: SEED ENROLLMENTS, PROGRESS, QUIZZES & XP TRANSACTIONS
  // -----------------------------------------------------------------
  console.log('\n[4/5] Simulating authentic learning behaviors & XP transactions...')

  let totalEnrollments = 0
  let totalProgress = 0
  let totalSubmissions = 0
  let totalXpTransactions = 0

  for (const u of demoUsers) {
    // Ensure strict idempotency: clean previous learning activity for this demo user
    await prisma.progress.deleteMany({ where: { userId: u.id } })
    await prisma.quizSubmission.deleteMany({ where: { userId: u.id } })
    await prisma.xPTransaction.deleteMany({ where: { userId: u.id } })
    await prisma.enrollment.deleteMany({ where: { userId: u.id } })

    // 1. Determine enrolled courses
    // Distribute across categories evenly using rotation
    const startIndex = (u.index * 5) % allActiveCourses.length
    const enrolledCourses: typeof allActiveCourses = []
    const countToEnroll = Math.min(u.courseEnrollmentCount, allActiveCourses.length)
    for (let c = 0; c < countToEnroll; c++) {
      enrolledCourses.push(allActiveCourses[(startIndex + c) % allActiveCourses.length])
    }

    // Collect lessons from enrolled courses
    const userEnrolledLessons = enrolledCourses.flatMap((c) => c.lessons)

    // Number of lessons to complete
    const lessonsToCompleteCount = Math.min(u.targetLessonCompletions, userEnrolledLessons.length)
    const completedLessons = userEnrolledLessons.slice(0, lessonsToCompleteCount)
    const completedLessonIdSet = new Set(completedLessons.map((l) => l.id))

    // Quizzes from completed lessons
    const availableQuizzes = completedLessons.filter((l) => l.quiz).map((l) => l.quiz!)
    const quizzesToCompleteCount = Math.min(u.targetQuizCompletions, availableQuizzes.length)
    const completedQuizzes = availableQuizzes.slice(0, quizzesToCompleteCount)

    // Calculate dates for activity timeline
    // Compute user's active days
    const activeDateStrings: string[] = []
    if (u.currentStreak > 0) {
      for (let s = 0; s < u.currentStreak; s++) {
        const d = new Date(now.getTime() - s * 86400000)
        activeDateStrings.push(toVietnamDateStr(d))
      }
    }
    // Additional past active days to reach u.daysActiveCount
    let pastDayOffset = u.currentStreak > 0 ? u.currentStreak + 2 : 5
    while (activeDateStrings.length < u.daysActiveCount && pastDayOffset < u.accountAgeDays) {
      const d = new Date(now.getTime() - pastDayOffset * 86400000)
      activeDateStrings.push(toVietnamDateStr(d))
      pastDayOffset += 2 // spaced out past activities
    }

    // Sort dates ascending
    activeDateStrings.sort()

    let userCalculatedXp = 0
    let userLastActivityAt: Date | null = null

    // 2. Process Enrollments & Progress
    for (const course of enrolledCourses) {
      const courseLessons = course.lessons
      const completedCount = courseLessons.filter((l) => completedLessonIdSet.has(l.id)).length
      const progressPercent = courseLessons.length > 0 ? Math.round((completedCount / courseLessons.length) * 100) : 0
      const isCompleted = progressPercent === 100

      const enrollmentCreated = new Date(now.getTime() - (u.accountAgeDays - 2) * 86400000)
      const enrollmentCompleted = isCompleted ? new Date(now.getTime() - 3 * 86400000) : null

      await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: u.id,
            courseId: course.id
          }
        },
        update: {
          progress: progressPercent,
          status: isCompleted ? EEnrollmentStatus.COMPLETED : EEnrollmentStatus.ACTIVE,
          completedAt: enrollmentCompleted
        },
        create: {
          userId: u.id,
          courseId: course.id,
          progress: progressPercent,
          status: isCompleted ? EEnrollmentStatus.COMPLETED : EEnrollmentStatus.ACTIVE,
          enrolledAt: enrollmentCreated,
          completedAt: enrollmentCompleted,
          createdAt: enrollmentCreated,
          updatedAt: now
        }
      })
      totalEnrollments++
    }

    // 3. Process Progress & Lesson XP Transactions
    for (let lIdx = 0; lIdx < completedLessons.length; lIdx++) {
      const lesson = completedLessons[lIdx]
      // Assign an activity timestamp spread over account lifetime
      const dayOffset = Math.max(0, Math.floor((u.accountAgeDays - 3) * (1 - (lIdx + 1) / completedLessons.length)))
      const activityDate = new Date(now.getTime() - dayOffset * 86400000 + lIdx * 60000)

      if (!userLastActivityAt || activityDate > userLastActivityAt) {
        userLastActivityAt = activityDate
      }

      // Progress record
      await prisma.progress.upsert({
        where: {
          userId_lessonId: {
            userId: u.id,
            lessonId: lesson.id
          }
        },
        update: {
          completed: true
        },
        create: {
          userId: u.id,
          courseId: lesson.courseId,
          lessonId: lesson.id,
          completed: true,
          createdAt: activityDate,
          updatedAt: activityDate
        }
      })
      totalProgress++

      // Lesson XP transaction (+70 XP)
      const lessonEventKey = `lesson-complete:${u.id}:${lesson.id}`
      await prisma.xPTransaction.upsert({
        where: { eventKey: lessonEventKey },
        update: {},
        create: {
          userId: u.id,
          amount: 70,
          type: XPTransactionType.LESSON_COMPLETED,
          eventKey: lessonEventKey,
          createdAt: activityDate
        }
      })
      userCalculatedXp += 70
      totalXpTransactions++
    }

    // 4. Process Quiz Submissions & Quiz XP Transactions
    for (let qIdx = 0; qIdx < completedQuizzes.length; qIdx++) {
      const qz = completedQuizzes[qIdx]
      const dayOffset = Math.max(0, Math.floor((u.accountAgeDays - 5) * (1 - (qIdx + 1) / completedQuizzes.length)))
      const activityDate = new Date(now.getTime() - dayOffset * 86400000 + 3600000)

      if (!userLastActivityAt || activityDate > userLastActivityAt) {
        userLastActivityAt = activityDate
      }

      await prisma.quizSubmission.upsert({
        where: {
          quizId_userId: {
            quizId: qz.id,
            userId: u.id
          }
        },
        update: {
          score: 10,
          totalPoints: 10,
          percentage: 100,
          completedAt: activityDate
        },
        create: {
          quizId: qz.id,
          userId: u.id,
          score: 10,
          totalPoints: 10,
          percentage: 100,
          completedAt: activityDate,
          createdAt: activityDate,
          updatedAt: activityDate
        }
      })
      totalSubmissions++

      // Quiz XP transaction (+100 XP)
      const quizEventKey = `quiz-complete:${u.id}:${qz.id}`
      await prisma.xPTransaction.upsert({
        where: { eventKey: quizEventKey },
        update: {},
        create: {
          userId: u.id,
          amount: 100,
          type: XPTransactionType.QUIZ_COMPLETED,
          eventKey: quizEventKey,
          createdAt: activityDate
        }
      })
      userCalculatedXp += 100
      totalXpTransactions++
    }

    // 5. Process Daily Streak XP Transactions (+20 XP)
    for (const dateStr of activeDateStrings) {
      const streakEventKey = `daily-streak:${u.id}:${dateStr}`
      const streakDate = new Date(`${dateStr}T12:00:00.000Z`)

      if (!userLastActivityAt || streakDate > userLastActivityAt) {
        userLastActivityAt = streakDate
      }

      await prisma.xPTransaction.upsert({
        where: { eventKey: streakEventKey },
        update: {},
        create: {
          userId: u.id,
          amount: 20,
          type: XPTransactionType.DAILY_STREAK,
          eventKey: streakEventKey,
          createdAt: streakDate
        }
      })
      userCalculatedXp += 20
      totalXpTransactions++
    }

    // 6. Synchronize User aggregate fields (xpTotal, currentStreak, longestStreak, lastActivityAt)
    await prisma.user.update({
      where: { id: u.id },
      data: {
        xpTotal: userCalculatedXp,
        currentStreak: u.currentStreak,
        longestStreak: Math.max(u.longestStreak, u.currentStreak),
        lastActivityAt: u.group === 'INACTIVE' ? null : userLastActivityAt
      }
    })
  }

  console.log(`  ✓ Completed simulations:`)
  console.log(`    - Enrollments created/updated: ${totalEnrollments}`)
  console.log(`    - Progress records: ${totalProgress}`)
  console.log(`    - Quiz submissions: ${totalSubmissions}`)
  console.log(`    - XP Transactions generated: ${totalXpTransactions}`)

  // -----------------------------------------------------------------
  // STAGE 5: INTEGRITY VERIFICATION & SUMMARY METRICS
  // -----------------------------------------------------------------
  console.log('\n[5/5] Running database verification and generating metric summary...')

  const [
    finalUsers,
    finalCourses,
    finalChapters,
    finalLessons,
    finalEnrollments,
    finalProgress,
    finalQuizzes,
    finalSubmissions,
    finalXpTransactions
  ] = await Promise.all([
    prisma.user.count(),
    prisma.course.count(),
    prisma.chapter.count(),
    prisma.lesson.count(),
    prisma.enrollment.count(),
    prisma.progress.count(),
    prisma.quiz.count(),
    prisma.quizSubmission.count(),
    prisma.xPTransaction.count()
  ])

  console.log('\n====================================================')
  console.log('              FINAL DATABASE TOTALS                 ')
  console.log('====================================================')
  console.log(`Users:            ${finalUsers}`)
  console.log(`Courses:          ${finalCourses}`)
  console.log(`Chapters:         ${finalChapters}`)
  console.log(`Lessons:          ${finalLessons}`)
  console.log(`Enrollments:      ${finalEnrollments}`)
  console.log(`Progress:         ${finalProgress}`)
  console.log(`Quizzes:          ${finalQuizzes}`)
  console.log(`Quiz Submissions: ${finalSubmissions}`)
  console.log(`XP Transactions:  ${finalXpTransactions}`)
  console.log('====================================================')
}
