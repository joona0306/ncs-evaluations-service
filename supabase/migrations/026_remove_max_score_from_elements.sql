-- competency_elements 테이블에서 max_score 컬럼 제거
-- (이미 performance_criteria로 이동했으므로)

-- max_score 컬럼이 존재하는 경우에만 제거
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'competency_elements' 
    AND column_name = 'max_score'
  ) THEN
    ALTER TABLE public.competency_elements 
    DROP COLUMN max_score;
  END IF;
END $$;

-- validate_element_score 함수가 아직 존재하는 경우 제거
-- (더 이상 필요 없음, validate_criteria_score로 대체됨)
DROP FUNCTION IF EXISTS validate_element_score() CASCADE;
DROP TRIGGER IF EXISTS validate_element_score_trigger ON public.evaluation_element_scores;

