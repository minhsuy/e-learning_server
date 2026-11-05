# TMDEMY — STEP 2: CODING EXERCISE CRUD API DOCUMENTATION

This document details the REST API specifications for the **Coding Exercise CRUD & Revision Management** module implemented in Step 2.

---

## 1. Overview & General Conventions

- **Base URL Prefix**: `/api/coding-exercises`
- **Data Exchange Format**: JSON (`application/json`)
- **Authentication**: Bearer Token in `Authorization` header (`Bearer <JWT_ACCESS_TOKEN>`)
- **Response Format**:
  - Success responses return `{ success: true, message: string, data: T }` with HTTP `200 OK` or `201 Created`.
  - Error responses return `{ success: false, message: string, errors?: any }` with appropriate HTTP status codes (`400`, `401`, `403`, `404`, `409`, `500`).
- **Primary Keys**: UUID v4 format (`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`). For backward compatibility with clients expecting MongoDB IDs, all responses provide both `id` and `_id` aliases.

---

## 2. Teacher vs Student Data Visibility Matrix

| Field / Data | Teacher / Admin (`/manage`) | Student (`/` or `/public`) |
| :--- | :---: | :---: |
| Exercise Metadata (`id`, `title`, `slug`, `difficulty`, `language`, `order`) | Yes | Yes |
| Exercise Status (`DRAFT`, `PUBLISHED`, `ARCHIVED`) | Yes (all statuses) | Only `PUBLISHED` |
| Draft Revision Content | Yes | **Never** |
| Starter Code | Yes | Yes |
| Execution Contract (`functionName`, `parameters`, `returnType`) | Yes | Yes |
| Resource Limits (`timeLimit`, `memoryLimit`) | Yes | Yes |
| **Reference Solution** (`referenceSolution`) | **Yes** | **STRICTLY STRIPPED (Never)** |
| Public Test Cases (`isHidden = false`) | Yes (with inputs & outputs) | Yes (with inputs & outputs) |
| **Hidden Test Cases** (`isHidden = true`) | **Yes** (with inputs & outputs) | **STRICTLY EXCLUDED (Never)** |
| Historical Revision List | Yes | No |
| Submissions & Results | Step 4 | Step 4 |

---

## 3. Endpoints Specification

### 3.1. Teacher — Create Exercise

Creates a new coding exercise under a specific Lesson.
- Creates the `CodingExercise` record with `status = DRAFT`.
- Creates `CodingExerciseRevision` v1 with `isPublished = false`.
- Creates all associated test cases (`CodingTestCase`) under revision v1.
- All writes are executed within a single atomic Prisma transaction.

- **Method**: `POST`
- **Endpoint**: `/api/coding-exercises`
- **Authentication**: Required (`verifyAccessToken`)
- **Authorization**: `TEACHER` (must own the target course containing the lesson) or `ADMIN`
- **Headers**: `Authorization: Bearer <token>`, `Content-Type: application/json`

#### Request Body
```json
{
  "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
  "title": "Tính tổng từ 1 đến N",
  "slug": "tinh-tong-tu-1-den-n",
  "description": "Viết hàm sumToN(n) trả về tổng các số nguyên dương từ 1 đến n.",
  "programmingLanguage": "javascript",
  "difficulty": "EASY",
  "starterCode": "function sumToN(n) {\n  // TODO: Viết code ở đây\n}",
  "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
  "executionContract": {
    "functionName": "sumToN",
    "parameters": [
      {
        "name": "n",
        "type": "number"
      }
    ],
    "returnType": "number"
  },
  "timeLimit": 2000,
  "memoryLimit": 128000,
  "order": 0,
  "testCases": [
    {
      "input": [5],
      "expectedOutput": 15,
      "isHidden": false,
      "order": 0,
      "weight": 20
    },
    {
      "input": [10],
      "expectedOutput": 55,
      "isHidden": true,
      "order": 1,
      "weight": 80
    }
  ]
}
```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Coding exercise created successfully",
  "data": {
    "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "_id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "title": "Tính tổng từ 1 đến N",
    "slug": "tinh-tong-tu-1-den-n",
    "difficulty": "EASY",
    "programmingLanguage": "javascript",
    "status": "DRAFT",
    "source": "MANUAL",
    "order": 0,
    "createdById": "13608f92-8acf-53e3-adcb-0d832e9cb1d4",
    "createdAt": "2026-10-23T19:07:04.120Z",
    "updatedAt": "2026-10-23T19:07:04.120Z",
    "currentRevision": {
      "id": "7662c431-8250-4d57-9dbf-1c4b8b6c8913",
      "_id": "7662c431-8250-4d57-9dbf-1c4b8b6c8913",
      "version": 1,
      "isPublished": false,
      "description": "Viết hàm sumToN(n) trả về tổng các số nguyên dương từ 1 đến n.",
      "starterCode": "function sumToN(n) {\n  // TODO: Viết code ở đây\n}",
      "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
      "executionContract": {
        "functionName": "sumToN",
        "parameters": [{ "name": "n", "type": "number" }],
        "returnType": "number"
      },
      "timeLimit": 2000,
      "memoryLimit": 128000,
      "testCases": [
        {
          "id": "e45ba05b-81d9-436f-bfe1-953b0f55d045",
          "_id": "e45ba05b-81d9-436f-bfe1-953b0f55d045",
          "input": [5],
          "expectedOutput": 15,
          "isHidden": false,
          "order": 0,
          "weight": 20
        },
        {
          "id": "fc4d96ab-c2d7-4009-8488-874b5c73cbe1",
          "_id": "fc4d96ab-c2d7-4009-8488-874b5c73cbe1",
          "input": [10],
          "expectedOutput": 55,
          "isHidden": true,
          "order": 1,
          "weight": 80
        }
      ]
    }
  }
}
```

#### Error Responses
- `400 Bad Request`: Validation failure (parameter count mismatch, invalid JSON, empty title, etc.).
- `401 Unauthorized`: Missing or invalid JWT token.
- `403 Forbidden`: User is a student, or teacher does not own the target course.
- `404 Not Found`: Target lesson or course does not exist.

---

### 3.2. Teacher — List Exercises by Lesson

Returns all exercises (including `DRAFT`, `PUBLISHED`, and `ARCHIVED`) belonging to a specified Lesson.

- **Method**: `GET`
- **Endpoint**: `/api/coding-exercises/lesson/:lessonId`
- **Authentication**: Required (`verifyAccessToken`)
- **Authorization**: `TEACHER` (course owner) or `ADMIN`
- **Route Params**:
  - `lessonId` (UUID): Identifier of the lesson.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Coding exercises fetched successfully",
  "data": [
    {
      "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
      "_id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
      "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
      "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
      "title": "Tính tổng từ 1 đến N",
      "slug": "tinh-tong-tu-1-den-n",
      "difficulty": "EASY",
      "programmingLanguage": "javascript",
      "status": "DRAFT",
      "source": "MANUAL",
      "order": 0,
      "createdAt": "2026-10-23T19:07:04.120Z",
      "updatedAt": "2026-10-23T19:07:04.120Z",
      "revisions": [
        {
          "id": "7662c431-8250-4d57-9dbf-1c4b8b6c8913",
          "version": 1,
          "isPublished": false,
          "createdAt": "2026-10-23T19:07:04.120Z",
          "_count": { "testCases": 2 }
        }
      ]
    }
  ]
}
```

---

### 3.3. Teacher — Get Full Exercise Details (Manage View)

Returns full management details of a coding exercise, including the reference solution, all test cases (both public and hidden), and the list of all historical revisions.

- **Method**: `GET`
- **Endpoint**: `/api/coding-exercises/:id/manage`
- **Authentication**: Required (`verifyAccessToken`)
- **Authorization**: `TEACHER` (course owner) or `ADMIN`
- **Route Params**:
  - `id` (UUID): Exercise identifier.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Coding exercise detail fetched successfully",
  "data": {
    "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "_id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "title": "Tính tổng từ 1 đến N",
    "slug": "tinh-tong-tu-1-den-n",
    "difficulty": "EASY",
    "programmingLanguage": "javascript",
    "status": "DRAFT",
    "source": "MANUAL",
    "order": 0,
    "createdAt": "2026-10-23T19:07:04.120Z",
    "updatedAt": "2026-10-23T19:07:04.120Z",
    "currentRevision": {
      "id": "7662c431-8250-4d57-9dbf-1c4b8b6c8913",
      "version": 1,
      "isPublished": false,
      "description": "Viết hàm sumToN(n) trả về tổng các số nguyên dương từ 1 đến n.",
      "starterCode": "function sumToN(n) {\n  // TODO: Viết code ở đây\n}",
      "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
      "executionContract": {
        "functionName": "sumToN",
        "parameters": [{ "name": "n", "type": "number" }],
        "returnType": "number"
      },
      "timeLimit": 2000,
      "memoryLimit": 128000,
      "testCases": [
        {
          "id": "e45ba05b-81d9-436f-bfe1-953b0f55d045",
          "input": [5],
          "expectedOutput": 15,
          "isHidden": false,
          "order": 0,
          "weight": 20
        },
        {
          "id": "fc4d96ab-c2d7-4009-8488-874b5c73cbe1",
          "input": [10],
          "expectedOutput": 55,
          "isHidden": true,
          "order": 1,
          "weight": 80
        }
      ]
    },
    "revisions": [
      {
        "id": "7662c431-8250-4d57-9dbf-1c4b8b6c8913",
        "version": 1,
        "isPublished": false,
        "createdAt": "2026-10-23T19:07:04.120Z",
        "_count": { "testCases": 2 }
      }
    ]
  }
}
```

---

### 3.4. Teacher — Update Exercise & Revision Management

Updates exercise metadata and grading specifications. Employs deterministic immutable revision versioning:
- **Case A (Draft Revision, 0 Submissions)**: Updates draft revision in-place and replaces test cases.
- **Case B (Published Revision or has Submissions)**: Preserves existing revision and test cases completely intact. Generates new revision `v(N+1)` (`isPublished = false`) and clones/replaces test cases.
- **Case C (Draft Revision already exists alongside Published)**: Updates the active draft revision in-place without generating redundant intermediate revisions.

- **Method**: `PUT`
- **Endpoint**: `/api/coding-exercises/:id`
- **Authentication**: Required (`verifyAccessToken`)
- **Authorization**: `TEACHER` (course owner) or `ADMIN`
- **Route Params**:
  - `id` (UUID): Exercise identifier.

#### Request Body
```json
{
  "title": "Tính tổng từ 1 đến N (Updated)",
  "difficulty": "MEDIUM",
  "starterCode": "function sumToN(n) {\n  // Viết code tối ưu\n}",
  "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
  "timeLimit": 3000,
  "memoryLimit": 256000,
  "testCases": [
    {
      "input": [5],
      "expectedOutput": 15,
      "isHidden": false,
      "order": 0,
      "weight": 30
    },
    {
      "input": [20],
      "expectedOutput": 210,
      "isHidden": true,
      "order": 1,
      "weight": 70
    }
  ]
}
```

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Coding exercise updated successfully",
  "data": {
    "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "title": "Tính tổng từ 1 đến N (Updated)",
    "slug": "tinh-tong-tu-1-den-n",
    "difficulty": "MEDIUM",
    "programmingLanguage": "javascript",
    "status": "DRAFT",
    "currentRevision": {
      "id": "5170d768-45ba-411a-88fa-f6f8bb15da2a",
      "version": 2,
      "isPublished": false,
      "starterCode": "function sumToN(n) {\n  // Viết code tối ưu\n}",
      "referenceSolution": "function sumToN(n) {\n  return (n * (n + 1)) / 2;\n}",
      "timeLimit": 3000,
      "memoryLimit": 256000,
      "testCases": [
        {
          "input": [5],
          "expectedOutput": 15,
          "isHidden": false,
          "order": 0,
          "weight": 30
        },
        {
          "input": [20],
          "expectedOutput": 210,
          "isHidden": true,
          "order": 1,
          "weight": 70
        }
      ]
    }
  }
}
```

---

### 3.5. Student — List Published Exercises

Lists published coding exercises within a lesson.
- Only returns exercises with `status = PUBLISHED` having a valid published revision.
- Strictly strips reference solutions, hidden test cases, and draft revisions.

- **Method**: `GET`
- **Endpoint**: `/api/coding-exercises/lesson/:lessonId/public`
- **Authentication**: Optional or standard student bearer token.
- **Route Params**:
  - `lessonId` (UUID): Lesson identifier.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Published coding exercises fetched successfully",
  "data": [
    {
      "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
      "_id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
      "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
      "title": "Tính tổng từ 1 đến N",
      "slug": "tinh-tong-tu-1-den-n",
      "difficulty": "EASY",
      "programmingLanguage": "javascript",
      "order": 0,
      "status": "PUBLISHED"
    }
  ]
}
```

---

### 3.6. Student — Get Published Exercise Detail

Retrieves detailed specifications of a published coding exercise for solving.
- Only serves the latest valid published revision.
- Strips `referenceSolution` and all hidden test cases.
- Includes execution contract, starter code, resource limits, and public sample test cases.

- **Method**: `GET`
- **Endpoint**: `/api/coding-exercises/:id`
- **Authentication**: Optional or standard student bearer token.
- **Route Params**:
  - `id` (UUID): Exercise identifier.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Published coding exercise fetched successfully",
  "data": {
    "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "_id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "lessonId": "1b2e6643-0006-5e9a-a9f7-3d3078b83262",
    "courseId": "f0dde7bb-1bf6-5602-a489-cd324132c68a",
    "title": "Tính tổng từ 1 đến N",
    "slug": "tinh-tong-tu-1-den-n",
    "difficulty": "EASY",
    "programmingLanguage": "javascript",
    "status": "PUBLISHED",
    "order": 0,
    "description": "Viết hàm sumToN(n) trả về tổng các số nguyên dương từ 1 đến n.",
    "starterCode": "function sumToN(n) {\n  // TODO: Viết code ở đây\n}",
    "executionContract": {
      "functionName": "sumToN",
      "parameters": [
        {
          "name": "n",
          "type": "number"
        }
      ],
      "returnType": "number"
    },
    "timeLimit": 2000,
    "memoryLimit": 128000,
    "testCases": [
      {
        "id": "e45ba05b-81d9-436f-bfe1-953b0f55d045",
        "input": [5],
        "expectedOutput": 15,
        "isHidden": false,
        "order": 0,
        "weight": 20
      }
    ]
  }
}
```

#### Error Responses
- `404 Not Found`: Exercise does not exist, is in `DRAFT` status, is `ARCHIVED`, or has no published revision.

---

### 3.7. Teacher — Soft Archive Exercise

Performs a soft archive of a coding exercise.
- Transitions `status` to `ARCHIVED`.
- Preserves all historical revisions, test cases, submissions, and test results intact.
- Immediately removes the exercise from student-facing published lists.

- **Method**: `DELETE`
- **Endpoint**: `/api/coding-exercises/:id`
- **Authentication**: Required (`verifyAccessToken`)
- **Authorization**: `TEACHER` (course owner) or `ADMIN`
- **Route Params**:
  - `id` (UUID): Exercise identifier.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Coding exercise archived successfully",
  "data": {
    "id": "e4587db3-6625-45dc-a681-9b19dfb40a5a",
    "status": "ARCHIVED",
    "updatedAt": "2026-10-23T19:07:05.100Z"
  }
}
```

---

## 4. Current Limitations & Scope Boundary for Step 2

1. **Publishing Workflow (Step 5)**:
   - There is deliberately no manual `isPublished = true` direct endpoint in Step 2.
   - Per architecture design, publishing an exercise requires automated validation of the reference solution against all test cases via the E2B Sandbox execution engine (scheduled for Step 5).
2. **Execution & Submission (Step 3 & 4)**:
   - Student execution (`/run`) and grading (`/submit`) endpoints will be implemented in Step 4 utilizing the E2B sandbox microVM client implemented in Step 3.
