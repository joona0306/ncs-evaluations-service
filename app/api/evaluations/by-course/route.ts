import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");

    if (!courseId) {
      return NextResponse.json(
        { error: "course_id is required" },
        { status: 400 }
      );
    }

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
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // 훈련과정의 모든 능력단위 조회
    const { data: competencyUnits, error: unitsError } = await supabase
      .from("competency_units")
      .select("id, name, code, description")
      .eq("course_id", courseId)
      .order("code", { ascending: true });

    if (unitsError) {
      console.error("능력단위 조회 오류:", unitsError);
      return NextResponse.json({ error: unitsError.message }, { status: 500 });
    }

    // 훈련과정의 모든 훈련생 조회
    const { data: courseStudents, error: studentsError } = await supabase
      .from("course_students")
      .select(
        `
        student_id,
        status,
        profiles(
          id,
          full_name,
          email
        )
      `
      )
      .eq("course_id", courseId)
      .eq("status", "active");

    if (studentsError) {
      console.error("훈련생 조회 오류:", studentsError);
      return NextResponse.json(
        { error: studentsError.message },
        { status: 500 }
      );
    }

    // 각 능력단위별로 훈련생별 평가 상태 조회
    const result: any[] = [];

    for (const unit of competencyUnits || []) {
      const unitEvaluations: any[] = [];

      for (const cs of courseStudents || []) {
        const student = Array.isArray(cs.profiles)
          ? cs.profiles[0]
          : cs.profiles;
        if (!student) continue;

        // 해당 능력단위와 훈련생의 평가 조회
        const { data: evaluation } = await supabase
          .from("evaluations")
          .select(
            `
            id,
            status,
            evaluated_at,
            submission_id,
            student:profiles!evaluations_student_id_fkey(
              id,
              full_name,
              email
            )
          `
          )
          .eq("competency_unit_id", unit.id)
          .eq("student_id", student.id)
          .maybeSingle();

        // 제출된 과제물 조회
        const { data: submissions } = await supabase
          .from("submissions")
          .select(
            `
            id,
            submission_type,
            file_url,
            url,
            file_name,
            submitted_at,
            evaluation_schedules(
              id,
              title
            )
          `
          )
          .eq("competency_unit_id", unit.id)
          .eq("student_id", student.id)
          .order("submitted_at", { ascending: false });

        unitEvaluations.push({
          student_id: student.id,
          student_name: student.full_name || student.email,
          student_email: student.email,
          evaluation: evaluation || null,
          submissions: submissions || [],
          has_submission: (submissions || []).length > 0,
          evaluation_status: evaluation ? evaluation.status : "pending",
        });
      }

      result.push({
        competency_unit: unit,
        students: unitEvaluations,
      });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("평가 상태 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
