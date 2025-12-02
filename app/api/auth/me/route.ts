import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized", user: null },
        { status: 401 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    // 민감한 정보를 제외하고 오류만 로깅
    const errorInfo = error instanceof Error 
      ? { message: error.message, name: error.name }
      : { error: String(error) };
    console.error("사용자 정보 조회 실패:", errorInfo);
    return NextResponse.json(
      { error: error.message || "Internal server error", user: null },
      { status: 500 }
    );
  }
}
