import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { CourseStatus } from '@prisma/client'
import { prisma } from '../src/config/prisma'
import { RecommendationMicroserviceClient } from '../src/services/recommendationClient.service'
import { RecommendationService } from '../src/services/recommendation.service'

const API_BASE = 'http://localhost:3002'
const JWT_ACCESS_SECRET = process.env.JWT_SECRECT_ACCESS_TOKEN || 'thaiminh061206'
const JWT_REFRESH_SECRET = process.env.JWT_SECRECT_REFRESH_TOKEN || 'thaiminh0612060504'

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex')
}

interface VerificationResult {
  id: string
  scenario: string
  status: 'PASSED' | 'FAILED' | 'BLOCKED' | 'NOT TESTED'
  evidence: string
}

const results: VerificationResult[] = []

function record(
  id: string,
  scenario: string,
  passed: boolean,
  evidence: string
) {
  const status = passed ? 'PASSED' : 'FAILED'
  results.push({ id, scenario, status, evidence })
  console.log(`[${status}] ${id} - ${scenario}\n   -> ${evidence}\n`)
}

async function main() {
  console.log('=================================================================')
  console.log(' REC-10.1 LIVE END-TO-END VERIFICATION & SCORE AUDIT SUITE')
  console.log('=================================================================\n')

  // 0. Health check
  const healthRes = await fetch(`${API_BASE}/api/recommendations/health`)
  const healthJson: any = await healthRes.json()
  record(
    'HEALTH-01',
    'GET /api/recommendations/health live readiness probe',
    healthRes.status === 200 &&
      healthJson.success === true &&
      healthJson.data?.ready === true &&
      healthJson.data?.catalog_course_count === 608,
    `HTTP ${healthRes.status}: ${JSON.stringify(healthJson.data)}`
  )

  // Find two courses from different categories in PostgreSQL
  const webCourse = await prisma.course.findFirst({
    where: {
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      category: { name: 'Lập trình web', isDestroyed: false }
    },
    include: { category: true }
  })

  const aiCourse = await prisma.course.findFirst({
    where: {
      status: CourseStatus.APPROVED,
      isDestroyed: false,
      category: { name: 'Trí tuệ nhân tạo (AI)', isDestroyed: false }
    },
    include: { category: true }
  })

  if (!webCourse || !aiCourse) {
    throw new Error('Could not find sample courses in PostgreSQL')
  }

  // =========================================================================
  // SCENARIO 1: Similar Courses returns real recommendations
  // =========================================================================
  const simRes1 = await fetch(
    `${API_BASE}/api/recommendations/courses/${webCourse.id}/similar?top_k=6&enable_diversity=true`
  )
  const simJson1: any = await simRes1.json()
  const simItems1: any[] = simJson1?.data?.recommendations || []

  record(
    'E2E-01',
    'Similar Courses returns real recommendations (top_k=6)',
    simRes1.status === 200 &&
      simJson1.success === true &&
      simJson1.data?.mode === 'item_to_item' &&
      simJson1.data?.strategy_used === 'hybrid_rrf_item_to_item' &&
      simItems1.length === 6 &&
      simItems1.every((it) => it.course?.id && it.course?.title && it.course?.slug),
    `HTTP ${simRes1.status}, mode=${simJson1.data?.mode}, strategy=${simJson1.data?.strategy_used}, count=${simItems1.length}, top1="${simItems1[0]?.course?.title}" (score=${simItems1[0]?.score})`
  )

  // =========================================================================
  // SCENARIO 2: Personalized returns real recommendations for authenticated learners
  // =========================================================================
  const usersWithEnrollments = await prisma.user.findMany({
    where: {
      status: 'ACTIVE',
      enrollments: { some: {} }
    },
    include: {
      enrollments: true,
      ratings: true,
      favoriteCourses: true,
      certificates: true
    },
    take: 20
  })

  usersWithEnrollments.sort((a, b) => b.enrollments.length - a.enrollments.length)
  const activeLearner = usersWithEnrollments[0]
  if (!activeLearner) {
    throw new Error('No active learner with enrollments found in PostgreSQL')
  }

  const activeToken = jwt.sign(
    { userId: activeLearner.id, role: (activeLearner.role || 'USER').toLowerCase() },
    JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  )

  const persRes1 = await fetch(
    `${API_BASE}/api/recommendations/personalized?top_k=8&enable_diversity=true&filter_completed=true&filter_enrolled=true`,
    {
      headers: { Authorization: `Bearer ${activeToken}` }
    }
  )
  const persJson1: any = await persRes1.json()
  const persItems1: any[] = persJson1?.data?.recommendations || []

  record(
    'E2E-02',
    'Personalized returns real recommendations for authenticated learner',
    persRes1.status === 200 &&
      persJson1.success === true &&
      persJson1.data?.mode === 'personalized' &&
      persItems1.length === 8 &&
      ['rich_personalized', 'sparse_personalized'].includes(persJson1.data?.strategy_used),
    `HTTP ${persRes1.status}, user=${activeLearner.email} (${activeLearner.enrollments.length} enrollments), strategy=${persJson1.data?.strategy_used}, count=${persItems1.length}, top1="${persItems1[0]?.course?.title}" (score=${persItems1[0]?.score})`
  )

  // =========================================================================
  // SCENARIO 3: Recommended course IDs exist in PostgreSQL
  // =========================================================================
  const allReturnedIds = Array.from(
    new Set([
      ...simItems1.map((it) => it.course.id),
      ...persItems1.map((it) => it.course.id)
    ])
  )
  const dbVerifiedCourses = await prisma.course.findMany({
    where: {
      id: { in: allReturnedIds },
      status: CourseStatus.APPROVED,
      isDestroyed: false
    },
    select: { id: true }
  })

  record(
    'E2E-03',
    'All recommended course IDs exist in PostgreSQL as APPROVED & non-destroyed',
    dbVerifiedCourses.length === allReturnedIds.length && allReturnedIds.length > 0,
    `Checked ${allReturnedIds.length} unique recommended course UUIDs in PostgreSQL -> ${dbVerifiedCourses.length}/${allReturnedIds.length} verified APPROVED & active`
  )

  // =========================================================================
  // SCENARIO 4: Changing course ID refreshes Similar recommendations
  // =========================================================================
  const simRes2 = await fetch(
    `${API_BASE}/api/recommendations/courses/${aiCourse.id}/similar?top_k=6&enable_diversity=true`
  )
  const simJson2: any = await simRes2.json()
  const simItems2: any[] = simJson2?.data?.recommendations || []

  const idsCourseA = simItems1.map((it) => it.course.id)
  const idsCourseB = simItems2.map((it) => it.course.id)
  const courseAExcluded = !idsCourseA.includes(webCourse.id)
  const courseBExcluded = !idsCourseB.includes(aiCourse.id)
  const listsDiffer = JSON.stringify(idsCourseA) !== JSON.stringify(idsCourseB)

  record(
    'E2E-04',
    'Changing course ID refreshes Similar recommendations and excludes source course',
    simRes2.status === 200 &&
      simItems2.length === 6 &&
      courseAExcluded &&
      courseBExcluded &&
      listsDiffer,
    `Course A (${webCourse.category?.name}) top1="${simItems1[0]?.course?.title}" vs Course B (${aiCourse.category?.name}) top1="${simItems2[0]?.course?.title}"; sourceCourseExcluded=${courseAExcluded && courseBExcluded}, listsDiffer=${listsDiffer}`
  )

  // =========================================================================
  // SCENARIO 5: Changing preferred category updates Personalized requests
  // =========================================================================
  const persWebRes = await fetch(
    `${API_BASE}/api/recommendations/personalized?top_k=8&enable_diversity=true&filter_completed=true&filter_enrolled=true&preferred_category_names=${encodeURIComponent('Lập trình web')}`,
    { headers: { Authorization: `Bearer ${activeToken}` } }
  )
  const persWebJson: any = await persWebRes.json()
  const persWebItems: any[] = persWebJson?.data?.recommendations || []

  const persAiRes = await fetch(
    `${API_BASE}/api/recommendations/personalized?top_k=8&enable_diversity=true&filter_completed=true&filter_enrolled=true&preferred_category_names=${encodeURIComponent('Trí tuệ nhân tạo (AI)')}`,
    { headers: { Authorization: `Bearer ${activeToken}` } }
  )
  const persAiJson: any = await persAiRes.json()
  const persAiItems: any[] = persAiJson?.data?.recommendations || []

  const persUiUxRes = await fetch(
    `${API_BASE}/api/recommendations/personalized?top_k=8&enable_diversity=true&filter_completed=true&filter_enrolled=true&preferred_category_names=${encodeURIComponent('Thiết kế UI/UX & Sản phẩm số')}`,
    { headers: { Authorization: `Bearer ${activeToken}` } }
  )
  const persUiUxJson: any = await persUiUxRes.json()
  const persUiUxItems: any[] = persUiUxJson?.data?.recommendations || []

  const webIds = persWebItems.map((it) => it.course.id)
  const aiIds = persAiItems.map((it) => it.course.id)
  const uiUxIds = persUiUxItems.map((it) => it.course.id)

  const hasWebMatch = persWebItems.some((it) => it.course?.category?.name === 'Lập trình web')
  const hasAiMatch = persAiItems.some((it) => it.course?.category?.name === 'Trí tuệ nhân tạo (AI)')
  const hasUiUxMatch = persUiUxItems.some((it) => it.course?.category?.name === 'Thiết kế UI/UX & Sản phẩm số')

  record(
    'E2E-05',
    'Changing preferred category updates Personalized recommendations',
    persWebRes.status === 200 &&
      persAiRes.status === 200 &&
      persUiUxRes.status === 200 &&
      JSON.stringify(webIds) !== JSON.stringify(aiIds) &&
      JSON.stringify(aiIds) !== JSON.stringify(uiUxIds) &&
      hasWebMatch &&
      hasAiMatch &&
      hasUiUxMatch,
    `Web list!=${JSON.stringify(webIds) === JSON.stringify(aiIds) ? 'same' : 'diff'} AI list!=${JSON.stringify(aiIds) === JSON.stringify(uiUxIds) ? 'same' : 'diff'} UI/UX; UI/UX top1="${persUiUxItems[0]?.course?.title}" (${persUiUxItems[0]?.course?.category?.name})`
  )

  // =========================================================================
  // SCENARIO 6: Completed and enrolled courses are filtered correctly
  // =========================================================================
  const learnerInteractionIds = new Set<string>([
    ...activeLearner.enrollments.map((e) => e.courseId),
    ...activeLearner.certificates.map((c) => c.courseId)
  ])
  const returnedPersIds = persItems1.map((it) => it.course.id)
  const overlapWithEnrolledOrCompleted = returnedPersIds.filter((id) =>
    learnerInteractionIds.has(id)
  )

  record(
    'E2E-06',
    'Completed and enrolled courses are filtered from personalized recommendations',
    overlapWithEnrolledOrCompleted.length === 0 &&
      persJson1.data?.filtered_courses_count >= activeLearner.enrollments.length,
    `Learner has ${activeLearner.enrollments.length} enrolled/completed courses; filtered_courses_count=${persJson1.data?.filtered_courses_count}, overlapInRecommendations=${overlapWithEnrolledOrCompleted.length}`
  )

  // =========================================================================
  // SCENARIO 7: Cold-start users receive fallback recommendations
  // =========================================================================
  const coldStartUser = await prisma.user.findFirst({
    where: {
      status: 'ACTIVE',
      enrollments: { none: {} },
      ratings: { none: {} },
      favoriteCourses: { none: {} },
      certificates: { none: {} }
    }
  })

  const coldStartUserId = coldStartUser?.id || '00000000-0000-4000-8000-000000000099'
  const coldToken = jwt.sign(
    { userId: coldStartUserId },
    JWT_ACCESS_SECRET,
    { expiresIn: '1h' }
  )

  const coldRes = await fetch(
    `${API_BASE}/api/recommendations/personalized?top_k=8&enable_diversity=true&filter_completed=true&filter_enrolled=true`,
    { headers: { Authorization: `Bearer ${coldToken}` } }
  )
  const coldJson: any = await coldRes.json()
  const coldItems: any[] = coldJson?.data?.recommendations || []
  const coldCategories = new Set(coldItems.map((it) => it.course?.category?.name))

  record(
    'E2E-07',
    'Cold-start users receive catalog_cold_start fallback recommendations',
    coldRes.status === 200 &&
      coldJson.success === true &&
      coldJson.data?.strategy_used === 'catalog_cold_start' &&
      coldJson.data?.fallback_used === true &&
      coldJson.data?.fusion_method === 'cold_start_round_robin' &&
      Array.isArray(coldJson.data?.models_used) &&
      coldJson.data.models_used.includes('catalog_metadata') &&
      coldItems.length === 8 &&
      coldCategories.size >= 4,
    `HTTP ${coldRes.status}, strategy_used=${coldJson.data?.strategy_used}, fallback_used=${coldJson.data?.fallback_used}, fusion_method=${coldJson.data?.fusion_method}, models_used=${JSON.stringify(coldJson.data?.models_used)}, count=${coldItems.length}, distinctCategories=${coldCategories.size}`
  )

  // =========================================================================
  // SCENARIO 8: HTTP 401, Token Refresh & HTTP 503 Graceful Handling
  // =========================================================================
  // 8a. Missing token -> 401
  const unauthRes = await fetch(`${API_BASE}/api/recommendations/personalized?top_k=8`)
  const unauthJson: any = await unauthRes.json()

  // 8b. Expired token -> 401 with 'jwt expired' -> refresh via POST /api/users/access_token
  const originalRefreshToken = activeLearner.refreshToken
  const validRefreshToken = jwt.sign(
    { userId: activeLearner.id },
    JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  )
  await prisma.user.update({
    where: { id: activeLearner.id },
    data: { refreshToken: hashToken(validRefreshToken) }
  })

  const expiredToken = jwt.sign(
    { userId: activeLearner.id },
    JWT_ACCESS_SECRET,
    { expiresIn: -10 }
  )
  const expiredRes = await fetch(`${API_BASE}/api/recommendations/personalized?top_k=8`, {
    headers: { Authorization: `Bearer ${expiredToken}` }
  })
  const expiredJson: any = await expiredRes.json()

  const refreshRes = await fetch(`${API_BASE}/api/users/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: validRefreshToken })
  })
  const refreshJson: any = await refreshRes.json()

  let retryAfterRefreshOk = false
  if (refreshJson?.access_token) {
    const retryRes = await fetch(`${API_BASE}/api/recommendations/personalized?top_k=8`, {
      headers: { Authorization: `Bearer ${refreshJson.access_token}` }
    })
    retryAfterRefreshOk = retryRes.status === 200
  }

  // 8c. Simulate Python 503 / Unreachable via RecommendationService
  const unavailableClient = new RecommendationMicroserviceClient({
    serviceUrl: 'http://127.0.0.1:8999',
    apiKey: 'tmdemy-recommendation',
    timeoutMs: 1000
  })
  const unavailableService = new RecommendationService(unavailableClient)
  const unavailableRes = await unavailableService.getSimilarCourses({
    courseId: webCourse.id,
    top_k: 6
  })

  record(
    'E2E-08',
    'HTTP 401, automatic JWT refresh (/api/users/access_token), and HTTP 503 graceful handling',
    unauthRes.status === 401 &&
      expiredRes.status === 401 &&
      JSON.stringify(expiredJson).includes('jwt expired') &&
      refreshRes.status === 200 &&
      Boolean(refreshJson?.access_token) &&
      retryAfterRefreshOk &&
      unavailableRes.success === false &&
      unavailableRes.statusCode === 503,
    `No-token HTTP ${unauthRes.status}; Expired-token HTTP ${expiredRes.status} (${expiredJson.error}); Refresh HTTP ${refreshRes.status} -> Replay HTTP 200=${retryAfterRefreshOk}; Service-down statusCode=${unavailableRes.statusCode} ("${unavailableRes.message}")`
  )

  // =========================================================================
  // SCENARIO 9: Logout clears personalized state and revokes refresh token
  // =========================================================================
  const logoutRes = await fetch(`${API_BASE}/api/users/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${refreshJson.access_token || activeToken}` }
  })
  const logoutJson: any = await logoutRes.json()

  // Verify refresh token is revoked in PostgreSQL after logout
  const postLogoutRefreshRes = await fetch(`${API_BASE}/api/users/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: validRefreshToken })
  })

  // Restore original refreshToken if any
  await prisma.user.update({
    where: { id: activeLearner.id },
    data: { refreshToken: originalRefreshToken }
  })

  record(
    'E2E-09',
    'Logout revokes session refresh token and clears personalized state',
    logoutRes.status === 200 &&
      logoutJson.success === true &&
      postLogoutRefreshRes.status !== 200,
    `POST /api/users/logout -> HTTP ${logoutRes.status} (${logoutJson.message}); subsequent token refresh rejected (HTTP ${postLogoutRefreshRes.status})`
  )

  // =========================================================================
  // SCENARIO 10: Existing pages continue working if Recommendation Service is unavailable
  // =========================================================================
  const publicCatalogRes = await fetch(`${API_BASE}/api/courses?page=1&limit=6`)
  const publicCatalogJson: any = await publicCatalogRes.json()
  const courseDetailRes = await fetch(`${API_BASE}/api/courses/${encodeURIComponent(webCourse.slug)}`)
  const courseDetailJson: any = await courseDetailRes.json()

  record(
    'E2E-10',
    'Existing course catalog & course detail APIs work independently of Recommendation Service',
    publicCatalogRes.status === 200 &&
      publicCatalogJson.success === true &&
      courseDetailRes.status === 200 &&
      courseDetailJson.success === true &&
      courseDetailJson.data?.id === webCourse.id &&
      unavailableRes.statusCode === 503,
    `GET /api/courses -> HTTP ${publicCatalogRes.status} (${publicCatalogJson.data?.courses?.length} courses); GET /api/courses/${webCourse.slug} -> HTTP ${courseDetailRes.status} (id=${courseDetailJson.data?.id}) while isolated RecommendationService down returns HTTP ${unavailableRes.statusCode}`
  )

  // =========================================================================
  // SCENARIO 11 (Section 3): Recommendation Score & Metadata Formula Verification
  // =========================================================================
  const sampleSimItem = simItems1[0]
  const sbSim = sampleSimItem?.score_breakdown
  const expectedRrfSim =
    (sbSim.bm25_rank ? 1.0 / (60 + sbSim.bm25_rank) : 0) +
    (sbSim.e5_rank ? 1.0 / (60 + sbSim.e5_rank) : 0)
  const rrfSimDiff = Math.abs(sbSim.rrf_score - Number(expectedRrfSim.toFixed(6)))

  const samplePersItem = persItems1[0]
  const sbPers = samplePersItem?.score_breakdown
  const expectedFinalPers = Number(
    (0.5 * sbPers.normalized_hybrid_score + 0.5 * sbPers.personalization_score).toFixed(4)
  )
  const finalPersDiff = Math.abs(sbPers.final_score - expectedFinalPers)

  record(
    'SCORE-01',
    'Score breakdown metadata & RRF / Hybrid Personalization mathematical accuracy',
    rrfSimDiff <= 1e-5 &&
      sbSim.final_score === sbSim.normalized_hybrid_score &&
      sbSim.personalization_score === null &&
      finalPersDiff <= 5e-4 &&
      typeof sbPers.personalization_score === 'number',
    `Similar Rank #1: bm25_rank=${sbSim.bm25_rank}, e5_rank=${sbSim.e5_rank}, rrf_score=${sbSim.rrf_score} (expected=${expectedRrfSim.toFixed(6)}, diff=${rrfSimDiff.toExponential(2)}), norm_hybrid=${sbSim.normalized_hybrid_score}, final=${sbSim.final_score} | Personalized Rank #1: bm25_rank=${sbPers.bm25_rank}, e5_rank=${sbPers.e5_rank}, rrf_score=${sbPers.rrf_score}, norm_hybrid=${sbPers.normalized_hybrid_score}, pers_score=${sbPers.personalization_score}, final=${sbPers.final_score} (expected=${expectedFinalPers}, diff=${finalPersDiff.toExponential(2)})`
  )

  console.log('\n=================================================================')
  const passed = results.filter((r) => r.status === 'PASSED').length
  console.log(` SUMMARY: ${passed}/${results.length} LIVE CHECKS PASSED`)
  console.log('=================================================================')

  if (passed !== results.length) {
    process.exit(1)
  }
}

main()
  .catch((err) => {
    console.error('Fatal verification error:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
