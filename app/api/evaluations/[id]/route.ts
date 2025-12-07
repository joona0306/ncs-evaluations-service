import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("evaluations")
      .select(
        `
        id,
        competency_unit_id,
        student_id,
        teacher_id,
        status,
        evaluated_at,
        submission_id,
        comments,
        total_score,
        raw_total_score,
        created_at,
        updated_at,
        competency_units(
          id,
          name,
          code,
          description,
          course_id,
          training_courses(
            id,
            name,
            code
          )
        ),
        student:profiles!evaluations_student_id_fkey(
          id,
          full_name,
          email
        ),
        teacher:profiles!evaluations_teacher_id_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("평가 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("평가 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // 평가 소유자 확인
    const { data: evaluation } = await supabase
      .from("evaluations")
      .select("teacher_id")
      .eq("id", id)
      .single();

    if (!evaluation) {
      return NextResponse.json(
        { error: "Evaluation not found" },
        { status: 404 }
      );
    }

    if (profile.role === "teacher" && evaluation.teacher_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabase.from("evaluations").delete().eq("id", id);

    if (error) {
      console.error("평가 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("평가 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
