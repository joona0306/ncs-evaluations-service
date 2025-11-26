-- 간단하고 확실한 RLS 정책 수정
-- 모든 SELECT는 허용, 관리 작업만 권한 체크

-- 기존 함수 삭제 (혹시 충돌 방지)
DROP FUNCTION IF EXISTS public.check_is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.check_is_teacher() CASCADE;
DROP FUNCTION IF EXISTS public.check_can_manage() CASCADE;

-- 1. 함수 재생성 (NULL 안전하게 처리)
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
  -- 프로필이 없으면 false 반환
  SELECT role INTO user_role
  FROM public.profiles
  WHERE id = auth.uid()
  LIMIT 1;
  
  -- NULL 체크 후 반환
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
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
  WHERE id = auth.uid()
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
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
  WHERE id = auth.uid()
  LIMIT 1;
  
  IF user_role IS NULL THEN
    RETURN false;
  END IF;
  
  RETURN user_role IN ('admin', 'teacher');
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_manage() TO authenticated;

-- 2. training_courses 정책 - 모든 SELECT 허용
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
  WITH CHECK (public.check_is_admin() = true);

CREATE POLICY "Admins can update courses"
  ON public.training_courses FOR UPDATE
  TO authenticated
  USING (public.check_is_admin() = true)
  WITH CHECK (public.check_is_admin() = true);

CREATE POLICY "Admins can delete courses"
  ON public.training_courses FOR DELETE
  TO authenticated
  USING (public.check_is_admin() = true);

-- 3. course_teachers 정책 - 모든 SELECT 허용
DROP POLICY IF EXISTS "Teachers can view their courses" ON public.course_teachers;
DROP POLICY IF EXISTS "Admins can manage course_teachers" ON public.course_teachers;
DROP POLICY IF EXISTS "Anyone authenticated can view course teachers" ON public.course_teachers;

CREATE POLICY "Anyone authenticated can view course teachers"
  ON public.course_teachers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage course teachers"
  ON public.course_teachers FOR ALL
  TO authenticated
  USING (public.check_is_admin() = true)
  WITH CHECK (public.check_is_admin() = true);

-- 4. course_students 정책 - 모든 SELECT 허용
DROP POLICY IF EXISTS "Students can view their enrollments" ON public.course_students;
DROP POLICY IF EXISTS "Admins can manage course_students" ON public.course_students;
DROP POLICY IF EXISTS "Anyone authenticated can view course students" ON public.course_students;

CREATE POLICY "Anyone authenticated can view course students"
  ON public.course_students FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage course students"
  ON public.course_students FOR ALL
  TO authenticated
  USING (public.check_is_admin() = true)
  WITH CHECK (public.check_is_admin() = true);

-- 5. competency_units 정책 - 모든 SELECT 허용
DROP POLICY IF EXISTS "Admins can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Teachers can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Admins and teachers can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Anyone authenticated can view units" ON public.competency_units;
DROP POLICY IF EXISTS "Admins can manage competency units" ON public.competency_units;
DROP POLICY IF EXISTS "Anyone authenticated can view competency units" ON public.competency_units;

CREATE POLICY "Anyone authenticated can view units"
  ON public.competency_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage units"
  ON public.competency_units FOR ALL
  TO authenticated
  USING (public.check_can_manage() = true)
  WITH CHECK (public.check_can_manage() = true);

-- 6. competency_elements 정책 - 모든 SELECT 허용
DROP POLICY IF EXISTS "Authenticated users can view competency elements" ON public.competency_elements;
DROP POLICY IF EXISTS "Admins and teachers can manage competency elements" ON public.competency_elements;

CREATE POLICY "Authenticated users can view competency elements"
  ON public.competency_elements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage competency elements"
  ON public.competency_elements FOR ALL
  TO authenticated
  USING (public.check_can_manage() = true)
  WITH CHECK (public.check_can_manage() = true);

-- 7. evaluation_element_scores 정책 - 평가 접근 권한 기반
DROP POLICY IF EXISTS "Users can view scores for evaluations they can access" ON public.evaluation_element_scores;
DROP POLICY IF EXISTS "Teachers can manage scores for their evaluations" ON public.evaluation_element_scores;

-- 평가 점수 조회 정책 (평가에 접근 가능하면 조회 가능)
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
        public.check_is_admin() = true
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
        public.check_is_admin() = true
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin() = true
      )
    )
  );

