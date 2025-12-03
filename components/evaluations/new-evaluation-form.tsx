"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CompetencyElement,
  PerformanceCriteria,
  Evaluation,
  EvaluationCriteriaScore,
} from "@/types/evaluation";
import dynamic from "next/dynamic";

// SignatureModal을 동적 임포트로 지연 로딩
const SignatureModal = dynamic(
  () =>
    import("@/components/signatures/signature-modal").then((mod) => ({
      default: mod.SignatureModal,
    })),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">
        서명 모달 로딩 중...
      </div>
    ),
    ssr: false,
  }
);
import { CourseSelectionSection } from "./evaluation-form-sections/course-selection-section";
import { SubmissionSelectionSection } from "./evaluation-form-sections/submission-selection-section";
import { CriteriaScoringSection } from "./evaluation-form-sections/criteria-scoring-section";
import { ScoreSummarySection } from "./evaluation-form-sections/score-summary-section";

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
  const [savedEvaluationId, setSavedEvaluationId] = useState<string | null>(
    null
  );
  const [hasTeacherSignature, setHasTeacherSignature] = useState(false);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string>(
    evaluation?.submission_id || ""
  );
  // 초기 로드 시 URL 파라미터의 submission_id를 저장 (한 번만 사용)
  const initialSubmissionIdRef = useRef<string | null>(null);
  // URL 파라미터로 설정된 selectedUnit을 추적 (자동 선택 방지)
  const initialUnitIdRef = useRef<string | null>(null);

  // URL 파라미터에서 초기값 설정 (렌더링 후)
  useEffect(() => {
    if (!evaluation) {
      const unitId = searchParams.get("competency_unit_id");
      const studentId = searchParams.get("student_id");
      const submissionId = searchParams.get("submission_id");

      if (unitId) {
        initialUnitIdRef.current = unitId;
        setSelectedUnit(unitId);
      }
      if (studentId) {
        setSelectedStudent(studentId);
      }
      if (submissionId) {
        // 초기 submission_id 저장 (한 번만 사용)
        initialSubmissionIdRef.current = submissionId;
        setSelectedSubmissionId(submissionId);
      }
    } else {
      // 수정 페이지에서 URL 파라미터로 submission_id가 전달된 경우
      const submissionId = searchParams.get("submission_id");
      if (submissionId) {
        initialSubmissionIdRef.current = submissionId;
        setSelectedSubmissionId(submissionId);
      }
    }
  }, [evaluation, searchParams]);

  const loadSubmissions = useCallback(async () => {
    if (!selectedUnit || !selectedStudent) {
      console.log("loadSubmissions: selectedUnit 또는 selectedStudent가 없음", {
        selectedUnit,
        selectedStudent,
      });
      setSubmissions([]);
      return;
    }

    console.log("loadSubmissions 시작:", { selectedUnit, selectedStudent });

    try {
      const response = await fetch(
        `/api/submissions?competency_unit_id=${selectedUnit}&student_id=${selectedStudent}`
      );

      if (!response.ok) {
        console.error(
          "과제물 조회 오류:",
          response.status,
          response.statusText
        );
        setSubmissions([]);
        return;
      }

      const data = await response.json();
      // API 응답이 페이지네이션 객체인 경우 data 속성 확인
      const submissionsArray = Array.isArray(data) ? data : data?.data || [];

      console.log("과제물 조회 결과:", {
        selectedUnit,
        selectedStudent,
        responseData: data,
        submissionsArray,
        count: submissionsArray.length,
        firstSubmission: submissionsArray[0]
          ? {
              id: submissionsArray[0].id,
              submission_type: submissionsArray[0].submission_type,
              submitted_at: submissionsArray[0].submitted_at,
            }
          : null,
      });

      // state 업데이트
      setSubmissions(submissionsArray);
      console.log(
        "✅ setSubmissions 호출 완료:",
        submissionsArray.length,
        "개"
      );

      // 초기 로드 시 URL 파라미터의 submission_id가 있으면 선택
      if (submissionsArray.length > 0) {
        const submissionIdFromInitial = initialSubmissionIdRef.current;
        if (
          submissionIdFromInitial &&
          submissionsArray.some((s: any) => s.id === submissionIdFromInitial)
        ) {
          // 초기 submission_id가 있으면 선택
          setSelectedSubmissionId(submissionIdFromInitial);
          console.log(
            "초기 URL 파라미터의 submission_id 선택:",
            submissionIdFromInitial
          );
          // 한 번 사용했으면 null로 설정하여 재사용 방지
          initialSubmissionIdRef.current = null;
        } else {
          // submission_id가 없으면 가장 최신 과제물 선택
          // setSelectedSubmissionId를 함수형 업데이트로 사용하여 현재 값을 확인
          setSelectedSubmissionId((currentId) => {
            if (
              !currentId ||
              !submissionsArray.some((s: any) => s.id === currentId)
            ) {
              const latest = submissionsArray.sort(
                (a: any, b: any) =>
                  new Date(b.submitted_at).getTime() -
                  new Date(a.submitted_at).getTime()
              )[0];
              console.log("가장 최신 과제물 자동 선택:", latest.id);
              return latest.id;
            }
            return currentId;
          });
        }
      }
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

  // selectedUnit과 selectedStudent가 변경될 때만 과제물 로드
  useEffect(() => {
    if (selectedUnit && selectedStudent) {
      console.log("useEffect: loadSubmissions 호출", {
        selectedUnit,
        selectedStudent,
        currentSubmissionsCount: submissions.length,
      });
      loadSubmissions();
    } else {
      setSubmissions([]);
      setSelectedSubmissionId("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUnit, selectedStudent]);

  const loadEvaluationData = useCallback(async () => {
    if (!evaluation) return;

    try {
      const response = await fetch(`/api/evaluations/${evaluation.id}`);
      if (!response.ok) {
        throw new Error("평가 데이터를 불러올 수 없습니다.");
      }

      const evalData = await response.json();
      // competency_units가 배열 또는 객체일 수 있음
      const unit = Array.isArray(evalData.competency_units)
        ? evalData.competency_units[0]
        : evalData.competency_units;

      // course_id 추출 (training_courses가 중첩되어 있을 수 있음)
      let courseId: string | null = null;
      if (unit) {
        // 직접 course_id가 있는 경우
        if (unit.course_id) {
          courseId = unit.course_id;
        }
        // training_courses가 중첩되어 있는 경우
        else if (unit.training_courses) {
          const course = Array.isArray(unit.training_courses)
            ? unit.training_courses[0]
            : unit.training_courses;
          courseId = course?.id || null;
        }
      }

      if (courseId) {
        setSelectedCourse(courseId);
      }
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
          // URL 파라미터로 이미 selectedUnit이 설정된 경우 자동 선택하지 않음
          if (!initialUnitIdRef.current) {
            setSelectedUnit(data[0].id);
          } else {
            // URL 파라미터의 unitId가 현재 로드된 능력단위 목록에 있는지 확인
            const unitExists = data.some(
              (u: any) => u.id === initialUnitIdRef.current
            );
            if (!unitExists) {
              // URL 파라미터의 unitId가 목록에 없으면 첫 번째 항목 선택
              setSelectedUnit(data[0].id);
              initialUnitIdRef.current = null; // 초기값 사용 완료
            }
            // unitExists가 true면 이미 URL 파라미터로 설정된 selectedUnit 유지
          }
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
        .filter((cs: any) => {
          // profiles가 배열 또는 객체일 수 있음
          const profile = Array.isArray(cs.profiles)
            ? cs.profiles[0]
            : cs.profiles;
          return profile && cs.status === "active";
        })
        .map((cs: any) => {
          // profiles가 배열 또는 객체일 수 있음
          const profile = Array.isArray(cs.profiles)
            ? cs.profiles[0]
            : cs.profiles;
          return {
            id: cs.student_id,
            email: profile?.email || "",
            full_name: profile?.full_name || "",
          };
        });
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
            if (
              confirm(
                "이 학생에 대한 평가가 이미 존재합니다. 기존 평가를 수정하시겠습니까?"
              )
            ) {
              router.push(
                `/dashboard/evaluations/${errorData.existing_evaluation_id}/edit`
              );
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
            <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md">
              {error}
            </div>
          )}

          {/* 평가 작성과 수정 모두 동일한 UI 사용 */}
          <CourseSelectionSection
            courses={courses}
            selectedCourse={selectedCourse}
            onCourseChange={setSelectedCourse}
            competencyUnits={competencyUnits}
            selectedUnit={selectedUnit}
            onUnitChange={setSelectedUnit}
            students={students}
            selectedStudent={selectedStudent}
            onStudentChange={setSelectedStudent}
            disabled={!!evaluation}
          />

          {selectedUnit && selectedStudent && (
            <SubmissionSelectionSection
              submissions={submissions}
              selectedSubmissionId={selectedSubmissionId}
              onSubmissionChange={setSelectedSubmissionId}
            />
          )}

          {selectedUnit && (
            <div className="space-y-4">
              <CriteriaScoringSection
                elements={elements}
                performanceCriteria={performanceCriteria}
                criteriaScores={criteriaScores}
                onScoreChange={updateCriteriaScore}
                onCommentsChange={updateCriteriaComments}
                loading={loadingCriteria}
              />

              {elements.length > 0 && performanceCriteria.length > 0 && (
                <>
                  <ScoreSummarySection
                    rawTotal={rawTotal}
                    maxTotal={maxTotal}
                    convertedScore={convertedScore}
                  />

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
                </>
              )}
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
              aria-label={
                loading
                  ? "저장 중"
                  : status === "submitted" && !evaluation
                  ? "서명하고 제출"
                  : evaluation
                  ? "평가 수정"
                  : "평가 저장"
              }
              aria-disabled={
                loading ||
                !selectedUnit ||
                !selectedStudent ||
                performanceCriteria.length === 0
              }
            >
              {loading
                ? "저장 중..."
                : status === "submitted" && !evaluation
                ? "서명하고 제출"
                : evaluation
                ? "수정"
                : "저장"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              aria-label="취소하고 뒤로가기"
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
