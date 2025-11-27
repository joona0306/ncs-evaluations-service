/**
 * 공통 API 호출 훅
 * 로딩 상태, 에러 처리, 재시도 로직을 포함한 공통 API 호출 로직
 */

import { useState, useCallback } from "react";

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  retryCount?: number;
  retryDelay?: number;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useApi<T = any>(
  apiFunction: (...args: any[]) => Promise<Response>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const { onSuccess, onError, retryCount = 0, retryDelay = 1000 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(
    async (...args: any[]): Promise<T | null> => {
      setLoading(true);
      setError(null);

      let lastError: Error | null = null;
      let attempts = 0;

      while (attempts <= retryCount) {
        try {
          const response = await apiFunction(...args);

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
          }

          const result = await response.json();
          setData(result);
          onSuccess?.(result);
          return result;
        } catch (err: any) {
          lastError = err;
          attempts++;

          if (attempts <= retryCount) {
            await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
            continue;
          }

          const errorMessage = err.message || "알 수 없는 오류가 발생했습니다.";
          setError(errorMessage);
          onError?.(err);
          return null;
        } finally {
          if (attempts > retryCount) {
            setLoading(false);
          }
        }
      }

      setLoading(false);
      return null;
    },
    [apiFunction, onSuccess, onError, retryCount, retryDelay]
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

