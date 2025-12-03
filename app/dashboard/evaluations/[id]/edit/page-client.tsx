"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationTabs } from "@/components/evaluations/evaluation-tabs";
import { NewEvaluationForm } from "@/components/evaluations/new-evaluation-form";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";

export default function EditEvaluationPageClient() {
  const params = useParams();
  const router = useRouter();
  const { profile, isInitialized } = useAuthStore();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    setError(null);
    try {
      // 평가 데이터 로드 (수정 페이지는 항상 최신 데이터 필요)
      const evalResponse = await fetch(`/api/evaluations/${params.id}`, {
        next: { revalidate: 0 }, // 수정 페이지는 항상 최신 데이터 필요
      });

      if (!evalResponse.ok) {
        const errorData = await evalResponse.json();
        throw new Error(errorData.error || "평가를 불러올 수 없습니다.");
      }

      const evalData = await evalResponse.json();
      setEvaluation(evalData);

      // 권한 확인
      if (profile.role === "teacher" && evalData.teacher_id !== profile.id) {
        setError("이 평가를 수정할 권한이 없습니다.");
        setLoading(false);
        return;
      }

      // 훈련과정 목록 로드
      const coursesResponse = await fetch("/api/courses", {
        next: { revalidate: 60 }, // 훈련과정 목록은 자주 변경되지 않음
      });

      if (!coursesResponse.ok) {
        throw new Error("훈련과정을 불러올 수 없습니다.");
      }

      const coursesData = await coursesResponse.json();
      setCourses(coursesData || []);
    } catch (err: any) {
      console.error("데이터 로드 실패:", err);
      setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [params.id, profile]);

  useEffect(() => {
    // 프로필이 초기화될 때까지 대기
    if (!isInitialized) {
      return;
    }

    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.role !== "admin" && profile.role !== "teacher") {
      router.push("/dashboard/evaluations");
      return;
    }

    loadData();
  }, [isInitialized, profile, router, loadData]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href={`/dashboard/evaluations/${params.id}`} />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
          <p className="text-muted-foreground mb-4">
            평가 정보를 수정합니다
          </p>
          <EvaluationTabs />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href={`/dashboard/evaluations/${params.id}`} />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
          <p className="text-muted-foreground mb-4">
            평가 정보를 수정합니다
          </p>
          <EvaluationTabs />
        </div>
        <p className="text-red-600">{error || "평가를 찾을 수 없습니다."}</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href={`/dashboard/evaluations/${params.id}`} />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
        <p className="text-muted-foreground mb-4">
          평가 정보를 수정합니다
        </p>
        <EvaluationTabs />
      </div>
      <NewEvaluationForm
        courses={courses}
        teacherId={profile.id}
        evaluation={evaluation}
      />
    </div>
  );
}

