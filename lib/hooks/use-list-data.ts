/**
 * 공통 리스트 데이터 로딩 훅
 * 중복된 데이터 로딩 패턴을 통합
 */

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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

  // apiUrl을 메모이제이션하여 불필요한 재생성 방지
  const memoizedApiUrl = useMemo(() => apiUrl, [apiUrl]);

  // transform, onSuccess, onError를 useRef로 안정화하여 dependency 문제 해결
  const transformRef = useRef(transform);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);

  // 최신 함수들을 ref에 저장
  useEffect(() => {
    transformRef.current = transform;
    onSuccessRef.current = onSuccess;
    onErrorRef.current = onError;
  }, [transform, onSuccess, onError]);

  // fetchData 함수를 useCallback으로 정의 (refetch용)
  const fetchData = useCallback(async () => {
    if (!enabled || !memoizedApiUrl) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(memoizedApiUrl, {
        next: { revalidate: 60 },
      });

      const result = await parseApiResponse<T[]>(response);
      const transformedData = transformRef.current(result);
      setData(transformedData);
      onSuccessRef.current?.(transformedData);
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      const error = err instanceof Error ? err : new Error(errorMessage);
      onErrorRef.current?.(error);
    } finally {
      setLoading(false);
    }
  }, [memoizedApiUrl, enabled]);

  // 자동 데이터 로딩 (apiUrl이나 enabled가 변경될 때만 실행)
  useEffect(() => {
    if (!enabled || !memoizedApiUrl) return;

    let cancelled = false;

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(memoizedApiUrl, {
          next: { revalidate: 60 },
        });

        if (cancelled) return;

        const result = await parseApiResponse<T[]>(response);
        const transformedData = transformRef.current(result);

        if (cancelled) return;

        setData(transformedData);
        onSuccessRef.current?.(transformedData);
      } catch (err) {
        if (cancelled) return;

        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        const error = err instanceof Error ? err : new Error(errorMessage);
        onErrorRef.current?.(error);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadData();

    // cleanup 함수로 취소 플래그 설정
    return () => {
      cancelled = true;
    };
  }, [memoizedApiUrl, enabled]); // apiUrl과 enabled만 dependency로 사용하여 무한 루프 방지

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
