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
  file_size?: number;
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
        const response = await fetch(
          `/api/submissions/image?id=${submissionId}`
        );
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
  // submissions가 배열이 아닌 경우 처리
  const submissionsArray = Array.isArray(submissions) ? submissions : [];

  // 디버깅: submissions prop 확인
  useEffect(() => {
    console.log("SubmissionSelectionSection - submissions prop:", {
      submissions,
      submissionsArray,
      isArray: Array.isArray(submissions),
      length: submissionsArray.length,
      selectedSubmissionId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submissions, selectedSubmissionId]);

  // 과제물이 없어도 섹션을 표시하여 사용자에게 알림
  if (submissionsArray.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="submission">과제물 (선택사항)</Label>
        <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 text-sm text-muted-foreground">
          이 학생이 제출한 과제물이 없습니다.
        </div>
      </div>
    );
  }

  const selectedSubmission = submissionsArray.find(
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
        {submissionsArray.map((submission) => (
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
        <div className="mt-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 space-y-4">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="font-semibold text-lg">과제물 상세</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm text-muted-foreground">
                  제출 유형:
                </span>
                <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400">
                  {selectedSubmission.submission_type === "image"
                    ? "이미지 파일"
                    : "URL"}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              {selectedSubmission.submission_type === "image" &&
                selectedSubmission.file_url && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.open(
                          `/api/submissions/download?id=${selectedSubmission.id}`,
                          "_blank"
                        );
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                      다운로드
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        // 이미지 URL을 가져와서 새 탭에서 열기
                        fetch(
                          `/api/submissions/image?id=${selectedSubmission.id}`
                        )
                          .then((res) => res.json())
                          .then((data) => {
                            if (data.url) {
                              window.open(data.url, "_blank");
                            }
                          })
                          .catch((err) => {
                            console.error("이미지 URL 로드 실패:", err);
                          });
                      }}
                      className="flex items-center gap-2"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      새 탭에서 열기
                    </Button>
                  </>
                )}
              {selectedSubmission.submission_type === "url" &&
                selectedSubmission.url && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.open(selectedSubmission.url, "_blank");
                    }}
                    className="flex items-center gap-2"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                    새 탭에서 열기
                  </Button>
                )}
            </div>
          </div>

          {selectedSubmission.submission_type === "image" &&
            selectedSubmission.file_url && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    이미지 미리보기
                  </p>
                  <SubmissionImagePreview
                    submissionId={selectedSubmission.id}
                  />
                </div>
                {selectedSubmission.file_name && (
                  <p className="text-xs text-muted-foreground">
                    파일명: {selectedSubmission.file_name}
                    {selectedSubmission.file_size && (
                      <>
                        {" "}
                        ({(selectedSubmission.file_size / 1024).toFixed(2)} KB)
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

          {selectedSubmission.submission_type === "url" &&
            selectedSubmission.url && (
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    제출된 URL
                  </p>
                  <div className="border rounded-lg p-3 bg-white dark:bg-gray-900">
                    <a
                      href={selectedSubmission.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline break-all block"
                    >
                      {selectedSubmission.url}
                    </a>
                  </div>
                </div>
              </div>
            )}

          {selectedSubmission.comments && (
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-muted-foreground mb-2">
                제출 코멘트
              </p>
              <p className="text-sm whitespace-pre-wrap bg-white dark:bg-gray-900 p-3 rounded border">
                {selectedSubmission.comments}
              </p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">제출일시</p>
            <p className="text-sm font-medium">
              {format(
                new Date(selectedSubmission.submitted_at),
                "yyyy년 MM월 dd일 HH:mm",
                { locale: ko }
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
