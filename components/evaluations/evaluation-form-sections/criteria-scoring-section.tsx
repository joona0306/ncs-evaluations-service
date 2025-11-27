"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  CompetencyElement,
  PerformanceCriteria,
  DIFFICULTY_SCORE_OPTIONS,
} from "@/types/evaluation";

interface CriteriaScoringSectionProps {
  elements: CompetencyElement[];
  performanceCriteria: PerformanceCriteria[];
  criteriaScores: Record<string, { score: number; comments: string }>;
  onScoreChange: (criteriaId: string, score: number) => void;
  onCommentsChange: (criteriaId: string, comments: string) => void;
  loading?: boolean;
}

export function CriteriaScoringSection({
  elements,
  performanceCriteria,
  criteriaScores,
  onScoreChange,
  onCommentsChange,
  loading = false,
}: CriteriaScoringSectionProps) {
  if (loading) {
    return (
      <div className="p-4 text-sm text-muted-foreground">
        수행준거를 불러오는 중...
      </div>
    );
  }

  if (elements.length === 0) {
    return (
      <div className="p-4 text-sm text-yellow-600 bg-yellow-50 rounded-md">
        이 능력단위에는 아직 능력단위요소가 등록되지 않았습니다. 먼저
        능력단위요소를 등록해주세요.
      </div>
    );
  }

  if (performanceCriteria.length === 0) {
    return (
      <div className="p-4 text-sm text-yellow-600 bg-yellow-50 rounded-md">
        능력단위요소에 수행준거가 등록되지 않았습니다. 먼저 수행준거를
        등록해주세요.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">수행준거별 평가</h3>
        <div className="space-y-6">
          {elements.map((element) => {
            const elementCriteria = performanceCriteria.filter(
              (pc) => pc.competency_element_id === element.id
            );

            if (elementCriteria.length === 0) return null;

            return (
              <div
                key={element.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-lg mb-1">
                      {element.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      코드: {element.code}
                    </p>
                    {element.description && (
                      <p className="text-sm mt-1">{element.description}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                  {elementCriteria.map((criterion) => (
                    <div key={criterion.id} className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Label className="font-medium">
                            {criterion.name}
                          </Label>
                          <span
                            className={`text-xs px-2 py-0.5 rounded ${
                              criterion.difficulty === "high"
                                ? "bg-red-100 text-red-800"
                                : criterion.difficulty === "medium"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {criterion.difficulty === "high"
                              ? "상"
                              : criterion.difficulty === "medium"
                              ? "중"
                              : "하"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          만점: {criterion.max_score}점
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Label className="w-16" htmlFor={`score-${criterion.id}`}>
                          점수
                        </Label>
                        <select
                          id={`score-${criterion.id}`}
                          value={criteriaScores[criterion.id]?.score || 0}
                          onChange={(e) =>
                            onScoreChange(
                              criterion.id,
                              parseInt(e.target.value) || 0
                            )
                          }
                          className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                          aria-label={`${criterion.name} 점수 선택`}
                          aria-describedby={`score-desc-${criterion.id}`}
                        >
                          <option value="0">0점</option>
                          {DIFFICULTY_SCORE_OPTIONS[criterion.difficulty].map(
                            (score) => (
                              <option key={score} value={score}>
                                {score}점
                              </option>
                            )
                          )}
                        </select>
                        <span
                          id={`score-desc-${criterion.id}`}
                          className="text-sm text-muted-foreground"
                          aria-live="polite"
                        >
                          / {criterion.max_score}점
                        </span>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">메모</Label>
                        <Textarea
                          value={criteriaScores[criterion.id]?.comments || ""}
                          onChange={(e) =>
                            onCommentsChange(criterion.id, e.target.value)
                          }
                          rows={2}
                          placeholder="이 수행준거에 대한 평가 의견을 입력하세요..."
                          className="text-sm"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

