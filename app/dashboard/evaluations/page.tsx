import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationsList } from "@/components/evaluations/evaluations-list";

// 캐싱 전략: 30초마다 재검증 (평가 데이터는 자주 변경될 수 있음)
export const revalidate = 30;

async function fetchCoursesForProfile(profile: any) {
  const supabase = await createClient();

  if (profile.role === "admin") {
    const { data } = await supabase
      .from("training_courses")
      .select("id, name, code, description, start_date, end_date")
      .order("created_at", { ascending: false });
    return data || [];
  } else if (profile.role === "teacher") {
    const { data } = await supabase
      .from("course_teachers")
      .select(
        `
        training_courses!course_teachers_course_id_fkey (
          id,
          name,
          code,
          description,
          start_date,
          end_date
        )
      `
      )
      .eq("teacher_id", profile.id);

    if (data) {
      return data.map((ct: any) => ct.training_courses).filter(Boolean);
    }
  }

  return [];
}

async function fetchEvaluationsByCourse(courseId: string, profile: any) {
  const supabase = await createClient();

  // 권한 확인: 교사는 해당 훈련과정의 교사여야 함
  if (profile.role === "teacher") {
    const { data: courseTeacher } = await supabase
      .from("course_teachers")
      .select("course_id, teacher_id")
      .eq("course_id", courseId)
      .eq("teacher_id", profile.id)
      .maybeSingle();

    if (!courseTeacher) {
      return [];
    }
  }

  // 훈련과정의 모든 능력단위 조회
  const { data: competencyUnits } = await supabase
    .from("competency_units")
    .select("id, name, code, description")
    .eq("course_id", courseId)
    .order("code", { ascending: true });

  if (!competencyUnits || competencyUnits.length === 0) {
    return [];
  }

  // 각 능력단위별로 평가 데이터 조회 (병렬 처리)
  const unitDataPromises = competencyUnits.map(async (unit) => {
    // 해당 능력단위의 훈련생 조회
    const { data: courseStudents } = await supabase
      .from("course_students")
      .select(
        `
        student_id,
        profiles!course_students_student_id_fkey (
          id,
          full_name,
          email
        )
      `
      )
      .eq("course_id", courseId)
      .eq("status", "active");

    if (!courseStudents || courseStudents.length === 0) {
      return {
        competency_unit: unit,
        students: [],
      };
    }

    // 각 학생별로 평가 및 과제물 조회 (병렬 처리)
    const studentPromises = courseStudents.map(async (cs: any) => {
      const student = Array.isArray(cs.profiles) ? cs.profiles[0] : cs.profiles;
      const studentId = cs.student_id;

      // 평가 조회
      const { data: evaluation } = await supabase
        .from("evaluations")
        .select("*")
        .eq("competency_unit_id", unit.id)
        .eq("student_id", studentId)
        .maybeSingle();

      // 과제물 조회
      const { data: submissions } = await supabase
        .from("submissions")
        .select("*")
        .eq("competency_unit_id", unit.id)
        .eq("student_id", studentId);

      // 평가 상태 결정
      let evaluation_status = "pending";
      if (evaluation) {
        if (evaluation.status === "confirmed") {
          evaluation_status = "completed";
        } else if (evaluation.status === "submitted") {
          evaluation_status = "submitted";
        }
      }

      return {
        student_id: studentId,
        student_name: student?.full_name || null,
        student_email: student?.email || null,
        evaluation: evaluation || null,
        submissions: submissions || [],
        has_submission: (submissions || []).length > 0,
        evaluation_status,
      };
    });

    const students = await Promise.all(studentPromises);

    return {
      competency_unit: unit,
      students,
    };
  });

  return await Promise.all(unitDataPromises);
}

export default async function EvaluationsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "student") {
    redirect("/dashboard/my-evaluations");
  }

  // 서버에서 초기 데이터 페칭
  const courses = await fetchCoursesForProfile(profile);

  // 각 과정별 평가 데이터 병렬 페칭
  const courseDataMap: Record<string, any> = {};
  const evaluationPromises = courses.map(async (course: any) => {
    try {
      const data = await fetchEvaluationsByCourse(course.id, profile);
      return { courseId: course.id, data: data || [] };
    } catch (err) {
      console.error(`훈련과정 ${course.id} 데이터 로드 실패:`, err);
      return { courseId: course.id, data: [] };
    }
  });

  const results = await Promise.all(evaluationPromises);
  results.forEach(({ courseId, data }) => {
    courseDataMap[courseId] = data;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">평가 관리</h2>
          <p className="text-muted-foreground">
            훈련생 평가를 작성하고 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/evaluations/competency-units">
            <Button variant="outline">능력단위 관리</Button>
          </Link>
          <Link href="/dashboard/evaluations/schedules">
            <Button variant="outline">평가일정 관리</Button>
          </Link>
          <Link href="/dashboard/evaluations/new">
            <Button>새 평가 작성</Button>
          </Link>
        </div>
      </div>

      <EvaluationsList
        profile={profile}
        initialCourses={courses}
        initialCourseData={courseDataMap}
      />
    </div>
  );
}
