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
    const evaluationScheduleId = searchParams.get("evaluation_schedule_id");
    const studentId = searchParams.get("student_id");
    const competencyUnitId = searchParams.get("competency_unit_id");

    const supabase = await createClient();

    let query = supabase
      .from("submissions")
      .select(
        `
        *,
        evaluation_schedules(
          id,
          title,
          start_date,
          end_date,
          status,
          competency_units(
            id,
            name,
            code
          )
        ),
        student:profiles!submissions_student_id_fkey(
          id,
          full_name,
          email
        ),
        competency_units(
          id,
          name,
          code
        )
      `
      )
      .order("submitted_at", { ascending: false });

    // 평가일정별 조회
    if (evaluationScheduleId) {
      query = query.eq("evaluation_schedule_id", evaluationScheduleId);
    }

    // 학생별 조회
    if (studentId) {
      // 학생은 자신의 과제물만 조회 가능
      if (profile.role === "student" && profile.id !== studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      query = query.eq("student_id", studentId);
    }

    // 능력단위별 조회
    if (competencyUnitId) {
      query = query.eq("competency_unit_id", competencyUnitId);
    }

    // 학생은 자신의 과제물만 조회
    if (profile.role === "student" && !studentId) {
      query = query.eq("student_id", profile.id);
    }

    const { data, error } = await query;

    if (error) {
      console.error("과제물 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("과제물 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      evaluation_schedule_id,
      competency_unit_id,
      submission_type,
      file_url,
      url,
      file_name,
      file_size,
      comments,
    } = body;

    if (!evaluation_schedule_id || !competency_unit_id || !submission_type) {
      return NextResponse.json(
        { error: "evaluation_schedule_id, competency_unit_id, and submission_type are required" },
        { status: 400 }
      );
    }

    // submission_type에 따른 검증
    if (submission_type === "image" && !file_url) {
      return NextResponse.json(
        { error: "file_url is required for image submission" },
        { status: 400 }
      );
    }

    if (submission_type === "url" && !url) {
      return NextResponse.json(
        { error: "url is required for url submission" },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
    if (file_size && file_size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be 5MB or less" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 평가일정 확인
    const { data: schedule } = await supabase
      .from("evaluation_schedules")
      .select("id, competency_unit_id")
      .eq("id", evaluation_schedule_id)
      .single();

    if (!schedule) {
      return NextResponse.json(
        { error: "Evaluation schedule not found" },
        { status: 404 }
      );
    }

    // 능력단위 일치 확인
    if (schedule.competency_unit_id !== competency_unit_id) {
      return NextResponse.json(
        { error: "Competency unit mismatch" },
        { status: 400 }
      );
    }

    // 평가 기간 제한 없음 - 모든 상태에서 제출 가능

    // 기존 제출 확인
    const { data: existing } = await supabase
      .from("submissions")
      .select("id")
      .eq("evaluation_schedule_id", evaluation_schedule_id)
      .eq("student_id", profile.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: "Submission already exists for this schedule", submission_id: existing.id },
        { status: 409 }
      );
    }

    const { data, error } = await supabase
      .from("submissions")
      .insert({
        evaluation_schedule_id,
        student_id: profile.id,
        competency_unit_id,
        submission_type,
        file_url: submission_type === "image" ? file_url : null,
        url: submission_type === "url" ? url : null,
        file_name: file_name || null,
        file_size: file_size || null,
        comments: comments || null,
      })
      .select()
      .single();

    if (error) {
      console.error("과제물 제출 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error("과제물 제출 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

