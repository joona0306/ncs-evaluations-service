// This file configures the initialization of Sentry on the client.
// The config you add here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";
const isDevelopment = process.env.NODE_ENV === "development";

// Sentry 초기화 설정
const sentryConfig: Parameters<typeof Sentry.init>[0] = {
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 설정
  environment: process.env.NODE_ENV || "development",

  // 프로덕션: 10%만 캡처 (성능 최적화), 개발: 100% 캡처
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // 에러는 항상 100% 캡처 (중요!)
  replaysOnErrorSampleRate: 1.0,

  // 세션 리플레이: 프로덕션 10%, 개발 100%
  replaysSessionSampleRate: isProduction ? 0.1 : 1.0,
};

// 개발 환경에서만 debug 모드 활성화
// 프로덕션 빌드에서는 debug 옵션을 사용할 수 없으므로 조건부로 추가
if (isDevelopment) {
  sentryConfig.debug = true;
}

Sentry.init({
  ...sentryConfig,

  // 프로덕션에서는 민감한 정보 마스킹
  beforeSend(event, hint) {
    if (isProduction) {
      // 민감한 정보 제거
      if (event.request) {
        // 쿠키 제거
        if (event.request.cookies) {
          delete event.request.cookies;
        }
        // Authorization 헤더 제거
        if (event.request.headers) {
          const headers = event.request.headers as Record<string, string>;
          if (headers.Authorization) {
            delete headers.Authorization;
          }
          if (headers.authorization) {
            delete headers.authorization;
          }
        }
      }
    }
    return event;
  },

  // Session Replay 통합
  integrations: [
    Sentry.replayIntegration({
      // 모든 텍스트 마스킹 (프라이버시 보호)
      maskAllText: true,
      // 모든 미디어 차단 (프라이버시 보호)
      blockAllMedia: true,
    }),
  ],
});

