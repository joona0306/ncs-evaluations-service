import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competencyUnitId = searchParams.get("competency_unit_id");
    const studentId = searchParams.get("student_id");

    if (!competencyUnitId || !studentId) {
      return NextResponse.json(
        { error: "competency_unit_id and student_id are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 기존 평가 확인
    const { data: existingEval, error } = await supabase
      .from("evaluations")
      .select("id, teacher_id")
      .eq("competency_unit_id", competencyUnitId)
      .eq("student_id", studentId)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116은 "no rows returned" 오류
      console.error("평가 확인 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 기존 평가가 있고, 현재 사용자가 소유자이거나 관리자인 경우
    if (existingEval && (profile.role === "admin" || existingEval.teacher_id === profile.id)) {
      return NextResponse.json({
        exists: true,
        evaluation_id: existingEval.id,
      });
    }

    return NextResponse.json({
      exists: false,
    });
  } catch (error: any) {
    console.error("평가 확인 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

