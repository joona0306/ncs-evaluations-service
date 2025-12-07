# Supabase 테이블 구조 분석

## 전체 테이블 목록

현재 Supabase 데이터베이스에는 다음 13개의 테이블이 있습니다:

1. **profiles** - 사용자 프로필
2. **training_courses** - 훈련과정
3. **course_teachers** - 훈련과정-교사 관계 (다대다)
4. **course_students** - 훈련과정-학생 관계 (다대다)
5. **competency_units** - 능력단위
6. **competency_elements** - 능력단위요소
7. **performance_criteria** - 수행준거
8. **evaluation_schedules** - 평가일정
9. **submissions** - 과제물 제출
10. **evaluations** - 평가
11. **evaluation_criteria_scores** - 평가 점수 상세
12. **signatures** - 서명
13. **user_preferences** - 사용자 설정

## 테이블 관계도

```
profiles (1) ──< (N) course_teachers (N) >── (1) training_courses
profiles (1) ──< (N) course_students (N) >── (1) training_courses
training_courses (1) ──< (N) competency_units
competency_units (1) ──< (N) competency_elements
competency_elements (1) ──< (N) performance_criteria
competency_units (1) ──< (N) evaluation_schedules
evaluation_schedules (1) ──< (N) submissions
competency_units (1) ──< (N) evaluations
evaluations (1) ──< (N) evaluation_criteria_scores
evaluations (1) ──< (N) signatures
performance_criteria (1) ──< (N) evaluation_criteria_scores
profiles (1) ──< (N) evaluations (teacher_id)
profiles (1) ──< (N) evaluations (student_id)
profiles (1) ──< (N) submissions
profiles (1) ──< (N) signatures
profiles (1) ──< (1) user_preferences
```

## 테이블별 상세 정보

### 1. profiles (프로필)

**역할**: 사용자 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 사용자 ID
- `email` (TEXT) - 이메일
- `full_name` (TEXT) - 이름
- `role` (ENUM) - 역할 (admin, teacher, student)
- `phone` (TEXT) - 전화번호
- `approved` (BOOLEAN) - 승인 상태
- `agreed_terms_at` (TIMESTAMP) - 이용약관 동의일
- `agreed_privacy_at` (TIMESTAMP) - 개인정보 동의일
- `agreed_marketing` (BOOLEAN) - 마케팅 동의
- `agreed_marketing_at` (TIMESTAMP) - 마케팅 동의일

**관계**:
- `course_teachers` (다대다) - 담당 훈련과정
- `course_students` (다대다) - 수강 훈련과정
- `evaluations` (1:N, teacher_id) - 평가한 평가 목록
- `evaluations` (1:N, student_id) - 받은 평가 목록
- `submissions` (1:N) - 제출한 과제물
- `signatures` (1:N) - 작성한 서명
- `user_preferences` (1:1) - 사용자 설정

### 2. training_courses (훈련과정)

**역할**: 훈련과정 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 훈련과정 ID
- `name` (TEXT) - 훈련과정명
- `code` (TEXT, UNIQUE) - 과정 코드
- `start_date` (DATE) - 시작일
- `end_date` (DATE) - 종료일
- `description` (TEXT) - 설명

**관계**:
- `course_teachers` (다대다) - 담당 교사
- `course_students` (다대다) - 수강 학생
- `competency_units` (1:N) - 포함된 능력단위

### 3. course_teachers (훈련과정-교사 관계)

**역할**: 훈련과정과 교사의 다대다 관계

**주요 필드**:
- `course_id` (UUID, FK) - 훈련과정 ID
- `teacher_id` (UUID, FK) - 교사 ID
- `created_at` (TIMESTAMP) - 생성일

**특징**: 복합 기본키 (course_id, teacher_id)

### 4. course_students (훈련과정-학생 관계)

**역할**: 훈련과정과 학생의 다대다 관계

**주요 필드**:
- `course_id` (UUID, FK) - 훈련과정 ID
- `student_id` (UUID, FK) - 학생 ID
- `enrollment_date` (DATE) - 등록일
- `status` (ENUM) - 상태 (active, completed, withdrawn)
- `created_at` (TIMESTAMP) - 생성일

**특징**: 복합 기본키 (course_id, student_id)

### 5. competency_units (능력단위)

**역할**: 능력단위 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 능력단위 ID
- `course_id` (UUID, FK) - 훈련과정 ID
- `name` (TEXT) - 능력단위명
- `code` (TEXT) - 단위 코드
- `description` (TEXT) - 설명
- `evaluation_criteria` (JSONB) - 평가 기준

**관계**:
- `training_courses` (N:1) - 소속 훈련과정
- `competency_elements` (1:N) - 포함된 능력단위요소
- `evaluation_schedules` (1:N) - 관련 평가일정
- `evaluations` (1:N) - 관련 평가

### 6. competency_elements (능력단위요소)

**역할**: 능력단위요소 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 요소 ID
- `competency_unit_id` (UUID, FK) - 능력단위 ID
- `name` (TEXT) - 요소명
- `code` (TEXT) - 요소 코드
- `description` (TEXT) - 설명
- `display_order` (INTEGER) - 표시 순서

**관계**:
- `competency_units` (N:1) - 소속 능력단위
- `performance_criteria` (1:N) - 포함된 수행준거

### 7. performance_criteria (수행준거)

**역할**: 수행준거 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 준거 ID
- `competency_element_id` (UUID, FK) - 능력단위요소 ID
- `name` (TEXT) - 준거명
- `code` (TEXT) - 준거 코드
- `difficulty` (ENUM) - 난이도 (high, medium, low)
- `max_score` (INTEGER) - 최대 점수
- `description` (TEXT) - 설명
- `display_order` (INTEGER) - 표시 순서

**관계**:
- `competency_elements` (N:1) - 소속 능력단위요소
- `evaluation_criteria_scores` (1:N) - 관련 평가 점수

### 8. evaluation_schedules (평가일정)

**역할**: 평가일정 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 일정 ID
- `competency_unit_id` (UUID, FK) - 능력단위 ID
- `title` (TEXT) - 일정 제목
- `description` (TEXT) - 설명
- `start_date` (TIMESTAMP) - 시작일시
- `end_date` (TIMESTAMP) - 종료일시
- `status` (ENUM) - 상태 (scheduled, in_progress, completed, cancelled)
- `created_by` (UUID, FK) - 생성자 ID

**관계**:
- `competency_units` (N:1) - 관련 능력단위
- `submissions` (1:N) - 제출된 과제물
- `profiles` (N:1, created_by) - 생성자

### 9. submissions (과제물 제출)

**역할**: 과제물 제출 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 제출 ID
- `evaluation_schedule_id` (UUID, FK) - 평가일정 ID
- `student_id` (UUID, FK) - 학생 ID
- `competency_unit_id` (UUID, FK) - 능력단위 ID
- `submission_type` (ENUM) - 제출 유형 (image, url)
- `file_url` (TEXT) - 파일 URL
- `url` (TEXT) - 링크 URL
- `file_name` (TEXT) - 파일명
- `file_size` (INTEGER) - 파일 크기
- `comments` (TEXT) - 코멘트
- `submitted_at` (TIMESTAMP) - 제출일시

**관계**:
- `evaluation_schedules` (N:1) - 관련 평가일정
- `profiles` (N:1, student_id) - 제출한 학생
- `competency_units` (N:1) - 관련 능력단위
- `evaluations` (1:1) - 관련 평가

### 10. evaluations (평가)

**역할**: 평가 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 평가 ID
- `competency_unit_id` (UUID, FK) - 능력단위 ID
- `student_id` (UUID, FK) - 학생 ID
- `teacher_id` (UUID, FK) - 교사 ID
- `scores` (JSONB) - 점수 정보
- `comments` (TEXT) - 코멘트
- `status` (ENUM) - 상태 (draft, submitted, confirmed)
- `evaluated_at` (TIMESTAMP) - 평가일시
- `submission_id` (UUID, FK) - 과제물 ID
- `total_score` (DECIMAL) - 총점 (백분율)
- `raw_total_score` (INTEGER) - 원점수 합계

**관계**:
- `competency_units` (N:1) - 평가 대상 능력단위
- `profiles` (N:1, student_id) - 평가 대상 학생
- `profiles` (N:1, teacher_id) - 평가 담당 교사
- `submissions` (N:1) - 관련 과제물
- `evaluation_criteria_scores` (1:N) - 평가 점수 상세
- `signatures` (1:N) - 관련 서명

### 11. evaluation_criteria_scores (평가 점수 상세)

**역할**: 수행준거별 평가 점수 관리

**주요 필드**:
- `id` (UUID, PK) - 점수 ID
- `evaluation_id` (UUID, FK) - 평가 ID
- `criteria_id` (UUID, FK) - 수행준거 ID
- `score` (INTEGER) - 획득 점수
- `comments` (TEXT) - 코멘트

**관계**:
- `evaluations` (N:1) - 소속 평가
- `performance_criteria` (N:1) - 평가 대상 수행준거

### 12. signatures (서명)

**역할**: 서명 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 서명 ID
- `evaluation_id` (UUID, FK) - 평가 ID
- `signer_id` (UUID, FK) - 서명자 ID
- `signer_role` (ENUM) - 서명자 역할 (teacher, student, admin)
- `signature_type` (ENUM) - 서명 유형 (canvas, image)
- `signature_data` (TEXT) - 서명 데이터
- `signed_at` (TIMESTAMP) - 서명일시

**관계**:
- `evaluations` (N:1) - 관련 평가
- `profiles` (N:1, signer_id) - 서명자

### 13. user_preferences (사용자 설정)

**역할**: 사용자 설정 정보 관리

**주요 필드**:
- `id` (UUID, PK) - 설정 ID
- `user_id` (UUID, FK) - 사용자 ID
- `theme` (VARCHAR) - 테마 (light, dark, system)

**관계**:
- `profiles` (N:1, user_id) - 설정 소유자

## 핵심 관계 패턴

### 다대다 관계
- `training_courses` ↔ `profiles` (교사): `course_teachers` 테이블
- `training_courses` ↔ `profiles` (학생): `course_students` 테이블

### 일대다 관계
- `training_courses` → `competency_units`
- `competency_units` → `competency_elements`
- `competency_elements` → `performance_criteria`
- `competency_units` → `evaluation_schedules`
- `evaluation_schedules` → `submissions`
- `competency_units` → `evaluations`
- `evaluations` → `evaluation_criteria_scores`
- `evaluations` → `signatures`

### 일대일 관계
- `profiles` ↔ `user_preferences`

## 다음 단계

이제 다음 문서를 읽어보세요:

1. **[노션 데이터베이스 설계 원칙](./03-design-principles.md)** - 노션 데이터베이스 설계 방법 학습
2. **[테이블별 노션 데이터베이스 설계](./04-database-designs.md)** - 각 테이블의 노션 설계 확인

---

**이전**: [개요 및 시작하기](./01-overview.md)  
**다음**: [노션 데이터베이스 설계 원칙](./03-design-principles.md)

