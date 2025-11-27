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
    console.error("사용자 정보 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error", user: null },
      { status: 500 }
    );
  }
}
