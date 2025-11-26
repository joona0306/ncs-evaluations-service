-- 수행준거(Performance Criteria) 시스템 추가
-- 능력단위요소는 여러 수행준거를 가지며, 난이도는 수행준거에 적용됨

-- 수행준거 테이블 생성
CREATE TABLE public.performance_criteria (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_element_id UUID REFERENCES public.competency_elements(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  max_score INTEGER NOT NULL, -- 난이도별 만점
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(competency_element_id, code)
);

-- 평가 점수를 수행준거별로 저장하도록 변경
-- 기존 evaluation_element_scores를 evaluation_criteria_scores로 변경
CREATE TABLE public.evaluation_criteria_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  criteria_id UUID REFERENCES public.performance_criteria(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL, -- 획득 점수
  comments TEXT, -- 수행준거별 코멘트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluation_id, criteria_id),
  CONSTRAINT valid_criteria_score CHECK (score >= 0)
);

-- 인덱스 생성
CREATE INDEX idx_performance_criteria_element ON public.performance_criteria(competency_element_id);
CREATE INDEX idx_performance_criteria_difficulty ON public.performance_criteria(difficulty);
CREATE INDEX idx_evaluation_criteria_scores_evaluation ON public.evaluation_criteria_scores(evaluation_id);
CREATE INDEX idx_evaluation_criteria_scores_criteria ON public.evaluation_criteria_scores(criteria_id);

-- updated_at 트리거 추가
CREATE TRIGGER update_performance_criteria_updated_at 
  BEFORE UPDATE ON public.performance_criteria
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_criteria_scores_updated_at 
  BEFORE UPDATE ON public.evaluation_criteria_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 수행준거 점수 유효성 검증 함수
CREATE OR REPLACE FUNCTION validate_criteria_score()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  criteria_max_score INTEGER;
BEGIN
  -- 수행준거의 만점 가져오기
  SELECT max_score INTO criteria_max_score
  FROM public.performance_criteria
  WHERE id = NEW.criteria_id;

  -- 점수가 0과 만점 사이인지 확인
  IF NEW.score < 0 OR NEW.score > criteria_max_score THEN
    RAISE EXCEPTION '점수는 0에서 %점 사이여야 합니다.', criteria_max_score;
  END IF;

  RETURN NEW;
END;
$$;

-- 점수 유효성 검증 트리거
CREATE TRIGGER validate_criteria_score_trigger
  BEFORE INSERT OR UPDATE ON public.evaluation_criteria_scores
  FOR EACH ROW
  EXECUTE FUNCTION validate_criteria_score();

-- 평가 점수 계산 함수 업데이트 (수행준거 기반)
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

  -- 해당 평가의 모든 수행준거 점수 합계 계산
  SELECT 
    COALESCE(SUM(ecs.score), 0),
    COALESCE(SUM(pc.max_score), 0)
  INTO raw_total, max_total
  FROM public.evaluation_criteria_scores ecs
  INNER JOIN public.performance_criteria pc ON ecs.criteria_id = pc.id
  WHERE ecs.evaluation_id = eval_id;

  -- 100점 만점으로 환산
  IF max_total > 0 THEN
    converted_score := ROUND((raw_total::DECIMAL / max_total::DECIMAL) * 100, 2);
  ELSE
    converted_score := 0;
  END IF;

  -- evaluations 테이블 업데이트
  UPDATE public.evaluations
  SET 
    raw_total_score = raw_total,
    total_score = converted_score,
    updated_at = TIMEZONE('utc'::text, NOW())
  WHERE id = eval_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 점수 변경 시 자동으로 환산 점수 업데이트하는 트리거
CREATE TRIGGER update_evaluation_total_score
  AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_criteria_scores
  FOR EACH ROW
  EXECUTE FUNCTION calculate_evaluation_score();

-- RLS 정책 추가
ALTER TABLE public.performance_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria_scores ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 수행준거 조회 가능
CREATE POLICY "Anyone authenticated can view performance criteria"
  ON public.performance_criteria FOR SELECT
  TO authenticated
  USING (true);

-- 관리자와 교사는 수행준거 관리 가능
CREATE POLICY "Admins and teachers can manage performance criteria"
  ON public.performance_criteria FOR ALL
  TO authenticated
  USING (public.check_can_manage() = true)
  WITH CHECK (public.check_can_manage() = true);

-- 모든 인증된 사용자가 평가 점수 조회 가능
CREATE POLICY "Anyone authenticated can view criteria scores"
  ON public.evaluation_criteria_scores FOR SELECT
  TO authenticated
  USING (true);

-- 교사는 자신의 평가 점수 관리 가능
CREATE POLICY "Teachers can manage scores for their evaluations"
  ON public.evaluation_criteria_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_criteria_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_criteria_scores.evaluation_id
      AND (
        e.teacher_id = auth.uid() OR
        public.check_is_admin()
      )
    )
  );

-- 평가 수정/삭제 정책 업데이트 (확정된 평가도 수정/삭제 가능)
DROP POLICY IF EXISTS "Teachers can update their evaluations" ON public.evaluations;
DROP POLICY IF EXISTS "Teachers can delete their evaluations" ON public.evaluations;

CREATE POLICY "Teachers can update their evaluations"
  ON public.evaluations FOR UPDATE
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    public.check_is_admin()
  )
  WITH CHECK (
    teacher_id = auth.uid() OR
    public.check_is_admin()
  );

CREATE POLICY "Teachers can delete their evaluations"
  ON public.evaluations FOR DELETE
  TO authenticated
  USING (
    teacher_id = auth.uid() OR
    public.check_is_admin()
  );

