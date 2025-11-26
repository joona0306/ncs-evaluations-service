-- 프로필에 승인 상태 필드 추가
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- 코멘트 추가
COMMENT ON COLUMN public.profiles.approved IS '관리자 승인 여부 (false: 대기, true: 승인)';

-- 기존 사용자는 모두 승인된 것으로 간주
UPDATE public.profiles
SET approved = true
WHERE approved IS NULL OR role IN ('admin', 'teacher', 'student');

