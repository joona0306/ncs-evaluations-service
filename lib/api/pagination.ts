/**
 * API 페이징 유틸리티 함수
 */

export interface PaginationParams {
  limit?: number;
  offset?: number;
  page?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    limit: number;
    offset: number;
    total?: number;
    hasMore: boolean;
  };
}

/**
 * URL searchParams에서 페이징 파라미터 추출
 */
export function getPaginationParams(searchParams: URLSearchParams): {
  limit: number;
  offset: number;
} {
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") || "20"), 1),
    100
  ); // 최소 1, 최대 100
  const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
  const offset = parseInt(searchParams.get("offset") || String((page - 1) * limit));

  return { limit, offset };
}

/**
 * 페이징된 응답 생성
 */
export function createPaginatedResponse<T>(
  data: T[],
  limit: number,
  offset: number,
  total?: number
): PaginationResult<T> {
  return {
    data,
    pagination: {
      limit,
      offset,
      total,
      hasMore: total ? offset + data.length < total : data.length === limit,
    },
  };
}

