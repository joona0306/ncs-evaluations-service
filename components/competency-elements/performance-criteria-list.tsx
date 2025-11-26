"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerformanceCriteriaForm } from "./performance-criteria-form";
import {
  PerformanceCriteria,
  DifficultyLevel,
  DIFFICULTY_LABELS,
  DIFFICULTY_COLORS,
  DIFFICULTY_SCORE_OPTIONS,
} from "@/types/evaluation";
import { useCanManage } from "@/stores/auth-store";

interface PerformanceCriteriaListProps {
  competencyElementId: string;
}

export function PerformanceCriteriaList({
  competencyElementId,
}: PerformanceCriteriaListProps) {
  const [criteria, setCriteria] = useState<PerformanceCriteria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<
    PerformanceCriteria | undefined
  >();
  const canManage = useCanManage();

  const loadCriteria = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/performance-criteria?competency_element_id=${competencyElementId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "수행준거를 불러올 수 없습니다.");
      }

      const data = await response.json();
      setCriteria(data || []);
    } catch (error: any) {
      console.error("수행준거 로드 실패:", error);
      alert(`수행준거를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [competencyElementId]);

  useEffect(() => {
    loadCriteria();
  }, [loadCriteria]);

  const handleDelete = async (criteriaId: string) => {
    if (!confirm("이 수행준거를 삭제하시겠습니까?")) return;

    const response = await fetch(`/api/performance-criteria/${criteriaId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadCriteria();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleAdd = () => {
    setEditingCriteria(undefined);
    setShowDialog(true);
  };

  const handleEdit = (criterion: PerformanceCriteria) => {
    setEditingCriteria(criterion);
    setShowDialog(true);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setEditingCriteria(undefined);
    loadCriteria();
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h5 className="font-semibold text-sm">수행준거</h5>
        {canManage && (
          <Button size="sm" onClick={handleAdd}>
            수행준거 추가
          </Button>
        )}
      </div>

      {criteria.length > 0 ? (
        <div className="space-y-2">
          {criteria.map((criterion) => (
            <div
              key={criterion.id}
              className="flex justify-between items-start p-2 border rounded bg-white"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm">{criterion.name}</p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${
                      DIFFICULTY_COLORS[criterion.difficulty]
                    }`}
                  >
                    {DIFFICULTY_LABELS[criterion.difficulty]}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    만점 {criterion.max_score}점
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  코드: {criterion.code}
                </p>
                {criterion.description && (
                  <p className="text-xs mt-1">{criterion.description}</p>
                )}
              </div>
              {canManage && (
                <div className="flex gap-2 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(criterion)}
                  >
                    수정
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(criterion.id)}
                  >
                    삭제
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          등록된 수행준거가 없습니다.
        </p>
      )}

      {showDialog && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              {editingCriteria ? "수행준거 수정" : "수행준거 추가"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PerformanceCriteriaForm
              competencyElementId={competencyElementId}
              criterion={editingCriteria}
              onSuccess={handleSuccess}
              onCancel={() => setShowDialog(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

