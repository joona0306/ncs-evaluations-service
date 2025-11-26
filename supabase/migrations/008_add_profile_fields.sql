-- 프로필 테이블에 생년월일, 성별 필드 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other'));

-- 코멘트 추가
COMMENT ON COLUMN public.profiles.birth_date IS '생년월일';
COMMENT ON COLUMN public.profiles.gender IS '성별 (male, female, other)';

