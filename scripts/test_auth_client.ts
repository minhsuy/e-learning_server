import { getRecommendationConfig } from '../src/config/recommendation.config'
import {
  RecommendationMicroserviceClient,
  RecommendationServiceError
} from '../src/services/recommendationClient.service'

async function main() {
  console.log('===========================================================')
  console.log('VERIFYING NODE.JS <-> FASTAPI MICROSERVICE AUTHENTICATION')
  console.log('===========================================================')

  // 1. Verify Node.js loads configuration without exposing secret value
  const config = getRecommendationConfig(true)
  console.log('[1] Node.js config loaded:')
  console.log('    Service URL:', config.serviceUrl)
  console.log('    Enabled:', config.enabled)
  console.log('    Timeout (ms):', config.timeoutMs)
  console.log('    API Key configured & non-empty:', Boolean(config.apiKey))
  console.log('    API Key length:', config.apiKey.length)

  const client = new RecommendationMicroserviceClient()

  // 2. Health probe (unauthenticated)
  console.log('\n[2] Testing GET /health...')
  const health = await client.checkHealth()
  console.log('    Health status:', health.status)
  if (health.status !== 'ok') {
    throw new Error(`Health check failed: expected ok, got ${health.status}`)
  }

  // 3. Readiness probe (unauthenticated)
  console.log('\n[3] Testing GET /ready...')
  const ready = await client.checkReadiness()
  console.log('    Readiness status:', ready.status)
  console.log('    Ready boolean:', ready.ready)
  console.log('    Catalog course count:', ready.catalog_course_count)
  console.log('    BM25 doc count:', ready.bm25_doc_count)
  if (ready.status !== 'ready' || !ready.ready) {
    throw new Error(`Readiness check failed: engine is not ready`)
  }

  // 4. Authenticated recommendation request with matching key from .env
  console.log('\n[4] Testing POST /api/v1/recommendations/hybrid/similar (with matching .env key)...')
  const validCourseId = '00d7b29c-a915-5905-9592-b282bd2194dc'
  const simResult = await client.getSimilarCourses({
    course_id: validCourseId,
    top_k: 3
  })
  console.log('    Mode:', simResult.mode)
  console.log('    Strategy used:', simResult.strategy_used)
  console.log('    Recommendations returned:', simResult.recommendations.length)
  console.log('    Inference latency (ms):', simResult.inference_latency_ms)
  if (!simResult.recommendations || simResult.recommendations.length !== 3) {
    throw new Error(`Expected 3 recommendations, got ${simResult.recommendations?.length}`)
  }

  // 5. Test invalid API key rejection
  console.log('\n[5] Testing rejection with invalid API key...')
  const invalidClient = new RecommendationMicroserviceClient({
    apiKey: 'invalid-fake-key-for-test-99999'
  })
  try {
    await invalidClient.getSimilarCourses({
      course_id: validCourseId,
      top_k: 3
    })
    throw new Error('Expected authentication failure with invalid key, but request succeeded!')
  } catch (err) {
    if (err instanceof RecommendationServiceError && err.errorCode === 'AUTHENTICATION_FAILURE') {
      console.log('    Successfully rejected with AUTHENTICATION_FAILURE (HTTP 401 mapped to 503 error).')
    } else {
      throw err
    }
  }

  // 6. Test missing API key rejection
  console.log('\n[6] Testing rejection with empty API key...')
  const emptyKeyClient = new RecommendationMicroserviceClient({
    apiKey: ''
  })
  try {
    await emptyKeyClient.getSimilarCourses({
      course_id: validCourseId,
      top_k: 3
    })
    throw new Error('Expected auth key missing failure, but request succeeded!')
  } catch (err) {
    if (err instanceof RecommendationServiceError && err.errorCode === 'AUTH_KEY_MISSING') {
      console.log('    Successfully rejected with AUTH_KEY_MISSING.')
    } else {
      throw err
    }
  }

  console.log('\n===========================================================')
  console.log('ALL NODE.JS <-> PYTHON AUTHENTICATION CHECKS PASSED!')
  console.log('===========================================================')
}

main().catch((err) => {
  console.error('\nFAILED:', err)
  process.exit(1)
})

