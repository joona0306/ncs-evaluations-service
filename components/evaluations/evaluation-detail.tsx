"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface EvaluationDetailProps {
  evaluation: any;
}

export function EvaluationDetail({ evaluation }: EvaluationDetailProps) {
  const criteria = evaluation.competency_units?.evaluation_criteria || {};
  const scores = evaluation.scores || {};

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
                {evaluation.competency_units?.name} ({evaluation.competency_units?.code})
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
              <span className={`inline-block px-2 py-1 text-xs rounded ${
                evaluation.status === "confirmed" ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400" :
                evaluation.status === "submitted" ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400" :
                "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
              }`}>
                {evaluation.status === "confirmed" ? "확정" :
                 evaluation.status === "submitted" ? "제출" : "임시저장"}
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
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>평가 점수</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(criteria).map(([key, value]: [string, any]) => (
              <div key={key} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-medium">{value.label || key}</p>
                  <p className="text-sm text-muted-foreground">
                    최대 점수: {value.max || 100}점
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{scores[key] || 0}</p>
                  <p className="text-sm text-muted-foreground">
                    / {value.max || 100}점
                  </p>
                </div>
              </div>
            ))}
            {Object.keys(criteria).length === 0 && (
              <p className="text-sm text-muted-foreground">평가 기준이 설정되지 않았습니다.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {evaluation.comments && (
        <Card>
          <CardHeader>
            <CardTitle>평가 의견</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="whitespace-pre-wrap">{evaluation.comments}</p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>서명</CardTitle>
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
