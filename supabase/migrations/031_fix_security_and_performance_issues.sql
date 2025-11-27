-- ============================================================================
-- Supabase 보안 및 성능 이슈 수정
-- ============================================================================
-- 이 파일은 Supabase Advisor에서 발견된 보안 및 성능 이슈를 수정합니다.

-- ============================================================================
-- 1. Function search_path 수정 (보안 취약점 해결)
-- ============================================================================

-- update_updated_at_column 함수 수정
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$;

-- prevent_admin_profile_creation 함수 수정
CREATE OR REPLACE FUNCTION prevent_admin_profile_creation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role = 'admin' AND (select auth.uid()) IS NOT NULL THEN
    RAISE EXCEPTION '관리자 계정은 회원가입을 통해 생성할 수 없습니다. 관리자 계정은 Supabase 대시보드에서 수동으로 생성해야 합니다.';
  END IF;
  RETURN NEW;
END;
$$;

-- prevent_admin_role_update 함수 수정
CREATE OR REPLACE FUNCTION prevent_admin_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.role = 'admin' AND OLD.role != 'admin' AND (select auth.uid()) IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid()) AND role = 'admin'
    ) THEN
      RAISE EXCEPTION '관리자 역할로 변경할 권한이 없습니다.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- validate_criteria_score 함수 수정
CREATE OR REPLACE FUNCTION validate_criteria_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  criteria_max_score INTEGER;
BEGIN
  SELECT max_score INTO criteria_max_score
  FROM public.performance_criteria
  WHERE id = NEW.criteria_id;

  IF NEW.score < 0 OR NEW.score > criteria_max_score THEN
    RAISE EXCEPTION '점수는 0에서 %점 사이여야 합니다.', criteria_max_score;
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- 2. RLS Policy 성능 최적화
-- ============================================================================

-- profiles 테이블의 "Admins can insert profiles" 정책 확인 및 수정
-- 먼저 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

-- 최적화된 정책 생성
CREATE POLICY "Admins can insert profiles"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select public.check_is_admin()));

-- evaluation_criteria_scores 테이블의 정책 확인
-- 기존 정책이 있는지 확인하고 수정
-- 참고: 현재 스키마에는 이 정책이 명시적으로 없을 수 있으므로 확인 필요

-- evaluation_criteria_scores 테이블에 대한 정책 추가/수정
-- 먼저 기존 정책 확인 후 필요시 수정
DO $$
BEGIN
  -- "Users can view scores for evaluations they can access" 정책이 있는지 확인
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'evaluation_criteria_scores'
    AND policyname = 'Users can view scores for evaluations they can access'
  ) THEN
    -- 기존 정책 삭제
    DROP POLICY "Users can view scores for evaluations they can access" ON public.evaluation_criteria_scores;
  END IF;
END $$;

-- 최적화된 정책 생성
CREATE POLICY "Users can view scores for evaluations they can access"
  ON public.evaluation_criteria_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_criteria_scores.evaluation_id
      AND (
        e.student_id = (select auth.uid())
        OR e.teacher_id = (select auth.uid())
        OR (select public.check_can_manage())
      )
    )
  );

-- ============================================================================
-- 완료
-- ============================================================================