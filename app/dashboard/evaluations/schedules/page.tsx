"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationSchedulesManager } from "@/components/evaluations/evaluation-schedules-manager";
import { CardSkeleton } from "@/components/ui/skeleton";

export default function EvaluationSchedulesPage() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");
  const [loading, setLoading] = useState(true);

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
  }, [profile, router]);

  const loadCourses = async () => {
    try {
      const response = await fetch("/api/courses", { cache: "no-store" });
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
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BackButton href="/dashboard/evaluations" />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가일정 관리</h2>
          <p className="text-muted-foreground">
            능력단위별 평가일정을 관리합니다
          </p>
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
        <p className="text-muted-foreground">
          능력단위별 평가일정을 관리합니다
        </p>
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

