import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase 서버 클라이언트 생성
 * 
 * Connection Pooler 사용:
 * - 환경 변수 NEXT_PUBLIC_SUPABASE_POOLER_URL이 설정되어 있으면 사용
 * - 없으면 기본 URL 사용
 * 
 * Connection Pooler URL 확인 방법:
 * 1. Supabase 대시보드 > Settings > Database > Connection Pooling
 * 2. Connection string에서 URL 추출
 * 3. 예: https://xxxxx.pooler.supabase.co
 * 
 * 성능 개선 효과:
 * - 동시 연결 수 증가 (무료 플랜: ~60개 → Pooler: 수백 개)
 * - 연결 재사용으로 오버헤드 감소
 * - 동시 사용자 증가 시 성능 저하 완화
 */
export async function createClient() {
  const cookieStore = await cookies();

  // Connection Pooler URL 우선 사용 (선택적)
  const poolerUrl = process.env.NEXT_PUBLIC_SUPABASE_POOLER_URL;
  const defaultUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Pooler URL이 있으면 사용, 없으면 기본 URL 사용
  const supabaseUrl = poolerUrl || defaultUrl;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Missing Supabase environment variables. Please check your .env.local file."
    );
  }

  return createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

