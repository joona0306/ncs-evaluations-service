"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationTabs } from "@/components/evaluations/evaluation-tabs";
import { useCoursesQuery } from "@/lib/hooks/use-courses-query";
import dynamic from "next/dynamic";
import { CardSkeleton } from "@/components/ui/skeleton";

// EvaluationSchedulesManager를 동적 임포트로 지연 로딩 (코드 스플리팅)
const EvaluationSchedulesManager = dynamic(
  () =>
    import("@/components/evaluations/evaluation-schedules-manager").then(
      (mod) => ({
        default: mod.EvaluationSchedulesManager,
      })
    ),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">
        평가일정 관리 로딩 중...
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

export default function EvaluationSchedulesPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const hasInitializedRef = useRef(false);

  // React Query를 사용한 데이터 페칭
  const {
    data: courses = [],
    isLoading: loading,
    error: coursesError,
  } = useCoursesQuery();

  // 첫 번째 과정 자동 선택 (한 번만 실행)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    
    if (courses.length > 0 && !selectedCourseId) {
      hasInitializedRef.current = true;
      setSelectedCourseId(courses[0].id);
    }
  }, [courses.length, selectedCourseId]);

  useEffect(() => {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.role !== "admin" && profile.role !== "teacher") {
      router.push("/dashboard");
      return;
    }
  }, [profile, router]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BackButton href="/dashboard/evaluations" />
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">평가일정 관리</h2>
              <p className="text-muted-foreground">
                능력단위별 평가일정을 관리합니다
              </p>
            </div>
            <EvaluationTabs alignRight />
          </div>
        </div>
        <CardSkeleton count={2} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard/evaluations" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">평가일정 관리</h2>
        <p className="text-muted-foreground mb-4">
          능력단위별 평가일정을 관리합니다
        </p>
        <EvaluationTabs />
      </div>

      {coursesError ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-red-600">
              훈련과정을 불러오는 중 오류가 발생했습니다.
            </p>
          </CardContent>
        </Card>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              배정된 훈련과정이 없습니다.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>훈련과정 선택</CardTitle>
              <CardDescription>
                평가일정을 관리할 훈련과정을 선택하세요
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="course">훈련과정</Label>
                <Select
                  id="course"
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                >
                  <option value="">훈련과정 선택</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name} ({course.code})
                    </option>
                  ))}
                </Select>
              </div>
            </CardContent>
          </Card>

          {selectedCourseId && (
            <EvaluationSchedulesManager courseId={selectedCourseId} />
          )}
        </div>
      )}
    </div>
  );
}

