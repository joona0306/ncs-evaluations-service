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
      .from("evaluation_schedules")
      .select(
        `
        *,
        competency_units(
          id,
          name,
          code,
          course_id,
          training_courses(
            id,
            name,
            code
          )
        ),
        created_by_profile:profiles!evaluation_schedules_created_by_fkey(
          id,
          full_name,
          email
        )
      `
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error("평가일정 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Evaluation schedule not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("평가일정 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { title, description, start_date, end_date, status } = body;

    const supabase = await createClient();

    // 기존 평가일정 조회
    const { data: existing } = await supabase
      .from("evaluation_schedules")
      .select("competency_unit_id, competency_units(id, course_id)")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Evaluation schedule not found" },
        { status: 404 }
      );
    }

    // 교사는 자신이 담당하는 과정의 평가일정만 수정 가능
    if (profile.role === "teacher") {
      const competencyUnit = Array.isArray(existing.competency_units)
        ? existing.competency_units[0]
        : existing.competency_units;
      const courseId = competencyUnit?.course_id;
      if (courseId) {
        const { data: courseTeacher } = await supabase
          .from("course_teachers")
          .select("course_id")
          .eq("course_id", courseId)
          .eq("teacher_id", profile.id)
          .single();

        if (!courseTeacher) {
          return NextResponse.json(
            { error: "You don't have permission to update this schedule" },
            { status: 403 }
          );
        }
      }
    }

    // 날짜 유효성 검증 제거 (날짜 제한 없음)
    // 필요시 클라이언트 측에서만 경고 표시

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (status !== undefined) updateData.status = status;

    const { data, error } = await supabase
      .from("evaluation_schedules")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("평가일정 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("평가일정 수정 실패:", error);
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

    // 기존 평가일정 조회
    const { data: existing } = await supabase
      .from("evaluation_schedules")
      .select("competency_unit_id, competency_units(id, course_id)")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Evaluation schedule not found" },
        { status: 404 }
      );
    }

    // 교사는 자신이 담당하는 과정의 평가일정만 삭제 가능
    if (profile.role === "teacher") {
      const competencyUnit = Array.isArray(existing.competency_units)
        ? existing.competency_units[0]
        : existing.competency_units;
      const courseId = competencyUnit?.course_id;
      if (courseId) {
        const { data: courseTeacher } = await supabase
          .from("course_teachers")
          .select("course_id")
          .eq("course_id", courseId)
          .eq("teacher_id", profile.id)
          .single();

        if (!courseTeacher) {
          return NextResponse.json(
            { error: "You don't have permission to delete this schedule" },
            { status: 403 }
          );
        }
      }
    }

    const { error } = await supabase
      .from("evaluation_schedules")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("평가일정 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("평가일정 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
