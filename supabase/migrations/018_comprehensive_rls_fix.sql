-- 종합 RLS 정책 수정
-- 모든 테이블의 RLS 정책을 안전하고 간단하게 재설정

-- 1. 함수 생성 (CREATE OR REPLACE는 이미 존재하면 교체, 없으면 생성)
-- 관리자 확인 함수
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
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'admin', false);
END;
$$;

-- 교사 확인 함수
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
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role = 'teacher', false);
END;
$$;

-- 관리자 또는 교사 확인 함수
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
  WHERE id = auth.uid()
  LIMIT 1;
  
  RETURN COALESCE(user_role IN ('admin', 'teacher'), false);
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_manage() TO authenticated;

-- 2. training_courses 정책 완전 재설정
DROP POLICY IF EXISTS "Admins can manage courses" ON public.training_courses;
DROP POLICY IF EXISTS "Admins can view courses" ON public.training_courses;
DROP POLICY IF EXISTS "Admins can insert courses" ON public.training_courses;
DROP POLICY IF EXISTS "Admins can update courses" ON public.training_courses;
DROP POLICY IF EXISTS "Admins can delete courses" ON public.training_courses;
DROP POLICY IF EXISTS "Anyone authenticated can view courses" ON public.training_courses;

-- 모든 인증된 사용자가 과정 조회 가능
CREATE POLICY "Anyone authenticated can view courses"
  ON public.training_courses FOR SELECT
  TO authenticated
  USING (true);

-- 관리자는 과정 생성, 수정, 삭제 가능
CREATE POLICY "Admins can insert courses"
  ON public.training_courses FOR INSERT
  TO authenticated
  WITH CHECK (public.check_is_admin());

CREATE POLICY "Admins can update courses"
  ON public.training_courses FOR UPDATE
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

CREATE POLICY "Admins can delete courses"
  ON public.training_courses FOR DELETE
  TO authenticated
  USING (public.check_is_admin());

-- 3. course_teachers 정책 재설정
DROP POLICY IF EXISTS "Teachers can view their courses" ON public.course_teachers;
DROP POLICY IF EXISTS "Admins can manage course_teachers" ON public.course_teachers;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Anyone authenticated can view course teachers"
  ON public.course_teachers FOR SELECT
  TO authenticated
  USING (true);

-- 관리자는 관리 가능
CREATE POLICY "Admins can manage course teachers"
  ON public.course_teachers FOR ALL
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- 4. course_students 정책 재설정
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.course_students;
DROP POLICY IF EXISTS "Admins can manage course_students" ON public.course_students;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Anyone authenticated can view course students"
  ON public.course_students FOR SELECT
  TO authenticated
  USING (true);

-- 관리자는 관리 가능
CREATE POLICY "Admins can manage course students"
  ON public.course_students FOR ALL
  TO authenticated
  USING (public.check_is_admin())
  WITH CHECK (public.check_is_admin());

-- 5. competency_units 정책 재설정
DROP POLICY IF EXISTS "Admins can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Teachers can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Admins and teachers can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Anyone authenticated can view units" ON public.competency_units;
DROP POLICY IF EXISTS "Admins can manage competency units" ON public.competency_units;
DROP POLICY IF EXISTS "Anyone authenticated can view competency units" ON public.competency_units;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Anyone authenticated can view units"
  ON public.competency_units FOR SELECT
  TO authenticated
  USING (true);

-- 관리자와 교사는 관리 가능
CREATE POLICY "Admins and teachers can manage units"
  ON public.competency_units FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- 6. competency_elements 정책 재설정
DROP POLICY IF EXISTS "Authenticated users can view competency elements" ON public.competency_elements;
DROP POLICY IF EXISTS "Admins and teachers can manage competency elements" ON public.competency_elements;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "Authenticated users can view competency elements"
  ON public.competency_elements FOR SELECT
  TO authenticated
  USING (true);

-- 관리자와 교사는 관리 가능
CREATE POLICY "Admins and teachers can manage competency elements"
  ON public.competency_elements FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- 7. evaluation_element_scores 정책 재설정
DROP POLICY IF EXISTS "Users can view scores for evaluations they can access" ON public.evaluation_element_scores;
DROP POLICY IF EXISTS "Teachers can manage scores for their evaluations" ON public.evaluation_element_scores;

-- 평가 점수 조회 정책
CREATE POLICY "Users can view scores for evaluations they can access"
  ON public.evaluation_element_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.student_id = auth.uid() OR
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  );

-- 교사는 자신의 평가 점수 관리 가능
CREATE POLICY "Teachers can manage scores for their evaluations"
  ON public.evaluation_element_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  );

