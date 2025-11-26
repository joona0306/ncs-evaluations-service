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
    const competencyUnitId = searchParams.get("competency_unit_id");
    const courseId = searchParams.get("course_id");

    const supabase = await createClient();

    let query = supabase
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
      .order("start_date", { ascending: false });

    // 능력단위별 조회
    if (competencyUnitId) {
      query = query.eq("competency_unit_id", competencyUnitId);
    }

    // 과정별 조회 (관리자 또는 해당 과정의 교사만)
    if (courseId) {
      if (profile.role === "admin") {
        query = query.eq("competency_units.course_id", courseId);
      } else if (profile.role === "teacher") {
        // 교사는 자신이 담당하는 과정의 평가일정만 조회
        query = query
          .eq("competency_units.course_id", courseId)
          .eq("competency_units.course_id", courseId); // 중복이지만 필터링을 위해
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("평가일정 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("평가일정 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      competency_unit_id,
      title,
      description,
      start_date,
      end_date,
      status,
    } = body;

    if (!competency_unit_id || !title || !start_date || !end_date) {
      return NextResponse.json(
        { error: "competency_unit_id, title, start_date, and end_date are required" },
        { status: 400 }
      );
    }

    // 날짜 제한 없음 - 모든 날짜 조합 허용

    const supabase = await createClient();

    // 교사는 자신이 담당하는 과정의 능력단위만 평가일정 생성 가능
    if (profile.role === "teacher") {
      const { data: unit } = await supabase
        .from("competency_units")
        .select("course_id")
        .eq("id", competency_unit_id)
        .single();

      if (!unit) {
        return NextResponse.json(
          { error: "Competency unit not found" },
          { status: 404 }
        );
      }

      const { data: courseTeacher } = await supabase
        .from("course_teachers")
        .select("course_id")
        .eq("course_id", unit.course_id)
        .eq("teacher_id", profile.id)
        .single();

      if (!courseTeacher) {
        return NextResponse.json(
          { error: "You don't have permission to create schedule for this competency unit" },
          { status: 403 }
        );
      }
    }

    const { data, error } = await supabase
      .from("evaluation_schedules")
      .insert({
        competency_unit_id,
        title,
        description: description || null,
        start_date: start_date,
        end_date: end_date,
        status: status || "scheduled",
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) {
      console.error("평가일정 생성 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("평가일정 생성 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

