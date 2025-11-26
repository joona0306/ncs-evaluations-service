"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CompetencyElementsList } from "@/components/competency-elements/elements-list";
import { CompetencyUnitForm } from "@/components/courses/competency-unit-form";
import { useCanManage } from "@/stores/auth-store";
import { CardSkeleton } from "@/components/ui/skeleton";

interface CompetencyUnitsProps {
  courseId: string;
}

export function CompetencyUnits({ courseId }: CompetencyUnitsProps) {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingUnit, setEditingUnit] = useState<any | null>(null);
  const canManage = useCanManage();

  const loadUnits = useCallback(async () => {
    if (!courseId) {
      setError("훈련과정이 선택되지 않았습니다.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/competency-units?course_id=${courseId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "능력단위를 불러올 수 없습니다.");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setUnits(data);
      } else {
        setUnits([]);
      }
    } catch (error: any) {
      console.error("능력단위 로드 실패:", error);
      setError(`능력단위 로드 중 예외 발생: ${error.message}`);
      setUnits([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      setUnits([]);
      setError("훈련과정이 선택되지 않았습니다.");
      return;
    }

    loadUnits();
  }, [courseId, loadUnits]);

  const handleDelete = async (unitId: string) => {
    if (!confirm("이 능력단위를 삭제하시겠습니까?")) return;

    try {
      const response = await fetch(`/api/competency-units/${unitId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "삭제에 실패했습니다.");
      }

      loadUnits();
    } catch (error: any) {
      console.error("능력단위 삭제 오류:", error);
      alert(`능력단위 삭제에 실패했습니다: ${error.message}`);
    }
  };

  const handleAdd = () => {
    setEditingUnit(null);
    setShowForm(true);
  };

  const handleEdit = (unit: any) => {
    setEditingUnit(unit);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUnit(null);
    loadUnits();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingUnit(null);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>능력단위</CardTitle>
            <CardDescription>
              이 훈련과정의 능력단위를 관리합니다
            </CardDescription>
          </div>
          {canManage && (
            <Button onClick={handleAdd}>
              능력단위 추가
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <div className="space-y-2">
            <CardSkeleton count={3} />
          </div>
        ) : units.length > 0 ? (
          <div className="space-y-2">
            {units.map((unit) => (
              <div key={unit.id} className="border rounded">
                <div
                  className="flex items-center p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() =>
                    setExpandedUnit(expandedUnit === unit.id ? null : unit.id)
                  }
                >
                  <div className="flex-1">
                    <p className="font-medium">{unit.name}</p>
                    <p className="text-sm text-muted-foreground">{unit.code}</p>
                  </div>
                  <div className="flex gap-2">
                    {canManage && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(unit);
                          }}
                        >
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(unit.id);
                          }}
                        >
                          삭제
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedUnit(
                          expandedUnit === unit.id ? null : unit.id
                        );
                      }}
                    >
                      {expandedUnit === unit.id ? "▲" : "▼"}
                    </Button>
                  </div>
                </div>
                {expandedUnit === unit.id && (
                  <div className="p-4 border-t bg-gray-50">
                    {unit.description && (
                      <p className="text-sm mb-4 text-muted-foreground">
                        {unit.description}
                      </p>
                    )}
                    <CompetencyElementsList competencyUnitId={unit.id} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            등록된 능력단위가 없습니다.
          </p>
        )}

        {showForm && (
          <div className="mt-4">
            <CompetencyUnitForm
              courseId={courseId}
              unit={editingUnit}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
