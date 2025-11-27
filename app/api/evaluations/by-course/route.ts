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

    // N+1 쿼리 문제 해결: 배치 쿼리로 변경
    const unitIds = (competencyUnits || []).map((u) => u.id);
    const studentIds = (courseStudents || [])
      .map((cs) => {
        const student = Array.isArray(cs.profiles) ? cs.profiles[0] : cs.profiles;
        return student?.id;
      })
      .filter(Boolean) as string[];

    if (unitIds.length === 0 || studentIds.length === 0) {
      return NextResponse.json([]);
    }

    // 모든 평가를 한 번에 조회
    const { data: allEvaluations, error: evaluationError } = await supabase
      .from("evaluations")
      .select(
        `
        id,
        competency_unit_id,
        student_id,
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
      .in("competency_unit_id", unitIds)
      .in("student_id", studentIds);

    if (evaluationError) {
      console.error("평가 조회 오류:", evaluationError);
      return NextResponse.json({ error: evaluationError.message }, { status: 500 });
    }

    // 모든 과제물을 한 번에 조회
    const { data: allSubmissions, error: subError } = await supabase
      .from("submissions")
      .select(
        `
        id,
        competency_unit_id,
        student_id,
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
      .in("competency_unit_id", unitIds)
      .in("student_id", studentIds)
      .order("submitted_at", { ascending: false });

    if (subError) {
      console.error("과제물 조회 오류:", subError);
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    // 메모리에서 데이터 그룹화
    const evaluationsMap = new Map<string, any>();
    (allEvaluations || []).forEach((evaluation) => {
      const key = `${evaluation.competency_unit_id}-${evaluation.student_id}`;
      evaluationsMap.set(key, evaluation);
    });

    const submissionsMap = new Map<string, any[]>();
    (allSubmissions || []).forEach((sub) => {
      const key = `${sub.competency_unit_id}-${sub.student_id}`;
      if (!submissionsMap.has(key)) {
        submissionsMap.set(key, []);
      }
      submissionsMap.get(key)!.push(sub);
    });

    // 결과 구성
    const result: any[] = [];

    for (const unit of competencyUnits || []) {
      const unitEvaluations: any[] = [];

      for (const cs of courseStudents || []) {
        const student = Array.isArray(cs.profiles)
          ? cs.profiles[0]
          : cs.profiles;
        if (!student) continue;

        const key = `${unit.id}-${student.id}`;
        const evaluation = evaluationsMap.get(key) || null;
        const submissions = submissionsMap.get(key) || [];

        unitEvaluations.push({
          student_id: student.id,
          student_name: student.full_name || student.email,
          student_email: student.email,
          evaluation: evaluation || null,
          submissions: submissions,
          has_submission: submissions.length > 0,
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
