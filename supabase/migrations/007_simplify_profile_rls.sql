-- 프로필 RLS 정책 단순화 및 무한 재귀 해결
-- 프로필 테이블을 조회하는 정책을 제거하고 단순화

-- 모든 프로필 관련 정책 삭제
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- 단순한 SELECT 정책: 자신의 프로필만 조회
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 단순한 UPDATE 정책: 자신의 프로필만 수정
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 단순한 INSERT 정책: 자신의 프로필만 생성 (admin 제외)
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id 
    AND role != 'admin'
  );

-- 관리자 정책은 별도로 처리하지 않음
-- 관리자는 서비스 역할을 사용하거나, 트리거를 통해 프로필 생성
-- 또는 관리자 프로필은 수동으로 생성하므로 RLS 정책 불필요

