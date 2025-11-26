-- 능력단위요소 기반 평가 시스템 추가
-- 각 능력단위는 여러 능력단위요소를 가지며, 난이도별 점수 체계를 적용

-- 난이도 enum 타입 생성
CREATE TYPE difficulty_level AS ENUM ('high', 'medium', 'low');

-- 능력단위요소 테이블 생성
CREATE TABLE public.competency_elements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  competency_unit_id UUID REFERENCES public.competency_units(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  max_score INTEGER NOT NULL, -- 난이도별 만점 (상: 15,13,10,8,6 / 중: 10,8,6,4,2 / 하: 5,4,3,2,1)
  description TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(competency_unit_id, code)
);

-- 평가 점수 상세 테이블 (각 능력단위요소별 점수 저장)
CREATE TABLE public.evaluation_element_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  evaluation_id UUID REFERENCES public.evaluations(id) ON DELETE CASCADE NOT NULL,
  element_id UUID REFERENCES public.competency_elements(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL, -- 획득 점수
  comments TEXT, -- 능력단위요소별 코멘트
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(evaluation_id, element_id),
  CONSTRAINT valid_score CHECK (score >= 0)
);

-- evaluations 테이블에 환산 점수 컬럼 추가
ALTER TABLE public.evaluations 
ADD COLUMN total_score DECIMAL(5,2), -- 100점 만점 환산 점수
ADD COLUMN raw_total_score INTEGER; -- 원점수 합계

-- 인덱스 생성
CREATE INDEX idx_competency_elements_unit ON public.competency_elements(competency_unit_id);
CREATE INDEX idx_competency_elements_difficulty ON public.competency_elements(difficulty);
CREATE INDEX idx_evaluation_element_scores_evaluation ON public.evaluation_element_scores(evaluation_id);
CREATE INDEX idx_evaluation_element_scores_element ON public.evaluation_element_scores(element_id);

-- updated_at 트리거 추가
CREATE TRIGGER update_competency_elements_updated_at 
  BEFORE UPDATE ON public.competency_elements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_element_scores_updated_at 
  BEFORE UPDATE ON public.evaluation_element_scores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 환산 점수 자동 계산 함수
CREATE OR REPLACE FUNCTION calculate_evaluation_score()
RETURNS TRIGGER AS $$
DECLARE
  raw_total INTEGER;
  max_total INTEGER;
  converted_score DECIMAL(5,2);
BEGIN
  -- 해당 평가의 모든 능력단위요소 점수 합계 계산
  SELECT 
    COALESCE(SUM(ees.score), 0),
    COALESCE(SUM(ce.max_score), 0)
  INTO raw_total, max_total
  FROM public.evaluation_element_scores ees
  INNER JOIN public.competency_elements ce ON ees.element_id = ce.id
  WHERE ees.evaluation_id = NEW.evaluation_id;

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
  WHERE id = NEW.evaluation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 점수 변경 시 자동으로 환산 점수 업데이트하는 트리거
CREATE TRIGGER update_evaluation_total_score
  AFTER INSERT OR UPDATE OR DELETE ON public.evaluation_element_scores
  FOR EACH ROW
  EXECUTE FUNCTION calculate_evaluation_score();

-- RLS 정책 추가

-- competency_elements: 모든 인증된 사용자가 조회 가능
ALTER TABLE public.competency_elements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view competency elements"
  ON public.competency_elements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins and teachers can manage competency elements"
  ON public.competency_elements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'teacher')
    )
  );

-- evaluation_element_scores: 평가와 동일한 권한 적용
ALTER TABLE public.evaluation_element_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view scores for evaluations they can access"
  ON public.evaluation_element_scores FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND (
        e.student_id = auth.uid() OR
        e.teacher_id = auth.uid()
      )
    )
  );

CREATE POLICY "Teachers can manage scores for their evaluations"
  ON public.evaluation_element_scores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.evaluations e
      WHERE e.id = evaluation_element_scores.evaluation_id
      AND e.teacher_id = auth.uid()
    )
  );

-- 난이도별 유효한 점수 확인 제약조건 추가 함수
CREATE OR REPLACE FUNCTION validate_element_score()
RETURNS TRIGGER AS $$
DECLARE
  element_max_score INTEGER;
BEGIN
  -- 해당 능력단위요소의 만점 확인
  SELECT max_score INTO element_max_score
  FROM public.competency_elements
  WHERE id = NEW.element_id;

  -- 점수가 0과 만점 사이인지 확인
  IF NEW.score < 0 OR NEW.score > element_max_score THEN
    RAISE EXCEPTION '점수는 0에서 %점 사이여야 합니다.', element_max_score;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 점수 유효성 검증 트리거
CREATE TRIGGER validate_element_score_trigger
  BEFORE INSERT OR UPDATE ON public.evaluation_element_scores
  FOR EACH ROW
  EXECUTE FUNCTION validate_element_score();

-- 난이도별 권장 만점 점수를 반환하는 뷰
CREATE VIEW difficulty_score_options AS
SELECT 
  'high'::difficulty_level as difficulty,
  unnest(ARRAY[15, 13, 10, 8, 6]) as score
UNION ALL
SELECT 
  'medium'::difficulty_level as difficulty,
  unnest(ARRAY[10, 8, 6, 4, 2]) as score
UNION ALL
SELECT 
  'low'::difficulty_level as difficulty,
  unnest(ARRAY[5, 4, 3, 2, 1]) as score;

