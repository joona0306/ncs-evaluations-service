import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

// 난이도별 점수 옵션 (서버 측 검증용)
const DIFFICULTY_SCORE_OPTIONS: Record<string, number[]> = {
  high: [15, 13, 10, 8, 6],
  medium: [10, 8, 6, 4, 2],
  low: [5, 4, 3, 2, 1],
};

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile || (profile.role !== "admin" && profile.role !== "teacher")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      competency_element_id,
      name,
      code,
      difficulty,
      max_score,
      description,
      display_order,
    } = body;

    if (!competency_element_id || !name || !code || !difficulty || !max_score) {
      return NextResponse.json(
        { error: "competency_element_id, name, code, difficulty, and max_score are required" },
        { status: 400 }
      );
    }

    // 난이도와 max_score 일치 여부 검증
    const validScores = DIFFICULTY_SCORE_OPTIONS[difficulty];
    if (!validScores || !validScores.includes(max_score)) {
      return NextResponse.json(
        { 
          error: `난이도 "${difficulty}"에 대한 유효한 만점은 ${validScores?.join(", ") || "없음"}점입니다.` 
        },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("performance_criteria")
      .insert({
        competency_element_id,
        name,
        code,
        difficulty,
        max_score,
        description,
        display_order: display_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error("수행준거 생성 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("수행준거 생성 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competencyElementId = searchParams.get("competency_element_id");

    if (!competencyElementId) {
      return NextResponse.json(
        { error: "competency_element_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("performance_criteria")
      .select("*")
      .eq("competency_element_id", competencyElementId)
      .order("display_order", { ascending: true });

    if (error) {
      console.error("수행준거 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("수행준거 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

