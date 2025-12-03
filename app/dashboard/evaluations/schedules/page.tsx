"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationTabs } from "@/components/evaluations/evaluation-tabs";
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
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const loadCourses = useCallback(async () => {
    try {
      const response = await fetch("/api/courses", {
        next: { revalidate: 60 }, // 일정 데이터는 자주 변경되지 않음
      });
      if (!response.ok) {
        throw new Error("훈련과정을 불러올 수 없습니다.");
      }
      const data = await response.json();
      setCourses(data || []);
      if (data && data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
      }
    } catch (err: any) {
      console.error("훈련과정 로드 오류:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedCourseId]);

  useEffect(() => {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.role !== "admin" && profile.role !== "teacher") {
      router.push("/dashboard");
      return;
    }

    loadCourses();
  }, [profile, router, loadCourses]);

  if (loading) {
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

      {courses.length === 0 ? (
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

