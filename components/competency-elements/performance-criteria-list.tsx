"use client";

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
import { useListData } from "@/lib/hooks/use-list-data";
import { useDeleteItem } from "@/lib/hooks/use-delete-item";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

interface PerformanceCriteriaListProps {
  competencyElementId: string;
}

export function PerformanceCriteriaList({
  competencyElementId,
}: PerformanceCriteriaListProps) {
  const canManage = useCanManage();

  // 공통 훅 사용
  const {
    data: criteria,
    loading,
    refetch: loadCriteria,
  } = useListData<PerformanceCriteria>({
    apiUrl: `/api/performance-criteria?competency_element_id=${competencyElementId}`,
    enabled: !!competencyElementId,
  });

  const { deleteItem } = useDeleteItem({
    onSuccess: loadCriteria,
    confirmMessage: "이 수행준거를 삭제하시겠습니까?",
  });

  const {
    showDialog,
    editingItem: editingCriteria,
    openDialog,
    closeDialog,
    handleSuccess,
  } = useDialogForm<PerformanceCriteria>({
    onSuccess: loadCriteria,
  });

  const handleDelete = (criteriaId: string) => {
    deleteItem(`/api/performance-criteria/${criteriaId}`, "수행준거");
  };

  const handleAdd = () => {
    openDialog();
  };

  const handleEdit = (criterion: PerformanceCriteria) => {
    openDialog(criterion);
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
              onCancel={closeDialog}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

