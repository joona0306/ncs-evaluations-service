# 마이그레이션 파일 요약

## 최종 마이그레이션 파일

### `supabase/migrations/000_consolidated_schema.sql`

**상태**: ✅ 최종 완료  
**크기**: 약 800줄  
**포함 내용**: 전체 데이터베이스 스키마

#### 주요 구성 요소

1. **확장 및 타입 정의**
   - UUID 확장
   - 7개의 Enum 타입 (user_role, enrollment_status, evaluation_status 등)

2. **테이블 생성** (11개)
   - `profiles` - 사용자 프로필
   - `training_courses` - 훈련과정
   - `course_teachers` - 훈련과정-교사 관계
   - `course_students` - 훈련과정-학생 관계
   - `competency_units` - 능력단위
   - `competency_elements` - 능력단위요소
   - `performance_criteria` - 수행준거
   - `evaluation_schedules` - 평가일정
   - `submissions` - 과제물 제출
   - `evaluations` - 평가
   - `evaluation_criteria_scores` - 평가 점수 상세
   - `signatures` - 서명

3. **인덱스 생성**
   - 모든 외래키 인덱스
   - 검색 최적화 인덱스

4. **함수 및 트리거**
   - `update_updated_at_column()` - updated_at 자동 업데이트
   - `handle_new_user()` - 자동 프로필 생성
   - `prevent_admin_profile_creation()` - 관리자 프로필 생성 방지
   - `prevent_admin_role_update()` - 관리자 역할 변경 방지
   - `calculate_evaluation_score()` - 평가 점수 자동 계산
   - `validate_criteria_score()` - 수행준거 점수 검증
   - `check_email_exists()` - 이메일 중복 확인 (최신 추가)

5. **RLS 정책**
   - 모든 테이블에 대한 Row Level Security 정책
   - 역할 기반 접근 제어

6. **Storage 정책**
   - `signatures` 버킷 정책
   - `submissions` 버킷 정책

## 실행 방법

1. Supabase 대시보드 > SQL Editor로 이동
2. `000_consolidated_schema.sql` 파일 내용 전체 복사
3. SQL Editor에 붙여넣기 후 실행

## 주의사항

- ⚠️ **기존 프로젝트**: 이미 적용된 마이그레이션이 있으면 충돌 가능
- ✅ **새 프로젝트**: 전체 스키마를 한 번에 구축 가능
- 📝 **부분 적용**: 필요한 섹션만 선택하여 실행 가능

## 최신 업데이트 (2025년 11월 27일)

- ✅ 이메일 중복 확인 함수 추가 (`check_email_exists`)
- ✅ 모든 RLS 정책 통합
- ✅ Storage 버킷 정책 통합
- ✅ 함수 및 트리거 통합 완료

