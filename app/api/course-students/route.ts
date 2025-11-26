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
    const studentId = searchParams.get("student_id");

    if (!courseId && !studentId) {
      return NextResponse.json(
        { error: "course_id or student_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    let query = supabase
      .from("course_students")
      .select(`
        course_id,
        student_id,
        status,
        enrollment_date,
        training_courses!course_students_course_id_fkey (
          id,
          name,
          code
        ),
        profiles!course_students_student_id_fkey (
          id,
          email,
          full_name,
          role,
          phone
        )
      `);

    if (courseId) {
      query = query.eq("course_id", courseId);
    }

    if (studentId) {
      query = query.eq("student_id", studentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("훈련생 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("훈련생 조회 실패:", error);
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
    const { course_id, student_id } = body;

    if (!course_id || !student_id) {
      return NextResponse.json(
        { error: "course_id and student_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("course_students")
      .insert({
        course_id,
        student_id,
        enrollment_date: new Date().toISOString().split("T")[0],
        status: "active",
      });

    if (error) {
      console.error("훈련생 추가 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("훈련생 추가 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { course_id, student_id, status } = body;

    if (!course_id || !student_id || !status) {
      return NextResponse.json(
        { error: "course_id, student_id, and status are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("course_students")
      .update({ status })
      .eq("course_id", course_id)
      .eq("student_id", student_id);

    if (error) {
      console.error("훈련생 상태 변경 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("훈련생 상태 변경 실패:", error);
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
    const studentId = searchParams.get("student_id");

    if (!courseId || !studentId) {
      return NextResponse.json(
        { error: "course_id and student_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { error } = await supabase
      .from("course_students")
      .delete()
      .eq("course_id", courseId)
      .eq("student_id", studentId);

    if (error) {
      console.error("훈련생 삭제 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("훈련생 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
