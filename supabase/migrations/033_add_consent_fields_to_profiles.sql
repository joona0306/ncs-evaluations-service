-- 프로필 테이블에 동의 관련 필드 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS agreed_terms_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agreed_privacy_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS agreed_marketing BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS agreed_marketing_at TIMESTAMP WITH TIME ZONE;

-- 코멘트 추가
COMMENT ON COLUMN public.profiles.agreed_terms_at IS '이용약관 동의 일시';
COMMENT ON COLUMN public.profiles.agreed_privacy_at IS '개인정보처리방침 동의 일시';
COMMENT ON COLUMN public.profiles.agreed_marketing IS '마케팅 정보 수신 동의 여부';
COMMENT ON COLUMN public.profiles.agreed_marketing_at IS '마케팅 정보 수신 동의 일시';

