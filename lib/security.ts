import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

export async function checkEvaluationAccess(evaluationId: string, userId: string) {
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
  return (
    evaluation.teacher_id === userId ||
    evaluation.student_id === userId
  );
}

export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, 10000); // 최대 길이 제한
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}
