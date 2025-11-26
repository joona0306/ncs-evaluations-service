"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import {
  CompetencyElement,
} from "@/types/evaluation";

interface ElementFormProps {
  competencyUnitId: string;
  element?: CompetencyElement;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ElementForm({
  competencyUnitId,
  element,
  onSuccess,
  onCancel,
}: ElementFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: element?.name || "",
    code: element?.code || "",
    description: element?.description || "",
    display_order: element?.display_order || 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = element
        ? `/api/competency-elements/${element.id}`
        : `/api/competency-elements`;
      
      const response = await fetch(url, {
        method: element ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          competency_unit_id: competencyUnitId,
        }),
      });

      if (!response.ok) throw new Error("Failed to save element");

      onSuccess();
    } catch (error) {
      console.error("Error saving element:", error);
      alert("능력단위요소 저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">능력단위요소명</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="code">능력단위요소 코드</Label>
        <Input
          id="code"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value })}
          required
          placeholder="예: 01, 02, 03..."
        />
      </div>

      <div>
        <Label htmlFor="display_order">표시 순서</Label>
        <Input
          id="display_order"
          type="number"
          value={formData.display_order}
          onChange={(e) =>
            setFormData({
              ...formData,
              display_order: parseInt(e.target.value) || 0,
            })
          }
        />
      </div>

      <div>
        <Label htmlFor="description">설명</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "저장 중..." : element ? "수정" : "추가"}
        </Button>
        <Button type="button" variant="outline" onClick={onCancel}>
          취소
        </Button>
      </div>
    </form>
  );
}

