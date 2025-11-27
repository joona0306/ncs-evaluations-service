"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { safeText } from "@/lib/utils/safe-render";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Evaluation,
  EvaluationCriteriaScore,
  PerformanceCriteria,
  CompetencyElement,
} from "@/types/evaluation";

interface NewEvaluationDetailProps {
  evaluation: Evaluation;
}

export function NewEvaluationDetail({ evaluation }: NewEvaluationDetailProps) {
  const [criteriaScores, setCriteriaScores] = useState<
    (EvaluationCriteriaScore & { performance_criteria: PerformanceCriteria })[]
  >([]);
  const [elements, setElements] = useState<CompetencyElement[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [submission, setSubmission] = useState<any>(null);
  const [submissionImageUrl, setSubmissionImageUrl] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 능력단위요소 로드
      const elementsResponse = await fetch(
        `/api/competency-elements?competency_unit_id=${evaluation.competency_unit_id}`
      );

      if (elementsResponse.ok) {
        const elementsData = await elementsResponse.json();
        setElements(elementsData || []);
      }

      // 수행준거 점수 로드
      const scoresResponse = await fetch(
        `/api/evaluation-criteria-scores?evaluation_id=${evaluation.id}`
      );

      if (!scoresResponse.ok) {
        const errorData = await scoresResponse.json();
        throw new Error(errorData.error || "평가 점수를 불러올 수 없습니다.");
      }

      const scoresData = await scoresResponse.json();
      setCriteriaScores(scoresData as any);

      // 서명 데이터 로드
      const sigResponse = await fetch(
        `/api/signatures?evaluation_id=${evaluation.id}`
      );
      if (sigResponse.ok) {
        const sigData = await sigResponse.json();
        setSignatures(sigData || []);
      }

      // 과제물 데이터 로드
      if (evaluation.submission_id) {
        const submissionResponse = await fetch(
          `/api/submissions/${evaluation.submission_id}`
        );
        if (submissionResponse.ok) {
          const submissionData = await submissionResponse.json();
          setSubmission(submissionData);

          // 이미지 타입인 경우 이미지 URL 로드
          if (
            submissionData.submission_type === "image" &&
            submissionData.file_url
          ) {
            const imageResponse = await fetch(
              `/api/submissions/image?id=${evaluation.submission_id}`
            );
            if (imageResponse.ok) {
              const imageData = await imageResponse.json();
              setSubmissionImageUrl(imageData.url);
            }
          }
        }
      }
    } catch (error: any) {
      console.error("평가 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [evaluation.id, evaluation.competency_unit_id, evaluation.submission_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 점수 계산 (수행준거 기반)
  const calculateScores = () => {
    let rawTotal = 0;
    let maxTotal = 0;

    criteriaScores.forEach((cs) => {
      rawTotal += cs.score;
      maxTotal += cs.performance_criteria.max_score;
    });

    const convertedScore =
      maxTotal > 0 ? Math.round((rawTotal / maxTotal) * 10000) / 100 : 0;

    return { rawTotal, maxTotal, convertedScore };
  };

  const { rawTotal, maxTotal, convertedScore } = calculateScores();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>평가 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">능력단위</p>
              <p className="font-medium">
                {safeText(evaluation.competency_units?.name)} (
                {evaluation.competency_units?.code})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">학생</p>
              <p className="font-medium">
                {safeText(
                  evaluation.student?.full_name || evaluation.student?.email
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">평가자</p>
              <p className="font-medium">
                {safeText(
                  evaluation.teacher?.full_name || evaluation.teacher?.email
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">상태</p>
              <span
                className={`inline-block px-2 py-1 text-xs rounded ${
                  evaluation.status === "confirmed"
                    ? "bg-green-100 text-green-800"
                    : evaluation.status === "submitted"
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {evaluation.status === "confirmed"
                  ? "확정"
                  : evaluation.status === "submitted"
                  ? "제출"
                  : "임시저장"}
              </span>
            </div>
            {evaluation.evaluated_at && (
              <div>
                <p className="text-sm text-muted-foreground">평가일</p>
                <p className="font-medium">
                  {new Date(evaluation.evaluated_at).toLocaleDateString(
                    "ko-KR"
                  )}
                </p>
              </div>
            )}
            {evaluation.total_score !== null &&
              evaluation.total_score !== undefined && (
                <div>
                  <p className="text-sm text-muted-foreground">환산 점수</p>
                  <p className="font-medium text-lg text-blue-700">
                    {evaluation.total_score} / 100점
                  </p>
                </div>
              )}
          </div>

          {/* 과제물 정보 */}
          {submission && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4 text-lg">제출된 과제물</h4>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">제출 유형:</p>
                  <span className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                    {submission.submission_type === "image"
                      ? "이미지 파일"
                      : "URL"}
                  </span>
                </div>
                {submission.submission_type === "image" && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        이미지 미리보기
                      </p>
                      {submissionImageUrl ? (
                        <div className="space-y-3">
                          <div className="border rounded-lg p-4 bg-white shadow-sm">
                            <Image
                              src={submissionImageUrl}
                              alt="과제물 이미지"
                              width={600}
                              height={400}
                              className="max-w-full h-auto max-h-96 mx-auto rounded"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(
                                  `/api/submissions/download?id=${submission.id}`,
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
                              이미지 다운로드
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                window.open(submissionImageUrl, "_blank");
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
                          </div>
                          {submission.file_name && (
                            <p className="text-xs text-muted-foreground">
                              파일명: {submission.file_name}
                              {submission.file_size && (
                                <>
                                  {" "}
                                  ({(submission.file_size / 1024).toFixed(
                                    2
                                  )}{" "}
                                  KB)
                                </>
                              )}
                            </p>
                          )}
                        </div>
                      ) : loading ? (
                        <p className="text-sm text-muted-foreground">
                          이미지를 불러오는 중...
                        </p>
                      ) : (
                        <p className="text-sm text-red-600">
                          이미지를 불러올 수 없습니다.
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {submission.submission_type === "url" && submission.url && (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">
                        제출된 URL
                      </p>
                      <div className="border rounded-lg p-3 bg-gray-50">
                        <a
                          href={submission.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all block mb-2"
                        >
                          {submission.url}
                        </a>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.open(submission.url, "_blank");
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
                      </div>
                    </div>
                  </div>
                )}
                {submission.comments && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium text-muted-foreground mb-2">
                      제출 코멘트
                    </p>
                    <p className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                      {safeText(submission.comments)}
                    </p>
                  </div>
                )}
                {submission.submitted_at && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground">제출일시</p>
                    <p className="text-sm font-medium">
                      {new Date(submission.submitted_at).toLocaleString(
                        "ko-KR"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 서명 정보 */}
          {signatures.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4">서명 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                {signatures.map((sig) => {
                  const isTeacher = sig.signer_role === "teacher";
                  const isStudent = sig.signer_role === "student";
                  const signerName =
                    sig.signer?.full_name || sig.signer?.email || "알 수 없음";

                  return (
                    <div key={sig.id} className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {isTeacher
                          ? "훈련교사 서명"
                          : isStudent
                          ? "훈련생 서명"
                          : "서명"}
                      </p>
                      <div className="border rounded p-2 bg-white">
                        <Image
                          src={sig.signature_data}
                          alt={`${signerName} 서명`}
                          width={200}
                          height={80}
                          className="max-w-full h-auto max-h-20"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {signerName}
                        </p>
                        {isStudent && (
                          <a
                            href={sig.signature_data}
                            download={`${signerName}_서명_${
                              new Date(sig.signed_at)
                                .toISOString()
                                .split("T")[0]
                            }.png`}
                            className="text-xs text-blue-600 hover:text-blue-800 underline"
                          >
                            다운로드
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(sig.signed_at).toLocaleString("ko-KR")}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 종합 점수 */}
      <Card>
        <CardHeader>
          <CardTitle>종합 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded bg-blue-50">
              <div>
                <p className="text-sm text-muted-foreground mb-1">원점수</p>
                <p className="text-lg font-semibold">
                  {rawTotal} / {maxTotal}점
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground mb-1">환산 점수</p>
                <p className="text-3xl font-bold text-blue-700">
                  {convertedScore} <span className="text-lg">/ 100점</span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 능력단위요소별 점수 */}
      <Card>
        <CardHeader>
          <CardTitle>수행준거별 평가</CardTitle>
          <CardDescription>
            능력단위요소별 수행준거 점수와 평가 의견입니다
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">로딩 중...</p>
          ) : elements.length > 0 && criteriaScores.length > 0 ? (
            <div className="space-y-6">
              {elements.map((element) => {
                // 이 요소에 속한 수행준거 점수 필터링
                const elementCriteriaScores = criteriaScores.filter(
                  (cs) =>
                    cs.performance_criteria.competency_element_id === element.id
                );

                if (elementCriteriaScores.length === 0) return null;

                return (
                  <div
                    key={element.id}
                    className="border rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-lg mb-1">
                          {safeText(element.name)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          코드: {safeText(element.code)}
                        </p>
                        {element.description && (
                          <p className="text-sm mt-1">
                            {safeText(element.description)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                      {elementCriteriaScores.map((cs) => (
                        <div
                          key={cs.id}
                          className="border rounded-lg p-3 space-y-2 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="space-y-1 mb-1">
                                <div className="flex items-center gap-2">
                                  <h5 className="font-medium">
                                    {safeText(cs.performance_criteria.name)}
                                  </h5>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      cs.performance_criteria.difficulty ===
                                      "high"
                                        ? "bg-red-100 text-red-800"
                                        : cs.performance_criteria.difficulty ===
                                          "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {cs.performance_criteria.difficulty ===
                                    "high"
                                      ? "상"
                                      : cs.performance_criteria.difficulty ===
                                        "medium"
                                      ? "중"
                                      : "하"}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  만점: {cs.performance_criteria.max_score}점
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                코드: {cs.performance_criteria.code}
                              </p>
                              {cs.performance_criteria.description && (
                                <p className="text-sm mt-1">
                                  {cs.performance_criteria.description}
                                </p>
                              )}
                            </div>
                            <div className="text-right ml-4">
                              <p className="text-2xl font-bold">{cs.score}</p>
                              <p className="text-sm text-muted-foreground">
                                / {cs.performance_criteria.max_score}점
                              </p>
                            </div>
                          </div>
                          {cs.comments && (
                            <div className="pt-2 border-t">
                              <p className="text-sm text-muted-foreground mb-1">
                                평가 의견
                              </p>
                              <p className="text-sm whitespace-pre-wrap">
                                {safeText(cs.comments)}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : criteriaScores.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              평가 점수가 입력되지 않았습니다.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              능력단위요소를 불러올 수 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 종합 평가 의견 */}
      {evaluation.comments && (
        <Card>
          <CardHeader>
            <CardTitle>종합 평가 의견</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">
              {safeText(evaluation.comments)}
            </p>
          </CardContent>
        </Card>
      )}

      {/* 서명 */}
      <Card>
        <CardHeader>
          <CardTitle>서명</CardTitle>
          <CardDescription>평가 내용을 확인하고 서명해주세요</CardDescription>
        </CardHeader>
        <CardContent>
          <Link href={`/dashboard/evaluations/${evaluation.id}/sign`}>
            <Button className="w-full">서명하기</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
