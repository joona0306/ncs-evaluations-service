-- ============================================================================
-- RLS 정책 성능 최적화
-- ============================================================================
-- auth.uid()를 (select auth.uid())로 변경하여 각 행마다 재평가되지 않도록 최적화
-- 중복된 permissive 정책 통합

-- 1. evaluation_element_scores 테이블 정책 최적화
-- 기존 정책이 있는지 확인하고 삭제
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename = 'evaluation_element_scores'
    AND policyname = 'Users can view scores for evaluations they can access'
  ) THEN
    DROP POLICY "Users can view scores for evaluations they can access" ON public.evaluation_element_scores;
  END IF;
END $$;

-- 최적화된 정책 생성 (evaluation_element_scores는 evaluation_criteria_scores와 유사한 구조)
CREATE POLICY "Users can view scores for evaluations they can access"
  ON public.evaluation_element_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.student_id = (select auth.uid())
        OR e.teacher_id = (select auth.uid())
        OR (select public.check_can_manage())
      )
    )
  );

-- 2. submissions 테이블 정책 최적화
-- SELECT 정책
DROP POLICY IF EXISTS "Students can view their own submissions" ON public.submissions;
CREATE POLICY "Students can view their own submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING (student_id = (select auth.uid()));

-- INSERT 정책
DROP POLICY IF EXISTS "Students can insert their own submissions" ON public.submissions;
CREATE POLICY "Students can insert their own submissions"
  ON public.submissions FOR INSERT
  TO authenticated
  WITH CHECK (student_id = (select auth.uid()));

-- UPDATE 정책
DROP POLICY IF EXISTS "Students can update their own submissions" ON public.submissions;
CREATE POLICY "Students can update their own submissions"
  ON public.submissions FOR UPDATE
  TO authenticated
  USING (student_id = (select auth.uid()))
  WITH CHECK (student_id = (select auth.uid()));

-- DELETE 정책
DROP POLICY IF EXISTS "Students can delete their own submissions" ON public.submissions;
CREATE POLICY "Students can delete their own submissions"
  ON public.submissions FOR DELETE
  TO authenticated
  USING (student_id = (select auth.uid()));

-- 교사/관리자 SELECT 정책 확인 및 재생성 (이미 존재하더라도 최적화를 위해 재생성)
DROP POLICY IF EXISTS "Admins and teachers can view all submissions" ON public.submissions;
CREATE POLICY "Admins and teachers can view all submissions"
  ON public.submissions FOR SELECT
  TO authenticated
  USING ((select public.check_can_manage()));

-- 3. signatures 테이블 정책 최적화
-- SELECT 정책
DROP POLICY IF EXISTS "Users can view their own signatures" ON public.signatures;
CREATE POLICY "Users can view their own signatures"
  ON public.signatures FOR SELECT
  TO authenticated
  USING (signer_id = (select auth.uid()));

-- INSERT 정책
DROP POLICY IF EXISTS "Users can insert their own signatures" ON public.signatures;
CREATE POLICY "Users can insert their own signatures"
  ON public.signatures FOR INSERT
  TO authenticated
  WITH CHECK (signer_id = (select auth.uid()));

-- UPDATE 정책
DROP POLICY IF EXISTS "Users can update their own signatures" ON public.signatures;
CREATE POLICY "Users can update their own signatures"
  ON public.signatures FOR UPDATE
  TO authenticated
  USING (signer_id = (select auth.uid()))
  WITH CHECK (signer_id = (select auth.uid()));

-- DELETE 정책
DROP POLICY IF EXISTS "Users can delete their own signatures" ON public.signatures;
CREATE POLICY "Users can delete their own signatures"
  ON public.signatures FOR DELETE
  TO authenticated
  USING (signer_id = (select auth.uid()));

-- 평가에 접근 가능한 서명 조회 정책 (signatures 테이블에 있을 수 있음)
DROP POLICY IF EXISTS "Users can view signatures for their evaluations" ON public.signatures;
CREATE POLICY "Users can view signatures for their evaluations"
  ON public.signatures FOR SELECT
  TO authenticated
  USING (
    signer_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = signatures.evaluation_id
      AND (
        e.student_id = (select auth.uid())
        OR e.teacher_id = (select auth.uid())
        OR (select public.check_can_manage())
      )
    )
  );

-- 4. profiles 테이블 정책 최적화
-- UPDATE 정책
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- SELECT 정책도 최적화 (이미 있지만 일관성을 위해)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = id);

-- 5. user_preferences 테이블 정책 최적화
-- SELECT 정책
DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences;
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  TO authenticated
  USING (user_id = (select auth.uid()));

-- INSERT 정책
DROP POLICY IF EXISTS "Users can insert their own preferences" ON public.user_preferences;
CREATE POLICY "Users can insert their own preferences"
  ON public.user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- UPDATE 정책
DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences;
CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ============================================================================
-- 6. 중복된 permissive 정책 통합
-- ============================================================================

-- competency_elements 테이블: SELECT 정책 통합
-- 기존 정책 삭제 (FOR ALL 정책이 개별 정책과 충돌하므로 먼저 삭제)
DROP POLICY IF EXISTS "Anyone authenticated can view elements" ON public.competency_elements;
-- FOR ALL 정책이 있으면 먼저 삭제 (INSERT, UPDATE, DELETE를 모두 포함하므로)
DROP POLICY IF EXISTS "Admins and teachers can manage elements" ON public.competency_elements;
-- 혹시 개별 정책이 이미 있다면 삭제
DROP POLICY IF EXISTS "Admins and teachers can insert elements" ON public.competency_elements;
DROP POLICY IF EXISTS "Admins and teachers can update elements" ON public.competency_elements;
DROP POLICY IF EXISTS "Admins and teachers can delete elements" ON public.competency_elements;

-- 통합된 정책 생성 (SELECT는 모두 허용, 나머지는 관리자/교사만)
CREATE POLICY "Anyone authenticated can view elements"
  ON public.competency_elements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can insert elements"
  ON public.competency_elements FOR INSERT
  TO authenticated
  WITH CHECK ((select public.check_can_manage()));

CREATE POLICY "Admins and teachers can update elements"
  ON public.competency_elements FOR UPDATE
  TO authenticated
  USING ((select public.check_can_manage()))
  WITH CHECK ((select public.check_can_manage()));

CREATE POLICY "Admins and teachers can delete elements"
  ON public.competency_elements FOR DELETE
  TO authenticated
  USING ((select public.check_can_manage()));

-- course_students 테이블: SELECT 정책 통합
-- 기존 정책 삭제 (FOR ALL 정책이 개별 정책과 충돌하므로 먼저 삭제)
DROP POLICY IF EXISTS "Anyone authenticated can view course students" ON public.course_students;
-- FOR ALL 정책이 있으면 먼저 삭제 (INSERT, UPDATE, DELETE를 모두 포함하므로)
DROP POLICY IF EXISTS "Admins can manage course students" ON public.course_students;
-- 혹시 개별 정책이 이미 있다면 삭제
DROP POLICY IF EXISTS "Admins can insert course students" ON public.course_students;
DROP POLICY IF EXISTS "Admins can update course students" ON public.course_students;
DROP POLICY IF EXISTS "Admins can delete course students" ON public.course_students;

-- 통합된 정책 생성 (SELECT는 모두 허용, 나머지는 관리자만)
CREATE POLICY "Anyone authenticated can view course students"
  ON public.course_students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert course students"
  ON public.course_students FOR INSERT
  TO authenticated
  WITH CHECK ((select public.check_is_admin()));

CREATE POLICY "Admins can update course students"
  ON public.course_students FOR UPDATE
  TO authenticated
  USING ((select public.check_is_admin()))
  WITH CHECK ((select public.check_is_admin()));

CREATE POLICY "Admins can delete course students"
  ON public.course_students FOR DELETE
  TO authenticated
  USING ((select public.check_is_admin()));

-- ============================================================================
-- 7. Storage 정책 성능 최적화
-- ============================================================================

-- signatures bucket 정책 최적화
DROP POLICY IF EXISTS "Users can upload their own signatures" ON storage.objects;
CREATE POLICY "Users can upload their own signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = (select auth.uid())::text OR
    name LIKE 'signatures/' || (select auth.uid())::text || '/%'
  )
);

DROP POLICY IF EXISTS "Users can view signatures they have access to" ON storage.objects;
CREATE POLICY "Users can view signatures they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = (select auth.uid())::text OR
    name LIKE 'signatures/' || (select auth.uid())::text || '/%' OR
    EXISTS (
      SELECT 1 FROM public.signatures
      WHERE signature_data LIKE '%' || name || '%'
    )
  )
);

DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;
CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    (storage.foldername(name))[1] = (select auth.uid())::text OR
    name LIKE 'signatures/' || (select auth.uid())::text || '/%'
  )
);

-- submissions bucket 정책 최적화
DROP POLICY IF EXISTS "Students can upload their own submissions" ON storage.objects;
CREATE POLICY "Students can upload their own submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'submissions' AND
  (
    (storage.foldername(name))[1] = (select auth.uid())::text OR
    name LIKE (select auth.uid())::text || '/%'
  )
);

DROP POLICY IF EXISTS "Users can view submissions they have access to" ON storage.objects;
CREATE POLICY "Users can view submissions they have access to"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    (storage.foldername(name))[1] = (select auth.uid())::text OR
    name LIKE (select auth.uid())::text || '/%' OR
    EXISTS (
      SELECT 1 FROM public.submissions
      WHERE file_url LIKE '%' || name || '%'
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role IN ('admin', 'teacher')
    )
  )
);

DROP POLICY IF EXISTS "Students can delete their own submissions" ON storage.objects;
CREATE POLICY "Students can delete their own submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'submissions' AND
  (
    (storage.foldername(name))[1] = (select auth.uid())::text OR
    name LIKE (select auth.uid())::text || '/%'
  )
);

-- ============================================================================
-- 8. 헬퍼 함수 내부 최적화 (선택사항이지만 일관성을 위해)
-- ============================================================================
-- 참고: 함수가 STABLE로 선언되어 있어서 이미 최적화되어 있지만,
-- 함수 내부의 auth.uid()도 (select auth.uid())로 변경하여 더 명확하게 함

CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (select auth.uid())
  LIMIT 1;
  
  RETURN user_role = 'admin';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_is_teacher()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (select auth.uid())
  LIMIT 1;
  
  RETURN user_role = 'teacher';
END;
$$;

CREATE OR REPLACE FUNCTION public.check_can_manage()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = (select auth.uid())
  LIMIT 1;
  
  RETURN user_role IN ('admin', 'teacher');
END;
$$;

-- ============================================================================
-- 9. 추가 정책 확인 및 최적화
-- ============================================================================

-- submissions 테이블의 "Admins and teachers can view all submissions" 정책 확인
-- 이미 check_can_manage()를 사용하므로 괜찮지만, 일관성을 위해 확인
-- (이 정책은 이미 최적화되어 있음 - 함수 호출이므로)

-- signatures 테이블의 "Admins can manage all signatures" 정책 확인
-- 이미 check_is_admin()를 사용하므로 괜찮음

-- evaluation_criteria_scores 테이블 정책 확인 (031에서 이미 최적화됨)
-- 추가 확인 필요 시 여기에 추가

-- ============================================================================
-- 최적화 완료 요약
-- ============================================================================
-- 
-- 다음 테이블들의 RLS 정책이 최적화되었습니다:
-- 1. evaluation_element_scores - auth.uid() 최적화
-- 2. submissions - auth.uid() 최적화
-- 3. signatures - auth.uid() 최적화
-- 4. profiles - auth.uid() 최적화
-- 5. user_preferences - auth.uid() 최적화
-- 6. storage.objects (signatures, submissions buckets) - auth.uid() 최적화
-- 7. competency_elements - 중복 정책 통합
-- 8. course_students - 중복 정책 통합
-- 9. 헬퍼 함수들 (check_is_admin, check_is_teacher, check_can_manage) - 내부 최적화
--
-- 다음 테이블들은 헬퍼 함수를 사용하므로 이미 최적화되어 있습니다:
-- - training_courses (check_is_admin 사용)
-- - competency_units (check_can_manage 사용)
-- - performance_criteria (check_can_manage 사용)
-- - course_teachers (check_is_admin 사용)
-- - evaluation_schedules (check_can_manage 사용)
-- - evaluations (check_can_manage 사용)
--
-- 모든 auth.uid() 호출이 (select auth.uid())로 변경되어
-- 각 행마다 재평가되지 않고 한 번만 평가됩니다.

