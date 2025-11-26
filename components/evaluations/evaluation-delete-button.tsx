"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface EvaluationDeleteButtonProps {
  evaluationId: string;
  onDelete?: () => void;
}

export function EvaluationDeleteButton({
  evaluationId,
  onDelete,
}: EvaluationDeleteButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!confirm("이 평가를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/evaluations/${evaluationId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "삭제에 실패했습니다.");
      }

      if (onDelete) {
        onDelete();
      } else {
        router.push("/dashboard/evaluations");
        router.refresh();
      }
    } catch (error: any) {
      console.error("평가 삭제 오류:", error);
      alert(`삭제에 실패했습니다: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="destructive"
      onClick={handleDelete}
      disabled={loading}
    >
      {loading ? "삭제 중..." : "삭제"}
    </Button>
  );
}

