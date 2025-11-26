import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role === "student") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();

    let query = supabase
      .from("evaluations")
      .select(
        `
        *,
        competency_units(
          *,
          training_courses(*)
        ),
        student:profiles!evaluations_student_id_fkey(*),
        teacher:profiles!evaluations_teacher_id_fkey(*)
      `
      );

    // 교사는 자신의 평가만 조회
    if (profile.role === "teacher") {
      query = query.eq("teacher_id", profile.id);
    }

    // 관리자는 모든 평가 조회 (최대 50개)
    if (profile.role === "admin") {
      query = query.limit(50);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("평가 목록 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("평가 목록 조회 실패:", error);
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
      student_id,
      teacher_id,
      comments,
      status,
      evaluated_at,
      submission_id,
      element_scores, // 수행준거별 점수 (criteria_id 포함)
    } = body;

    if (!competency_unit_id || !student_id || !teacher_id) {
      return NextResponse.json(
        {
          error: "competency_unit_id, student_id, and teacher_id are required",
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 기존 평가가 있는지 확인
    const { data: existingEval } = await supabase
      .from("evaluations")
      .select("id, teacher_id")
      .eq("competency_unit_id", competency_unit_id)
      .eq("student_id", student_id)
      .single();

    // 기존 평가가 있고, 현재 사용자가 소유자이거나 관리자인 경우 업데이트
    if (existingEval) {
      if (profile.role !== "admin" && existingEval.teacher_id !== profile.id) {
        return NextResponse.json(
          {
            error: "이 학생에 대한 평가가 이미 존재합니다.",
            existing_evaluation_id: existingEval.id,
          },
          { status: 409 }
        );
      }

      // 기존 평가 업데이트
      const evaluationData: any = {
        teacher_id,
        comments: comments || null,
        status: status || "draft",
        submission_id: submission_id || null,
      };

      if (evaluated_at) {
        evaluationData.evaluated_at = evaluated_at;
      }

      const { data: updatedEval, error: updateError } = await supabase
        .from("evaluations")
        .update(evaluationData)
        .eq("id", existingEval.id)
        .select()
        .single();

      if (updateError) {
        console.error("평가 업데이트 오류:", updateError);
        return NextResponse.json(
          { error: updateError.message },
          { status: 500 }
        );
      }

      // 기존 점수 삭제 후 새 점수 저장
      if (
        element_scores &&
        Array.isArray(element_scores) &&
        element_scores.length > 0
      ) {
        await supabase
          .from("evaluation_criteria_scores")
          .delete()
          .eq("evaluation_id", existingEval.id);

        const scoreRecords = element_scores.map((es: any) => ({
          evaluation_id: existingEval.id,
          criteria_id: es.criteria_id,
          score: es.score || 0,
          comments: es.comments || null,
        }));

        const { error: scoresError } = await supabase
          .from("evaluation_criteria_scores")
          .insert(scoreRecords);

        if (scoresError) {
          console.error("평가 점수 저장 오류:", scoresError);
        }
      }

      return NextResponse.json(updatedEval);
    }

    // 새 평가 생성
    const evaluationData: any = {
      competency_unit_id,
      student_id,
      teacher_id,
      comments: comments || null,
      status: status || "draft",
      submission_id: submission_id || null,
    };

    if (evaluated_at) {
      evaluationData.evaluated_at = evaluated_at;
    }

    const { data: newEval, error: insertError } = await supabase
      .from("evaluations")
      .insert(evaluationData)
      .select()
      .single();

    if (insertError) {
      console.error("평가 생성 오류:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // 수행준거별 점수 저장
    if (
      element_scores &&
      Array.isArray(element_scores) &&
      element_scores.length > 0
    ) {
      const scoreRecords = element_scores.map((es: any) => ({
        evaluation_id: newEval.id,
        criteria_id: es.criteria_id,
        score: es.score || 0,
        comments: es.comments || null,
      }));

      const { error: scoresError } = await supabase
        .from("evaluation_criteria_scores")
        .insert(scoreRecords);

      if (scoresError) {
        console.error("평가 점수 저장 오류:", scoresError);
        // 평가는 생성되었지만 점수 저장 실패 - 평가는 유지
      }
    }

    return NextResponse.json(newEval);
  } catch (error: any) {
    console.error("평가 생성 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      id,
      competency_unit_id,
      student_id,
      teacher_id,
      comments,
      status,
      evaluated_at,
      element_scores, // 수행준거별 점수 (criteria_id 포함)
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "evaluation id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const evaluationData: any = {};
    if (competency_unit_id)
      evaluationData.competency_unit_id = competency_unit_id;
    if (student_id) evaluationData.student_id = student_id;
    if (teacher_id) evaluationData.teacher_id = teacher_id;
    if (comments !== undefined) evaluationData.comments = comments;
    if (status) evaluationData.status = status;
    if (evaluated_at) evaluationData.evaluated_at = evaluated_at;
    if (submission_id !== undefined) evaluationData.submission_id = submission_id || null;

    // 평가 수정
    const { error: updateError } = await supabase
      .from("evaluations")
      .update(evaluationData)
      .eq("id", id);

    if (updateError) {
      console.error("평가 수정 오류:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 기존 점수 삭제 후 새 점수 저장
    if (
      element_scores &&
      Array.isArray(element_scores) &&
      element_scores.length > 0
    ) {
      // 기존 점수 삭제
      await supabase
        .from("evaluation_criteria_scores")
        .delete()
        .eq("evaluation_id", id);

      // 새 점수 저장
      const scoreRecords = element_scores.map((es: any) => ({
        evaluation_id: id,
        criteria_id: es.criteria_id,
        score: es.score || 0,
        comments: es.comments || null,
      }));

      const { error: scoresError } = await supabase
        .from("evaluation_criteria_scores")
        .insert(scoreRecords);

      if (scoresError) {
        console.error("평가 점수 저장 오류:", scoresError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("평가 수정 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
