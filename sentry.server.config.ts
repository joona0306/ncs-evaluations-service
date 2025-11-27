// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // 환경 설정
  environment: process.env.NODE_ENV || "development",

  // 프로덕션: 10%만 캡처 (성능 최적화), 개발: 100% 캡처
  tracesSampleRate: isProduction ? 0.1 : 1.0,

  // 개발 환경에서만 디버그 모드 활성화
  debug: !isProduction,

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
        // Body에서 민감한 정보 제거
        if (event.request.data) {
          const data = event.request.data as Record<string, unknown>;
          if (data.password) {
            delete data.password;
          }
          if (data.token) {
            delete data.token;
          }
          if (data.accessToken) {
            delete data.accessToken;
          }
        }
      }
    }
    return event;
  },
});

