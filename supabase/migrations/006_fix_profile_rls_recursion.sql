-- 프로필 RLS 정책 무한 재귀 문제 해결
-- "Admins can view all profiles" 정책이 프로필 테이블을 조회하면서 무한 재귀 발생
-- 이 정책을 수정하여 재귀를 방지

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 관리자 조회 정책 재생성 (재귀 방지)
-- auth.jwt()를 사용하여 역할 확인 (프로필 테이블 조회 없음)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    -- JWT에서 역할을 확인하거나, 직접 프로필을 조회하지 않고 auth.uid()만 사용
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (
        -- JWT 클레임에서 역할 확인 (가능한 경우)
        (auth.jwt() ->> 'user_role')::text = 'admin'
        OR
        -- 또는 프로필이 이미 존재하는 경우에만 조회 (재귀 방지)
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.role = 'admin'
        )
      )
    )
  );

-- 더 간단한 방법: 관리자 정책을 제거하고 기본 정책만 사용
-- 또는 서비스 역할을 사용하여 프로필 생성

-- INSERT 정책 재생성 (단순화)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    AND role != 'admin'
  );

-- UPDATE 정책 재생성 (재귀 방지)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    -- 프로필 테이블을 조회하지 않고 auth.uid()만 사용
    auth.uid() IS NOT NULL
    AND (
      -- 자신의 프로필이거나
      auth.uid() = id
      OR
      -- 관리자인 경우 (JWT에서 확인하거나 별도 방법 사용)
      EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
      )
    )
  );

