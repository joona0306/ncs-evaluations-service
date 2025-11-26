-- 관리자가 모든 프로필을 조회하고 수정할 수 있도록 RLS 정책 추가

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

-- 관리자 여부를 확인하는 함수 생성 (RLS 우회를 위해 SECURITY DEFINER 사용)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 관리자 SELECT 정책: 관리자는 모든 프로필 조회 가능
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

-- 관리자 UPDATE 정책: 관리자는 모든 프로필 수정 가능
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

