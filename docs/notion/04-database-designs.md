# 테이블별 노션 데이터베이스 설계

이 문서는 각 Supabase 테이블을 노션 데이터베이스로 변환하는 상세 설계를 제공합니다.

## 목차

1. [프로필 (Profiles)](#1-프로필-profiles)
2. [훈련과정 (Training Courses)](#2-훈련과정-training-courses)
3. [능력단위 (Competency Units)](#3-능력단위-competency-units)
4. [능력단위요소 (Competency Elements)](#4-능력단위요소-competency-elements)
5. [수행준거 (Performance Criteria)](#5-수행준거-performance-criteria)
6. [평가일정 (Evaluation Schedules)](#6-평가일정-evaluation-schedules)
7. [과제물 제출 (Submissions)](#7-과제물-제출-submissions)
8. [평가 (Evaluations)](#8-평가-evaluations)
9. [평가 점수 상세 (Evaluation Criteria Scores)](#9-평가-점수-상세-evaluation-criteria-scores)
10. [서명 (Signatures)](#10-서명-signatures)
11. [사용자 설정 (User Preferences)](#11-사용자-설정-user-preferences)
12. [훈련과정-교사 (Course Teachers)](#12-훈련과정-교사-course-teachers)
13. [훈련과정-학생 (Course Students)](#13-훈련과정-학생-course-students)

---

## 1. 프로필 (Profiles)

**데이터베이스 이름**: `프로필`

### 속성 설계

| 속성명           | 속성 유형        | 설명                       | Supabase 필드                    |
| ---------------- | ---------------- | -------------------------- | -------------------------------- |
| 이름             | Title (기본)     | 사용자 이름                | `full_name`                      |
| 이메일           | Email            | 이메일 주소                | `email`                          |
| 역할             | Select           | 사용자 역할                | `role` (admin, teacher, student) |
| 전화번호         | Phone            | 전화번호                   | `phone`                          |
| 승인 상태        | Checkbox         | 관리자 승인 여부           | `approved`                       |
| 이용약관 동의일  | Date             | 이용약관 동의 일시         | `agreed_terms_at`                |
| 개인정보 동의일  | Date             | 개인정보처리방침 동의 일시 | `agreed_privacy_at`              |
| 마케팅 동의      | Checkbox         | 마케팅 정보 수신 동의      | `agreed_marketing`               |
| 마케팅 동의일    | Date             | 마케팅 정보 수신 동의 일시 | `agreed_marketing_at`            |
| 생성일           | Created time     | 레코드 생성 일시           | `created_at`                     |
| 수정일           | Last edited time | 레코드 수정 일시           | `updated_at`                     |
| 담당 훈련과정    | Relation         | 담당하는 훈련과정 (교사용) | `course_teachers` 관계           |
| 수강 훈련과정    | Relation         | 수강하는 훈련과정 (학생용) | `course_students` 관계           |
| 평가 목록 (교사) | Relation         | 교사로서 평가한 평가 목록  | `evaluations` (teacher_id)       |
| 평가 목록 (학생) | Relation         | 학생으로서 받은 평가 목록  | `evaluations` (student_id)       |
| 제출 과제물      | Relation         | 제출한 과제물 목록         | `submissions`                    |
| 서명 목록        | Relation         | 작성한 서명 목록           | `signatures`                     |
| 사용자 설정      | Relation         | 사용자 설정 (1:1)          | `user_preferences`               |

### Select 속성 옵션 (역할)

- Admin (빨간색)
- Teacher (노란색)
- Student (초록색)

---

## 2. 훈련과정 (Training Courses)

**데이터베이스 이름**: `훈련과정`

### 속성 설계

| 속성명      | 속성 유형        | 설명                       | Supabase 필드           |
| ----------- | ---------------- | -------------------------- | ----------------------- |
| 이름        | Title (기본)     | 훈련과정명                 | `name`                  |
| 과정 코드   | Text             | 훈련과정 코드              | `code`                  |
| 시작일      | Date             | 훈련과정 시작일            | `start_date`            |
| 종료일      | Date             | 훈련과정 종료일            | `end_date`              |
| 기간        | Formula          | 종료일 - 시작일 (일수)     | 계산 필드               |
| 설명        | Text             | 훈련과정 설명              | `description`           |
| 담당 교사   | Relation         | 담당 교사 목록             | `course_teachers`       |
| 수강 학생   | Relation         | 수강 학생 목록             | `course_students`       |
| 학생 수     | Rollup           | 수강 학생 수 (Count)       | `course_students` 롤업  |
| 교사 수     | Rollup           | 담당 교사 수 (Count)       | `course_teachers` 롤업  |
| 능력단위    | Relation         | 포함된 능력단위 목록       | `competency_units`      |
| 능력단위 수 | Rollup           | 포함된 능력단위 수 (Count) | `competency_units` 롤업 |
| 생성일      | Created time     | 레코드 생성 일시           | `created_at`            |
| 수정일      | Last edited time | 레코드 수정 일시           | `updated_at`            |

### 수식 속성 (기간)

```
dateBetween(prop("종료일"), prop("시작일"), "days")
```

---

## 3. 능력단위 (Competency Units)

**데이터베이스 이름**: `능력단위`

### 속성 설계

| 속성명       | 속성 유형        | 설명                     | Supabase 필드                  |
| ------------ | ---------------- | ------------------------ | ------------------------------ |
| 이름         | Title (기본)     | 능력단위명               | `name`                         |
| 단위 코드    | Text             | 능력단위 코드            | `code`                         |
| 설명         | Text             | 능력단위 설명            | `description`                  |
| 평가 기준    | Text             | 평가 기준 (JSONB 변환)   | `evaluation_criteria` (JSONB)  |
| 훈련과정     | Relation         | 소속 훈련과정            | `training_courses`             |
| 훈련과정명   | Rollup           | 훈련과정 이름            | `training_courses` 롤업 (name) |
| 능력단위요소 | Relation         | 포함된 능력단위요소 목록 | `competency_elements`          |
| 요소 수      | Rollup           | 포함된 요소 수 (Count)   | `competency_elements` 롤업     |
| 평가일정     | Relation         | 관련 평가일정 목록       | `evaluation_schedules`         |
| 평가         | Relation         | 관련 평가 목록           | `evaluations`                  |
| 평가 수      | Rollup           | 평가 수 (Count)          | `evaluations` 롤업             |
| 생성일       | Created time     | 레코드 생성 일시         | `created_at`                   |
| 수정일       | Last edited time | 레코드 수정 일시         | `updated_at`                   |

### JSONB 필드 처리 (evaluation_criteria)

Supabase의 `evaluation_criteria` JSONB 필드는 노션에서 다음과 같이 처리합니다:

**방법 1: Text 속성으로 변환** (권장)
- JSON을 문자열로 변환하여 Text 속성에 저장
- 필요시 레코드 페이지에 상세 정보 작성

**방법 2: 별도 속성으로 분리**
- JSON 구조를 분석하여 개별 속성으로 분리
- 예: 평가 항목1, 평가 항목2 등

**방법 3: 레코드 페이지에 작성**
- 레코드를 페이지로 열어 상세 평가 기준 작성
- 구조화된 블록으로 정보 정리

---

## 4. 능력단위요소 (Competency Elements)

**데이터베이스 이름**: `능력단위요소`

### 속성 설계

| 속성명         | 속성 유형        | 설명                               | Supabase 필드                           |
| -------------- | ---------------- | ---------------------------------- | --------------------------------------- |
| 이름           | Title (기본)     | 요소명                             | `name`                                  |
| 요소 코드      | Text             | 요소 코드                          | `code`                                  |
| 설명           | Text             | 요소 설명                          | `description`                           |
| 표시 순서      | Number           | 정렬 순서                          | `display_order`                         |
| 능력단위       | Relation         | 소속 능력단위                      | `competency_units`                      |
| 능력단위명     | Rollup           | 능력단위 이름                      | `competency_units` 롤업 (name)          |
| 수행준거       | Relation         | 포함된 수행준거 목록               | `performance_criteria`                  |
| 수행준거 수    | Rollup           | 수행준거 수 (Count)                | `performance_criteria` 롤업             |
| 최대 점수 합계 | Rollup           | 모든 수행준거의 최대 점수 합 (Sum) | `performance_criteria` 롤업 (max_score) |
| 생성일         | Created time     | 레코드 생성 일시                   | `created_at`                            |
| 수정일         | Last edited time | 레코드 수정 일시                   | `updated_at`                            |

---

## 5. 수행준거 (Performance Criteria)

**데이터베이스 이름**: `수행준거`

### 속성 설계

| 속성명       | 속성 유형        | 설명                | Supabase 필드                     |
| ------------ | ---------------- | ------------------- | --------------------------------- |
| 이름         | Title (기본)     | 수행준거명          | `name`                            |
| 준거 코드    | Text             | 준거 코드           | `code`                            |
| 난이도       | Select           | 난이도 수준         | `difficulty` (high, medium, low)  |
| 최대 점수    | Number           | 최대 점수           | `max_score`                       |
| 설명         | Text             | 준거 설명           | `description`                     |
| 표시 순서    | Number           | 정렬 순서           | `display_order`                   |
| 능력단위요소 | Relation         | 소속 능력단위요소   | `competency_elements`             |
| 요소명       | Rollup           | 능력단위요소 이름   | `competency_elements` 롤업 (name) |
| 평가 점수    | Relation         | 관련 평가 점수 목록 | `evaluation_criteria_scores`      |
| 생성일       | Created time     | 레코드 생성 일시    | `created_at`                      |
| 수정일       | Last edited time | 레코드 수정 일시    | `updated_at`                      |

### Select 속성 옵션 (난이도)

- High (빨간색)
- Medium (노란색)
- Low (초록색)

---

## 6. 평가일정 (Evaluation Schedules)

**데이터베이스 이름**: `평가일정`

### 속성 설계

| 속성명      | 속성 유형        | 설명                       | Supabase 필드                                           |
| ----------- | ---------------- | -------------------------- | ------------------------------------------------------- |
| 이름        | Title (기본)     | 평가일정 제목              | `title`                                                 |
| 설명        | Text             | 평가일정 설명              | `description`                                           |
| 시작일시    | Date             | 평가 시작 일시             | `start_date`                                            |
| 종료일시    | Date             | 평가 종료 일시             | `end_date`                                              |
| 기간        | Formula          | 종료일시 - 시작일시 (일수) | 계산 필드                                               |
| 상태        | Select           | 평가일정 상태              | `status` (scheduled, in_progress, completed, cancelled) |
| 능력단위    | Relation         | 관련 능력단위              | `competency_units`                                      |
| 능력단위명  | Rollup           | 능력단위 이름              | `competency_units` 롤업 (name)                          |
| 제출 과제물 | Relation         | 제출된 과제물 목록         | `submissions`                                           |
| 제출 수     | Rollup           | 제출된 과제물 수 (Count)   | `submissions` 롤업                                      |
| 생성자      | Relation         | 일정 생성자                | `profiles` (created_by)                                 |
| 생성자명    | Rollup           | 생성자 이름                | `profiles` 롤업 (이름)                                  |
| 생성일      | Created time     | 레코드 생성 일시           | `created_at`                                            |
| 수정일      | Last edited time | 레코드 수정 일시           | `updated_at`                                            |

### Select 속성 옵션 (상태)

- Scheduled (회색)
- In Progress (파란색)
- Completed (초록색)
- Cancelled (빨간색)

### 수식 속성 (기간)

```
dateBetween(prop("종료일시"), prop("시작일시"), "days")
```

---

## 7. 과제물 제출 (Submissions)

**데이터베이스 이름**: `과제물 제출`

### 속성 설계

| 속성명         | 속성 유형        | 설명                     | Supabase 필드                      |
| -------------- | ---------------- | ------------------------ | ---------------------------------- |
| 이름           | Title (기본)     | 과제물 제목 (자동 생성)  | Formula로 생성                     |
| 제출 유형      | Select           | 제출 유형                | `submission_type` (image, url)     |
| 파일 URL       | URL              | 파일 URL (이미지인 경우) | `file_url`                         |
| 링크 URL       | URL              | 링크 URL (URL인 경우)    | `url`                              |
| 파일명         | Text             | 파일명                   | `file_name`                        |
| 파일 크기      | Number           | 파일 크기 (바이트)       | `file_size`                        |
| 파일 크기 (MB) | Formula          | 파일 크기를 MB로 변환    | 계산 필드                          |
| 코멘트         | Text             | 제출 코멘트              | `comments`                         |
| 평가일정       | Relation         | 관련 평가일정            | `evaluation_schedules`             |
| 평가일정명     | Rollup           | 평가일정 제목            | `evaluation_schedules` 롤업 (이름) |
| 학생           | Relation         | 제출한 학생              | `profiles` (student_id)            |
| 학생명         | Rollup           | 학생 이름                | `profiles` 롤업 (이름)             |
| 능력단위       | Relation         | 관련 능력단위            | `competency_units`                 |
| 능력단위명     | Rollup           | 능력단위 이름            | `competency_units` 롤업 (이름)     |
| 관련 평가      | Relation         | 관련 평가 (1:1)          | `evaluations` (submission_id)      |
| 제출일시       | Date             | 제출 일시                | `submitted_at`                     |
| 생성일         | Created time     | 레코드 생성 일시         | `created_at`                       |
| 수정일         | Last edited time | 레코드 수정 일시         | `updated_at`                       |

### Select 속성 옵션 (제출 유형)

- Image (파란색)
- URL (초록색)

### 수식 속성 (이름)

```
if(prop("제출 유형") == "image", prop("파일명"), prop("링크 URL"))
```

### 수식 속성 (파일 크기 MB)

```
round(prop("파일 크기") / 1048576, 2)
```

### 주의사항: submissions와 evaluations의 1:1 관계

Supabase에서 `evaluations` 테이블에 `submission_id`가 있어 1:1 관계를 형성합니다. 노션에서는:

- **과제물 제출** 데이터베이스에 `관련 평가` (Relation) 속성 추가
- **평가** 데이터베이스에 `과제물` (Relation) 속성 추가
- 양방향 관계로 설정하되, 실제로는 1:1 관계임을 명시

---

## 8. 평가 (Evaluations)

**데이터베이스 이름**: `평가`

### 속성 설계

| 속성명         | 속성 유형        | 설명                                  | Supabase 필드                                                          |
| -------------- | ---------------- | ------------------------------------- | ---------------------------------------------------------------------- |
| 이름           | Title (기본)     | 평가 제목 (자동 생성)                 | Formula로 생성                                                         |
| 능력단위       | Relation         | 평가 대상 능력단위                    | `competency_units`                                                     |
| 능력단위명     | Rollup           | 능력단위 이름                         | `competency_units` 롤업 (이름)                                         |
| 학생           | Relation         | 평가 대상 학생                        | `profiles` (student_id)                                                |
| 학생명         | Rollup           | 학생 이름                             | `profiles` 롤업 (이름)                                                 |
| 교사           | Relation         | 평가 담당 교사                        | `profiles` (teacher_id)                                                |
| 교사명         | Rollup           | 교사 이름                             | `profiles` 롤업 (이름)                                                 |
| 상태           | Select           | 평가 상태                             | `status` (draft, submitted, confirmed)                                 |
| 코멘트         | Text             | 평가 코멘트                           | `comments`                                                             |
| 평가 점수 상세 | Relation         | 수행준거별 점수 목록                  | `evaluation_criteria_scores`                                           |
| 원점수 합계    | Rollup           | 모든 점수의 합 (Sum)                  | `evaluation_criteria_scores` 롤업 (score)                              |
| 최대 점수 합계 | Rollup           | 모든 수행준거의 최대 점수 합 (Sum)    | `evaluation_criteria_scores` → `performance_criteria` 롤업 (max_score) |
| 총점 (백분율)  | Formula          | (원점수 합계 / 최대 점수 합계) \* 100 | 계산 필드                                                              |
| 평가일시       | Date             | 평가 완료 일시                        | `evaluated_at`                                                         |
| 과제물         | Relation         | 관련 과제물 (1:1)                     | `submissions` (submission_id)                                           |
| 서명 목록      | Relation         | 관련 서명 목록                        | `signatures`                                                           |
| 서명 수        | Rollup           | 서명 수 (Count)                       | `signatures` 롤업                                                      |
| 생성일         | Created time     | 레코드 생성 일시                      | `created_at`                                                           |
| 수정일         | Last edited time | 레코드 수정 일시                      | `updated_at`                                                           |

### Select 속성 옵션 (상태)

- Draft (회색)
- Submitted (파란색)
- Confirmed (초록색)

### 수식 속성 (이름)

```
prop("능력단위명") + " - " + prop("학생명")
```

### 수식 속성 (총점 백분율)

```
if(prop("최대 점수 합계") > 0, round((prop("원점수 합계") / prop("최대 점수 합계")) * 100, 2), 0)
```

### 주의사항: scores JSONB 필드

Supabase의 `scores` JSONB 필드는 노션에서 다음과 같이 처리합니다:

- **평가 점수 상세** 데이터베이스로 분리하여 관리 (이미 설계됨)
- JSONB의 구조화된 데이터는 별도 레코드로 관리하는 것이 더 효율적

---

## 9. 평가 점수 상세 (Evaluation Criteria Scores)

**데이터베이스 이름**: `평가 점수 상세`

### 속성 설계

| 속성명    | 속성 유형        | 설명                      | Supabase 필드                           |
| --------- | ---------------- | ------------------------- | --------------------------------------- |
| 이름      | Title (기본)     | 점수 항목명 (자동 생성)   | Formula로 생성                          |
| 평가      | Relation         | 소속 평가                 | `evaluations`                           |
| 평가명    | Rollup           | 평가 제목                 | `evaluations` 롤업 (이름)               |
| 수행준거  | Relation         | 평가 대상 수행준거        | `performance_criteria`                  |
| 준거명    | Rollup           | 수행준거 이름             | `performance_criteria` 롤업 (이름)      |
| 최대 점수 | Rollup           | 수행준거의 최대 점수      | `performance_criteria` 롤업 (max_score) |
| 점수      | Number           | 획득 점수                 | `score`                                 |
| 점수 비율 | Formula          | (점수 / 최대 점수) \* 100 | 계산 필드                               |
| 코멘트    | Text             | 점수 코멘트               | `comments`                              |
| 생성일    | Created time     | 레코드 생성 일시          | `created_at`                            |
| 수정일    | Last edited time | 레코드 수정 일시          | `updated_at`                            |

### 수식 속성 (이름)

```
prop("평가명") + " - " + prop("준거명")
```

### 수식 속성 (점수 비율)

```
if(prop("최대 점수") > 0, round((prop("점수") / prop("최대 점수")) * 100, 2), 0)
```

---

## 10. 서명 (Signatures)

**데이터베이스 이름**: `서명`

### 속성 설계

| 속성명      | 속성 유형    | 설명                    | Supabase 필드                           |
| ----------- | ------------ | ----------------------- | --------------------------------------- |
| 이름        | Title (기본) | 서명 제목 (자동 생성)   | Formula로 생성                          |
| 평가        | Relation     | 관련 평가               | `evaluations`                           |
| 평가명      | Rollup       | 평가 제목               | `evaluations` 롤업 (이름)               |
| 서명자      | Relation     | 서명한 사용자           | `profiles` (signer_id)                  |
| 서명자명    | Rollup       | 서명자 이름             | `profiles` 롤업 (이름)                  |
| 서명자 역할 | Select       | 서명자 역할             | `signer_role` (teacher, student, admin) |
| 서명 유형   | Select       | 서명 유형               | `signature_type` (canvas, image)        |
| 서명 데이터 | Text         | 서명 데이터 (Base64 등) | `signature_data`                        |
| 서명일시    | Date         | 서명 일시               | `signed_at`                             |
| 생성일      | Created time | 레코드 생성 일시        | `created_at`                            |

### Select 속성 옵션 (서명자 역할)

- Teacher (파란색)
- Student (초록색)
- Admin (빨간색)

### Select 속성 옵션 (서명 유형)

- Canvas (파란색)
- Image (초록색)

### 수식 속성 (이름)

```
prop("평가명") + " - " + prop("서명자명")
```

---

## 11. 사용자 설정 (User Preferences)

**데이터베이스 이름**: `사용자 설정`

### 속성 설계

| 속성명   | 속성 유형        | 설명                  | Supabase 필드                 |
| -------- | ---------------- | --------------------- | ----------------------------- |
| 이름     | Title (기본)     | 설정 제목 (자동 생성) | Formula로 생성                |
| 사용자   | Relation         | 설정 소유자           | `profiles` (user_id)          |
| 사용자명 | Rollup           | 사용자 이름           | `profiles` 롤업 (이름)        |
| 테마     | Select           | 테마 설정             | `theme` (light, dark, system) |
| 생성일   | Created time     | 레코드 생성 일시      | `created_at`                  |
| 수정일   | Last edited time | 레코드 수정 일시      | `updated_at`                  |

### Select 속성 옵션 (테마)

- Light (노란색)
- Dark (회색)
- System (파란색)

### 수식 속성 (이름)

```
prop("사용자명") + " 설정"
```

---

## 12. 훈련과정-교사 (Course Teachers)

**데이터베이스 이름**: `훈련과정-교사`

**역할**: 훈련과정과 교사의 다대다 관계를 위한 중간 데이터베이스

### 속성 설계

| 속성명   | 속성 유형        | 설명                | Supabase 필드           |
| -------- | ---------------- | ------------------- | ----------------------- |
| 이름     | Title (기본)     | 관계 제목 (자동 생성) | Formula로 생성          |
| 훈련과정 | Relation         | 관련 훈련과정       | `training_courses`      |
| 훈련과정명 | Rollup         | 훈련과정 이름       | `training_courses` 롤업 (이름) |
| 교사     | Relation         | 관련 교사           | `profiles` (teacher_id) |
| 교사명   | Rollup           | 교사 이름           | `profiles` 롤업 (이름)  |
| 생성일   | Created time     | 레코드 생성 일시    | `created_at`            |

### 수식 속성 (이름)

```
prop("훈련과정명") + " - " + prop("교사명")
```

### 주의사항

- 이 데이터베이스는 다대다 관계를 구현하기 위한 중간 테이블입니다
- 직접 레코드를 생성하지 않고, 훈련과정 또는 프로필 데이터베이스에서 관계를 통해 자동으로 생성됩니다
- 또는 수동으로 레코드를 생성하여 관계를 설정할 수 있습니다

---

## 13. 훈련과정-학생 (Course Students)

**데이터베이스 이름**: `훈련과정-학생`

**역할**: 훈련과정과 학생의 다대다 관계를 위한 중간 데이터베이스

### 속성 설계

| 속성명     | 속성 유형        | 설명                | Supabase 필드           |
| ---------- | ---------------- | ------------------- | ----------------------- |
| 이름       | Title (기본)     | 관계 제목 (자동 생성) | Formula로 생성          |
| 훈련과정   | Relation         | 관련 훈련과정       | `training_courses`      |
| 훈련과정명 | Rollup           | 훈련과정 이름       | `training_courses` 롤업 (이름) |
| 학생       | Relation         | 관련 학생           | `profiles` (student_id) |
| 학생명     | Rollup           | 학생 이름           | `profiles` 롤업 (이름)  |
| 등록일     | Date             | 등록일              | `enrollment_date`       |
| 상태       | Select           | 등록 상태           | `status` (active, completed, withdrawn) |
| 생성일     | Created time     | 레코드 생성 일시    | `created_at`            |

### Select 속성 옵션 (상태)

- Active (초록색)
- Completed (파란색)
- Withdrawn (빨간색)

### 수식 속성 (이름)

```
prop("훈련과정명") + " - " + prop("학생명")
```

### 주의사항

- 이 데이터베이스는 다대다 관계를 구현하기 위한 중간 테이블입니다
- `등록일`과 `상태` 같은 추가 정보를 저장할 수 있습니다
- 훈련과정 또는 프로필 데이터베이스에서 관계를 통해 관리하거나, 수동으로 레코드를 생성할 수 있습니다

---

## 다음 단계

이제 다음 문서를 읽어보세요:

1. **[관계 설정 방법](./05-relationships.md)** - 관계 설정 실습
2. **[롤업 및 수식 속성 활용](./06-rollups-formulas.md)** - 계산 필드 추가 방법

---

**이전**: [노션 데이터베이스 설계 원칙](./03-design-principles.md)  
**다음**: [관계 설정 방법](./05-relationships.md)
