import { useQuery } from "@tanstack/react-query";

async function fetchCourses(): Promise<any[]> {
  const response = await fetch("/api/courses", {
    next: { revalidate: 300 }, // 5분 캐시
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "훈련과정을 불러올 수 없습니다.");
  }

  return response.json();
}

export function useCoursesQuery() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: fetchCourses,
    staleTime: 5 * 60 * 1000, // 5분간 fresh 상태 유지
    gcTime: 10 * 60 * 1000, // 10분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

