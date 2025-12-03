"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

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
  initialCourseData = {},
}: EvaluationsListProps) {
  const [courses, setCourses] = useState<any[]>(initialCourses);
  const [courseData, setCourseData] =
    useState<Record<string, any>>(initialCourseData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<string>("");
  const hasLoadedRef = useRef(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // 훈련과정 목록 가져오기 (적절한 캐싱 전략 적용)
      const coursesResponse = await fetch("/api/courses", {
        next: { revalidate: 60 }, // 60초마다 재검증
      });

      if (!coursesResponse.ok) {
        const errorData = await coursesResponse.json();
        throw new Error(
          errorData.error || "훈련과정 목록을 불러올 수 없습니다."
        );
      }

      const coursesData = await coursesResponse.json();
      setCourses(coursesData || []);

      // 각 훈련과정별로 평가 상태 가져오기 (병렬 처리로 성능 개선)
      const courseDataMap: Record<string, any> = {};

      // 모든 API 호출을 병렬로 처리
      const evaluationPromises = (coursesData || []).map(
        async (course: any) => {
          try {
            const response = await fetch(
              `/api/evaluations/by-course?course_id=${course.id}`,
              {
                // 평가 데이터는 자주 변경되므로 짧은 캐시 시간
                next: { revalidate: 30 }, // 30초마다 재검증
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
        }
      );

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

  // 초기 데이터가 없을 때만 로드 (한 번만 실행)
  const hasInitialData = useMemo(
    () =>
      initialCourses.length > 0 || Object.keys(initialCourseData).length > 0,
    [initialCourses.length, Object.keys(initialCourseData).length]
  );

  useEffect(() => {
    // 이미 로드했거나 초기 데이터가 있으면 스킵
    if (hasLoadedRef.current || hasInitialData) {
      return;
    }

    hasLoadedRef.current = true;
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasInitialData]); // hasInitialData가 변경될 때만 체크

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
          // router.push 대신 window.location.href 사용 (페이지 전체 리로드 필요)
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

  // 선택한 훈련과정의 능력단위 목록
  const availableUnits = useMemo(() => {
    if (!selectedCourseId) return [];
    const units = courseData[selectedCourseId] || [];
    return units.map((unitData: any) => unitData.competency_unit);
  }, [selectedCourseId, courseData]);

  // 선택한 능력단위의 데이터
  const selectedUnitData = useMemo(() => {
    if (!selectedCourseId || !selectedUnitId) return null;
    const units = courseData[selectedCourseId] || [];
    return units.find(
      (unitData: any) => unitData.competency_unit.id === selectedUnitId
    );
  }, [selectedCourseId, selectedUnitId, courseData]);

  // 초기 선택: 첫 번째 훈련과정과 첫 번째 능력단위 자동 선택 (한 번만 실행)
  const hasInitializedRef = useRef(false);
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    if (courses.length > 0 && !selectedCourseId) {
      hasInitializedRef.current = true;
      const firstCourse = courses[0];
      setSelectedCourseId(firstCourse.id);
      const units = courseData[firstCourse.id] || [];
      if (units.length > 0) {
        setSelectedUnitId(units[0].competency_unit.id);
      }
    }
  }, [courses.length, courseData, selectedCourseId]); // courses.length만 사용하여 배열 참조 변경 방지

  // 훈련과정 변경 시 능력단위 초기화
  const prevSelectedCourseIdRef = useRef<string>("");
  useEffect(() => {
    // 선택된 과정이 실제로 변경되었을 때만 실행
    if (selectedCourseId && selectedCourseId !== prevSelectedCourseIdRef.current) {
      prevSelectedCourseIdRef.current = selectedCourseId;
      const units = courseData[selectedCourseId] || [];
      if (units.length > 0) {
        setSelectedUnitId(units[0].competency_unit.id);
      } else {
        setSelectedUnitId("");
      }
    }
  }, [selectedCourseId, courseData]);

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
          <p className="text-muted-foreground">
            담당 중인 훈련과정이 없습니다.
          </p>
        </CardContent>
      </Card>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  return (
    <div className="space-y-6 px-4 sm:px-0">
      {/* 드롭다운 선택 영역 */}
      <Card>
        <CardHeader>
          <CardTitle>평가 선택</CardTitle>
          <CardDescription>
            훈련과정과 능력단위를 선택하여 평가를 관리하세요
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="course-select">훈련과정</Label>
            <Select
              id="course-select"
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </Select>
          </div>

          {selectedCourseId && (
            <div className="space-y-2">
              <Label htmlFor="unit-select">능력단위</Label>
              <Select
                id="unit-select"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={availableUnits.length === 0}
              >
                {availableUnits.length === 0 ? (
                  <option value="">능력단위가 없습니다</option>
                ) : (
                  <>
                    <option value="">선택하세요</option>
                    {availableUnits.map((unit: any) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.name} ({unit.code})
                      </option>
                    ))}
                  </>
                )}
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 선택한 능력단위의 평가 정보 */}
      {selectedUnitData && selectedUnitId && (
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl">
                  {selectedUnitData.competency_unit.name}
                </CardTitle>
                <CardDescription className="mt-1">
                  {selectedUnitData.competency_unit.code}
                  {selectedUnitData.competency_unit.description && (
                    <span className="ml-2 text-xs">
                      -{" "}
                      {selectedUnitData.competency_unit.description.substring(
                        0,
                        50
                      )}
                      {selectedUnitData.competency_unit.description.length > 50
                        ? "..."
                        : ""}
                    </span>
                  )}
                </CardDescription>
                {selectedCourse && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {selectedCourse.name} ({selectedCourse.code})
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">
                  평가 완료:{" "}
                  {
                    selectedUnitData.students.filter(
                      (s: any) =>
                        s.evaluation && s.evaluation_status !== "pending"
                    ).length
                  }
                  명
                </div>
                <div className="text-sm text-muted-foreground">
                  평가 대기:{" "}
                  {
                    selectedUnitData.students.filter(
                      (s: any) =>
                        !s.evaluation || s.evaluation_status === "pending"
                    ).length
                  }
                  명
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  총 인원: {selectedUnitData.students.length}명
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {selectedUnitData.students.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-muted-foreground">
                  이 능력단위에 등록된 훈련생이 없습니다.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selectedUnitData.students.map((studentData: any) => {
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
                      competencyUnitId={selectedUnitData.competency_unit.id}
                      onEvaluate={handleEvaluate}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedCourseId && !selectedUnitId && availableUnits.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              이 훈련과정에 등록된 능력단위가 없습니다.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
