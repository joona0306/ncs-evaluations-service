import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationTabs } from "@/components/evaluations/evaluation-tabs";
import { EvaluationDeleteButton } from "@/components/evaluations/evaluation-delete-button";
import { CardSkeleton } from "@/components/ui/skeleton";
import { NewEvaluationDetailClient } from "@/components/evaluations/new-evaluation-detail-client";

// 캐싱 전략: 30초마다 재검증
export const revalidate = 30;

export default async function EvaluationDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  const supabase = await createClient();

  // 서버에서 평가 데이터 직접 조회
  const { data: evaluation, error } = await supabase
    .from("evaluations")
    .select(
      `
      id,
      competency_unit_id,
      student_id,
      teacher_id,
      status,
      evaluated_at,
      submission_id,
      comments,
      total_score,
      raw_total_score,
      created_at,
      updated_at,
      competency_units(
        id,
        name,
        code,
        description,
        training_courses(
          id,
          name,
          code
        )
      ),
      student:profiles!evaluations_student_id_fkey(
        id,
        full_name,
        email
      ),
      teacher:profiles!evaluations_teacher_id_fkey(
        id,
        full_name,
        email
      )
    `
    )
    .eq("id", params.id)
    .single();

  if (error || !evaluation) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton href="/dashboard/evaluations" />
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">평가 상세</h2>
          <p className="text-red-600">
            {error?.message || "평가를 찾을 수 없습니다."}
          </p>
        </div>
      </div>
    );
  }

  // 권한 확인
  const canEdit =
    profile.role === "admin" ||
    (profile.role === "teacher" && evaluation.teacher_id === profile.id);

  // 훈련생인지 확인
  const isStudent = profile.role === "student";

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton
        href={
          isStudent ? "/dashboard/my-evaluations" : "/dashboard/evaluations"
        }
      />
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">평가 상세</h2>
            <p className="text-muted-foreground">
              {Array.isArray(evaluation.competency_units)
                ? (evaluation.competency_units as any[])[0]?.name
                : (evaluation.competency_units as any)?.name}{" "}
              -{" "}
              {Array.isArray(evaluation.student)
                ? (evaluation.student as any[])[0]?.full_name ||
                  (evaluation.student as any[])[0]?.email
                : (evaluation.student as any)?.full_name ||
                  (evaluation.student as any)?.email}
            </p>
          </div>
          {canEdit && (
            <div className="flex gap-2">
              <Link href={`/dashboard/evaluations/${params.id}/edit`}>
                <Button variant="outline">수정</Button>
              </Link>
              <EvaluationDeleteButton evaluationId={params.id} />
            </div>
          )}
        </div>
        {/* 훈련생이 아닐 때만 탭 메뉴 표시 */}
        {!isStudent && <EvaluationTabs alignRight />}
      </div>

      <NewEvaluationDetailClient evaluation={evaluation} />
    </div>
  );
}
