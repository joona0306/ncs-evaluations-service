// 평가 관련 타입 정의

export type DifficultyLevel = 'high' | 'medium' | 'low';

// 능력단위요소 (난이도 제거)
export interface CompetencyElement {
  id: string;
  competency_unit_id: string;
  name: string;
  code: string;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
  performance_criteria?: PerformanceCriteria[];
}

// 수행준거 (난이도 포함)
export interface PerformanceCriteria {
  id: string;
  competency_element_id: string;
  name: string;
  code: string;
  difficulty: DifficultyLevel;
  max_score: number;
  description?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

// 평가 점수 (수행준거별)
export interface EvaluationCriteriaScore {
  id: string;
  evaluation_id: string;
  criteria_id: string;
  score: number;
  comments?: string;
  created_at: string;
  updated_at: string;
  performance_criteria?: PerformanceCriteria;
}

// 레거시: 능력단위요소별 점수 (하위 호환성)
export interface EvaluationElementScore {
  id: string;
  evaluation_id: string;
  element_id: string;
  score: number;
  comments?: string;
  created_at: string;
  updated_at: string;
  competency_elements?: CompetencyElement;
}

export interface Evaluation {
  id: string;
  competency_unit_id: string;
  student_id: string;
  teacher_id: string;
  scores?: any; // 레거시 JSONB 필드 (향후 제거 예정)
  comments?: string;
  status: 'draft' | 'submitted' | 'confirmed';
  evaluated_at?: string;
  total_score?: number; // 100점 만점 환산 점수
  raw_total_score?: number; // 원점수 합계
  submission_id?: string | null;
  created_at: string;
  updated_at: string;
  competency_units?: any;
  student?: any;
  teacher?: any;
  evaluation_element_scores?: EvaluationElementScore[];
}

// 난이도별 점수 옵션
export const DIFFICULTY_SCORE_OPTIONS: Record<DifficultyLevel, number[]> = {
  high: [15, 13, 10, 8, 6],
  medium: [10, 8, 6, 4, 2],
  low: [5, 4, 3, 2, 1],
};

// 난이도 한글 표시
export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  high: '상',
  medium: '중',
  low: '하',
};

// 난이도별 색상
export const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800',
};

