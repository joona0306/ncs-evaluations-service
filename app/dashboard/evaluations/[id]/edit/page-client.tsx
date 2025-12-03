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

  useEffect(() => {
    // profile이 없으면 대기 (isInitialized는 체크하지 않음)
    if (!profile) {
      // isInitialized가 true이고 profile이 없으면 로그인 페이지로 리다이렉트
      if (isInitialized) {
        router.push("/login");
      }
      return;
    }

    // 권한 확인
    if (profile.role !== "admin" && profile.role !== "teacher") {
      router.push("/dashboard/evaluations");
      return;
    }

    // 이미 로드 중이거나 데이터가 있으면 스킵
    if (loading || evaluation) {
      return;
    }

    // 데이터 로드
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("데이터 로드 시작");
        // 평가 데이터와 훈련과정 목록을 병렬로 로드
        const [evalResponse, coursesResponse] = await Promise.all([
          fetch(`/api/evaluations/${params.id}`, {
            next: { revalidate: 0 },
          }),
          fetch("/api/courses", {
            next: { revalidate: 60 },
          }),
        ]);

        if (!evalResponse.ok) {
          const errorData = await evalResponse.json();
          throw new Error(errorData.error || "평가를 불러올 수 없습니다.");
        }

        const evalData = await evalResponse.json();
        console.log("평가 데이터 로드 완료:", evalData);
        setEvaluation(evalData);

        // 권한 확인
        if (profile.role === "teacher" && evalData.teacher_id !== profile.id) {
          setError("이 평가를 수정할 권한이 없습니다.");
          setLoading(false);
          return;
        }

        if (!coursesResponse.ok) {
          console.warn(
            "훈련과정 목록을 불러올 수 없습니다. 빈 배열로 설정합니다."
          );
          setCourses([]);
        } else {
          const coursesData = await coursesResponse.json();
          console.log("훈련과정 목록 로드 완료:", coursesData);
          setCourses(coursesData || []);
        }
      } catch (err: any) {
        console.error("데이터 로드 실패:", err);
        setError(err.message || "데이터를 불러오는 중 오류가 발생했습니다.");
      } finally {
        console.log("로딩 완료, loading을 false로 설정");
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, params.id]);

  // 디버깅: 현재 상태 로그
  useEffect(() => {
    console.log("상태 업데이트:", {
      isInitialized,
      loading,
      hasEvaluation: !!evaluation,
      hasCourses: courses.length > 0,
      error,
      evaluationId: evaluation?.id,
    });
  }, [isInitialized, loading, evaluation, courses, error]);

  // profile이 없고 isInitialized가 true면 로그인 페이지로 리다이렉트 (useEffect에서 처리)
  // profile이 없고 isInitialized가 false면 스켈레톤 표시
  if (!profile) {
    if (isInitialized) {
      return null; // useEffect에서 리다이렉트 처리 중
    }
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href={`/dashboard/evaluations/${params.id}`} />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
          <p className="text-muted-foreground mb-4">평가 정보를 수정합니다</p>
          <EvaluationTabs />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  // 에러가 있으면 에러 메시지 표시
  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href={`/dashboard/evaluations/${params.id}`} />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
          <p className="text-muted-foreground mb-4">평가 정보를 수정합니다</p>
          <EvaluationTabs />
        </div>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  // 로딩 중이거나 evaluation이 없으면 스켈레톤 표시
  if (loading || !evaluation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href={`/dashboard/evaluations/${params.id}`} />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
          <p className="text-muted-foreground mb-4">평가 정보를 수정합니다</p>
          <EvaluationTabs />
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  // evaluation이 준비되었으면 폼 렌더링 (courses는 빈 배열이어도 괜찮음)
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href={`/dashboard/evaluations/${params.id}`} />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">평가 수정</h2>
        <p className="text-muted-foreground mb-4">평가 정보를 수정합니다</p>
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
