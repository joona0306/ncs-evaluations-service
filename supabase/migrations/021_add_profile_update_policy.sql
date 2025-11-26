-- profiles 테이블에 관리자 UPDATE 정책 추가
-- 관리자는 모든 프로필을 업데이트할 수 있어야 함

-- 기존 정책 확인 및 삭제 (혹시 있을 수 있음)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- 사용자는 자신의 프로필만 업데이트 가능
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 관리자는 모든 프로필 업데이트 가능
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.check_is_admin() = true)
  WITH CHECK (public.check_is_admin() = true);

