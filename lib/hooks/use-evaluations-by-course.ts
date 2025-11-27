/**
 * React Query를 사용한 평가 데이터 페칭 훅 (훈련과정별)
 */

import { useQuery } from "@tanstack/react-query";

interface EvaluationByCourseData {
  competency_unit: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  students: Array<{
    student_id: string;
    student_name: string;
    student_email: string;
    evaluation: any;
    submissions: any[];
    has_submission: boolean;
    evaluation_status: string;
  }>;
}

async function fetchEvaluationsByCourse(
  courseId: string
): Promise<EvaluationByCourseData[]> {
  const response = await fetch(
    `/api/evaluations/by-course?course_id=${courseId}`,
    {
      next: { revalidate: 30 },
    }
  );

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.error || "평가 데이터를 불러올 수 없습니다."
    );
  }

  return await response.json();
}

export function useEvaluationsByCourse(courseId: string | null) {
  return useQuery({
    queryKey: ["evaluations", "by-course", courseId],
    queryFn: () => fetchEvaluationsByCourse(courseId!),
    enabled: !!courseId,
    staleTime: 2 * 60 * 1000, // 2분
    gcTime: 5 * 60 * 1000, // 5분
  });
}

