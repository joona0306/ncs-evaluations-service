import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { NewEvaluationForm } from "@/components/evaluations/new-evaluation-form";

// 항상 동적으로 렌더링하여 최신 데이터 표시
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function NewEvaluationPage() {
  const profile = await getCurrentUserProfile();
  
  if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get courses for this teacher
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
      <BackButton href="/dashboard/evaluations" />
      <h2 className="text-3xl font-bold mb-8">새 평가 작성</h2>
      <NewEvaluationForm courses={courses} teacherId={profile.id} />
    </div>
  );
}

