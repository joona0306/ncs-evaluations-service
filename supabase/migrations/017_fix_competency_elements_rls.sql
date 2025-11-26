-- 능력단위요소 관련 RLS 정책을 SECURITY DEFINER 함수로 안전하게 수정
-- 무한 재귀 방지 및 성능 향상

-- competency_elements 정책 재생성 (함수 사용)
DROP POLICY IF EXISTS "Authenticated users can view competency elements" ON public.competency_elements;
DROP POLICY IF EXISTS "Admins and teachers can manage competency elements" ON public.competency_elements;

-- 모든 인증된 사용자가 능력단위요소 조회 가능
CREATE POLICY "Authenticated users can view competency elements"
  ON public.competency_elements FOR SELECT
  TO authenticated
  USING (true);

-- 관리자와 교사는 능력단위요소 관리 가능 (함수 사용)
CREATE POLICY "Admins and teachers can manage competency elements"
  ON public.competency_elements FOR ALL
  TO authenticated
  USING (public.check_can_manage())
  WITH CHECK (public.check_can_manage());

-- evaluation_element_scores 정책 재생성 (함수 사용)
DROP POLICY IF EXISTS "Users can view scores for evaluations they can access" ON public.evaluation_element_scores;
DROP POLICY IF EXISTS "Teachers can manage scores for their evaluations" ON public.evaluation_element_scores;

-- 평가 점수 조회 정책 (평가 접근 권한이 있으면 조회 가능)
CREATE POLICY "Users can view scores for evaluations they can access"
  ON public.evaluation_element_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.student_id = auth.uid() OR
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  );

-- 교사는 자신의 평가 점수 관리 가능
CREATE POLICY "Teachers can manage scores for their evaluations"
  ON public.evaluation_element_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  );

-- calculate_evaluation_score 함수를 SECURITY DEFINER로 변경
-- (RLS를 우회하여 점수 계산 가능)
DROP FUNCTION IF EXISTS calculate_evaluation_score() CASCADE;

CREATE OR REPLACE FUNCTION calculate_evaluation_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  raw_total INTEGER;
  max_total INTEGER;
  converted_score DECIMAL(5,2);
  eval_id UUID;
BEGIN
  -- NEW 또는 OLD에서 evaluation_id 가져오기
  IF TG_OP = 'DELETE' THEN
    eval_id := OLD.evaluation_id;
  ELSE
    eval_id := NEW.evaluation_id;
  END IF;

  -- 해당 평가의 모든 능력단위요소 점수 합계 계산 (RLS 우회)
  SELECT 
    COALESCE(SUM(ees.score), 0),
    COALESCE(SUM(ce.max_score), 0)
  INTO raw_total, max_total
  FROM public.evaluation_element_scores ees
  INNER JOIN public.competency_elements ce ON ees.element_id = ce.id
  WHERE ees.evaluation_id = eval_id;

  -- 100점 만점으로 환산
  IF max_total > 0 THEN
    converted_score := ROUND((raw_total::DECIMAL / max_total::DECIMAL) * 100, 2);
  ELSE
    converted_score := 0;
  END IF;

  -- evaluations 테이블 업데이트 (RLS 우회)
  UPDATE public.evaluations
  SET 
    raw_total_score = raw_total,
    total_score = converted_score,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = eval_id;

  -- DELETE의 경우 NULL 반환, 그 외에는 NEW 반환
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 트리거 재생성
DROP TRIGGER IF EXISTS update_evaluation_total_score ON public.evaluation_element_scores;

CREATE TRIGGER update_evaluation_total_score
  AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_element_scores
  FOR EACH ROW
  EXECUTE FUNCTION calculate_evaluation_score();

-- validate_element_score 함수도 SECURITY DEFINER로 변경
DROP FUNCTION IF EXISTS validate_element_score() CASCADE;

CREATE OR REPLACE FUNCTION validate_element_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  element_max_score INTEGER;
BEGIN
  -- 해당 능력단위요소의 만점 확인 (RLS 우회)
  SELECT max_score INTO element_max_score
  FROM public.competency_elements
  WHERE id = NEW.element_id;

  -- 점수가 0과 만점 사이인지 확인
  IF NEW.score < 0 OR NEW.score > element_max_score THEN
    RAISE EXCEPTION '점수는 0에서 %점 사이여야 합니다.', element_max_score;
  END IF;

  RETURN NEW;
END;
$$;

-- 트리거 재생성
DROP TRIGGER IF EXISTS validate_element_score_trigger ON public.evaluation_element_scores;

CREATE TRIGGER validate_element_score_trigger
  BEFORE INSERT OR UPDATE ON public.evaluation_element_scores
  FOR EACH ROW
  EXECUTE FUNCTION validate_element_score();

