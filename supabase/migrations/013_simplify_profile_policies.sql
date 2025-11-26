-- 프로필 RLS 정책을 단순화하여 무한 재귀 문제 완전히 해결
-- 복잡한 역할 기반 정책을 제거하고 기본 정책만 유지
-- 역할별 접근 제어는 애플리케이션 레벨에서 처리

-- 1. 모든 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view their course students" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view other teachers" ON public.profiles;
DROP POLICY IF EXISTS "Students can view their course teachers" ON public.profiles;
DROP POLICY IF EXISTS "Students can view other students in same course" ON public.profiles;
DROP POLICY IF EXISTS "Temporary allow all" ON public.profiles;

-- 2. 함수들 삭제 (더 이상 사용하지 않음)
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;
DROP FUNCTION IF EXISTS public.is_teacher() CASCADE;
DROP FUNCTION IF EXISTS public.is_student() CASCADE;

-- 3. 단순하고 안전한 정책만 생성

-- SELECT: 모든 인증된 사용자가 모든 프로필 조회 가능
-- (역할별 필터링은 애플리케이션에서 처리)
CREATE POLICY "Authenticated users can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- INSERT: 사용자는 자신의 프로필만 생성 가능 (admin 제외)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id 
    AND role != 'admin'
  );

-- UPDATE: 사용자는 자신의 프로필만 수정 가능
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- DELETE: 아무도 프로필 삭제 불가 (관리 작업은 서비스 역할 사용)
-- DELETE 정책은 생성하지 않음 (기본적으로 모두 차단)

