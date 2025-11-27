"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface SubmissionFormProps {
  evaluationSchedule: any;
  existingSubmission?: any;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SubmissionForm({
  evaluationSchedule,
  existingSubmission,
  onSuccess,
  onCancel,
}: SubmissionFormProps) {
  const [submissionType, setSubmissionType] = useState<"image" | "url">(
    (existingSubmission?.submission_type as "image" | "url") || "image"
  );
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [url, setUrl] = useState<string>(existingSubmission?.url ?? "");
  const [comments, setComments] = useState<string>(
    existingSubmission?.comments ?? ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 기존 제출물이 이미지인 경우 API를 통해 이미지 URL 로드
  useEffect(() => {
    if (existingSubmission?.submission_type === "image" && existingSubmission?.id) {
      const loadImageUrl = async () => {
        try {
          const response = await fetch(`/api/submissions/image?id=${existingSubmission.id}`);
          if (response.ok) {
            const data = await response.json();
            setFilePreview(data.url);
          }
        } catch (err) {
          console.error("이미지 URL 로드 실패:", err);
        }
      };
      loadImageUrl();
    }
  }, [existingSubmission]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // 파일 타입 검증
    if (!selectedFile.type.startsWith("image/")) {
      setError("이미지 파일만 업로드 가능합니다.");
      return;
    }

    // 파일 크기 검증 (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("파일 크기는 5MB 이하여야 합니다.");
      return;
    }

    setFile(selectedFile);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setFilePreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let fileUrl = existingSubmission?.file_url || null;
      let fileName = existingSubmission?.file_name || null;
      let fileSize = existingSubmission?.file_size || null;

      // 이미지 파일 업로드
      if (submissionType === "image") {
        if (!file && !filePreview) {
          setError("파일을 선택해주세요.");
          setLoading(false);
          return;
        }

        if (file) {
          const formData = new FormData();
          formData.append("file", file);
          formData.append("evaluation_schedule_id", evaluationSchedule.id);

          const uploadResponse = await fetch("/api/submissions/upload", {
            method: "POST",
            body: formData,
          });

          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json();
            throw new Error(errorData.error || "파일 업로드에 실패했습니다.");
          }

          const uploadData = await uploadResponse.json();
          fileUrl = uploadData.path;
          fileName = uploadData.file_name;
          fileSize = uploadData.file_size;
        }
      } else {
        // URL 입력
        if (!url.trim()) {
          setError("URL을 입력해주세요.");
          setLoading(false);
          return;
        }

        // URL 유효성 검증
        try {
          new URL(url);
        } catch {
          setError("유효한 URL을 입력해주세요.");
          setLoading(false);
          return;
        }
      }

      // 제출 데이터 저장
      const apiUrl = existingSubmission
        ? `/api/submissions/${existingSubmission.id}`
        : "/api/submissions";
      const method = existingSubmission ? "PATCH" : "POST";

      const response = await fetch(apiUrl, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evaluation_schedule_id: evaluationSchedule.id,
          competency_unit_id: evaluationSchedule.competency_unit_id,
          submission_type: submissionType,
          file_url: submissionType === "image" ? fileUrl : null,
          url: submissionType === "url" ? url : null,
          file_name: fileName,
          file_size: fileSize,
          comments: comments.trim() || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "과제물 제출에 실패했습니다.");
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("과제물 제출 오류:", err);
      setError(err.message || "과제물 제출에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {existingSubmission ? "과제물 수정" : "과제물 제출"}
        </CardTitle>
        <CardDescription>
          {evaluationSchedule.competency_units?.name} (
          {evaluationSchedule.competency_units?.code})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-2">
          <div>
            <span className="font-medium">평가일정:</span> {evaluationSchedule.title}
          </div>
          <div>
            <span className="font-medium">시작일시:</span>{" "}
            {format(new Date(evaluationSchedule.start_date), "yyyy년 MM월 dd일 HH:mm", {
              locale: ko,
            })}
          </div>
          <div>
            <span className="font-medium">종료일시:</span>{" "}
            {format(new Date(evaluationSchedule.end_date), "yyyy년 MM월 dd일 HH:mm", {
              locale: ko,
            })}
          </div>
          {evaluationSchedule.description && (
            <div>
              <span className="font-medium">설명:</span>{" "}
              {evaluationSchedule.description}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="submission_type">제출 방식</Label>
            <Select
              id="submission_type"
              value={submissionType || "image"}
              onChange={(e) => {
                const value = e.target.value as "image" | "url";
                setSubmissionType(value);
                setFile(null);
                setFilePreview(null);
                setUrl("");
                setError(null);
              }}
              disabled={!!existingSubmission}
            >
              <option value="image">이미지 파일 업로드</option>
              <option value="url">URL 입력</option>
            </Select>
          </div>

          {submissionType === "image" ? (
            <div>
              <Label htmlFor="file">이미지 파일 (최대 5MB)</Label>
              <Input
                id="file"
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={loading}
              />
              {filePreview && (
                <div className="mt-4">
                  <Image
                    src={filePreview}
                    alt="미리보기"
                    width={600}
                    height={400}
                    className="max-w-full h-auto max-h-64 border rounded"
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <Label htmlFor="url">URL</Label>
              <Input
                id="url"
                type="url"
                value={url ?? ""}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                disabled={loading}
              />
            </div>
          )}

          <div>
            <Label htmlFor="comments">코멘트 (선택사항)</Label>
            <Textarea
              id="comments"
              value={comments ?? ""}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              placeholder="과제물에 대한 추가 설명을 입력하세요"
              disabled={loading}
            />
          </div>

          {error && (
            <div className="text-sm text-red-600">{error}</div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? "제출 중..." : existingSubmission ? "수정" : "제출"}
            </Button>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                취소
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

