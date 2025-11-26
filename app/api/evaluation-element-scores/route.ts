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
    const evaluationId = searchParams.get("evaluation_id");

    if (!evaluationId) {
      return NextResponse.json(
        { error: "evaluation_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("evaluation_element_scores")
      .select(`
        *,
        competency_elements(*)
      `)
      .eq("evaluation_id", evaluationId)
      .order("competency_elements(display_order)");

    if (error) {
      console.error("평가 점수 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error("평가 점수 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

