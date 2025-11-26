import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BackButton } from "@/components/ui/back-button";
import { CompetencyUnitsManager } from "@/components/evaluations/competency-units-manager";

export default async function CompetencyUnitsManagementPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role !== "admin" && profile.role !== "teacher") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  // Get courses for this user
  let courses: any[] = [];
  if (profile.role === "admin") {
    const { data } = await supabase
      .from("training_courses")
      .select("*")
      .order("created_at", { ascending: false });
    courses = data || [];
  } else {
    // Teacher: get assigned courses
    const { data } = await supabase
      .from("course_teachers")
      .select("training_courses(*)")
      .eq("teacher_id", profile.id);
    courses = data?.map((ct: any) => ct.training_courses).filter(Boolean) || [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard/evaluations" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">능력단위 관리</h2>
        <p className="text-muted-foreground">
          훈련과정별 능력단위와 능력단위요소를 관리합니다
        </p>
      </div>

      <CompetencyUnitsManager courses={courses} />
    </div>
  );
}
