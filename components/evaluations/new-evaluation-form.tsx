"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CompetencyElement,
  PerformanceCriteria,
  Evaluation,
  EvaluationCriteriaScore,
  DIFFICULTY_SCORE_OPTIONS,
} from "@/types/evaluation";
import { SignatureModal } from "@/components/signatures/signature-modal";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

// 과제물 이미지 미리보기 컴포넌트
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
        unoptimized
        onError={() => {
          setError("이미지를 표시할 수 없습니다.");
        }}
      />
    </div>
  );
}

interface NewEvaluationFormProps {
  courses: any[];
  teacherId: string;
  evaluation?: Evaluation & {
    evaluation_criteria_scores?: EvaluationCriteriaScore[];
  };
}

export function NewEvaluationForm({
  courses,
  teacherId,
  evaluation,
}: NewEvaluationFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [competencyUnits, setCompetencyUnits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [elements, setElements] = useState<CompetencyElement[]>([]);
  const [performanceCriteria, setPerformanceCriteria] = useState<
    PerformanceCriteria[]
  >([]);
  const [criteriaScores, setCriteriaScores] = useState<
    Record<string, { score: number; comments: string }>
  >({});
  const [loadingCriteria, setLoadingCriteria] = useState(false);
  const [comments, setComments] = useState(evaluation?.comments || "");
  const [status, setStatus] = useState(evaluation?.status || "draft");
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [savedEvaluationId, setSavedEvaluationId] = useState<string | null>(null);
  const [hasTeacherSignature, setHasTeacherSignature] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>(
    evaluation?.submission_id || ""
  );

  // URL 파라미터에서 초기값 설정 (렌더링 후)
  useEffect(() => {
    if (!evaluation) {
      const unitId = searchParams.get("competency_unit_id");
      const studentId = searchParams.get("student_id");
      const submissionId = searchParams.get("submission_id");
      
      if (unitId) {
        setSelectedUnit(unitId);
      }
      if (studentId) {
        setSelectedStudent(studentId);
      }
      if (submissionId) {
        setSelectedSubmissionId(submissionId);
      }
    } else {
      // 수정 페이지에서 URL 파라미터로 submission_id가 전달된 경우
      const submissionId = searchParams.get("submission_id");
      if (submissionId) {
        setSelectedSubmissionId(submissionId);
      }
    }
  }, [evaluation, searchParams]);

  const loadSubmissions = useCallback(async () => {
    if (!selectedUnit || !selectedStudent) return;

    try {
      const response = await fetch(
        `/api/submissions?competency_unit_id=${selectedUnit}&student_id=${selectedStudent}`
      );

      if (!response.ok) {
        console.error("과제물 조회 오류");
        setSubmissions([]);
        return;
      }

      const data = await response.json();
      setSubmissions(data || []);
    } catch (error: any) {
      console.error("과제물 로드 실패:", error);
      setSubmissions([]);
    }
  }, [selectedUnit, selectedStudent]);

  // URL 파라미터로 전달된 경우 초기 데이터 로드
  useEffect(() => {
    if (!evaluation && selectedUnit) {
      const loadInitialDataFromParams = async () => {
        try {
          // 능력단위 정보 가져오기
          const unitResponse = await fetch(
            `/api/competency-units/${selectedUnit}`
          );
          if (unitResponse.ok) {
            const unitData = await unitResponse.json();
            setSelectedCourse(unitData.course_id);
            // 능력단위요소와 수행준거는 selectedCourse가 설정되면 자동으로 로드됨
          }
        } catch (err: any) {
          console.error("초기 데이터 로드 실패:", err);
        }
      };
      loadInitialDataFromParams();
    }
  }, [selectedUnit, evaluation]);

  useEffect(() => {
    if (selectedUnit) {
      loadElements();
    } else {
      setElements([]);
      setPerformanceCriteria([]);
      setCriteriaScores({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit]);

  useEffect(() => {
    if (selectedUnit && selectedStudent) {
      loadSubmissions();
    } else {
      setSubmissions([]);
      setSelectedSubmissionId("");
    }
  }, [selectedUnit, selectedStudent, loadSubmissions]);

  const loadEvaluationData = useCallback(async () => {
    if (!evaluation) return;

    try {
      const response = await fetch(`/api/evaluations/${evaluation.id}`);
      if (!response.ok) {
        throw new Error("평가 데이터를 불러올 수 없습니다.");
      }

      const evalData = await response.json();
      const unit = evalData.competency_units;
      setSelectedCourse(unit.course_id);
      setSelectedUnit(evaluation.competency_unit_id);
      setSelectedStudent(evaluation.student_id);
      setComments(evaluation.comments || "");
      setStatus(evaluation.status);
      setSelectedSubmissionId(evaluation.submission_id || "");

      // 기존 수행준거 점수 로드
      const criteriaScoresResponse = await fetch(
        `/api/evaluation-criteria-scores?evaluation_id=${evaluation.id}`
      );
      if (criteriaScoresResponse.ok) {
        const criteriaScoresData = await criteriaScoresResponse.json();
        const scores: Record<string, { score: number; comments: string }> = {};
        criteriaScoresData.forEach((cs: any) => {
          scores[cs.criteria_id] = {
            score: cs.score,
            comments: cs.comments || "",
          };
        });
        setCriteriaScores(scores);
      }
    } catch (error: any) {
      console.error("평가 데이터 로드 실패:", error);
      setError(
        `평가 데이터를 불러오는 중 오류가 발생했습니다: ${error.message}`
      );
    }
  }, [evaluation]);

  const loadCompetencyUnits = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      const response = await fetch(
        `/api/competency-units?course_id=${selectedCourse}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "능력단위를 불러올 수 없습니다.");
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setCompetencyUnits(data);
        if (!evaluation && data.length > 0) {
          setSelectedUnit(data[0].id);
        } else if (data.length === 0) {
          setSelectedUnit("");
          setError(
            "이 훈련과정에 등록된 능력단위가 없습니다. 먼저 능력단위를 등록해주세요."
          );
        }
      } else {
        setCompetencyUnits([]);
        setSelectedUnit("");
      }
    } catch (err: any) {
      console.error("능력단위 로드 실패:", err);
      setError(`능력단위 로드 중 오류가 발생했습니다: ${err.message}`);
      setCompetencyUnits([]);
    }
  }, [selectedCourse, evaluation]);

  const loadStudents = useCallback(async () => {
    if (!selectedCourse) return;

    try {
      const response = await fetch(
        `/api/course-students?course_id=${selectedCourse}`
      );

      if (!response.ok) {
        console.error("훈련생 조회 오류");
        setStudents([]);
        return;
      }

      const data = await response.json();
      const studentList = data
        .filter((cs: any) => cs.profiles && cs.status === "active")
        .map((cs: any) => ({
          id: cs.student_id,
          email: cs.profiles.email,
          full_name: cs.profiles.full_name,
        }));
      setStudents(studentList);
    } catch (error: any) {
      console.error("훈련생 로드 실패:", error);
      setStudents([]);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (evaluation) {
      loadEvaluationData();
    }
  }, [evaluation, loadEvaluationData]);

  useEffect(() => {
    if (selectedCourse) {
      loadCompetencyUnits();
      loadStudents();
    }
  }, [selectedCourse, loadCompetencyUnits, loadStudents]);

  useEffect(() => {
    if (evaluation) {
      loadEvaluationData();
    }
  }, [evaluation, loadEvaluationData]);

  useEffect(() => {
    if (selectedCourse) {
      loadCompetencyUnits();
      loadStudents();
    }
  }, [selectedCourse, loadCompetencyUnits, loadStudents]);

  useEffect(() => {
    if (selectedUnit && selectedStudent) {
      loadSubmissions();
    } else {
      setSubmissions([]);
      setSelectedSubmissionId("");
    }
  }, [selectedUnit, selectedStudent, loadSubmissions]);

  const loadElements = async () => {
    if (!selectedUnit) return;

    try {
      const response = await fetch(
        `/api/competency-elements?competency_unit_id=${selectedUnit}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "능력단위요소를 불러올 수 없습니다."
        );
      }

      const data = await response.json();
      setElements(data || []);

      // 능력단위요소 로드 후 수행준거도 로드
      if (data && data.length > 0) {
        await loadPerformanceCriteria(data);
      } else {
        setPerformanceCriteria([]);
        setCriteriaScores({});
      }
    } catch (error: any) {
      console.error("능력단위요소 로드 실패:", error);
      setError(
        `능력단위요소를 불러오는 중 오류가 발생했습니다: ${error.message}`
      );
      setElements([]);
      setPerformanceCriteria([]);
      setCriteriaScores({});
    }
  };

  const loadPerformanceCriteria = async (
    elementsToLoad?: CompetencyElement[]
  ) => {
    const elementsToUse = elementsToLoad || elements;
    if (elementsToUse.length === 0) {
      setPerformanceCriteria([]);
      setCriteriaScores({});
      return;
    }

    setLoadingCriteria(true);
    try {
      // 모든 능력단위요소의 수행준거를 한 번에 로드
      const criteriaPromises = elementsToUse.map((element) =>
        fetch(`/api/performance-criteria?competency_element_id=${element.id}`)
          .then((res) => {
            if (!res.ok) {
              return res.json().then((err) => {
                console.error(
                  `수행준거 로드 실패 (element ${element.id}):`,
                  err
                );
                return { elementId: element.id, criteria: [] };
              });
            }
            return res.json();
          })
          .then((data) => ({
            elementId: element.id,
            criteria: Array.isArray(data) ? data : [],
          }))
          .catch((err) => {
            console.error(`수행준거 로드 오류 (element ${element.id}):`, err);
            return { elementId: element.id, criteria: [] };
          })
      );

      const criteriaResults = await Promise.all(criteriaPromises);
      const allCriteria: PerformanceCriteria[] = [];

      criteriaResults.forEach(({ criteria }) => {
        allCriteria.push(...criteria);
      });

      setPerformanceCriteria(allCriteria);

      // 초기 점수 설정
      if (!evaluation) {
        const initialScores: Record<
          string,
          { score: number; comments: string }
        > = {};
        allCriteria.forEach((criterion) => {
          initialScores[criterion.id] = { score: 0, comments: "" };
        });
        setCriteriaScores(initialScores);
      }
    } catch (error: any) {
      console.error("수행준거 로드 실패:", error);
      setPerformanceCriteria([]);
      setCriteriaScores({});
    } finally {
      setLoadingCriteria(false);
    }
  };

  const updateCriteriaScore = (criteriaId: string, score: number) => {
    setCriteriaScores({
      ...criteriaScores,
      [criteriaId]: {
        ...criteriaScores[criteriaId],
        score,
      },
    });
  };

  const updateCriteriaComments = (criteriaId: string, comments: string) => {
    setCriteriaScores({
      ...criteriaScores,
      [criteriaId]: {
        ...criteriaScores[criteriaId],
        comments,
      },
    });
  };

  // 총점 및 환산 점수 계산 (수행준거 기반)
  const calculateTotalScore = () => {
    let rawTotal = 0;
    let maxTotal = 0;

    performanceCriteria.forEach((criterion) => {
      const score = criteriaScores[criterion.id]?.score || 0;
      rawTotal += score;
      maxTotal += criterion.max_score;
    });

    const convertedScore =
      maxTotal > 0 ? Math.round((rawTotal / maxTotal) * 10000) / 100 : 0;

    return { rawTotal, maxTotal, convertedScore };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedUnit || !selectedStudent) {
        throw new Error("능력단위와 학생을 선택해주세요.");
      }

      if (performanceCriteria.length === 0) {
        throw new Error(
          "수행준거가 없습니다. 먼저 능력단위요소에 수행준거를 등록해주세요."
        );
      }

      const evaluationData: any = {
        competency_unit_id: selectedUnit,
        student_id: selectedStudent,
        teacher_id: teacherId,
        comments: comments || null,
        status,
        submission_id: selectedSubmissionId || null,
      };

      if (status === "submitted" || status === "confirmed") {
        evaluationData.evaluated_at = new Date().toISOString();
      }

      // 수행준거별 점수 데이터 준비
      const criteriaScoresData = performanceCriteria.map((criterion) => ({
        criteria_id: criterion.id,
        score: criteriaScores[criterion.id]?.score || 0,
        comments: criteriaScores[criterion.id]?.comments || null,
      }));

      let evaluationId: string;

      if (evaluation) {
        // 기존 평가 수정
        const response = await fetch("/api/evaluations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: evaluation.id,
            ...evaluationData,
            element_scores: criteriaScoresData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "평가 수정에 실패했습니다.");
        }

        const updatedData = await response.json();
        evaluationId = updatedData.id || evaluation.id;
      } else {
        // 새 평가 생성
        const response = await fetch("/api/evaluations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...evaluationData,
            element_scores: criteriaScoresData,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          
          // 기존 평가가 있는 경우 수정 페이지로 리다이렉트
          if (response.status === 409 && errorData.existing_evaluation_id) {
            if (confirm("이 학생에 대한 평가가 이미 존재합니다. 기존 평가를 수정하시겠습니까?")) {
              router.push(`/dashboard/evaluations/${errorData.existing_evaluation_id}/edit`);
              return;
            } else {
              throw new Error("이미 평가가 존재합니다.");
            }
          }
          
          throw new Error(errorData.error || "평가 생성에 실패했습니다.");
        }

        const createdData = await response.json();
        evaluationId = createdData.id;
      }

      // 상태가 "submitted"이고 새 평가인 경우 서명 모달 표시
      if (status === "submitted" && !evaluation) {
        setSavedEvaluationId(evaluationId);
        setShowSignatureModal(true);
        return; // 서명 완료 후 handleSignatureSuccess에서 처리
      }

      // 평가 목록 페이지로 이동 (자동 새로고침됨)
      router.push("/dashboard/evaluations");
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignatureSuccess = () => {
    setShowSignatureModal(false);
    setHasTeacherSignature(true);
    // 서명 완료 후 평가 목록으로 이동
    router.push("/dashboard/evaluations");
  };

  const handleSignatureCancel = () => {
    setShowSignatureModal(false);
    // 서명 취소 시 평가 목록으로 이동 (평가는 이미 저장됨)
    router.push("/dashboard/evaluations");
  };

  const { rawTotal, maxTotal, convertedScore } = calculateTotalScore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{evaluation ? "평가 수정" : "새 평가"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
              {error}
            </div>
          )}

          {/* 평가 작성과 수정 모두 동일한 UI 사용 */}
          <div className="space-y-2">
            <Label htmlFor="course">훈련과정 *</Label>
            <select
              id="course"
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setSelectedUnit("");
                setSelectedStudent("");
              }}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              required
              disabled={!!evaluation}
            >
              <option value="">선택하세요</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </select>
          </div>

          {selectedCourse && (
            <>
              <div className="space-y-2">
                <Label htmlFor="unit">능력단위 *</Label>
                <select
                  id="unit"
                  value={selectedUnit}
                  onChange={(e) => setSelectedUnit(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!!evaluation}
                >
                  <option value="">선택하세요</option>
                  {competencyUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.name} ({unit.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="student">학생 *</Label>
                <select
                  id="student"
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                  disabled={!!evaluation}
                >
                  <option value="">선택하세요</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </option>
                  ))}
                </select>
              </div>

              {selectedUnit && selectedStudent && submissions.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="submission">과제물 (선택사항)</Label>
                      <select
                        id="submission"
                        value={selectedSubmissionId}
                        onChange={(e) => setSelectedSubmissionId(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      >
                        <option value="">과제물 없이 평가</option>
                        {submissions.map((submission) => (
                          <option key={submission.id} value={submission.id}>
                            {submission.submission_type === "image"
                              ? `이미지: ${submission.file_name || "파일"}`
                              : `URL: ${submission.url}`}
                            {" - "}
                            {format(
                              new Date(submission.submitted_at),
                              "yyyy-MM-dd HH:mm",
                              { locale: ko }
                            )}
                          </option>
                        ))}
                      </select>
                      
                      {/* 선택된 과제물 미리보기 */}
                      {selectedSubmissionId && (() => {
                        const selectedSubmission = submissions.find(
                          (s) => s.id === selectedSubmissionId
                        );
                        if (!selectedSubmission) return null;
                        
                        return (
                          <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold">과제물 미리보기</h4>
                              <div className="flex gap-2">
                                {selectedSubmission.submission_type === "image" && selectedSubmission.file_url && (
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
                                {selectedSubmission.submission_type === "url" && selectedSubmission.url && (
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
                            
                            {selectedSubmission.submission_type === "image" && selectedSubmission.file_url && (
                              <SubmissionImagePreview submissionId={selectedSubmission.id} />
                            )}
                            
                            {selectedSubmission.submission_type === "url" && selectedSubmission.url && (
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
                        );
                      })()}
                    </div>
                  )}
            </>
          )}

          {selectedUnit &&
            elements.length > 0 &&
            performanceCriteria.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-4">
                    수행준거별 평가
                  </h3>
                  <div className="space-y-6">
                    {elements.map((element) => {
                      const elementCriteria = performanceCriteria.filter(
                        (pc) => pc.competency_element_id === element.id
                      );

                      if (elementCriteria.length === 0) return null;

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
                                <p className="text-sm mt-1">
                                  {element.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="space-y-3 pl-4 border-l-2 border-gray-200">
                            {elementCriteria.map((criterion) => (
                              <div key={criterion.id} className="space-y-2">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <Label className="font-medium">
                                      {criterion.name}
                                    </Label>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded ${
                                        criterion.difficulty === "high"
                                          ? "bg-red-100 text-red-800"
                                          : criterion.difficulty === "medium"
                                          ? "bg-yellow-100 text-yellow-800"
                                          : "bg-green-100 text-green-800"
                                      }`}
                                    >
                                      {criterion.difficulty === "high"
                                        ? "상"
                                        : criterion.difficulty === "medium"
                                        ? "중"
                                        : "하"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    만점: {criterion.max_score}점
                                  </div>
                                </div>
                                <div className="flex items-center gap-4">
                                  <Label className="w-16">점수</Label>
                                  <select
                                    value={
                                      criteriaScores[criterion.id]?.score || 0
                                    }
                                    onChange={(e) =>
                                      updateCriteriaScore(
                                        criterion.id,
                                        parseInt(e.target.value) || 0
                                      )
                                    }
                                    className="flex h-10 w-32 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                  >
                                    <option value="0">0점</option>
                                    {DIFFICULTY_SCORE_OPTIONS[
                                      criterion.difficulty
                                    ].map((score) => (
                                      <option key={score} value={score}>
                                        {score}점
                                      </option>
                                    ))}
                                  </select>
                                  <span className="text-sm text-muted-foreground">
                                    / {criterion.max_score}점
                                  </span>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">메모</Label>
                                  <Textarea
                                    value={
                                      criteriaScores[criterion.id]?.comments ||
                                      ""
                                    }
                                    onChange={(e) =>
                                      updateCriteriaComments(
                                        criterion.id,
                                        e.target.value
                                      )
                                    }
                                    rows={2}
                                    placeholder="이 수행준거에 대한 평가 의견을 입력하세요..."
                                    className="text-sm"
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 점수 요약 */}
                <div className="border rounded-lg p-4 bg-blue-50">
                  <h4 className="font-semibold mb-2">점수 요약</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      원점수: {rawTotal} / {maxTotal}점
                    </p>
                    <p className="text-lg font-bold text-blue-700">
                      환산 점수: {convertedScore} / 100점
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="comments">종합 평가 의견</Label>
                  <Textarea
                    id="comments"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={4}
                    placeholder="전체적인 평가 의견을 입력하세요..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">상태</Label>
                  <select
                    id="status"
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value as "draft" | "submitted" | "confirmed"
                      )
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="draft">임시저장</option>
                    <option value="submitted">제출</option>
                    {evaluation && <option value="confirmed">확정</option>}
                  </select>
                </div>
              </div>
            )}

          {selectedUnit && elements.length === 0 && (
            <div className="p-4 text-sm text-yellow-600 bg-yellow-50 rounded-md">
              이 능력단위에는 아직 능력단위요소가 등록되지 않았습니다. 먼저
              능력단위요소를 등록해주세요.
            </div>
          )}

          {selectedUnit &&
            elements.length > 0 &&
            !loadingCriteria &&
            performanceCriteria.length === 0 && (
              <div className="p-4 text-sm text-yellow-600 bg-yellow-50 rounded-md">
                능력단위요소에 수행준거가 등록되지 않았습니다. 먼저 수행준거를
                등록해주세요.
              </div>
            )}

          {selectedUnit && elements.length > 0 && loadingCriteria && (
            <div className="p-4 text-sm text-muted-foreground">
              수행준거를 불러오는 중...
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={
                loading ||
                !selectedUnit ||
                !selectedStudent ||
                performanceCriteria.length === 0
              }
            >
              {loading ? "저장 중..." : status === "submitted" && !evaluation ? "서명하고 제출" : evaluation ? "수정" : "저장"}
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

        {/* 서명 모달 */}
        {showSignatureModal && savedEvaluationId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <SignatureModal
                evaluationId={savedEvaluationId}
                signerId={teacherId}
                signerRole="teacher"
                onSuccess={handleSignatureSuccess}
                onCancel={handleSignatureCancel}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
