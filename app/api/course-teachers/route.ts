import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");
    const teacherId = searchParams.get("teacher_id");

    if (!courseId && !teacherId) {
      return NextResponse.json(
        { error: "course_id or teacher_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from("course_teachers")
      .select(
        `
        course_id,
        teacher_id,
        training_courses!course_teachers_course_id_fkey (
          id,
          name,
          code
        ),
        profiles!course_teachers_teacher_id_fkey (
          id,
          email,
          full_name,
          role,
          phone
        )
      `
      );

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    if (teacherId) {
      query = query.eq("teacher_id", teacherId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("훈련교사 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // course_id로 조회한 경우: 교사 목록 반환
    // teacher_id로 조회한 경우: 훈련과정 목록 반환
    if (courseId) {
      const teachersList =
        data
          ?.map((ct: any) => {
            // Supabase join 결과는 배열 또는 객체일 수 있음
            const profile = Array.isArray(ct.profiles)
              ? ct.profiles[0]
              : ct.profiles;
            return profile;
          })
          .filter(Boolean) || [];
      return NextResponse.json(teachersList);
    } else {
      const coursesList =
        data
          ?.map((ct: any) => {
            // Supabase join 결과는 배열 또는 객체일 수 있음
            const course = Array.isArray(ct.training_courses)
              ? ct.training_courses[0]
              : ct.training_courses;
            return course;
          })
          .filter(Boolean) || [];
      return NextResponse.json(coursesList);
    }
  } catch (error: any) {
    console.error("훈련교사 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { course_id, teacher_id } = body;

    if (!course_id || !teacher_id) {
      return NextResponse.json(
        { error: "course_id and teacher_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("course_teachers")
      .insert({ course_id, teacher_id });

    if (error) {
      console.error("훈련교사 추가 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("훈련교사 추가 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");
    const teacherId = searchParams.get("teacher_id");

    if (!courseId || !teacherId) {
      return NextResponse.json(
        { error: "course_id and teacher_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("course_teachers")
      .delete()
      .eq("course_id", courseId)
      .eq("teacher_id", teacherId);

    if (error) {
      console.error("훈련교사 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("훈련교사 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
