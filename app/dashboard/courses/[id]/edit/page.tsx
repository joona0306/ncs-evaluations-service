import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { CourseForm } from "@/components/courses/course-form";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  try {
    await requireAdmin();
  } catch (error) {
    console.error("권한 확인 오류:", error);
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: course, error } = await supabase
    .from("training_courses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("훈련과정 조회 오류:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
    console.error("에러 상세:", error.details);
    redirect("/dashboard/courses");
  }

  if (!course) {
    console.error("훈련과정을 찾을 수 없습니다. ID:", id);
    redirect("/dashboard/courses");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <BackButton href={`/dashboard/courses/${id}`} />
      <h2 className="text-3xl font-bold mb-8">훈련과정 수정</h2>
      <CourseForm course={course} />
    </div>
  );
}
