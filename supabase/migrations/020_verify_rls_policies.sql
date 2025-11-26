-- RLS 정책 확인 및 수정
-- 관리자가 모든 데이터를 조회할 수 있도록 보장

-- 1. profiles 테이블 정책 확인 (이미 모든 인증된 사용자가 조회 가능)
-- SELECT 정책은 이미 "Authenticated users can view all profiles"로 설정되어 있음

-- 2. training_courses 정책 확인
-- SELECT 정책은 이미 "Anyone authenticated can view courses"로 설정되어 있음

-- 3. course_teachers 정책 확인
-- SELECT 정책은 이미 "Anyone authenticated can view course teachers"로 설정되어 있음

-- 4. course_students 정책 확인
-- SELECT 정책은 이미 "Anyone authenticated can view course students"로 설정되어 있음

-- 5. competency_units 정책 확인
-- SELECT 정책은 이미 "Anyone authenticated can view units"로 설정되어 있음

-- 모든 정책이 이미 올바르게 설정되어 있으므로, 추가 작업 없음
-- 이 마이그레이션은 정책 상태를 확인하기 위한 것입니다.

SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'training_courses', 'course_teachers', 'course_students', 'competency_units')
ORDER BY tablename, policyname;

