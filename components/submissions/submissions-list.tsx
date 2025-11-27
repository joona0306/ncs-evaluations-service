"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SubmissionForm } from "./submission-form";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useAuthStore } from "@/stores/auth-store";
import { SubmissionListSkeleton } from "@/components/ui/skeleton";

interface SubmissionsListProps {
  evaluationScheduleId?: string;
  competencyUnitId?: string;
}

export function SubmissionsList({
  evaluationScheduleId,
  competencyUnitId,
}: SubmissionsListProps) {
  const { profile } = useAuthStore();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!profile || profile.role !== "student") return;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile, evaluationScheduleId, competencyUnitId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 평가일정 조회
      let scheduleUrl = "/api/evaluation-schedules?";
      if (evaluationScheduleId) {
        scheduleUrl += `competency_unit_id=${evaluationScheduleId}`;
      } else if (competencyUnitId) {
        scheduleUrl += `competency_unit_id=${competencyUnitId}`;
      }

      const scheduleResponse = await fetch(scheduleUrl, { 
        next: { revalidate: 60 } // 60초마다 재검증
      });
      if (!scheduleResponse.ok) {
        throw new Error("평가일정을 불러올 수 없습니다.");
      }
      const scheduleData = await scheduleResponse.json();

      // 모든 평가일정 표시 (필터링 제거)
      setSchedules(scheduleData || []);

      // 과제물 조회
      if (profile?.id) {
        const submissionResponse = await fetch(
          `/api/submissions?student_id=${profile.id}`,
          { next: { revalidate: 30 } } // 30초마다 재검증
        );
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          setSubmissions(submissionData || []);
        }
      }
    } catch (err: any) {
      console.error("데이터 로드 오류:", err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedSchedule(null);
    loadData();
  };

  const handleEdit = (schedule: any) => {
    const existingSubmission = submissions.find(
      (s) => s.evaluation_schedule_id === schedule.id
    );
    setSelectedSchedule({ ...schedule, existingSubmission });
    setShowForm(true);
  };

  if (loading) {
    return <SubmissionListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (showForm && selectedSchedule) {
    return (
      <SubmissionForm
        evaluationSchedule={selectedSchedule}
        existingSubmission={selectedSchedule.existingSubmission}
        onSuccess={handleFormSuccess}
        onCancel={() => {
          setShowForm(false);
          setSelectedSchedule(null);
        }}
      />
    );
  }

  if (schedules.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">등록된 평가일정이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">과제물 제출</h3>
      {schedules.map((schedule) => {
        const existingSubmission = submissions.find(
          (s) => s.evaluation_schedule_id === schedule.id
        );

        // 상태 표시
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

        return (
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
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                      schedule.status
                    )}`}
                  >
                    {getStatusLabel(schedule.status)}
                  </span>
                  {existingSubmission && (
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      제출 완료
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {schedule.description && (
                <p className="text-sm text-muted-foreground mb-4">
                  {schedule.description}
                </p>
              )}
              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="font-medium">시작일시:</span>{" "}
                  {format(
                    new Date(schedule.start_date),
                    "yyyy년 MM월 dd일 HH:mm",
                    {
                      locale: ko,
                    }
                  )}
                </div>
                <div>
                  <span className="font-medium">종료일시:</span>{" "}
                  {format(
                    new Date(schedule.end_date),
                    "yyyy년 MM월 dd일 HH:mm",
                    {
                      locale: ko,
                    }
                  )}
                </div>
              </div>
              {existingSubmission && (
                <div className="mb-4 p-3 bg-gray-50 rounded text-sm">
                  <div className="font-medium mb-2">제출 내용:</div>
                  {existingSubmission.submission_type === "image" ? (
                    <div>
                      <div className="font-medium">파일명:</div>
                      {existingSubmission.file_name || "파일"}
                    </div>
                  ) : (
                    <div>
                      <div className="font-medium">URL:</div>
                      <a
                        href={existingSubmission.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {existingSubmission.url}
                      </a>
                    </div>
                  )}
                  {existingSubmission.comments && (
                    <div className="mt-2">
                      <div className="font-medium">코멘트:</div>
                      {existingSubmission.comments}
                    </div>
                  )}
                </div>
              )}
              <Button
                onClick={() => handleEdit(schedule)}
                variant={existingSubmission ? "outline" : "default"}
              >
                {existingSubmission ? "수정" : "제출"}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
