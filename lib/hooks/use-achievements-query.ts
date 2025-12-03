import { useQuery } from "@tanstack/react-query";

interface CourseAchievement {
  course_id: string;
  course_name: string;
  course_code: string;
  students: any[];
  course_average: number;
  competency_units?: any[];
  competency_unit_average?: number;
  score_distribution?: {
    over90: number;
    over80: number;
    over70: number;
    over60: number;
    under60: number;
    total: number;
  };
}

async function fetchAchievements(courseId: string): Promise<CourseAchievement> {
  const response = await fetch(`/api/achievements?course_id=${courseId}`, {
    next: { revalidate: 60 }, // 1분 캐시
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "학업 성취도를 불러올 수 없습니다.");
  }

  return response.json();
}

export function useAchievementsQuery(courseId: string | null) {
  return useQuery({
    queryKey: ["achievements", courseId],
    queryFn: () => fetchAchievements(courseId!),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2분간 fresh 상태 유지
    gcTime: 5 * 60 * 1000, // 5분간 캐시 유지
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}

