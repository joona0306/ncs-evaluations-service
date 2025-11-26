"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
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

export function NewEvaluationDetail({
  evaluation,
}: NewEvaluationDetailProps) {
  const [criteriaScores, setCriteriaScores] = useState<
    (EvaluationCriteriaScore & { performance_criteria: PerformanceCriteria })[]
  >([]);
  const [elements, setElements] = useState<CompetencyElement[]>([]);
  const [signatures, setSignatures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [evaluation.id]);

  const loadData = async () => {
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
    } catch (error: any) {
      console.error("평가 데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  };

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
                {evaluation.competency_units?.name} (
                {evaluation.competency_units?.code})
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">학생</p>
              <p className="font-medium">
                {evaluation.student?.full_name || evaluation.student?.email}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">평가자</p>
              <p className="font-medium">
                {evaluation.teacher?.full_name || evaluation.teacher?.email}
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
                  {new Date(evaluation.evaluated_at).toLocaleDateString("ko-KR")}
                </p>
              </div>
            )}
            {evaluation.total_score !== null && evaluation.total_score !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">환산 점수</p>
                <p className="font-medium text-lg text-blue-700">
                  {evaluation.total_score} / 100점
                </p>
              </div>
            )}
          </div>
          
          {/* 서명 정보 */}
          {signatures.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold mb-4">서명 정보</h4>
              <div className="grid grid-cols-2 gap-4">
                {signatures.map((sig) => {
                  const isTeacher = sig.signer_role === "teacher";
                  const isStudent = sig.signer_role === "student";
                  const signerName = sig.signer?.full_name || sig.signer?.email || "알 수 없음";
                  
                  return (
                    <div key={sig.id} className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {isTeacher ? "훈련교사 서명" : isStudent ? "훈련생 서명" : "서명"}
                      </p>
                      <div className="border rounded p-2 bg-white">
                        <img
                          src={sig.signature_data}
                          alt={`${signerName} 서명`}
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
                            download={`${signerName}_서명_${new Date(sig.signed_at).toISOString().split('T')[0]}.png`}
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
                  (cs) => cs.performance_criteria.competency_element_id === element.id
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
                          {element.name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          코드: {element.code}
                        </p>
                        {element.description && (
                          <p className="text-sm mt-1">{element.description}</p>
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
                                    {cs.performance_criteria.name}
                                  </h5>
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded ${
                                      cs.performance_criteria.difficulty === "high"
                                        ? "bg-red-100 text-red-800"
                                        : cs.performance_criteria.difficulty ===
                                          "medium"
                                        ? "bg-yellow-100 text-yellow-800"
                                        : "bg-green-100 text-green-800"
                                    }`}
                                  >
                                    {cs.performance_criteria.difficulty === "high"
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
                                {cs.comments}
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
            <p className="whitespace-pre-wrap">{evaluation.comments}</p>
          </CardContent>
        </Card>
      )}

      {/* 서명 */}
      <Card>
        <CardHeader>
          <CardTitle>서명</CardTitle>
          <CardDescription>
            평가 내용을 확인하고 서명해주세요
          </CardDescription>
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

