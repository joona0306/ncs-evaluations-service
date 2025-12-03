import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/ui/back-button";
import { NewEvaluationForm } from "@/components/evaluations/new-evaluation-form";
import { EvaluationTabs } from "@/components/evaluations/evaluation-tabs";

// 캐싱 전략: 1분마다 재검증
export const revalidate = 60;

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
    courses =
      data
        ?.map((ct: any) => {
          // Supabase join 결과는 배열 또는 객체일 수 있음
          const course = Array.isArray(ct.training_courses)
            ? ct.training_courses[0]
            : ct.training_courses;
          return course;
        })
        .filter(Boolean) || [];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <BackButton href="/dashboard/evaluations" />
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">새 평가 작성</h2>
            <p className="text-muted-foreground">
              새로운 평가를 작성합니다
            </p>
          </div>
          <EvaluationTabs alignRight />
        </div>
      </div>
      <NewEvaluationForm courses={courses} teacherId={profile.id} />
    </div>
  );
}

