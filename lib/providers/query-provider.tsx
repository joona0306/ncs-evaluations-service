"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 5분간 fresh 상태 유지 (staleTime) - 이 시간 동안은 재요청하지 않음
            staleTime: 5 * 60 * 1000,
            // 30분간 캐시 유지 (gcTime) - 메모리에서 캐시 유지 시간 증가
            gcTime: 30 * 60 * 1000,
            // 재시도 설정
            retry: 1,
            // 에러 시 재시도 지연 시간
            retryDelay: 1000,
            // 기본 refetch 설정
            refetchOnWindowFocus: false, // 윈도우 포커스 시 자동 refetch 비활성화
            refetchOnMount: false, // 마운트 시 자동 refetch 비활성화 (캐시 우선 사용)
            refetchOnReconnect: false, // 네트워크 재연결 시에도 자동 refetch 비활성화
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

