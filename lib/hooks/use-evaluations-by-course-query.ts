import { useQuery } from "@tanstack/react-query";

async function fetchEvaluationsByCourse(
  courseId: string
): Promise<any[]> {
  const response = await fetch(
    `/api/evaluations/by-course?course_id=${courseId}`,
    {
      next: { revalidate: 60 }, // 1분 캐시
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "평가 데이터를 불러올 수 없습니다."
    );
  }

  return response.json();
}

export function useEvaluationsByCourseQuery(courseId: string | null) {
  return useQuery({
    queryKey: ["evaluations-by-course", courseId],
    queryFn: () => fetchEvaluationsByCourse(courseId!),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

