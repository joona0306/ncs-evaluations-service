/**
 * React Query를 사용한 훈련과정 데이터 페칭 훅
 */

import { useQuery } from "@tanstack/react-query";

interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

async function fetchCourses(): Promise<Course[]> {
  const response = await fetch("/api/courses", {
    next: { revalidate: 60 },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "훈련과정 목록을 불러올 수 없습니다.");
  }

  return await response.json();
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분
  });
}

