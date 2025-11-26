-- 사용자 생성 시 자동으로 프로필 생성하는 트리거
-- auth.users에 사용자가 생성될 때 public.profiles에 프로필을 자동으로 생성합니다.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role_value user_role;
  user_full_name TEXT;
  user_phone TEXT;
BEGIN
  -- auth.users의 raw_user_meta_data에서 role, full_name, phone 추출
  user_role_value := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'student'::user_role
  );
  
  -- admin 역할은 자동 생성하지 않음 (트리거에서 차단)
  IF user_role_value = 'admin' THEN
    RETURN NEW;
  END IF;
  
  user_full_name := NEW.raw_user_meta_data->>'full_name';
  user_phone := NEW.raw_user_meta_data->>'phone';
  
  -- 프로필 생성
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    user_phone,
    user_role_value
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 트리거 생성
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

