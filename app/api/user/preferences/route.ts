import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

// 사용자 설정 조회
export async function GET() {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("user_preferences")
      .select("theme")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (error && error.code !== "PGRST116") { // PGRST116은 "no rows returned" 에러
      console.error("사용자 설정 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 설정이 없으면 기본값 반환
    return NextResponse.json({
      theme: data?.theme || "system",
    });
  } catch (error: any) {
    console.error("사용자 설정 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// 사용자 설정 저장/업데이트
export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { theme } = body;

    if (!theme || !["light", "dark", "system"].includes(theme)) {
      return NextResponse.json(
        { error: "Invalid theme value. Must be 'light', 'dark', or 'system'" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // UPSERT: 설정이 있으면 업데이트, 없으면 생성
    const { data, error } = await supabase
      .from("user_preferences")
      .upsert(
        {
          user_id: profile.id,
          theme: theme,
        },
        {
          onConflict: "user_id",
        }
      )
      .select()
      .single();

    if (error) {
      console.error("사용자 설정 저장 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("사용자 설정 저장 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

