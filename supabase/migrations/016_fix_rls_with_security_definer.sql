-- RLS 정책을 SECURITY DEFINER 함수로 안전하게 수정
-- 무한 재귀 방지 및 성능 향상

-- 관리자 확인 함수 (SECURITY DEFINER로 RLS 우회)
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
  
  RETURN user_role = 'admin';
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
  
  RETURN user_role = 'teacher';
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
  
  RETURN user_role IN ('admin', 'teacher');
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION public.check_is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_is_teacher() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_can_manage() TO authenticated;

-- training_courses 정책 재생성
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

-- 관리자는 과정 생성, 수정, 삭제 가능 (함수 사용)
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

-- competency_units 정책 재생성
DROP POLICY IF EXISTS "Admins can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Teachers can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Admins and teachers can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Anyone authenticated can view units" ON public.competency_units;
DROP POLICY IF EXISTS "Admins can manage competency units" ON public.competency_units;

CREATE POLICY "Anyone authenticated can view units"
  ON public.competency_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage units"
  ON public.competency_units FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

