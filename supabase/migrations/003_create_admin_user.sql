-- 관리자 계정 생성 스크립트
-- 이 스크립트는 Supabase 대시보드의 SQL Editor에서 실행하세요.
-- 또는 Supabase CLI를 사용하여 실행할 수 있습니다.

-- 관리자 계정 생성 함수
-- 사용법: SELECT create_admin_user('admin@example.com', 'secure_password_here');

CREATE OR REPLACE FUNCTION create_admin_user(
  admin_email TEXT,
  admin_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
BEGIN
  -- Supabase Auth를 통해 사용자 생성은 클라이언트 측에서 해야 합니다.
  -- 이 함수는 프로필만 생성합니다.
  -- 실제 사용자 생성은 Supabase 대시보드의 Authentication > Users에서 수동으로 생성하거나
  -- 클라이언트 측에서 생성한 후 이 함수를 호출해야 합니다.
  
  -- 프로필 생성 (사용자가 이미 auth.users에 존재한다고 가정)
  -- 실제로는 auth.users에 사용자가 먼저 생성되어야 합니다.
  
  RAISE NOTICE '관리자 계정은 Supabase 대시보드에서 수동으로 생성해야 합니다.';
  RAISE NOTICE '1. Authentication > Users > Add user에서 이메일과 비밀번호로 사용자 생성';
  RAISE NOTICE '2. 생성된 사용자의 UUID를 확인';
  RAISE NOTICE '3. 아래 쿼리를 실행하여 프로필 생성:';
  RAISE NOTICE '   INSERT INTO public.profiles (id, email, role) VALUES (''user_uuid_here'', ''admin@example.com'', ''admin'');';
  
  RETURN NULL;
END;
$$;

-- 관리자 프로필 생성 예시 (실제 사용 시 UUID를 변경해야 함)
-- INSERT INTO public.profiles (id, email, full_name, role)
-- VALUES (
--   '00000000-0000-0000-0000-000000000000', -- 실제 사용자 UUID로 변경
--   'admin@example.com',
--   '시스템 관리자',
--   'admin'
-- )
-- ON CONFLICT (id) DO UPDATE
-- SET role = 'admin';

