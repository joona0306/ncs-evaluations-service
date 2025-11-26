-- 관리자의 훈련과정 관리 권한 수정
-- 현재 RLS 정책이 관리자의 update를 막고 있을 수 있음

-- 기존 정책 확인 및 재생성
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
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update courses"
  ON public.training_courses FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can delete courses"
  ON public.training_courses FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- competency_units도 동일하게 수정
DROP POLICY IF EXISTS "Admins can manage units" ON public.competency_units;
DROP POLICY IF EXISTS "Teachers can manage units" ON public.competency_units;

CREATE POLICY "Anyone authenticated can view units"
  ON public.competency_units FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage units"
  ON public.competency_units FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

