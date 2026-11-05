# TMDEMY — STEP 4: STUDENT EXECUTION & SUBMISSION API SPECIFICATION

## 1. Overview & Base Configuration

This document specifies the REST API contract for student code execution, submission, and auto-grading in TMdemy Backend.

- **Base URL**: `http://localhost:5000/api`
- **Protocol**: HTTP/1.1 or HTTP/2, JSON format
- **Authentication**: Bearer JWT (`Authorization: Bearer <accessToken>`)
- **Route Namespace**: `/coding-exercises`

---

## 2. API Endpoints Summary

| Method | Endpoint | Description | Rate Limit |
| :--- | :--- | :--- | :--- |
| `POST` | `/coding-exercises/:id/run` | Practice test run against public test cases (Ephemeral, no DB writes) | 10 req/min |
| `POST` | `/coding-exercises/:id/submit` | Official graded submission against all test cases (Persisted to DB) | 5 req/min |
| `GET` | `/coding-exercises/:id/submissions` | Paginated submission history for the authenticated student | Standard |
| `GET` | `/coding-exercises/:id/submissions/:submissionId` | Detailed submission report with anti-cheat redaction | Standard |

---

## 3. Endpoint Details

### 3.1 Run Code (Practice Mode)

Executes untrusted JavaScript solution code against **public test cases only** (`isHidden: false`). Creates no database records.

- **Endpoint**: `POST /api/coding-exercises/:id/run`
- **Headers**:
  ```http
  Authorization: Bearer <student_jwt>
  Content-Type: application/json
  ```
- **Path Parameters**:
  - `id` (UUIDv4): Unique identifier of the coding exercise.
- **Request Body**:
  ```json
  {
    "sourceCode": "function sumToN(n) {\n  return n * (n + 1) / 2;\n}"
  }
  ```
  *Validation Rules*:
  - `sourceCode`: `string`, non-empty, maximum 65,536 bytes (64 KB).

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Practice run completed successfully",
  "data": {
    "status": "ACCEPTED",
    "score": 100,
    "maxScore": 100,
    "passedTests": 1,
    "totalTests": 1,
    "executionTimeMs": 42,
    "results": [
      {
        "testCaseId": "1b5e4088-3e4b-4b2a-89a5-8be48bf7612c",
        "order": 1,
        "weight": 30,
        "isHidden": false,
        "status": "PASSED",
        "input": [5],
        "expectedOutput": 15,
        "actualOutput": 15,
        "stdout": "Calculated sum for n=5\n",
        "executionTimeMs": 42
      }
    ]
  }
}
```

#### Special Case: Zero Public Test Cases (`200 OK`)
When an exercise contains only hidden test cases:
```json
{
  "success": true,
  "message": "Practice run completed with no public test cases",
  "data": {
    "status": "NO_TEST_CASES",
    "score": 0,
    "maxScore": 100,
    "passedTests": 0,
    "totalTests": 0,
    "executionTimeMs": 0,
    "results": []
  }
}
```

---

### 3.2 Submit Code (Official Assessment)

Creates an official `CodingSubmission` in PostgreSQL, executes all test cases (public + hidden) in the E2B Sandbox, calculates the final score, and persists individual `CodingTestResult` records.

- **Endpoint**: `POST /api/coding-exercises/:id/submit`
- **Headers**:
  ```http
  Authorization: Bearer <student_jwt>
  Content-Type: application/json
  ```
- **Path Parameters**:
  - `id` (UUIDv4): Unique identifier of the coding exercise.
- **Request Body**:
  ```json
  {
    "sourceCode": "function sumToN(n) {\n  return n * (n + 1) / 2;\n}"
  }
  ```

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "message": "Submission evaluated and recorded successfully",
  "data": {
    "id": "e0b59b3f-14ab-453f-a3d8-5517173b2ae4",
    "exerciseId": "9b526365-666d-49be-a5b8-3f188e3abe9e",
    "revisionId": "2a8b1e2d-325c-4bcf-a7d1-027bca220e5a",
    "status": "ACCEPTED",
    "score": 100,
    "maxScore": 100,
    "passedTests": 2,
    "totalTests": 2,
    "executionTime": 84,
    "createdAt": "2026-10-23T14:40:15.710Z",
    "completedAt": "2026-10-23T14:40:17.320Z",
    "results": [
      {
        "testCaseId": "1b5e4088-3e4b-4b2a-89a5-8be48bf7612c",
        "order": 1,
        "weight": 30,
        "isHidden": false,
        "status": "PASSED",
        "input": [5],
        "expectedOutput": 15,
        "actualOutput": 15,
        "stdout": "Calculated sum for n=5\n",
        "executionTimeMs": 42
      },
      {
        "testCaseId": "7f8b91c2-901e-450a-bf19-3c990b76e511",
        "order": 2,
        "weight": 70,
        "isHidden": true,
        "status": "PASSED",
        "executionTimeMs": 42
      }
    ]
  }
}
```
*Notice*: On the hidden test case (`order: 2`), `input`, `expectedOutput`, `actualOutput`, and `stdout` are strictly omitted from the response.

---

### 3.3 Submission History

Returns a paginated list of submissions made by the authenticated student for the specified coding exercise.

- **Endpoint**: `GET /api/coding-exercises/:id/submissions`
- **Headers**:
  ```http
  Authorization: Bearer <student_jwt>
  ```
- **Path Parameters**:
  - `id` (UUIDv4): Unique identifier of the coding exercise.
- **Query Parameters**:
  - `page` (integer, optional, default: `1`): Current page number.
  - `limit` (integer, optional, default: `10`, max: `50`): Items per page.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Submission history retrieved successfully",
  "data": {
    "items": [
      {
        "id": "e0b59b3f-14ab-453f-a3d8-5517173b2ae4",
        "exerciseId": "9b526365-666d-49be-a5b8-3f188e3abe9e",
        "revisionId": "2a8b1e2d-325c-4bcf-a7d1-027bca220e5a",
        "revisionVersion": 1,
        "status": "ACCEPTED",
        "score": 100,
        "maxScore": 100,
        "passedTests": 2,
        "totalTests": 2,
        "executionTime": 84,
        "createdAt": "2026-10-23T14:40:15.710Z",
        "completedAt": "2026-10-23T14:40:17.320Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "totalItems": 1,
      "totalPages": 1
    }
  }
}
```

---

### 3.4 Submission Detail

Retrieves detailed execution results for a specific submission, with server-side anti-cheat redaction.

- **Endpoint**: `GET /api/coding-exercises/:id/submissions/:submissionId`
- **Headers**:
  ```http
  Authorization: Bearer <student_jwt>
  ```
- **Path Parameters**:
  - `id` (UUIDv4): Exercise identifier.
  - `submissionId` (UUIDv4): Submission identifier.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "message": "Submission details retrieved successfully",
  "data": {
    "id": "e0b59b3f-14ab-453f-a3d8-5517173b2ae4",
    "exerciseId": "9b526365-666d-49be-a5b8-3f188e3abe9e",
    "revisionId": "2a8b1e2d-325c-4bcf-a7d1-027bca220e5a",
    "userId": "02e8e13a-dab2-5fb6-a14f-933ac125edca",
    "sourceCode": "function sumToN(n) {\n  return n * (n + 1) / 2;\n}",
    "status": "ACCEPTED",
    "score": 100,
    "maxScore": 100,
    "passedTests": 2,
    "totalTests": 2,
    "executionTime": 84,
    "errorMessage": null,
    "createdAt": "2026-10-23T14:40:15.710Z",
    "completedAt": "2026-10-23T14:40:17.320Z",
    "results": [
      {
        "testCaseId": "1b5e4088-3e4b-4b2a-89a5-8be48bf7612c",
        "order": 1,
        "weight": 30,
        "isHidden": false,
        "status": "PASSED",
        "input": [5],
        "expectedOutput": 15,
        "actualOutput": 15,
        "stdout": "Calculated sum for n=5\n",
        "executionTimeMs": 42
      },
      {
        "testCaseId": "7f8b91c2-901e-450a-bf19-3c990b76e511",
        "order": 2,
        "weight": 70,
        "isHidden": true,
        "status": "PASSED",
        "executionTimeMs": 42
      }
    ]
  }
}
```

---

## 4. Error Responses

### 4.1 Missing / Malformed JWT (`401 Unauthorized`)
```json
{
  "success": false,
  "error": "Access Token is missing!"
}
```

### 4.2 Not Enrolled in Course (`403 Forbidden`)
```json
{
  "success": false,
  "error": "You are not enrolled in this course"
}
```

### 4.3 IDOR Attempt: Viewing Other Student's Submission (`403 Forbidden`)
```json
{
  "success": false,
  "error": "You are not authorized to view this submission"
}
```

### 4.4 Exercise is in DRAFT or ARCHIVED (`404 Not Found`)
```json
{
  "success": false,
  "error": "Coding exercise not found or not published"
}
```

### 4.5 Rate Limit Exceeded (`429 Too Many Requests`)
Header: `Retry-After: 48`
```json
{
  "success": false,
  "error": "Too many code execution requests. Please wait before running again."
}
```

### 4.6 Source Code Exceeds Maximum Limit (`400 Bad Request`)
```json
{
  "success": false,
  "error": "Source code exceeds maximum allowed size of 64 KB"
}
```

---

## 5. Testing with cURL

### 5.1 Run Code
```bash
curl -X POST "http://localhost:5000/api/coding-exercises/9b526365-666d-49be-a5b8-3f188e3abe9e/run" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "function sumToN(n) { return n * (n + 1) / 2; }"
  }'
```

### 5.2 Submit Code
```bash
curl -X POST "http://localhost:5000/api/coding-exercises/9b526365-666d-49be-a5b8-3f188e3abe9e/submit" \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sourceCode": "function sumToN(n) { return n * (n + 1) / 2; }"
  }'
```

### 5.3 Fetch Submission History
```bash
curl -X GET "http://localhost:5000/api/coding-exercises/9b526365-666d-49be-a5b8-3f188e3abe9e/submissions?page=1&limit=10" \
  -H "Authorization: Bearer <TOKEN>"
```

### 5.4 Fetch Submission Detail
```bash
curl -X GET "http://localhost:5000/api/coding-exercises/9b526365-666d-49be-a5b8-3f188e3abe9e/submissions/e0b59b3f-14ab-453f-a3d8-5517173b2ae4" \
  -H "Authorization: Bearer <TOKEN>"
```
