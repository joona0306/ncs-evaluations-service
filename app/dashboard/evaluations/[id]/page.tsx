import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { NewEvaluationDetail } from "@/components/evaluations/new-evaluation-detail";
import { EvaluationDeleteButton } from "@/components/evaluations/evaluation-delete-button";

// 항상 동적으로 렌더링하여 최신 데이터 표시
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select(
      `
      *,
      competency_units(*),
      student:profiles!evaluations_student_id_fkey(*),
      teacher:profiles!evaluations_teacher_id_fkey(*)
    `
    )
    .eq("id", params.id)
    .single();

  if (!evaluation) {
    redirect("/dashboard/evaluations");
  }

  // 권한 확인
  const canEdit =
    profile.role === "admin" ||
    (profile.role === "teacher" && evaluation.teacher_id === profile.id);

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
            <EvaluationDeleteButton evaluationId={params.id} />
          </div>
        )}
      </div>

      <NewEvaluationDetail evaluation={evaluation} />
    </div>
  );
}
