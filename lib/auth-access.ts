import { createClient } from "@/lib/supabase/server";

/**
 * 서버 사이드 전용: 사용자의 과정 접근 권한을 확인합니다.
 */
export async function checkCourseAccess(courseId: string, userId: string) {
  const supabase = await createClient();

  // 관리자는 모든 과정 접근 가능
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    return true;
  }

  // 교사는 자신이 담당한 과정만 접근 가능
  if (profile?.role === "teacher") {
    const { data } = await supabase
      .from("course_teachers")
      .select("*")
      .eq("course_id", courseId)
      .eq("teacher_id", userId)
      .single();

    return !!data;
  }

  // 학생은 자신이 등록한 과정만 접근 가능
  if (profile?.role === "student") {
    const { data } = await supabase
      .from("course_students")
      .select("*")
      .eq("course_id", courseId)
      .eq("student_id", userId)
      .single();

    return !!data;
  }

  return false;
}

/**
 * 서버 사이드 전용: 사용자의 평가 접근 권한을 확인합니다.
 */
export async function checkEvaluationAccess(
  evaluationId: string,
  userId: string
) {
  const supabase = await createClient();

  const { data: evaluation } = await supabase
    .from("evaluations")
    .select("*")
    .eq("id", evaluationId)
    .single();

  if (!evaluation) {
    return false;
  }

  // 관리자는 모든 평가 접근 가능
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (profile?.role === "admin") {
    return true;
  }

  // 평가자와 피평가자는 접근 가능
  return evaluation.teacher_id === userId || evaluation.student_id === userId;
}

