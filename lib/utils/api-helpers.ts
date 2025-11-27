/**
 * 공통 API 헬퍼 함수
 * API 호출, 에러 처리, 응답 파싱 등의 공통 로직
 */

/**
 * API 응답을 안전하게 파싱
 */
export async function parseApiResponse<T = any>(
  response: Response
): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `API 요청 실패: ${response.status}`);
  }
  return await response.json();
}

/**
 * API 에러를 사용자 친화적인 메시지로 변환
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "알 수 없는 오류가 발생했습니다.";
}

/**
 * 페이징 응답에서 데이터 추출
 */
export function extractPaginatedData<T = any>(response: any): T[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response?.data && Array.isArray(response.data)) {
    return response.data;
  }
  return [];
}

/**
 * API 호출 래퍼 (재시도 로직 포함)
 */
export async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  retryCount = 0,
  retryDelay = 1000
): Promise<Response> {
  let lastError: Error | null = null;
  let attempts = 0;

  while (attempts <= retryCount) {
    try {
      const response = await fetch(url, options);
      
      // 5xx 에러만 재시도
      if (response.status >= 500 && attempts < retryCount) {
        attempts++;
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      attempts++;

      if (attempts <= retryCount) {
        await new Promise((resolve) => setTimeout(resolve, retryDelay * attempts));
        continue;
      }

      throw lastError;
    }
  }

  throw lastError || new Error("API 호출 실패");
}

