"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ElementForm } from "./element-form";
import { PerformanceCriteriaList } from "./performance-criteria-list";
import {
  CompetencyElement,
} from "@/types/evaluation";
import { useCanManage } from "@/stores/auth-store";

interface CompetencyElementsListProps {
  competencyUnitId: string;
}

export function CompetencyElementsList({
  competencyUnitId,
}: CompetencyElementsListProps) {
  const [elements, setElements] = useState<CompetencyElement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingElement, setEditingElement] = useState<
    CompetencyElement | undefined
  >();
  const canManage = useCanManage(); // ✨ Zustand hook

  const loadElements = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/competency-elements?competency_unit_id=${competencyUnitId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "능력단위요소를 불러올 수 없습니다.");
      }

      const data = await response.json();
      setElements(data || []);
    } catch (error: any) {
      console.error("능력단위요소 로드 실패:", error);
      alert(`능력단위요소를 불러오는 중 오류가 발생했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [competencyUnitId]);

  useEffect(() => {
    loadElements();
  }, [loadElements]);

  const handleDelete = async (elementId: string) => {
    if (!confirm("이 능력단위요소를 삭제하시겠습니까?")) return;

    const response = await fetch(`/api/competency-elements/${elementId}`, {
      method: "DELETE",
    });

    if (response.ok) {
      loadElements();
    } else {
      alert("삭제에 실패했습니다.");
    }
  };

  const handleAdd = () => {
    setEditingElement(undefined);
    setShowDialog(true);
  };

  const handleEdit = (element: CompetencyElement) => {
    setEditingElement(element);
    setShowDialog(true);
  };

  const handleSuccess = () => {
    setShowDialog(false);
    setEditingElement(undefined);
    loadElements();
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
                    >
                      수정
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(element.id)}
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
              onCancel={() => setShowDialog(false)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
