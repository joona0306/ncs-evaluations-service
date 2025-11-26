"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { EvaluationListSkeleton } from "@/components/ui/skeleton";

interface EvaluationsListProps {
  profile: {
    id: string;
    role: string;
  };
}

type CourseGroup = {
  course: any;
  courseId: string;
  competencyUnits: any[];
};

export function EvaluationsList({ profile }: EvaluationsListProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 훈련과정 목록 가져오기
      const coursesResponse = await fetch("/api/courses", { cache: "no-store" });

      if (!coursesResponse.ok) {
        const errorData = await coursesResponse.json();
        throw new Error(errorData.error || "훈련과정 목록을 불러올 수 없습니다.");
      }

      const coursesData = await coursesResponse.json();
      setCourses(coursesData || []);

      // 각 훈련과정별로 평가 상태 가져오기
      const courseDataMap: Record<string, any> = {};
      
      for (const course of coursesData || []) {
        try {
          const response = await fetch(
            `/api/evaluations/by-course?course_id=${course.id}`,
            { cache: "no-store" }
          );
          
          if (response.ok) {
            const data = await response.json();
            courseDataMap[course.id] = data || [];
          }
        } catch (err) {
          console.error(`훈련과정 ${course.id} 데이터 로드 실패:`, err);
          courseDataMap[course.id] = [];
        }
      }

      setCourseData(courseDataMap);
    } catch (err: any) {
      console.error("데이터 로드 실패:", err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [profile.id, profile.role]);

  const handleEvaluate = async (
    competencyUnitId: string,
    studentId: string,
    submissionId?: string,
    evaluationId?: string
  ) => {
    try {
      if (evaluationId) {
        // 기존 평가가 있으면 수정 페이지로 이동
        const url = submissionId
          ? `/dashboard/evaluations/${evaluationId}/edit?submission_id=${submissionId}`
          : `/dashboard/evaluations/${evaluationId}/edit`;
        window.location.href = url;
      } else {
        // 새 평가 작성 페이지로 이동
        const url = submissionId
          ? `/dashboard/evaluations/new?competency_unit_id=${competencyUnitId}&student_id=${studentId}&submission_id=${submissionId}`
          : `/dashboard/evaluations/new?competency_unit_id=${competencyUnitId}&student_id=${studentId}`;
        window.location.href = url;
      }
    } catch (err) {
      console.error("평가 페이지 이동 실패:", err);
    }
  };

  if (loading) {
    return <EvaluationListSkeleton />;
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={loadData}>다시 시도</Button>
        </CardContent>
      </Card>
    );
  }

  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">담당 중인 훈련과정이 없습니다.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {courses.map((course) => {
        const units = courseData[course.id] || [];
        
        return (
          <div key={course.id} className="space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-2xl font-bold">{course.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {course.code} - 능력단위 {units.length}개
              </p>
            </div>

            {units.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-muted-foreground">
                    이 훈련과정에 등록된 능력단위가 없습니다.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {units.map((unitData: any) => {
                  const { competency_unit, students } = unitData;
                  const completedCount = students.filter(
                    (s: any) => s.evaluation && s.evaluation_status !== "pending"
                  ).length;
                  const pendingCount = students.filter(
                    (s: any) => !s.evaluation || s.evaluation_status === "pending"
                  ).length;

                  return (
                    <Card key={competency_unit.id} className="border-l-4 border-l-blue-500">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">
                              {competency_unit.name}
                            </CardTitle>
                            <CardDescription className="mt-1">
                              {competency_unit.code}
                              {competency_unit.description && (
                                <span className="ml-2 text-xs">
                                  - {competency_unit.description.substring(0, 50)}
                                  {competency_unit.description.length > 50 ? "..." : ""}
                                </span>
                              )}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">
                              평가 완료: {completedCount}명
                            </div>
                            <div className="text-sm text-muted-foreground">
                              평가 대기: {pendingCount}명
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {students.map((studentData: any) => {
                            const { student_id, student_name, student_email, evaluation, submissions, evaluation_status } = studentData;
                            const latestSubmission = submissions && submissions.length > 0 ? submissions[0] : null;

                            return (
                              <div
                                key={student_id}
                                className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <h4 className="font-semibold">
                                        {student_name || student_email}
                                      </h4>
                                      <span
                                        className={`px-2 py-1 text-xs rounded ${
                                          evaluation_status === "confirmed"
                                            ? "bg-green-100 text-green-800"
                                            : evaluation_status === "submitted"
                                            ? "bg-blue-100 text-blue-800"
                                            : evaluation_status === "pending"
                                            ? "bg-yellow-100 text-yellow-800"
                                            : "bg-gray-100 text-gray-800"
                                        }`}
                                      >
                                        {evaluation_status === "confirmed"
                                          ? "확정"
                                          : evaluation_status === "submitted"
                                          ? "제출"
                                          : evaluation_status === "pending"
                                          ? "대기중"
                                          : "임시저장"}
                                      </span>
                                      {latestSubmission && (
                                        <span className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700">
                                          과제물 제출됨
                                        </span>
                                      )}
                                    </div>

                                    {evaluation && evaluation.evaluated_at && (
                                      <p className="text-xs text-muted-foreground mb-2">
                                        평가일:{" "}
                                        {format(
                                          new Date(evaluation.evaluated_at),
                                          "yyyy년 MM월 dd일",
                                          { locale: ko }
                                        )}
                                      </p>
                                    )}

                                    {latestSubmission && (
                                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                                        <p className="text-blue-700 font-medium">
                                          최근 제출:{" "}
                                          {format(
                                            new Date(latestSubmission.submitted_at),
                                            "yyyy-MM-dd HH:mm",
                                            { locale: ko }
                                          )}
                                        </p>
                                        {latestSubmission.evaluation_schedules && (
                                          <p className="text-blue-600 mt-1">
                                            평가일정: {latestSubmission.evaluation_schedules.title}
                                          </p>
                                        )}
                                      </div>
                                    )}
                                  </div>

                                  <div className="flex gap-2 ml-4">
                                    {evaluation ? (
                                      <>
                                        <Link
                                          href={`/dashboard/evaluations/${evaluation.id}`}
                                        >
                                          <Button variant="outline" size="sm">
                                            상세보기
                                          </Button>
                                        </Link>
                                        <Button
                                          size="sm"
                                          onClick={() =>
                                            handleEvaluate(
                                              competency_unit.id,
                                              student_id,
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
                                        onClick={() =>
                                          handleEvaluate(
                                            competency_unit.id,
                                            student_id,
                                            latestSubmission?.id
                                          )
                                        }
                                      >
                                        {latestSubmission ? "평가하기" : "평가 시작"}
                                      </Button>
                                    )}
                                    {latestSubmission && (
                                      <Button
                                        variant="outline"
                                        size="sm"
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
                          })}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

