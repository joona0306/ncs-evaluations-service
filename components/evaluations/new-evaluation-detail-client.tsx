"use client";

import dynamic from "next/dynamic";
import { Evaluation } from "@/types/evaluation";

const NewEvaluationDetail = dynamic(
  () =>
    import("@/components/evaluations/new-evaluation-detail").then((mod) => ({
      default: mod.NewEvaluationDetail,
    })),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">
        평가 상세 로딩 중...
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

interface NewEvaluationDetailClientProps {
  evaluation: Evaluation;
}

export function NewEvaluationDetailClient({
  evaluation,
}: NewEvaluationDetailClientProps) {
  return <NewEvaluationDetail evaluation={evaluation} />;
}
