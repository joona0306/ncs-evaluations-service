/**
 * 공통 리스트 데이터 로딩 훅
 * 중복된 데이터 로딩 패턴을 통합
 */

import { useState, useCallback, useEffect } from "react";
import { parseApiResponse, getErrorMessage } from "@/lib/utils/api-helpers";

interface UseListDataOptions<T> {
  apiUrl: string;
  enabled?: boolean;
  onSuccess?: (data: T[]) => void;
  onError?: (error: Error) => void;
  transform?: (data: any) => T[];
}

interface UseListDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useListData<T = any>(
  options: UseListDataOptions<T>
): UseListDataResult<T> {
  const {
    apiUrl,
    enabled = true,
    onSuccess,
    onError,
    transform = (data) => (Array.isArray(data) ? data : []),
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(apiUrl, {
        next: { revalidate: 60 },
      });

      const result = await parseApiResponse<T[]>(response);
      const transformedData = transform(result);
      setData(transformedData);
      onSuccess?.(transformedData);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      const error = err instanceof Error ? err : new Error(errorMessage);
      onError?.(error);
    } finally {
      setLoading(false);
    }
  }, [apiUrl, enabled, transform, onSuccess, onError]);

  useEffect(() => {
    if (enabled) {
      fetchData();
    }
  }, [fetchData, enabled]);

  const reset = useCallback(() => {
    setData([]);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    reset,
  };
}

