import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
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
import { CourseTeachers } from "@/components/courses/course-teachers";
import { CourseStudents } from "@/components/courses/course-students";
import { CompetencyUnits } from "@/components/courses/competency-units";

export default async function CourseDetailPage({
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
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard/courses" />
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">{course.name}</h2>
            <p className="text-muted-foreground">{course.code}</p>
          </div>
          <Link href={`/dashboard/courses/${course.id}/edit`}>
            <Button variant="outline">수정</Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">시작일</p>
            <p className="font-medium">
              {new Date(course.start_date).toLocaleDateString("ko-KR")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">종료일</p>
            <p className="font-medium">
              {new Date(course.end_date).toLocaleDateString("ko-KR")}
            </p>
          </div>
        </div>

        {course.description && (
          <p className="text-muted-foreground">{course.description}</p>
        )}
      </div>

      <div className="space-y-6">
        <CompetencyUnits courseId={course.id} />
        <CourseTeachers courseId={course.id} />
        <CourseStudents courseId={course.id} />
      </div>
    </div>
  );
}
