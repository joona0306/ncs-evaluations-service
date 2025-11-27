# 마이그레이션 통합 가이드

## 개요

기존 28개의 마이그레이션 파일을 논리적으로 그룹화하여 통합 마이그레이션 파일(`000_consolidated_schema.sql`)을 생성했습니다.

**✅ 통합 완료**: 모든 개별 마이그레이션 파일이 통합 파일에 포함되었으며, 개별 파일들은 제거되었습니다.

## 파일 구조

### 통합 마이그레이션 파일
- `supabase/migrations/000_consolidated_schema.sql`: 모든 스키마를 하나로 통합한 파일
  - 확장 및 타입 정의
  - 모든 테이블 생성
  - 인덱스 생성
  - 함수 및 트리거
  - RLS 정책 (완전 통합)
  - Storage Buckets 및 정책 (완전 통합)

## 사용 방법

### Supabase 대시보드에서 실행

이 마이그레이션 파일은 **Supabase 대시보드의 SQL Editor에서 직접 실행**합니다:

1. Supabase 대시보드 → SQL Editor 열기
2. `000_consolidated_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. 실행

### 새 프로젝트
새 프로젝트를 시작할 때는 `000_consolidated_schema.sql` 파일 하나만 사용하면 됩니다.

### 기존 프로젝트
기존 프로젝트에서는:
1. 통합 파일을 참고하여 필요한 부분만 선택하여 실행
2. 이미 존재하는 테이블/함수와 충돌하지 않도록 주의
3. 새로운 변경사항은 통합 파일을 수정하여 관리

## 통합 내용

### 1. 확장 및 타입 정의
- UUID 확장
- 모든 Enum 타입 (user_role, enrollment_status, evaluation_status 등)

### 2. 기본 테이블
- profiles
- training_courses
- course_teachers
- course_students
- competency_units
- competency_elements
- performance_criteria
- evaluation_schedules
- submissions
- evaluations
- evaluation_criteria_scores
- signatures

### 3. 인덱스
- 모든 주요 조회 컬럼에 인덱스 생성

### 4. 함수 및 트리거
- `update_updated_at_column()`: updated_at 자동 업데이트
- `handle_new_user()`: 사용자 생성 시 프로필 자동 생성
- `prevent_admin_profile_creation()`: 관리자 프로필 생성 방지
- `prevent_admin_role_update()`: 관리자 역할 변경 방지
- `calculate_evaluation_score()`: 평가 점수 자동 계산
- `validate_criteria_score()`: 수행준거 점수 유효성 검증

### 5. Row Level Security (RLS)
- 모든 테이블에 RLS 활성화
- **RLS 헬퍼 함수**: `check_is_admin()`, `check_is_teacher()`, `check_can_manage()`
- **모든 테이블의 RLS 정책 완전 통합**
  - profiles, training_courses, competency_units, competency_elements
  - performance_criteria, course_teachers, course_students
  - evaluation_schedules, submissions, evaluations, signatures

### 6. Storage Buckets 및 정책
- signatures bucket (완전 통합)
- submissions bucket (완전 통합)
- **모든 Storage 정책 완전 통합**

## 주의사항

1. **기존 프로젝트에서는 통합 파일을 그대로 실행하지 마세요**
   - 이미 적용된 마이그레이션이 중복 실행될 수 있습니다
   - 필요한 부분만 선택하여 실행하세요

2. **통합 파일은 완전합니다**
   - RLS 정책, Storage 정책 모두 포함
   - 별도 파일 없이 하나의 파일로 전체 스키마 구축 가능

3. **Supabase 대시보드에서 직접 실행**
   - Supabase CLI를 사용하지 않습니다
   - SQL Editor에서 직접 실행합니다

## 마이그레이션 파일 매핑

| 통합 섹션 | 기존 마이그레이션 파일 |
|----------|---------------------|
| 확장 및 타입 | 001_initial_schema.sql |
| 기본 테이블 | 001_initial_schema.sql, 014_add_competency_elements.sql, 022_add_performance_criteria.sql, 027_add_evaluation_schedules_and_submissions.sql |
| 인덱스 | 각 테이블 생성 파일에 포함 |
| 함수 및 트리거 | 001_initial_schema.sql, 004_prevent_admin_signup.sql, 005_auto_create_profile.sql, 022_add_performance_criteria.sql |
| RLS | 001_initial_schema.sql, 010_add_admin_rls_policies.sql, 011_add_teacher_student_rls.sql, 016_fix_rls_with_security_definer.sql 등 |
| Storage | 002_create_storage_bucket.sql, 025_fix_storage_upload_policy.sql, 028_fix_submissions_storage_policy.sql |

---

**문서 버전**: 1.0  
**최종 업데이트**: 2025년 11월 27일

