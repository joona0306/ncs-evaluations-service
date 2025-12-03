import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { CompetencyUnitsView } from "@/components/courses/competency-units-view";

export default async function MyCourseDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "admin") {
    redirect(`/dashboard/courses/${params.id}`);
  }

  const supabase = await createClient();

  // 권한 확인: 학생/교사는 자신이 등록된 훈련과정만 볼 수 있음
  let course: any = null;
  let hasAccess = false;

  if (profile.role === "student") {
    const { data: courseStudent } = await supabase
      .from("course_students")
      .select(
        `
        training_courses!course_students_course_id_fkey (*)
      `
      )
      .eq("student_id", profile.id)
      .eq("course_id", params.id)
      .eq("status", "active")
      .maybeSingle();

    if (courseStudent) {
      const courseData = Array.isArray(courseStudent.training_courses)
        ? courseStudent.training_courses[0]
        : courseStudent.training_courses;
      if (courseData) {
        course = courseData;
        hasAccess = true;
      }
    }
  } else if (profile.role === "teacher") {
    const { data: courseTeacher } = await supabase
      .from("course_teachers")
      .select(
        `
        training_courses!course_teachers_course_id_fkey (*)
      `
      )
      .eq("teacher_id", profile.id)
      .eq("course_id", params.id)
      .maybeSingle();

    if (courseTeacher) {
      const courseData = Array.isArray(courseTeacher.training_courses)
        ? courseTeacher.training_courses[0]
        : courseTeacher.training_courses;
      if (courseData) {
        course = courseData;
        hasAccess = true;
      }
    }
  }

  if (!hasAccess || !course) {
    redirect("/dashboard");
  }

  // 능력단위 조회
  const { data: competencyUnits } = await supabase
    .from("competency_units")
    .select("id, name, code, description")
    .eq("course_id", params.id)
    .order("code", { ascending: true });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">{course.name}</h2>
        <p className="text-muted-foreground mb-4">{course.code}</p>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">시작일</p>
            <p className="font-medium">
              {course.start_date
                ? new Date(course.start_date).toLocaleDateString("ko-KR")
                : "-"}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">종료일</p>
            <p className="font-medium">
              {course.end_date
                ? new Date(course.end_date).toLocaleDateString("ko-KR")
                : "-"}
            </p>
          </div>
        </div>

        {course.description && (
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-1">설명</p>
            <p className="text-muted-foreground whitespace-pre-wrap">
              {course.description}
            </p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>능력단위</CardTitle>
            <CardDescription>
              {competencyUnits?.length || 0}개의 능력단위
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CompetencyUnitsView
              courseId={params.id}
              competencyUnits={competencyUnits || []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

