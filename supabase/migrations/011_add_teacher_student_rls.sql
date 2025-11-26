-- 교사가 자신이 담당하는 과정의 학생 프로필을 조회할 수 있도록 RLS 정책 추가
-- 학생이 자신의 과정 교사 프로필을 조회할 수 있도록 RLS 정책 추가

-- 교사 여부를 확인하는 함수 생성 (RLS 우회를 위해 SECURITY DEFINER 사용)
CREATE OR REPLACE FUNCTION public.is_teacher()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'teacher'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 학생 여부를 확인하는 함수 생성 (RLS 우회를 위해 SECURITY DEFINER 사용)
CREATE OR REPLACE FUNCTION public.is_student()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'student'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Teachers can view their course students" ON public.profiles;
DROP POLICY IF EXISTS "Students can view their course teachers" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view other teachers" ON public.profiles;
DROP POLICY IF EXISTS "Students can view other students in same course" ON public.profiles;

-- 교사가 자신이 담당하는 과정의 학생을 조회할 수 있는 정책
CREATE POLICY "Teachers can view their course students"
  ON public.profiles FOR SELECT
  USING (
    public.is_teacher()
    AND role = 'student'
    AND EXISTS (
      SELECT 1
      FROM public.course_teachers ct
      INNER JOIN public.course_students cs ON ct.course_id = cs.course_id
      WHERE ct.teacher_id = auth.uid()
        AND cs.student_id = profiles.id
        AND cs.status = 'active'
    )
  );

-- 학생이 자신의 과정 교사를 조회할 수 있는 정책
CREATE POLICY "Students can view their course teachers"
  ON public.profiles FOR SELECT
  USING (
    public.is_student()
    AND role = 'teacher'
    AND EXISTS (
      SELECT 1
      FROM public.course_students cs
      INNER JOIN public.course_teachers ct ON cs.course_id = ct.course_id
      WHERE cs.student_id = auth.uid()
        AND ct.teacher_id = profiles.id
        AND cs.status = 'active'
    )
  );

-- 교사끼리 서로 볼 수 있도록 (선택사항 - 필요한 경우)
CREATE POLICY "Teachers can view other teachers"
  ON public.profiles FOR SELECT
  USING (
    public.is_teacher()
    AND role = 'teacher'
  );

-- 학생끼리 서로 볼 수 있도록 (선택사항 - 필요한 경우)
CREATE POLICY "Students can view other students in same course"
  ON public.profiles FOR SELECT
  USING (
    public.is_student()
    AND role = 'student'
    AND EXISTS (
      SELECT 1
      FROM public.course_students cs1
      INNER JOIN public.course_students cs2 ON cs1.course_id = cs2.course_id
      WHERE cs1.student_id = auth.uid()
        AND cs2.student_id = profiles.id
        AND cs1.status = 'active'
        AND cs2.status = 'active'
    )
  );

