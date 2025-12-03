/**
 * 평가 학생 아이템 컴포넌트
 * React.memo로 최적화하여 불필요한 리렌더링 방지
 */

"use client";

import { memo, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface EvaluationStudentItemProps {
  studentId: string;
  studentName: string;
  studentEmail: string;
  evaluation: any;
  submissions: any[];
  evaluationStatus: string;
  competencyUnitId: string;
  onEvaluate: (
    competencyUnitId: string,
    studentId: string,
    submissionId?: string,
    evaluationId?: string
  ) => void;
}

function EvaluationStudentItemComponent({
  studentId,
  studentName,
  studentEmail,
  evaluation,
  submissions,
  evaluationStatus,
  competencyUnitId,
  onEvaluate,
}: EvaluationStudentItemProps) {
  // 최신 제출물 메모이제이션
  const latestSubmission = useMemo(() => {
    return submissions && submissions.length > 0 ? submissions[0] : null;
  }, [submissions]);

  // 상태 배지 스타일 메모이제이션
  const statusBadgeStyle = useMemo(() => {
    const styles = {
      confirmed: "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400",
      submitted: "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400",
      pending: "bg-yellow-100 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400",
      default: "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200",
    };
    return styles[evaluationStatus as keyof typeof styles] || styles.default;
  }, [evaluationStatus]);

  // 상태 텍스트 메모이제이션
  const statusText = useMemo(() => {
    const texts = {
      confirmed: "확정",
      submitted: "제출",
      pending: "대기중",
      default: "임시저장",
    };
    return texts[evaluationStatus as keyof typeof texts] || texts.default;
  }, [evaluationStatus]);

  // 평가일 포맷팅 메모이제이션
  const evaluatedDate = useMemo(() => {
    if (!evaluation?.evaluated_at) return null;
    return format(new Date(evaluation.evaluated_at), "yyyy년 MM월 dd일", {
      locale: ko,
    });
  }, [evaluation?.evaluated_at]);

  // 제출일 포맷팅 메모이제이션
  const submittedDate = useMemo(() => {
    if (!latestSubmission?.submitted_at) return null;
    return format(new Date(latestSubmission.submitted_at), "yyyy-MM-dd HH:mm", {
      locale: ko,
    });
  }, [latestSubmission?.submitted_at]);

  return (
    <div className="p-3 sm:p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 sm:gap-0">
        <div className="flex-1 w-full sm:w-auto">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h4 className="font-semibold text-sm sm:text-base">{studentName || studentEmail}</h4>
            <span className={`px-2 py-1 text-xs rounded ${statusBadgeStyle}`}>
              {statusText}
            </span>
            {latestSubmission && (
              <span className="px-2 py-1 text-xs rounded bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400">
                과제물 제출됨
              </span>
            )}
          </div>

          {evaluatedDate && (
            <p className="text-xs text-muted-foreground mb-2">
              평가일: {evaluatedDate}
            </p>
          )}

          {latestSubmission && (
            <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/50 rounded text-xs">
              <p className="text-blue-700 dark:text-blue-400 font-medium">
                최근 제출: {submittedDate}
              </p>
              {latestSubmission.evaluation_schedules && (
                <p className="text-blue-600 mt-1">
                  평가일정: {latestSubmission.evaluation_schedules.title}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto sm:ml-4">
          {evaluation ? (
            <>
              <Link href={`/dashboard/evaluations/${evaluation.id}`} className="w-full sm:w-auto">
                <Button variant="outline" size="sm" className="w-full sm:w-auto">
                  상세보기
                </Button>
              </Link>
              <Button
                size="sm"
                className="w-full sm:w-auto"
                onClick={() =>
                  onEvaluate(
                    competencyUnitId,
                    studentId,
                    latestSubmission?.id,
                    evaluation.id
                  )
                }
              >
                수정하기
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() =>
                onEvaluate(competencyUnitId, studentId, latestSubmission?.id)
              }
            >
              {latestSubmission ? "평가하기" : "평가 시작"}
            </Button>
          )}
          {latestSubmission && !evaluation && (
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => {
                if (latestSubmission.submission_type === "image") {
                  window.open(
                    `/api/submissions/download?id=${latestSubmission.id}`,
                    "_blank"
                  );
                } else if (latestSubmission.url) {
                  window.open(latestSubmission.url, "_blank");
                }
              }}
            >
              {latestSubmission.submission_type === "image"
                ? "다운로드"
                : "URL 열기"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// React.memo로 최적화 (props가 변경되지 않으면 리렌더링 방지)
export const EvaluationStudentItem = memo(
  EvaluationStudentItemComponent,
  (prevProps, nextProps) => {
    // 커스텀 비교 함수: 중요한 props만 비교
    return (
      prevProps.studentId === nextProps.studentId &&
      prevProps.evaluationStatus === nextProps.evaluationStatus &&
      prevProps.evaluation?.id === nextProps.evaluation?.id &&
      prevProps.submissions?.length === nextProps.submissions?.length &&
      prevProps.submissions?.[0]?.id === nextProps.submissions?.[0]?.id
    );
  }
);

EvaluationStudentItem.displayName = "EvaluationStudentItem";

