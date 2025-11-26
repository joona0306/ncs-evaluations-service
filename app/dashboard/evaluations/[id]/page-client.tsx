"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { NewEvaluationDetail } from "@/components/evaluations/new-evaluation-detail";
import { EvaluationDeleteButton } from "@/components/evaluations/evaluation-delete-button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { useAuthStore } from "@/stores/auth-store";

export default function EvaluationDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { profile } = useAuthStore();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvaluation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/evaluations/${params.id}`, {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "평가를 불러올 수 없습니다.");
      }

      const data = await response.json();
      setEvaluation(data);
    } catch (err: any) {
      console.error("평가 로드 실패:", err);
      setError(err.message || "평가를 불러오는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    if (!profile) {
      router.push("/login");
      return;
    }
    loadEvaluation();
  }, [profile, router, loadEvaluation]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href="/dashboard/evaluations" />
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">평가 상세</h2>
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
        <CardSkeleton count={3} />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href="/dashboard/evaluations" />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 상세</h2>
          <p className="text-red-600">{error || "평가를 찾을 수 없습니다."}</p>
        </div>
      </div>
    );
  }

  // 권한 확인
  const canEdit =
    profile?.role === "admin" ||
    (profile?.role === "teacher" && evaluation.teacher_id === profile.id);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href="/dashboard/evaluations" />
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">평가 상세</h2>
          <p className="text-muted-foreground">
            {evaluation.competency_units?.name} -{" "}
            {evaluation.student?.full_name || evaluation.student?.email}
          </p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Link href={`/dashboard/evaluations/${params.id}/edit`}>
              <Button variant="outline">수정</Button>
            </Link>
            <EvaluationDeleteButton evaluationId={params.id as string} />
          </div>
        )}
      </div>

      <NewEvaluationDetail evaluation={evaluation} />
    </div>
  );
}

