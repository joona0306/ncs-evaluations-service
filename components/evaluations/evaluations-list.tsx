"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EvaluationListSkeleton } from "@/components/ui/skeleton";
import { EvaluationStudentItem } from "./evaluation-student-item";

interface EvaluationsListProps {
  profile: {
    id: string;
    role: string;
  };
  initialCourses?: any[];
  initialCourseData?: Record<string, any>;
}

type CourseGroup = {
  course: any;
  courseId: string;
  competencyUnits: any[];
};

export function EvaluationsList({ 
  profile,
  initialCourses = [],
  initialCourseData = {}
}: EvaluationsListProps) {
  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [courseData, setCourseData] = useState<Record<string, any>>(initialCourseData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 훈련과정 목록 가져오기 (적절한 캐싱 전략 적용)
      const coursesResponse = await fetch("/api/courses", { 
        next: { revalidate: 60 } // 60초마다 재검증
      });

      if (!coursesResponse.ok) {
        const errorData = await coursesResponse.json();
        throw new Error(errorData.error || "훈련과정 목록을 불러올 수 없습니다.");
      }

      const coursesData = await coursesResponse.json();
      setCourses(coursesData || []);

      // 각 훈련과정별로 평가 상태 가져오기 (병렬 처리로 성능 개선)
      const courseDataMap: Record<string, any> = {};
      
      // 모든 API 호출을 병렬로 처리
      const evaluationPromises = (coursesData || []).map(async (course: any) => {
        try {
          const response = await fetch(
            `/api/evaluations/by-course?course_id=${course.id}`,
            { 
              // 평가 데이터는 자주 변경되므로 짧은 캐시 시간
              next: { revalidate: 30 } // 30초마다 재검증
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            return { courseId: course.id, data: data || [] };
          }
          return { courseId: course.id, data: [] };
        } catch (err) {
          console.error(`훈련과정 ${course.id} 데이터 로드 실패:`, err);
          return { courseId: course.id, data: [] };
        }
      });

      // 모든 요청을 병렬로 실행
      const results = await Promise.all(evaluationPromises);
      
      // 결과를 맵으로 변환
      results.forEach(({ courseId, data }) => {
        courseDataMap[courseId] = data;
      });

      setCourseData(courseDataMap);
    } catch (err: any) {
      console.error("데이터 로드 실패:", err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기 데이터가 없을 때만 로드
  useEffect(() => {
    if (initialCourses.length === 0 && Object.keys(initialCourseData).length === 0) {
      loadData();
    }
  }, [profile.id, profile.role]);

  const handleEvaluate = useCallback(
    async (
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
    },
    []
  );

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
    <div className="space-y-8 px-4 sm:px-0">
      {courses.map((course) => {
        const units = courseData[course.id] || [];
        
        return (
          <div key={course.id} className="space-y-6">
            <div className="border-b pb-3">
              <h3 className="text-xl sm:text-2xl font-bold">{course.name}</h3>
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
                            const {
                              student_id,
                              student_name,
                              student_email,
                              evaluation,
                              submissions,
                              evaluation_status,
                            } = studentData;

                            return (
                              <EvaluationStudentItem
                                key={student_id}
                                studentId={student_id}
                                studentName={student_name || student_email}
                                studentEmail={student_email}
                                evaluation={evaluation}
                                submissions={submissions || []}
                                evaluationStatus={evaluation_status}
                                competencyUnitId={competency_unit.id}
                                onEvaluate={handleEvaluate}
                              />
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

