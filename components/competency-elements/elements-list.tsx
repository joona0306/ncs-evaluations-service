"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ElementForm } from "./element-form";
import { PerformanceCriteriaList } from "./performance-criteria-list";
import {
  CompetencyElement,
} from "@/types/evaluation";
import { useCanManage } from "@/stores/auth-store";
import { useListData } from "@/lib/hooks/use-list-data";
import { useDeleteItem } from "@/lib/hooks/use-delete-item";
import { useDialogForm } from "@/lib/hooks/use-dialog-form";

interface CompetencyElementsListProps {
  competencyUnitId: string;
}

export function CompetencyElementsList({
  competencyUnitId,
}: CompetencyElementsListProps) {
  const canManage = useCanManage(); // ✨ Zustand hook

  // 공통 훅 사용
  const {
    data: elements,
    loading,
    refetch: loadElements,
  } = useListData<CompetencyElement>({
    apiUrl: `/api/competency-elements?competency_unit_id=${competencyUnitId}`,
    enabled: !!competencyUnitId,
  });

  const { deleteItem } = useDeleteItem({
    onSuccess: loadElements,
    confirmMessage: "이 능력단위요소를 삭제하시겠습니까?",
  });

  const {
    showDialog,
    editingItem: editingElement,
    openDialog,
    closeDialog,
    handleSuccess,
  } = useDialogForm<CompetencyElement>({
    onSuccess: loadElements,
  });

  const handleDelete = (elementId: string) => {
    deleteItem(`/api/competency-elements/${elementId}`, "능력단위요소");
  };

  const handleAdd = () => {
    openDialog();
  };

  const handleEdit = (element: CompetencyElement) => {
    openDialog(element);
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">로딩 중...</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">능력단위요소</h4>
        {canManage && (
          <Button size="sm" onClick={handleAdd}>
            요소 추가
          </Button>
        )}
      </div>

      {elements.length > 0 ? (
        <div className="space-y-4">
          {elements.map((element) => (
            <div
              key={element.id}
              className="border rounded bg-gray-50"
            >
              <div className="flex justify-between items-start p-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{element.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    코드: {element.code}
                  </p>
                  {element.description && (
                    <p className="text-sm mt-1">{element.description}</p>
                  )}
                </div>
                {canManage && (
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(element)}
                      aria-label={`${element.name} 능력단위요소 수정`}
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(element.id)}
                      aria-label={`${element.name} 능력단위요소 삭제`}
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </div>
              <div className="p-3 border-t bg-white">
                <PerformanceCriteriaList competencyElementId={element.id} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          등록된 능력단위요소가 없습니다.
        </p>
      )}

      {showDialog && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle>
              {editingElement ? "능력단위요소 수정" : "능력단위요소 추가"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ElementForm
              competencyUnitId={competencyUnitId}
              element={editingElement}
              onSuccess={handleSuccess}
              onCancel={closeDialog}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
