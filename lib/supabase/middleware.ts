import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const pathname = request.nextUrl.pathname;
  
  // 루트 페이지는 모든 사용자에게 접근 허용 (리다이렉트 없음)
  if (pathname === "/") {
    return supabaseResponse;
  }

  // 이메일 확인 페이지는 모든 사용자에게 접근 허용
  if (pathname.startsWith("/verify-email")) {
    return supabaseResponse;
  }

  // 약관 및 개인정보처리방침 페이지는 모든 사용자에게 접근 허용
  if (pathname.startsWith("/terms") || pathname.startsWith("/privacy")) {
    return supabaseResponse;
  }

  // 동의 페이지는 로그인된 사용자만 접근 가능
  if (pathname.startsWith("/consent")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    return supabaseResponse;
  }

  // 인증 페이지: 로그인된 사용자는 대시보드로 (단, 이메일 확인 및 승인 필요)
  if (pathname.startsWith("/login") || pathname.startsWith("/signup")) {
    if (user) {
      // 이메일 확인 및 승인 상태 확인
      const { data: { user: authUser } } = await supabase.auth.getUser();
      
      if (authUser?.email_confirmed_at) {
        // 프로필 확인
        const { data: profile } = await supabase
          .from("profiles")
          .select("approved, agreed_terms_at, agreed_privacy_at")
          .eq("id", user.id)
          .maybeSingle();

        // 이메일 확인 완료 + 관리자 승인 완료 + 동의 완료인 경우에만 대시보드로
        if (profile?.approved && profile?.agreed_terms_at && profile?.agreed_privacy_at) {
          return NextResponse.redirect(new URL("/dashboard", request.url));
        } else if (!profile?.approved) {
          // 이메일 확인은 완료되었지만 승인이 안 된 경우
          return NextResponse.redirect(new URL("/waiting-approval", request.url));
        } else if (!profile?.agreed_terms_at || !profile?.agreed_privacy_at) {
          // 승인은 완료되었지만 동의가 안 된 경우
          return NextResponse.redirect(new URL("/consent?redirect=/dashboard", request.url));
        }
      } else {
        // 이메일 확인이 안 된 경우
        return NextResponse.redirect(new URL("/verify-email", request.url));
      }
    }
    return supabaseResponse;
  }

  // 대기 페이지는 이메일 확인 완료된 사용자만 접근 가능
  if (pathname.startsWith("/waiting-approval")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser?.email_confirmed_at) {
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    // 이미 승인된 경우 대시보드로
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.approved) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return supabaseResponse;
  }

  // 대시보드 및 보호된 페이지: 로그인 + 이메일 확인 + 관리자 승인 필수
  if (pathname.startsWith("/dashboard") || (pathname.startsWith("/api") && !pathname.startsWith("/api/auth"))) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // 이메일 확인 상태 확인
    const { data: { user: authUser } } = await supabase.auth.getUser();
    
    if (!authUser?.email_confirmed_at) {
      // 이메일 확인이 안 된 경우 이메일 확인 페이지로 리다이렉트
      return NextResponse.redirect(new URL("/verify-email", request.url));
    }

    // 프로필 확인 (이메일 확인 완료 + 관리자 승인 + 동의 필요)
    const { data: profile } = await supabase
      .from("profiles")
      .select("approved, agreed_terms_at, agreed_privacy_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile?.approved) {
      // 관리자 승인이 안 된 경우 대기 페이지로 리다이렉트
      return NextResponse.redirect(new URL("/waiting-approval", request.url));
    }

    // 동의 확인 (이용약관 및 개인정보처리방침)
    if (!profile?.agreed_terms_at || !profile?.agreed_privacy_at) {
      // 동의가 안 된 경우 동의 페이지로 리다이렉트
      const redirectUrl = new URL("/consent", request.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  return supabaseResponse;
}

