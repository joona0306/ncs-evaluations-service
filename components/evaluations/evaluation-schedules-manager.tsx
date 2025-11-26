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
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCanManage } from "@/stores/auth-store";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { CardSkeleton } from "@/components/ui/skeleton";

interface EvaluationSchedulesManagerProps {
  courseId: string;
  competencyUnitId?: string;
}

export function EvaluationSchedulesManager({
  courseId,
  competencyUnitId,
}: EvaluationSchedulesManagerProps) {
  const [schedules, setSchedules] = useState<any[]>([]);
  const [competencyUnits, setCompetencyUnits] = useState<any[]>([]);
  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    competencyUnitId || ""
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any | null>(null);
  const canManage = useCanManage();

  const [formData, setFormData] = useState({
    competency_unit_id: "",
    title: "",
    description: "",
    start_date: "",
    end_date: "",
    status: "scheduled" as
      | "scheduled"
      | "in_progress"
      | "completed"
      | "cancelled",
  });

  const loadCompetencyUnits = useCallback(async () => {
    if (!courseId) return;

    try {
      const response = await fetch(
        `/api/competency-units?course_id=${courseId}`
      );
      if (!response.ok) {
        throw new Error("능력단위를 불러올 수 없습니다.");
      }
      const data = await response.json();
      setCompetencyUnits(data || []);
    } catch (err: any) {
      console.error("능력단위 로드 오류:", err);
    }
  }, [courseId]);

  const loadSchedules = useCallback(async () => {
    if (!selectedUnitId) {
      setSchedules([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/evaluation-schedules?competency_unit_id=${selectedUnitId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "평가일정을 불러올 수 없습니다.");
      }

      const data = await response.json();
      setSchedules(data || []);
    } catch (err: any) {
      console.error("평가일정 로드 오류:", err);
      setError(err.message || "평가일정을 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [selectedUnitId]);

  useEffect(() => {
    loadCompetencyUnits();
  }, [loadCompetencyUnits]);

  useEffect(() => {
    loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (competencyUnitId && competencyUnits.length > 0) {
      setSelectedUnitId(competencyUnitId);
    }
  }, [competencyUnitId, competencyUnits]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.competency_unit_id ||
      !formData.title ||
      !formData.start_date ||
      !formData.end_date
    ) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = editingSchedule
        ? `/api/evaluation-schedules/${editingSchedule.id}`
        : "/api/evaluation-schedules";
      const method = editingSchedule ? "PATCH" : "POST";

      // datetime-local 형식을 ISO 8601 형식으로 변환
      // datetime-local은 로컬 시간대를 의미하므로, 이를 UTC로 변환
      const formatToISO = (dateTimeLocal: string) => {
        if (!dateTimeLocal) return null;
        // datetime-local 형식 (YYYY-MM-DDTHH:mm)을 Date 객체로 변환
        // 이는 로컬 시간대로 해석됨
        const date = new Date(dateTimeLocal);
        // ISO 8601 형식으로 변환 (UTC)
        return date.toISOString();
      };

      const submitData = {
        ...formData,
        start_date: formatToISO(formData.start_date),
        end_date: formatToISO(formData.end_date),
      };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "평가일정 저장에 실패했습니다.");
      }

      setShowForm(false);
      setEditingSchedule(null);
      setFormData({
        competency_unit_id: "",
        title: "",
        description: "",
        start_date: "",
        end_date: "",
        status: "scheduled",
      });
      loadSchedules();
    } catch (err: any) {
      console.error("평가일정 저장 오류:", err);
      setError(err.message || "평가일정 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (schedule: any) => {
    setEditingSchedule(schedule);
    // 날짜를 datetime-local 형식으로 변환 (로컬 시간대 기준)
    const startDate = new Date(schedule.start_date);
    const endDate = new Date(schedule.end_date);

    // 로컬 시간대의 날짜/시간을 YYYY-MM-DDTHH:mm 형식으로 변환
    const formatLocalDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const hours = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    };

    setFormData({
      competency_unit_id: schedule.competency_unit_id,
      title: schedule.title,
      description: schedule.description || "",
      start_date: formatLocalDateTime(startDate),
      end_date: formatLocalDateTime(endDate),
      status: schedule.status,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("이 평가일정을 삭제하시겠습니까?")) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/evaluation-schedules/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "평가일정 삭제에 실패했습니다.");
      }

      loadSchedules();
    } catch (err: any) {
      console.error("평가일정 삭제 오류:", err);
      setError(err.message || "평가일정 삭제에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      scheduled: "예정",
      in_progress: "진행중",
      completed: "완료",
      cancelled: "취소",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      scheduled: "bg-blue-100 text-blue-800",
      in_progress: "bg-green-100 text-green-800",
      completed: "bg-gray-100 text-gray-800",
      cancelled: "bg-red-100 text-red-800",
    };
    return colors[status] || "bg-gray-100 text-gray-800";
  };

  if (!courseId) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">훈련과정을 선택해주세요.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">평가일정 관리</h3>
        {canManage && (
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingSchedule(null);
              setFormData({
                competency_unit_id: selectedUnitId || "",
                title: "",
                description: "",
                start_date: "",
                end_date: "",
                status: "scheduled",
              });
            }}
          >
            평가일정 추가
          </Button>
        )}
      </div>

      {canManage && showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSchedule ? "평가일정 수정" : "평가일정 추가"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="competency_unit_id">능력단위 *</Label>
                <Select
                  value={formData.competency_unit_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      competency_unit_id: e.target.value,
                    })
                  }
                  disabled={!!editingSchedule}
                >
                  <option value="">능력단위 선택</option>
                  {competencyUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <Label htmlFor="title">제목 *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  required
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_date">시작일시 *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) =>
                      setFormData({ ...formData, start_date: e.target.value })
                    }
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_date">종료일시 *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) =>
                      setFormData({ ...formData, end_date: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="status">상태</Label>
                <Select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value as any })
                  }
                >
                  <option value="scheduled">예정</option>
                  <option value="in_progress">진행중</option>
                  <option value="completed">완료</option>
                  <option value="cancelled">취소</option>
                </Select>
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>
                  {loading ? "저장 중..." : "저장"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingSchedule(null);
                    setFormData({
                      competency_unit_id: "",
                      title: "",
                      description: "",
                      start_date: "",
                      end_date: "",
                      status: "scheduled",
                    });
                  }}
                >
                  취소
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div>
        <Label htmlFor="unit-select">능력단위 선택</Label>
        <Select
          id="unit-select"
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          disabled={!!competencyUnitId}
        >
          <option value="">능력단위를 선택하세요</option>
          {competencyUnits.map((unit) => (
            <option key={unit.id} value={unit.id}>
              {unit.name} ({unit.code})
            </option>
          ))}
        </Select>
      </div>

      {loading && !schedules.length ? (
        <div className="space-y-4">
          <CardSkeleton count={3} />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      ) : schedules.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">
              {selectedUnitId
                ? "등록된 평가일정이 없습니다."
                : "능력단위를 선택해주세요."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{schedule.title}</CardTitle>
                    <CardDescription>
                      {schedule.competency_units?.name} (
                      {schedule.competency_units?.code})
                    </CardDescription>
                  </div>
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      schedule.status
                    )}`}
                  >
                    {getStatusLabel(schedule.status)}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                {schedule.description && (
                  <p className="text-sm text-muted-foreground mb-4">
                    {schedule.description}
                  </p>
                )}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">시작일시:</span>{" "}
                    {format(
                      new Date(schedule.start_date),
                      "yyyy년 MM월 dd일 HH:mm",
                      { locale: ko }
                    )}
                  </div>
                  <div>
                    <span className="font-medium">종료일시:</span>{" "}
                    {format(
                      new Date(schedule.end_date),
                      "yyyy년 MM월 dd일 HH:mm",
                      { locale: ko }
                    )}
                  </div>
                </div>
                {canManage && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(schedule)}
                    >
                      수정
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(schedule.id)}
                    >
                      삭제
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
