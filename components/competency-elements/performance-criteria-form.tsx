"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  PerformanceCriteria,
  DifficultyLevel,
  DIFFICULTY_SCORE_OPTIONS,
  DIFFICULTY_LABELS,
} from "@/types/evaluation";

interface PerformanceCriteriaFormProps {
  competencyElementId: string;
  criterion?: PerformanceCriteria;
  onSuccess: () => void;
  onCancel: () => void;
}

export function PerformanceCriteriaForm({
  competencyElementId,
  criterion,
  onSuccess,
  onCancel,
}: PerformanceCriteriaFormProps) {
  const [loading, setLoading] = useState(false);

  // 난이도와 만점이 일치하는지 확인하고 자동 조정
  const getValidMaxScore = (
    difficulty: DifficultyLevel,
    currentMaxScore?: number
  ): number => {
    const validScores = DIFFICULTY_SCORE_OPTIONS[difficulty];
    if (!validScores || validScores.length === 0) {
      return 10; // 기본값
    }

    // 현재 만점이 유효한 옵션에 포함되어 있으면 그대로 사용
    if (currentMaxScore && validScores.includes(currentMaxScore)) {
      return currentMaxScore;
    }

    // 그렇지 않으면 해당 난이도의 첫 번째 옵션(최대값) 사용
    return validScores[0];
  };

  const initialDifficulty = (criterion?.difficulty ||
    "medium") as DifficultyLevel;
  const initialMaxScore = getValidMaxScore(
    initialDifficulty,
    criterion?.max_score
  );

  const [formData, setFormData] = useState({
    name: criterion?.name || "",
    code: criterion?.code || "",
    difficulty: initialDifficulty,
    max_score: initialMaxScore,
    description: criterion?.description || "",
    display_order: criterion?.display_order || 0,
  });

  // 난이도가 변경될 때 만점 자동 조정
  useEffect(() => {
    const validMaxScore = getValidMaxScore(formData.difficulty);
    setFormData((prev) => {
      // 만점이 유효하지 않으면 자동으로 조정
      if (
        prev.max_score !== validMaxScore &&
        !DIFFICULTY_SCORE_OPTIONS[prev.difficulty]?.includes(prev.max_score)
      ) {
        return {
          ...prev,
          max_score: validMaxScore,
        };
      }
      return prev;
    });
  }, [formData.difficulty]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = criterion
        ? `/api/performance-criteria/${criterion.id}`
        : `/api/performance-criteria`;

      const response = await fetch(url, {
        method: criterion ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          competency_element_id: competencyElementId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to save performance criteria"
        );
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving performance criteria:", error);
      alert(`수행준거 저장에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">수행준거명</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="code">수행준거 코드</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
          placeholder="예: PC01, PC02..."
        />
      </div>

      <div>
        <Label htmlFor="difficulty">난이도</Label>
        <Select
          id="difficulty"
          value={formData.difficulty}
          onChange={(e) => {
            const newDifficulty = e.target.value as DifficultyLevel;
            const newMaxScore = DIFFICULTY_SCORE_OPTIONS[newDifficulty][0]; // 난이도 변경 시 최대값으로 자동 설정
            setFormData({
              ...formData,
              difficulty: newDifficulty,
              max_score: newMaxScore,
            });
          }}
        >
          <option value="high">상</option>
          <option value="medium">중</option>
          <option value="low">하</option>
        </Select>
      </div>

      <div>
        <Label htmlFor="max_score">만점</Label>
        <Select
          id="max_score"
          value={formData.max_score.toString()}
          onChange={(e) =>
            setFormData({ ...formData, max_score: parseInt(e.target.value) })
          }
        >
          {DIFFICULTY_SCORE_OPTIONS[formData.difficulty].map((score) => (
            <option key={score} value={score.toString()}>
              {score}점
            </option>
          ))}
        </Select>
        <p className="text-sm text-muted-foreground mt-1">
          난이도 {DIFFICULTY_LABELS[formData.difficulty]} 선택 가능 점수:{" "}
          {DIFFICULTY_SCORE_OPTIONS[formData.difficulty].join(", ")}점
        </p>
      </div>

      <div>
        <Label htmlFor="display_order">표시 순서</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            setFormData({
              ...formData,
              display_order: parseInt(e.target.value) || 0,
            })
          }
        />
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : criterion ? "수정" : "추가"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}
