import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 현재 사용자 확인
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    const { 
      email, 
      full_name, 
      phone, 
      role,
      agreed_terms,
      agreed_privacy,
      agreed_marketing 
    } = await request.json();

    // 프로필 확인 (에러가 발생해도 계속 진행)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (existingProfile) {
      return NextResponse.json({
        success: true,
        profile: existingProfile,
        message: "프로필이 이미 존재합니다.",
      });
    }

    // 프로필 생성 (RLS 정책을 통과하기 위해 role 확인)
    const profileRole = role || "student";
    
    // admin 역할은 생성 불가
    if (profileRole === "admin") {
      return NextResponse.json(
        { error: "관리자 프로필은 수동으로 생성해야 합니다." },
        { status: 403 }
      );
    }

    // 동의 정보 준비
    const now = new Date().toISOString();
    const agreedTermsAt = agreed_terms ? now : null;
    const agreedPrivacyAt = agreed_privacy ? now : null;
    // 마케팅 동의는 현재 서비스가 없으므로 항상 false
    const agreedMarketing = false;
    const agreedMarketingAt = null;

    const { data: profile, error: insertError } = await supabase
      .from("profiles")
      .insert({
        id: user.id,
        email: email || user.email || "",
        full_name: full_name || "",
        phone: phone || null,
        role: profileRole,
        agreed_terms_at: agreedTermsAt,
        agreed_privacy_at: agreedPrivacyAt,
        agreed_marketing: agreedMarketing,
        agreed_marketing_at: agreedMarketingAt,
      })
      .select()
      .single();

    if (insertError) {
      console.error("프로필 생성 오류:", insertError);
      return NextResponse.json(
        { error: insertError.message || "프로필 생성에 실패했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile,
    });
  } catch (error: any) {
    console.error("프로필 생성 중 오류:", error);
    return NextResponse.json(
      { error: error.message || "프로필 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

