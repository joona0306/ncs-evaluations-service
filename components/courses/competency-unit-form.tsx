"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface CompetencyUnitFormProps {
  courseId: string;
  unit?: {
    id: string;
    name: string;
    code: string;
    description: string | null;
    evaluation_criteria: any;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CompetencyUnitForm({
  courseId,
  unit,
  onSuccess,
  onCancel,
}: CompetencyUnitFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: unit?.name || "",
    code: unit?.code || "",
    description: unit?.description || "",
    evaluation_criteria: unit?.evaluation_criteria || {},
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const url = unit
        ? `/api/competency-units/${unit.id}`
        : `/api/competency-units`;
      
      const method = unit ? "PATCH" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          name: formData.name,
          code: formData.code,
          description: formData.description || null,
          evaluation_criteria: formData.evaluation_criteria,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "저장에 실패했습니다.");
      }

      if (onSuccess) {
        onSuccess();
      } else {
        router.back();
        router.refresh();
      }
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{unit ? "능력단위 수정" : "새 능력단위"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">능력단위명 *</Label>
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
            <Label htmlFor="code">능력단위 코드 *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              required
            />
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
              {loading ? "저장 중..." : unit ? "수정" : "생성"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (onCancel) {
                  onCancel();
                } else {
                  router.back();
                }
              }}
            >
              취소
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
