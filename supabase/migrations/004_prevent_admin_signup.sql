-- 관리자 역할로 프로필 생성 방지 트리거
-- 회원가입 시 admin 역할로 프로필을 생성하는 것을 방지합니다.

CREATE OR REPLACE FUNCTION prevent_admin_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- admin 역할로 프로필 생성 시도 시 오류 발생
  IF NEW.role = 'admin' THEN
    RAISE EXCEPTION '관리자 계정은 회원가입을 통해 생성할 수 없습니다. 관리자 계정은 Supabase 대시보드에서 수동으로 생성해야 합니다.';
  END IF;
  
  RETURN NEW;
END;
$$;

-- 트리거 생성
DROP TRIGGER IF EXISTS check_admin_role_on_insert ON public.profiles;
CREATE TRIGGER check_admin_role_on_insert
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_profile_creation();

-- 기존 프로필 업데이트 시에도 admin으로 변경하는 것을 방지 (자기 자신의 프로필 업데이트는 제외)
CREATE OR REPLACE FUNCTION prevent_admin_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- admin이 아닌 사용자가 자신의 역할을 admin으로 변경하려고 시도하는 경우 방지
  IF NEW.role = 'admin' AND OLD.role != 'admin' THEN
    -- 현재 사용자가 이미 admin인지 확인
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    ) THEN
      RAISE EXCEPTION '관리자 역할로 변경할 권한이 없습니다.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS check_admin_role_on_update ON public.profiles;
CREATE TRIGGER check_admin_role_on_update
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_admin_role_update();

