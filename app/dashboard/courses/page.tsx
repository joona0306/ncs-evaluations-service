import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";

export default async function CoursesPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: courses, error } = await supabase
    .from("training_courses")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("훈련과정 조회 오류:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
    console.error("에러 상세:", error.details);
    console.error("에러 힌트:", error.hint);
  }

  // 각 과정의 교사와 학생 정보 조회
  const coursesWithDetails = await Promise.all(
    (courses || []).map(async (course) => {
      // 훈련교사 조회
      const { data: teachers } = await supabase
        .from("course_teachers")
        .select(
          `
          profiles!course_teachers_teacher_id_fkey (
            id,
            full_name,
            email
          )
        `
        )
        .eq("course_id", course.id);

      // 훈련생 조회
      const { data: students } = await supabase
        .from("course_students")
        .select(
          `
          profiles!course_students_student_id_fkey (
            id,
            full_name,
            email
          )
        `
        )
        .eq("course_id", course.id)
        .eq("status", "active");

      return {
        ...course,
        teachers:
          teachers?.map((t: any) =>
            Array.isArray(t.profiles) ? t.profiles[0] : t.profiles
          ).filter(Boolean) || [],
        students:
          students?.map((s: any) =>
            Array.isArray(s.profiles) ? s.profiles[0] : s.profiles
          ).filter(Boolean) || [],
      };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
        <BackButton href="/dashboard" />
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">훈련과정 관리</h2>
            <p className="text-muted-foreground">
              훈련과정을 생성하고 관리합니다
            </p>
          </div>
          <Link href="/dashboard/courses/new">
            <Button>새 훈련과정 생성</Button>
          </Link>
        </div>

        {coursesWithDetails && coursesWithDetails.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {coursesWithDetails.map((course) => (
              <Card key={course.id}>
                <CardHeader>
                  <CardTitle>{course.name}</CardTitle>
                  <CardDescription>{course.code}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 mb-4">
                    <p className="text-sm text-muted-foreground">
                      시작일: {new Date(course.start_date).toLocaleDateString("ko-KR")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      종료일: {new Date(course.end_date).toLocaleDateString("ko-KR")}
                    </p>
                    {course.description && (
                      <p className="text-sm">{course.description}</p>
                    )}
                  </div>

                  {/* 훈련교사 목록 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">
                      훈련교사 ({course.teachers?.length || 0}명)
                    </p>
                    {course.teachers && course.teachers.length > 0 ? (
                      <div className="space-y-1">
                        {course.teachers.slice(0, 3).map((teacher: any) => (
                          <p
                            key={teacher.id}
                            className="text-xs text-muted-foreground truncate"
                            title={teacher.full_name || teacher.email}
                          >
                            • {teacher.full_name || teacher.email}
                          </p>
                        ))}
                        {course.teachers.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            외 {course.teachers.length - 3}명
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        등록된 훈련교사가 없습니다
                      </p>
                    )}
                  </div>

                  {/* 훈련생 목록 */}
                  <div className="mb-4">
                    <p className="text-sm font-medium mb-2">
                      훈련생 ({course.students?.length || 0}명)
                    </p>
                    {course.students && course.students.length > 0 ? (
                      <div className="space-y-1">
                        {course.students.slice(0, 3).map((student: any) => (
                          <p
                            key={student.id}
                            className="text-xs text-muted-foreground truncate"
                            title={student.full_name || student.email}
                          >
                            • {student.full_name || student.email}
                          </p>
                        ))}
                        {course.students.length > 3 && (
                          <p className="text-xs text-muted-foreground">
                            외 {course.students.length - 3}명
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        등록된 훈련생이 없습니다
                      </p>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/courses/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">상세보기</Button>
                    </Link>
                    <Link href={`/dashboard/courses/${course.id}/edit`}>
                      <Button variant="outline">수정</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">등록된 훈련과정이 없습니다.</p>
              <Link href="/dashboard/courses/new" className="mt-4 inline-block">
                <Button>첫 훈련과정 생성하기</Button>
              </Link>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

