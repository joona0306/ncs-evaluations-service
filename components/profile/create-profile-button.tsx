"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export function CreateProfileButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const handleCreateProfile = async () => {
    setLoading(true);
    setError(null);

    try {
      // 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("로그인이 필요합니다.");
      }

      // 사용자 메타데이터에서 정보 추출
      const fullName = user.user_metadata?.full_name || user.email?.split("@")[0] || "";
      const phone = user.user_metadata?.phone || "";
      const role = user.user_metadata?.role || "student";

      // 프로필 생성 API 호출
      const response = await fetch("/api/auth/create-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: user.email,
          full_name: fullName,
          phone,
          role,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "프로필 생성에 실패했습니다.");
      }

      // 성공 시 페이지 새로고침
      router.refresh();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "프로필 생성에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      <Button onClick={handleCreateProfile} disabled={loading}>
        {loading ? "생성 중..." : "프로필 생성하기"}
      </Button>
    </div>
  );
}

