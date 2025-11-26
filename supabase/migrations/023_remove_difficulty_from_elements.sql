-- 능력단위요소에서 difficulty 필드 제거 (수행준거로 이동)

-- 먼저 기존 데이터가 있다면 수행준거로 마이그레이션
-- (기존 데이터가 없을 수 있으므로 에러 무시)
DO $$
BEGIN
  -- 기존 competency_elements의 difficulty를 기반으로 기본 수행준거 생성
  -- 이 부분은 선택사항이며, 기존 데이터가 없으면 스킵됨
  INSERT INTO public.performance_criteria (
    competency_element_id,
    name,
    code,
    difficulty,
    max_score,
    description,
    display_order
  )
  SELECT 
    ce.id,
    ce.name || ' - 기본 수행준거',
    ce.code || '-PC1',
    ce.difficulty,
    ce.max_score,
    ce.description,
    1
  FROM public.competency_elements ce
  WHERE NOT EXISTS (
    SELECT 1 FROM public.performance_criteria pc
    WHERE pc.competency_element_id = ce.id
  )
  ON CONFLICT DO NOTHING;
EXCEPTION
  WHEN OTHERS THEN
    -- 기존 데이터가 없거나 오류가 발생해도 계속 진행
    NULL;
END $$;

-- competency_elements 테이블에서 difficulty와 max_score 컬럼 제거
-- (이제 performance_criteria로 이동했으므로)
ALTER TABLE public.competency_elements 
DROP COLUMN IF EXISTS difficulty,
DROP COLUMN IF EXISTS max_score;

-- difficulty 관련 인덱스 제거
DROP INDEX IF EXISTS idx_competency_elements_difficulty;

-- difficulty_score_options 뷰 제거 (더 이상 필요 없음)
DROP VIEW IF EXISTS difficulty_score_options;

-- validate_element_score 함수 제거 (더 이상 필요 없음, validate_criteria_score로 대체됨)
DROP FUNCTION IF EXISTS validate_element_score() CASCADE;
DROP TRIGGER IF EXISTS validate_element_score_trigger ON public.evaluation_element_scores;

