"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    console.error("대시보드 에러:", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            대시보드를 불러오는 중 오류가 발생했습니다.
          </p>
          {error.message && (
            <div className="p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-800 font-mono">{error.message}</p>
            </div>
          )}
          {error.digest && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-xs text-gray-600">에러 ID: {error.digest}</p>
            </div>
          )}
          <div className="flex gap-2">
            <Button onClick={() => reset()}>다시 시도</Button>
            <Button variant="outline" onClick={() => router.push("/login")}>
              로그인 페이지로
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

