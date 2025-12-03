import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { getPaginationParams, createPaginatedResponse } from "@/lib/api/pagination";
import { CreateSubmissionSchema } from "@/lib/validation/schemas";
import { validateRequest } from "@/lib/validation/api-validator";

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
    const { limit, offset } = getPaginationParams(searchParams);

    const supabase = await createClient();

    // 전체 개수 조회용 쿼리
    let countQuery = supabase
      .from("submissions")
      .select("*", { count: "exact", head: true });

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
      countQuery = countQuery.eq("evaluation_schedule_id", evaluationScheduleId);
    }

    // 학생별 조회
    if (studentId) {
      // 학생은 자신의 과제물만 조회 가능
      if (profile.role === "student" && profile.id !== studentId) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      query = query.eq("student_id", studentId);
      countQuery = countQuery.eq("student_id", studentId);
    }

    // 능력단위별 조회
    if (competencyUnitId) {
      query = query.eq("competency_unit_id", competencyUnitId);
      countQuery = countQuery.eq("competency_unit_id", competencyUnitId);
    }

    // 학생은 자신의 과제물만 조회
    if (profile.role === "student" && !studentId) {
      query = query.eq("student_id", profile.id);
      countQuery = countQuery.eq("student_id", profile.id);
    }

    // 페이징 적용
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    const { count } = await countQuery;

    if (error) {
      console.error("과제물 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 디버깅: 교사/관리자가 조회하는 경우 로그 추가
    if (profile.role === "teacher" || profile.role === "admin") {
      console.log("과제물 조회 (교사/관리자):", {
        profileRole: profile.role,
        studentId,
        competencyUnitId,
        evaluationScheduleId,
        resultCount: data?.length || 0,
        data: data || []
      });
    }

    // 페이징 정보와 함께 응답
    return NextResponse.json(
      createPaginatedResponse(data || [], limit, offset, count || undefined)
    );
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
    const validation = validateRequest(CreateSubmissionSchema, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const {
      evaluation_schedule_id,
      competency_unit_id,
      submission_type,
      file_url,
      url,
      file_name,
      file_size,
      comments,
    } = validation.data;

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

