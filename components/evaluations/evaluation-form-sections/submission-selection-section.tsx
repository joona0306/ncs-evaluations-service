"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface Submission {
  id: string;
  submission_type: "image" | "url";
  file_name?: string;
  file_url?: string;
  url?: string;
  comments?: string;
  submitted_at: string;
}

interface SubmissionSelectionSectionProps {
  submissions: Submission[];
  selectedSubmissionId: string;
  onSubmissionChange: (submissionId: string) => void;
}

function SubmissionImagePreview({ submissionId }: { submissionId: string }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadImage = async () => {
      try {
        const response = await fetch(`/api/submissions/image?id=${submissionId}`);
        if (response.ok) {
          const data = await response.json();
          setImageUrl(data.url);
        } else {
          setError("이미지를 불러올 수 없습니다.");
        }
      } catch (err) {
        console.error("이미지 로드 실패:", err);
        setError("이미지를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    };

    loadImage();
  }, [submissionId]);

  if (loading) {
    return (
      <div className="mt-2 p-4 border rounded text-center text-muted-foreground">
        이미지 로딩 중...
      </div>
    );
  }

  if (error || !imageUrl) {
    return (
      <div className="mt-2 p-4 border rounded text-center text-red-600">
        {error || "이미지를 불러올 수 없습니다."}
      </div>
    );
  }

  return (
    <div className="mt-2">
      <Image
        src={imageUrl}
        alt="과제물 미리보기"
        width={800}
        height={600}
        className="max-w-full h-auto max-h-96 border rounded"
        onError={() => {
          setError("이미지를 표시할 수 없습니다.");
        }}
      />
    </div>
  );
}

export function SubmissionSelectionSection({
  submissions,
  selectedSubmissionId,
  onSubmissionChange,
}: SubmissionSelectionSectionProps) {
  if (submissions.length === 0) {
    return null;
  }

  const selectedSubmission = submissions.find(
    (s) => s.id === selectedSubmissionId
  );

  return (
    <div className="space-y-2">
      <Label htmlFor="submission">과제물 (선택사항)</Label>
      <select
        id="submission"
        value={selectedSubmissionId}
        onChange={(e) => onSubmissionChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">과제물 없이 평가</option>
        {submissions.map((submission) => (
          <option key={submission.id} value={submission.id}>
            {submission.submission_type === "image"
              ? `이미지: ${submission.file_name || "파일"}`
              : `URL: ${submission.url}`}
            {" - "}
            {format(new Date(submission.submitted_at), "yyyy-MM-dd HH:mm", {
              locale: ko,
            })}
          </option>
        ))}
      </select>

      {/* 선택된 과제물 미리보기 */}
      {selectedSubmission && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-semibold">과제물 미리보기</h4>
            <div className="flex gap-2">
              {selectedSubmission.submission_type === "image" &&
                selectedSubmission.file_url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(
                        `/api/submissions/download?id=${selectedSubmission.id}`,
                        "_blank"
                      );
                    }}
                  >
                    다운로드
                  </Button>
                )}
              {selectedSubmission.submission_type === "url" &&
                selectedSubmission.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(selectedSubmission.url, "_blank");
                    }}
                  >
                    URL 열기
                  </Button>
                )}
            </div>
          </div>

          {selectedSubmission.submission_type === "image" &&
            selectedSubmission.file_url && (
              <SubmissionImagePreview submissionId={selectedSubmission.id} />
            )}

          {selectedSubmission.submission_type === "url" &&
            selectedSubmission.url && (
              <div className="mt-2">
                <a
                  href={selectedSubmission.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline break-all"
                >
                  {selectedSubmission.url}
                </a>
              </div>
            )}

          {selectedSubmission.comments && (
            <div className="mt-2 p-2 bg-white rounded text-sm">
              <strong>코멘트:</strong> {selectedSubmission.comments}
            </div>
          )}

          <div className="mt-2 text-sm text-muted-foreground">
            제출일시:{" "}
            {format(
              new Date(selectedSubmission.submitted_at),
              "yyyy년 MM월 dd일 HH:mm",
              { locale: ko }
            )}
          </div>
        </div>
      )}
    </div>
  );
}

