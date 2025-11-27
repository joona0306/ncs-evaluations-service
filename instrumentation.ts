export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }

  // 클라이언트 측 Sentry 초기화는 instrumentation-client.ts에서 자동으로 처리됨
  // Next.js가 자동으로 로드하므로 여기서 import할 필요 없음
}

