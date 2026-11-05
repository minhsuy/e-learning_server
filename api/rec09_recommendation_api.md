# TMdemy Recommendation System — REC-09 Frontend API Specification

**Version:** 1.0.0  
**Target Audience:** Next.js Client Developers, Frontend Engineers, Mobile Developers  
**Base URL:** `/api/recommendations`  
**Protocol:** HTTP/1.1, JSON  
**Backend:** Node.js + Express + Prisma (with Python REC-08 FastAPI Recommendation Engine)  

---

## 1. Overview & Dataflow

The **TMdemy Recommendation API** exposes high-performance course recommendations directly to the Next.js frontend without requiring the client to interact with or have knowledge of the Python microservice.

### System Architecture
```
[ Next.js Frontend Client ]
           │
           │  GET /api/recommendations/...
           ▼
[ TMdemy Node.js Backend Layer ]
   ├── Authentication & Route Parameter Validation (Express-Validator)
   ├── Learner Profile Aggregation (Enrollments, Progress, Ratings, Favorites from Prisma)
   ├── Internal Secure Microservice Client (HTTP + X-API-Key to Python REC-08)
   └── Course Hydration (Single-query PostgreSQL live price, instructor, title hydration)
           │
           ▼
[ Python Hybrid Recommendation Engine (REC-08) ]
   ├── BM25 Okapi Lexical Retrieval
   ├── Multilingual E5 Small Semantic Embeddings
   ├── Reciprocal Rank Fusion (RRF)
   └── Pedagogical Multi-Criteria Personalization & Diversity Reranking
```

---

## 2. Authentication & Headers

| Endpoint | Access Level | Header Required | Description |
| :--- | :---: | :---: | :--- |
| `GET /api/recommendations/courses/:courseId/similar` | **Public** | None (Optional `Authorization: Bearer <jwt>`) | Item-to-Item similar courses based on curriculum content. |
| `GET /api/recommendations/personalized` | **Private** | `Authorization: Bearer <access_token>` | Personalized recommendations for the authenticated learner. |
| `GET /api/recommendations/health` | **Public** | None | System readiness probe for recommendation infrastructure. |

---

## 3. Endpoints

### 3.1 Item-to-Item Similar Courses

Retrieves ranked courses pedagogically and semantically similar to a target course.

- **Method:** `GET`
- **Path:** `/api/recommendations/courses/:courseId/similar`
- **Auth:** Public

#### Route Parameters
| Parameter | Type | Required | Description |
| :--- | :---: | :---: | :--- |
| `courseId` | UUID | Yes | Target course primary key UUID (e.g. `00d7b29c-a915-5905-9592-b282bd2194dc`) |

#### Query Parameters
| Parameter | Type | Default | Constraints | Description |
| :--- | :---: | :---: | :---: | :--- |
| `top_k` | Integer | `10` | $1 \le \text{top\_k} \le 50$ | Number of recommended courses to return. |
| `retrieval_depth` | Integer | `50` | $10 \le \text{depth} \le 200$ | Candidate pool size retrieved per model channel. |
| `enable_diversity` | Boolean | `true` | `true` / `false` | Enforce category diversification. |
| `max_courses_per_category` | Integer | `3` | $1 \le \text{max} \le 10$ | Maximum recommendations from any single category. |

#### Example Request
```http
GET /api/recommendations/courses/00d7b29c-a915-5905-9592-b282bd2194dc/similar?top_k=4&enable_diversity=true HTTP/1.1
Host: localhost:3000
Accept: application/json
```

#### Example Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "mode": "item_to_item",
    "strategy_used": "hybrid_rrf_item_to_item",
    "models_used": ["bm25", "e5_small"],
    "fusion_method": "rrf",
    "fallback_used": false,
    "fallback_reason": null,
    "total_candidates_retrieved": 68,
    "filtered_courses_count": 0,
    "recommendations": [
      {
        "course": {
          "id": "7b2b3df2-f8d4-5667-a7f9-0c30d8853ae7",
          "_id": "7b2b3df2-f8d4-5667-a7f9-0c30d8853ae7",
          "title": "Làm chủ Tailwind CSS 4: Từ nền tảng đến thiết kế giao diện tinh tế",
          "slug": "lam-chu-tailwind-css-4-tu-nen-tang-den-thiet-ke-giao-dien-tinh-te",
          "image": "https://res.cloudinary.com/tmdemy/image/upload/v1/courses/tailwind.jpg",
          "price": 199000,
          "oldPrice": 399000,
          "level": "BEGINNER",
          "type": "PAID",
          "view": 125,
          "sold": 38,
          "author": {
            "id": "13608f92-8acf-53e3-adcb-0d832e9cb1d4",
            "username": "teacher02",
            "avatar": ""
          },
          "category": {
            "id": "fc5d66a4-7468-5328-a6a9-16c3a9e49881",
            "name": "Lập trình web",
            "slug": "lap-trinh-web"
          }
        },
        "rank": 1,
        "score": 1.0,
        "explanation": "Xuất hiện hàng đầu cả về từ khóa (hạng #2) và ngữ nghĩa (hạng #3)",
        "score_breakdown": {
          "bm25_rank": 2,
          "e5_rank": 3,
          "bm25_score": 14.82,
          "e5_score": 0.895,
          "rrf_score": 0.0325,
          "normalized_hybrid_score": 1.0,
          "final_score": 1.0
        }
      }
    ]
  }
}
```

---

### 3.2 Personalized Recommendations for Authenticated Learner

Tailors course suggestions to the current user's learning path based on their enrollments, progress, ratings, and wishlist.

- **Method:** `GET`
- **Path:** `/api/recommendations/personalized`
- **Auth:** Private (`Bearer <JWT>`)

#### Query Parameters (All Optional)
| Parameter | Type | Default | Constraints | Description |
| :--- | :---: | :---: | :---: | :--- |
| `top_k` | Integer | `10` | $1 \le \text{top\_k} \le 50$ | Number of recommended courses. |
| `retrieval_depth` | Integer | `50` | $10 \le \text{depth} \le 200$ | Search depth across candidate pools. |
| `filter_completed`| Boolean | `true` | `true` / `false` | Exclude courses the learner has already completed (progress 100% or certificate). |
| `filter_enrolled` | Boolean | `true` | `true` / `false` | Exclude courses the learner is currently taking. |
| `enable_diversity`| Boolean | `true` | `true` / `false` | Prevent a single category from dominating top-K. |
| `max_courses_per_category` | Integer | `3` | $1 \le \text{max} \le 10$ | Max courses per category. |
| `preferred_level` | String | Auto | `BEGINNER`, `INTERMEDIATE`, `ADVANCED` | Optional target difficulty filter override. |
| `preferred_category_names` | String / Array | Auto | Comma-delimited strings | Optional category affinity boost (e.g. `Lập trình web,Khoa học dữ liệu`). |
| `preferred_topics`| String / Array | Auto | Comma-delimited strings | Optional keyword affinity boost (e.g. `React,TypeScript`). |

#### Example Request
```http
GET /api/recommendations/personalized?top_k=6&filter_completed=true&filter_enrolled=true HTTP/1.1
Host: localhost:3000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Accept: application/json
```

#### Example Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "mode": "personalized",
    "strategy_used": "rich_personalized",
    "models_used": ["bm25", "e5_small"],
    "fusion_method": "rrf",
    "fallback_used": false,
    "fallback_reason": null,
    "total_candidates_retrieved": 96,
    "filtered_courses_count": 3,
    "recommendations": [
      {
        "course": {
          "id": "e4589d12-6f2b-4fa8-b21a-4d7a718b52a1",
          "_id": "e4589d12-6f2b-4fa8-b21a-4d7a718b52a1",
          "title": "TypeScript và Clean Architecture trong ứng dụng thực tế",
          "slug": "typescript-va-clean-architecture-trong-ung-dung-thuc-te",
          "price": 349000,
          "oldPrice": 699000,
          "level": "INTERMEDIATE",
          "type": "PAID",
          "author": {
            "id": "6dd1ccd9-420b-5c6d-8322-75223e67e549",
            "username": "teacher_cntt"
          },
          "category": {
            "name": "Lập trình",
            "slug": "lap-trinh"
          }
        },
        "rank": 1,
        "score": 0.942,
        "explanation": "Phù hợp với tiến trình học tập các khóa học Frontend trước đó của bạn, đồng thời tiếp nối trình độ INTERMEDIATE.",
        "score_breakdown": {
          "normalized_hybrid_score": 0.91,
          "personalization_score": 0.974,
          "final_score": 0.942
        }
      }
    ]
  }
}
```

---

### 3.3 Recommendation Service Health Probe

Provides operational status of the recommendation pipeline.

- **Method:** `GET`
- **Path:** `/api/recommendations/health`
- **Auth:** Public

#### Example Response (200 OK)
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "ready",
    "service": "TMdemy Recommendation Integration Layer",
    "ready": true,
    "catalog_course_count": 608
  }
}
```

---

## 4. Cold-Start & Learner States

The system gracefully accommodates learners with different interaction histories:

| Learner State | Strategy Applied | Behavior & Display |
| :--- | :--- | :--- |
| **New Learner (Zero History)** | `catalog_cold_start` | Returns high-quality starter courses diversified across foundational domains (Programming, Design, Soft Skills). |
| **Learner with Preferences** | `explicit_cold_start` | Recommends courses tailored to explicit category and difficulty tags requested via query parameters. |
| **Early Learner (1-2 Courses)**| `sparse_personalized` | Balances direct prerequisite next steps with category exploration. |
| **Active Learner ($\ge 3$ Courses)** | `rich_personalized` | Multi-criteria reranking accounting for high ratings (4-5 stars), favorites, and topic continuity. |

---

## 5. Next.js / TypeScript Integration Snippets

### 5.1 Fetching Similar Courses for Course Detail Page
```typescript
import axios from 'axios'

export interface CourseCardRecommendation {
  course: {
    id: string
    _id: string
    title: string
    slug: string
    image: string
    price: number
    oldPrice: number
    level: string
    category: { name: string; slug: string }
    author: { username: string }
  }
  rank: number
  score: number
  explanation: string
}

export async function fetchSimilarCourses(courseId: string, topK = 4): Promise<CourseCardRecommendation[]> {
  try {
    const res = await axios.get(`/api/recommendations/courses/${courseId}/similar`, {
      params: { top_k: topK, enable_diversity: true }
    })
    return res.data?.data?.recommendations || []
  } catch (err) {
    console.warn('Could not load similar courses:', err)
    return []
  }
}
```

### 5.2 Fetching Personalized Recommendations for Learner Dashboard
```typescript
export async function fetchPersonalizedRecommendations(
  accessToken: string,
  topK = 6
): Promise<CourseCardRecommendation[]> {
  try {
    const res = await axios.get('/api/recommendations/personalized', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        top_k: topK,
        filter_completed: true,
        filter_enrolled: true
      }
    })
    return res.data?.data?.recommendations || []
  } catch (err) {
    console.warn('Could not load personalized recommendations:', err)
    return []
  }
}
```

---

## 6. Error Responses & HTTP Status Codes

All errors adhere to TMdemy standard JSON envelopes:

| Status Code | Meaning | Example Response Body |
| :---: | :--- | :--- |
| **400** | Bad Request (Validation failure) | `{"success": false, "statusCode": 400, "message": "top_k must be an integer between 1 and 50"}` |
| **401** | Unauthorized (Missing/invalid JWT) | `{"success": false, "statusCode": 401, "message": "Access Token is missing!"}` |
| **404** | Target Course Not Found | `{"success": false, "statusCode": 404, "message": "Target course not found or is not currently available for recommendation."}` |
| **503** | Service Temporarily Unavailable | `{"success": false, "statusCode": 503, "message": "Recommendation service is currently not ready or unavailable."}` |

