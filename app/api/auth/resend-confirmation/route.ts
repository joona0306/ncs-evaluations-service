/**
 * 이메일 확인 링크 재발송 API
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 이메일 확인 링크 재발송
    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/verify-email`,
      },
    });

    if (error) {
      console.error("이메일 재발송 오류:", error);
      return NextResponse.json(
        { error: error.message || "이메일 재발송에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "이메일 확인 링크를 재발송했습니다.",
    });
  } catch (error: any) {
    console.error("이메일 재발송 중 오류:", error);
    return NextResponse.json(
      { error: error.message || "이메일 재발송 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

