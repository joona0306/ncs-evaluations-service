import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ 
      error: "User not authenticated",
      details: userError 
    });
  }

  // 1. 프로필 조회 테스트
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 2. 훈련과정 조회 테스트
  const { data: courses, error: coursesError } = await supabase
    .from("training_courses")
    .select("*")
    .limit(5);

  // 3. 함수 테스트
  let adminCheck: any = null;
  let canManageCheck: any = null;
  try {
    const { data: adminData, error: adminError } = await supabase
      .rpc("check_is_admin");
    adminCheck = { data: adminData, error: adminError };

    const { data: manageData, error: manageError } = await supabase
      .rpc("check_can_manage");
    canManageCheck = { data: manageData, error: manageError };
  } catch (error) {
    adminCheck = { error: String(error) };
    canManageCheck = { error: String(error) };
  }

  // 4. course_teachers 조회 테스트 (JOIN 포함)
  const { data: teachers, error: teachersError } = await supabase
    .from("course_teachers")
    .select(`
      *,
      profiles!course_teachers_teacher_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .limit(5);

  // 5. course_students 조회 테스트 (JOIN 포함)
  const { data: students, error: studentsError } = await supabase
    .from("course_students")
    .select(`
      *,
      profiles!course_students_student_id_fkey (
        id,
        email,
        full_name
      )
    `)
    .limit(5);

  // 6. competency_units 조회 테스트
  const { data: units, error: unitsError } = await supabase
    .from("competency_units")
    .select("*")
    .limit(5);

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
    },
    profile: {
      data: profile,
      error: profileError,
    },
    courses: {
      data: courses,
      count: courses?.length || 0,
      error: coursesError,
    },
    functions: {
      check_is_admin: adminCheck,
      check_can_manage: canManageCheck,
    },
    course_teachers: {
      data: teachers,
      count: teachers?.length || 0,
      error: teachersError,
    },
    course_students: {
      data: students,
      count: students?.length || 0,
      error: studentsError,
    },
    competency_units: {
      data: units,
      count: units?.length || 0,
      error: unitsError,
    },
  });
}

