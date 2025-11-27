# NCS 훈련 관리 시스템 API 문서

**버전**: 1.0  
**기본 URL**: `/api`

---

## 📋 목차

1. [인증](#인증)
2. [사용자 관리](#사용자-관리)
3. [훈련과정 관리](#훈련과정-관리)
4. [평가 관리](#평가-관리)
5. [과제물 관리](#과제물-관리)
6. [서명 관리](#서명-관리)
7. [공통 응답 형식](#공통-응답-형식)
8. [에러 코드](#에러-코드)

---

## 인증

모든 API 요청은 인증이 필요합니다. 인증되지 않은 요청은 `401 Unauthorized`를 반환합니다.

### 역할 기반 접근 제어

- **admin**: 모든 리소스 접근 가능
- **teacher**: 자신이 담당한 훈련과정의 리소스만 접근 가능
- **student**: 자신의 리소스만 접근 가능

---

## 사용자 관리

### GET /api/profiles

사용자 목록 조회 (관리자만)

**권한**: `admin`

**Query Parameters**:
- `role` (optional): 역할 필터 (`admin`, `teacher`, `student`)
- `limit` (optional): 페이지당 항목 수 (기본값: 20, 최대: 100)
- `offset` (optional): 오프셋 (기본값: 0)
- `page` (optional): 페이지 번호 (1부터 시작)

**응답**:
```json
{
  "data": [
    {
      "id": "uuid",
      "full_name": "홍길동",
      "email": "hong@example.com",
      "role": "student",
      "phone": "010-1234-5678",
      "approved": true,
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

---

## 훈련과정 관리

### GET /api/courses

훈련과정 목록 조회

**권한**: `admin`, `teacher`

**응답**:
```json
[
  {
    "id": "uuid",
    "name": "웹 개발 과정",
    "code": "WEB-001",
    "start_date": "2025-01-01",
    "end_date": "2025-12-31",
    "description": "웹 개발 기초 과정"
  }
]
```

### POST /api/courses

훈련과정 생성

**권한**: `admin`

**요청 본문**:
```json
{
  "name": "웹 개발 과정",
  "code": "WEB-001",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "description": "웹 개발 기초 과정"
}
```

**검증 규칙**:
- `name`: 1-200자, HTML 태그 제거
- `code`: 1-50자, HTML 태그 제거
- `start_date`: YYYY-MM-DD 형식
- `end_date`: YYYY-MM-DD 형식
- `description`: 최대 5000자 (선택사항)

**응답**: `201 Created`
```json
{
  "data": {
    "id": "uuid",
    "name": "웹 개발 과정",
    ...
  }
}
```

### PUT /api/courses

훈련과정 수정

**권한**: `admin`

**요청 본문**:
```json
{
  "id": "uuid",
  "name": "웹 개발 과정 (수정)",
  "code": "WEB-001",
  "start_date": "2025-01-01",
  "end_date": "2025-12-31",
  "description": "수정된 설명"
}
```

**응답**: `200 OK`

---

## 평가 관리

### GET /api/evaluations

평가 목록 조회

**권한**: `admin`, `teacher`

**Query Parameters**:
- `limit` (optional): 페이지당 항목 수 (기본값: 20, 최대: 100)
- `offset` (optional): 오프셋
- `page` (optional): 페이지 번호

**응답**:
```json
{
  "data": [
    {
      "id": "uuid",
      "competency_unit_id": "uuid",
      "student_id": "uuid",
      "teacher_id": "uuid",
      "status": "confirmed",
      "comments": "우수한 성과",
      "submission_id": "uuid",
      "competency_units": { ... },
      "student": { ... },
      "teacher": { ... }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 50,
    "hasMore": true
  }
}
```

### POST /api/evaluations

평가 생성

**권한**: `admin`, `teacher`

**요청 본문**:
```json
{
  "competency_unit_id": "uuid",
  "student_id": "uuid",
  "teacher_id": "uuid",
  "comments": "평가 의견",
  "status": "draft",
  "submission_id": "uuid",
  "element_scores": [
    {
      "criteria_id": "uuid",
      "score": 15,
      "comments": "수행준거별 의견"
    }
  ]
}
```

**검증 규칙**:
- `competency_unit_id`: UUID 형식
- `student_id`: UUID 형식
- `teacher_id`: UUID 형식
- `status`: `draft`, `submitted`, `confirmed` 중 하나
- `element_scores`: 배열, 각 항목은 `criteria_id`, `score` (0-100), `comments` 포함

**응답**: `201 Created`

**에러**:
- `409 Conflict`: 이미 평가가 존재하는 경우
  ```json
  {
    "error": "이 학생에 대한 평가가 이미 존재합니다.",
    "existing_evaluation_id": "uuid"
  }
  ```

### PUT /api/evaluations

평가 수정

**권한**: `admin`, `teacher`

**요청 본문**:
```json
{
  "id": "uuid",
  "comments": "수정된 평가 의견",
  "status": "confirmed",
  "element_scores": [ ... ]
}
```

**응답**: `200 OK`

### GET /api/evaluations/[id]

평가 상세 조회

**권한**: `admin`, `teacher`, `student` (본인 평가만)

**응답**: `200 OK`

### DELETE /api/evaluations/[id]

평가 삭제

**권한**: `admin`, `teacher` (본인 평가만)

**응답**: `200 OK`

### GET /api/evaluations/by-course

훈련과정별 평가 상태 조회

**권한**: `admin`, `teacher`

**Query Parameters**:
- `course_id` (required): 훈련과정 ID

**응답**:
```json
[
  {
    "competency_unit": {
      "id": "uuid",
      "name": "능력단위명",
      "code": "01"
    },
    "students": [
      {
        "student_id": "uuid",
        "student_name": "홍길동",
        "student_email": "hong@example.com",
        "evaluation": { ... },
        "submissions": [ ... ],
        "has_submission": true,
        "evaluation_status": "confirmed"
      }
    ]
  }
]
```

---

## 과제물 관리

### GET /api/submissions

과제물 목록 조회

**권한**: `admin`, `teacher`, `student` (본인 과제물만)

**Query Parameters**:
- `evaluation_schedule_id` (optional): 평가일정 ID
- `student_id` (optional): 학생 ID
- `competency_unit_id` (optional): 능력단위 ID
- `limit` (optional): 페이지당 항목 수 (기본값: 20)
- `offset` (optional): 오프셋
- `page` (optional): 페이지 번호

**응답**:
```json
{
  "data": [
    {
      "id": "uuid",
      "submission_type": "image",
      "file_url": "https://...",
      "file_name": "assignment.png",
      "submitted_at": "2025-01-01T00:00:00Z",
      "student": { ... },
      "evaluation_schedules": { ... }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 30,
    "hasMore": true
  }
}
```

### POST /api/submissions

과제물 제출

**권한**: `student`

**요청 본문**:
```json
{
  "evaluation_schedule_id": "uuid",
  "competency_unit_id": "uuid",
  "submission_type": "image",
  "file_url": "https://...",
  "file_name": "assignment.png",
  "file_size": 1024000,
  "comments": "과제물 설명"
}
```

**검증 규칙**:
- `evaluation_schedule_id`: UUID 형식
- `competency_unit_id`: UUID 형식
- `submission_type`: `image` 또는 `url`
- `file_url`: `submission_type`이 `image`인 경우 필수, URL 형식
- `url`: `submission_type`이 `url`인 경우 필수, URL 형식
- `file_size`: 최대 5MB (5 * 1024 * 1024 bytes)

**응답**: `201 Created`

### GET /api/submissions/image

과제물 이미지 조회 (Signed URL)

**권한**: 
- `admin`: 모든 이미지 접근 가능
- `teacher`: 담당 훈련과정의 이미지만 접근 가능
- `student`: 본인 과제물 이미지만 접근 가능

**Query Parameters**:
- `id` (required): 제출 ID
- `path` (optional): 직접 파일 경로 (관리자/교사만)

**응답**:
```json
{
  "url": "https://...signed-url...",
  "path": "submissions/..."
}
```

---

## 서명 관리

### GET /api/signatures

서명 목록 조회

**권한**: `admin`, `teacher`, `student` (관련 평가의 서명만)

**Query Parameters**:
- `evaluation_id` (required): 평가 ID

**응답**:
```json
[
  {
    "id": "uuid",
    "evaluation_id": "uuid",
    "signer_id": "uuid",
    "signer_role": "teacher",
    "signature_url": "https://...",
    "signed_at": "2025-01-01T00:00:00Z",
    "signer": { ... }
  }
]
```

### POST /api/signatures

서명 생성

**권한**: `admin`, `teacher`, `student` (본인 평가만)

**요청 본문**:
```json
{
  "evaluation_id": "uuid",
  "signer_id": "uuid",
  "signer_role": "teacher",
  "signature_url": "https://..."
}
```

**응답**: `201 Created`

---

## 공통 응답 형식

### 성공 응답

**페이징 없는 경우**:
```json
{
  "data": [ ... ]
}
```

**페이징 있는 경우**:
```json
{
  "data": [ ... ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

### 에러 응답

```json
{
  "error": "에러 메시지",
  "details": [ "상세 에러 메시지 1", "상세 에러 메시지 2" ]
}
```

---

## 에러 코드

| HTTP 상태 코드 | 설명 |
|---------------|------|
| `200 OK` | 요청 성공 |
| `201 Created` | 리소스 생성 성공 |
| `400 Bad Request` | 잘못된 요청 (입력 검증 실패 등) |
| `401 Unauthorized` | 인증되지 않음 |
| `403 Forbidden` | 권한 없음 |
| `404 Not Found` | 리소스를 찾을 수 없음 |
| `409 Conflict` | 리소스 충돌 (예: 중복 생성) |
| `500 Internal Server Error` | 서버 오류 |

---

## 페이징

대부분의 목록 조회 API는 페이징을 지원합니다.

**Query Parameters**:
- `limit`: 페이지당 항목 수 (기본값: 20, 최소: 1, 최대: 100)
- `offset`: 오프셋 (기본값: 0)
- `page`: 페이지 번호 (1부터 시작, `offset`과 함께 사용 시 `offset` 우선)

**예시**:
```
GET /api/evaluations?limit=20&page=1
GET /api/evaluations?limit=10&offset=20
```

**응답 형식**:
```json
{
  "data": [ ... ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 100,
    "hasMore": true
  }
}
```

---

## 입력 검증

모든 POST/PUT 요청은 Zod 스키마로 검증됩니다.

**검증 실패 시**:
```json
{
  "error": "입력 검증 실패",
  "details": [
    "name: 최소 1자 이상 입력해주세요.",
    "code: 최대 50자까지 입력 가능합니다."
  ]
}
```

**자동 적용되는 보안 조치**:
- HTML 태그 제거 (`<`, `>`)
- 공백 제거 (trim)
- 최대 길이 제한

---

## 인증 헤더

모든 API 요청은 Supabase 세션 쿠키를 통해 인증됩니다. 별도의 Authorization 헤더는 필요하지 않습니다.

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 11월 27일

