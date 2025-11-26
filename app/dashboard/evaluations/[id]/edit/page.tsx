import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { NewEvaluationForm } from "@/components/evaluations/new-evaluation-form";

// 항상 동적으로 렌더링하여 최신 데이터 표시
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function EditEvaluationPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCurrentUserProfile();

  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // 평가 데이터 로드
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
  if (profile.role === "teacher" && evaluation.teacher_id !== profile.id) {
    redirect("/dashboard/evaluations");
  }

  // Get courses
  let courses: any[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("training_courses")
      .select("*")
      .order("created_at", { ascending: false });
    courses = data || [];
  } else {
    const { data } = await supabase
      .from("course_teachers")
      .select("training_courses(*)")
      .eq("teacher_id", profile.id);
    courses = data?.map((ct: any) => ct.training_courses).filter(Boolean) || [];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href={`/dashboard/evaluations/${params.id}`} />
      <h2 className="text-3xl font-bold mb-8">평가 수정</h2>
      <NewEvaluationForm
        courses={courses}
        teacherId={profile.id}
        evaluation={evaluation}
      />
    </div>
  );
}
