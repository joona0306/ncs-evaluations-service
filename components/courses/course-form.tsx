"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/auth-store";
import { useEffect } from "react";

interface CourseFormProps {
  course?: {
    id: string;
    name: string;
    code: string;
    start_date: string;
    end_date: string;
    description: string | null;
  };
}

export function CourseForm({ course }: CourseFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const { user, profile, initialize, isInitialized } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 컴포넌트 마운트 시 Zustand store 초기화
  useEffect(() => {
    if (!isInitialized) {
      initialize().catch((err) => {
        console.error("Zustand store 초기화 실패:", err);
      });
    }
  }, [initialize, isInitialized]);
  const [formData, setFormData] = useState({
    name: course?.name || "",
    code: course?.code || "",
    start_date: course?.start_date || "",
    end_date: course?.end_date || "",
    description: course?.description || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Zustand store에서 프로필 정보 확인 (클라이언트 사이드 기본 검증)
      if (!profile) {
        // API route에서 확인
      } else if (profile.role !== "admin") {
        throw new Error("관리자 권한이 필요합니다.");
      }

      if (course) {
        // Update existing course - API route 사용
        const response = await fetch("/api/courses", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: course.id,
            name: formData.name,
            code: formData.code,
            start_date: formData.start_date,
            end_date: formData.end_date,
            description: formData.description || null,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("과정 수정 오류:", result);
          throw new Error(
            result.error || "과정 수정에 실패했습니다. 권한을 확인해주세요."
          );
        }

        if (!result.data) {
          throw new Error("수정된 데이터를 확인할 수 없습니다.");
        }
      } else {
        // Create new course - API route 사용
        const response = await fetch("/api/courses", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: formData.name,
            code: formData.code,
            start_date: formData.start_date,
            end_date: formData.end_date,
            description: formData.description || null,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          console.error("과정 생성 오류:", result);
          throw new Error(
            result.error || "과정 생성에 실패했습니다. 권한을 확인해주세요."
          );
        }

        if (!result.data) {
          throw new Error("생성된 데이터를 확인할 수 없습니다.");
        }
      }

      // 성공 시 리다이렉트 및 데이터 새로고침
      router.push("/dashboard/courses");
      router.refresh();
    } catch (err: any) {
      console.error("저장 오류:", err);
      setError(err?.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{course ? "훈련과정 수정" : "새 훈련과정"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">훈련과정명 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="code">과정 코드 *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">시작일 *</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end_date">종료일 *</Label>
              <Input
                id="end_date"
                type="date"
                value={formData.end_date}
                onChange={(e) =>
                  setFormData({ ...formData, end_date: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">설명</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "저장 중..." : course ? "수정" : "생성"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
