import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  const isProduction = process.env.NODE_ENV === "production";

  // 프로덕션에서는 디버그 로깅 비활성화
  // @supabase/ssr는 내부적으로 @supabase/supabase-js를 사용하며,
  // 프로덕션 환경에서는 기본적으로 최소한의 로깅만 수행됨
  // 추가적인 로깅 제어는 Supabase 클라이언트의 기본 동작에 의존
  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    // 프로덕션 환경에서는 Supabase가 자동으로 디버그 로깅을 최소화함
    // 추가 옵션이 필요하면 여기에 추가 가능
  });
}
