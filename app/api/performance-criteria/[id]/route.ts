import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

// 난이도별 점수 옵션 (서버 측 검증용)
const DIFFICULTY_SCORE_OPTIONS: Record<string, number[]> = {
  high: [15, 13, 10, 8, 6],
  medium: [10, 8, 6, 4, 2],
  low: [5, 4, 3, 2, 1],
};

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
    const { name, code, difficulty, max_score, description, display_order } =
      body;

    const supabase = await createClient();

    // 기존 데이터 조회
    const { data: existing } = await supabase
      .from("performance_criteria")
      .select("difficulty, max_score")
      .eq("id", id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "수행준거를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 최종 난이도와 만점 결정
    const finalDifficulty =
      difficulty !== undefined ? difficulty : existing.difficulty;
    let finalMaxScore =
      max_score !== undefined ? max_score : existing.max_score;

    // 난이도와 만점 일치 여부 검증 및 자동 조정
    const validScores = DIFFICULTY_SCORE_OPTIONS[finalDifficulty];
    if (!validScores || validScores.length === 0) {
      return NextResponse.json(
        { error: `유효하지 않은 난이도입니다: ${finalDifficulty}` },
        { status: 400 }
      );
    }

    // 만점이 유효하지 않으면 자동으로 해당 난이도의 최대값으로 조정
    if (!validScores.includes(finalMaxScore)) {
      finalMaxScore = validScores[0]; // 해당 난이도의 첫 번째 옵션(최대값)
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (difficulty !== undefined) updateData.difficulty = finalDifficulty;
    // 만점은 항상 최종 검증된 값으로 설정 (자동 조정된 경우 포함)
    if (max_score !== undefined || difficulty !== undefined) {
      updateData.max_score = finalMaxScore;
    }
    if (description !== undefined) updateData.description = description;
    if (display_order !== undefined) updateData.display_order = display_order;

    const { data, error } = await supabase
      .from("performance_criteria")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("수행준거 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("수행준거 수정 실패:", error);
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

    const { error } = await supabase
      .from("performance_criteria")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("수행준거 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("수행준거 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
