-- 성능 개선을 위한 인덱스 추가
-- 이 마이그레이션은 쿼리 성능을 크게 향상시킵니다

-- 1. evaluations 테이블 인덱스
-- 학생별, 능력단위별 평가 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluations_student_unit 
  ON evaluations(student_id, competency_unit_id);

-- 점수가 있는 평가만 조회하는 쿼리 최적화
CREATE INDEX IF NOT EXISTS idx_evaluations_total_score 
  ON evaluations(total_score) 
  WHERE total_score IS NOT NULL;

-- 능력단위별 평가 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluations_competency_unit 
  ON evaluations(competency_unit_id);

-- 교사별 평가 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher 
  ON evaluations(teacher_id);

-- 2. competency_units 테이블 인덱스
-- 과정별 능력단위 조회 최적화
CREATE INDEX IF NOT EXISTS idx_competency_units_course 
  ON competency_units(course_id);

-- 3. course_students 테이블 인덱스
-- 과정별, 상태별 학생 조회 최적화
CREATE INDEX IF NOT EXISTS idx_course_students_course_status 
  ON course_students(course_id, status);

-- 학생별 과정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_course_students_student 
  ON course_students(student_id);

-- 4. course_teachers 테이블 인덱스
-- 과정별 교사 조회 최적화
CREATE INDEX IF NOT EXISTS idx_course_teachers_course 
  ON course_teachers(course_id);

-- 교사별 과정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher 
  ON course_teachers(teacher_id);

-- 5. submissions 테이블 인덱스
-- 능력단위별, 학생별 과제물 조회 최적화
CREATE INDEX IF NOT EXISTS idx_submissions_unit_student 
  ON submissions(competency_unit_id, student_id);

-- 평가일정별 과제물 조회 최적화
CREATE INDEX IF NOT EXISTS idx_submissions_schedule 
  ON submissions(evaluation_schedule_id);

-- 제출일시 기준 정렬 최적화
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at 
  ON submissions(submitted_at DESC);

-- 6. evaluation_schedules 테이블 인덱스
-- 능력단위별 평가일정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluation_schedules_unit 
  ON evaluation_schedules(competency_unit_id);

-- 상태별 평가일정 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluation_schedules_status 
  ON evaluation_schedules(status);

-- 7. evaluation_criteria_scores 테이블 인덱스
-- 평가별 수행준거 점수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_scores_evaluation 
  ON evaluation_criteria_scores(evaluation_id);

-- 수행준거별 점수 조회 최적화
CREATE INDEX IF NOT EXISTS idx_evaluation_criteria_scores_criteria 
  ON evaluation_criteria_scores(criteria_id);

-- 인덱스 생성 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '성능 개선 인덱스가 성공적으로 생성되었습니다.';
  RAISE NOTICE '쿼리 성능이 크게 향상될 것입니다.';
END $$;

