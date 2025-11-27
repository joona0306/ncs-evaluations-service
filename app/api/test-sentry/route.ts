import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

/**
 * Sentry 통합 테스트용 API 엔드포인트
 * 
 * 사용법:
 * 1. 브라우저에서 http://localhost:3000/api/test-sentry 접속
 * 2. 서버 콘솔과 Sentry 대시보드에서 에러 확인
 * 3. 테스트 완료 후 이 파일 삭제 가능
 */
export async function GET() {
  // DSN 확인
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  const hasDsn = !!dsn;

  try {
    // DSN이 없으면 경고
    if (!hasDsn) {
      return NextResponse.json(
        {
          success: false,
          message: "❌ NEXT_PUBLIC_SENTRY_DSN이 설정되지 않았습니다!",
          instructions: [
            "1. .env.local 파일에 NEXT_PUBLIC_SENTRY_DSN 추가",
            "2. 개발 서버 재시작 (pnpm run dev)",
            "3. 다시 이 엔드포인트 접속",
          ],
        },
        { status: 500 }
      );
    }

    // 의도적으로 에러 발생
    const testError = new Error("Sentry 테스트 에러입니다! 이 에러는 Sentry 통합 테스트를 위해 의도적으로 발생시킨 것입니다.");
    
    // Sentry에 에러 보고 (error 레벨로 설정)
    Sentry.captureException(testError, {
      tags: {
        test: "sentry-integration",
        environment: process.env.NODE_ENV || "development",
        endpoint: "/api/test-sentry",
      },
      extra: {
        message: "이것은 Sentry 통합 테스트입니다.",
        timestamp: new Date().toISOString(),
        testEndpoint: "/api/test-sentry",
        dsnConfigured: hasDsn,
      },
      level: "error", // error 레벨로 변경 (Issues에 표시됨)
    });

    // 콘솔에도 로그 출력 (디버깅용)
    console.log("✅ Sentry에 에러 전송 시도:");
    console.log("   - DSN 설정됨:", hasDsn);
    console.log("   - DSN 값:", dsn?.substring(0, 20) + "...");
    console.log("   - 에러 메시지:", testError.message);

    return NextResponse.json(
      {
        success: true,
        message: "✅ 테스트 에러가 Sentry에 전송되었습니다!",
        instructions: [
          "1. 서버 콘솔에서 'Sentry에 에러 전송 시도' 메시지 확인",
          "2. Sentry 대시보드 (https://sentry.io) 접속",
          "3. 프로젝트 선택 → Issues 탭 확인",
          "4. 'Sentry 테스트 에러입니다!' 메시지 찾기",
        ],
        error: testError.message,
        dsnConfigured: hasDsn,
        sentryUrl: "https://sentry.io",
        note: "테스트 완료 후 이 엔드포인트는 삭제해도 됩니다.",
      },
      { status: 200 }
    );
  } catch (error) {
    // 예상치 못한 에러
    console.error("❌ 테스트 엔드포인트에서 예상치 못한 에러:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: "테스트 중 예상치 못한 에러가 발생했습니다.",
        error: error instanceof Error ? error.message : "Unknown error",
        dsnConfigured: hasDsn,
      },
      { status: 500 }
    );
  }
}

