"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface UserApprovalButtonProps {
  userId: string;
  approved: boolean;
  onUpdate: () => void;
}

export function UserApprovalButton({
  userId,
  approved,
  onUpdate,
}: UserApprovalButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/users/${userId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ approved: !approved }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("승인 상태 변경 오류:", result);
        alert(`승인 상태 변경에 실패했습니다: ${result.error || "알 수 없는 오류"}`);
        return;
      }

      onUpdate();
    } catch (err: any) {
      console.error("승인 상태 변경 중 오류:", err);
      alert(`승인 상태 변경 중 오류가 발생했습니다: ${err.message || "알 수 없는 오류"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={approved ? "default" : "outline"}
      size="sm"
      onClick={handleToggle}
      disabled={loading}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          처리 중...
        </>
      ) : approved ? (
        "승인됨"
      ) : (
        "승인하기"
      )}
    </Button>
  );
}

