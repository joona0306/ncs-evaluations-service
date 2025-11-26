"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface EvaluationFormProps {
  courses: any[];
  teacherId: string;
  evaluation?: {
    id: string;
    competency_unit_id: string;
    student_id: string;
    scores: any;
    comments: string | null;
    status: string;
  };
}

export function EvaluationForm({
  courses,
  teacherId,
  evaluation,
}: EvaluationFormProps) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [competencyUnits, setCompetencyUnits] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [scores, setScores] = useState<any>(evaluation?.scores || {});
  const [comments, setComments] = useState(evaluation?.comments || "");
  const [status, setStatus] = useState(evaluation?.status || "draft");

  const loadEvaluationData = useCallback(async () => {
    if (!evaluation) return;

    const { data: evalData } = await supabase
      .from("evaluations")
      .select(
        `
        *,
        competency_units(*)
      `
      )
      .eq("id", evaluation.id)
      .single();

    if (evalData) {
      const unit = evalData.competency_units;
      setSelectedCourse(unit.course_id);
      setSelectedUnit(evaluation.competency_unit_id);
      setSelectedStudent(evaluation.student_id);
      setScores(evaluation.scores || {});
      setComments(evaluation.comments || "");
      setStatus(evaluation.status);
    }
  }, [evaluation, supabase]);

  const loadCompetencyUnits = useCallback(async () => {
    const { data } = await supabase
      .from("competency_units")
      .select("*")
      .eq("course_id", selectedCourse);

    if (data) {
      setCompetencyUnits(data);
      if (!evaluation && data.length > 0) {
        setSelectedUnit(data[0].id);
      }
    }
  }, [selectedCourse, evaluation, supabase]);

  const loadStudents = useCallback(async () => {
    const { data } = await supabase
      .from("course_students")
      .select(
        `
        student_id,
        profiles!course_students_student_id_fkey (
          id,
          email,
          full_name,
          phone,
          role
        )
      `
      )
      .eq("course_id", selectedCourse)
      .eq("status", "active");

    if (data) {
      const studentList = data
        .filter((cs: any) => cs.profiles) // profiles가 null이 아닌 경우만 필터
        .map((cs: any) => ({
          id: cs.student_id,
          email: cs.profiles.email,
          full_name: cs.profiles.full_name,
          phone: cs.profiles.phone,
          role: cs.profiles.role,
        }));
      setStudents(studentList);
    }
  }, [selectedCourse, supabase]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (!selectedUnit || !selectedStudent) {
        throw new Error("능력단위와 학생을 선택해주세요.");
      }

      const evaluationData: any = {
        competency_unit_id: selectedUnit,
        student_id: selectedStudent,
        teacher_id: teacherId,
        scores,
        comments: comments || null,
        status,
      };

      if (status === "submitted" || status === "confirmed") {
        evaluationData.evaluated_at = new Date().toISOString();
      }

      const url = evaluation ? "/api/evaluations" : "/api/evaluations";
      const method = evaluation ? "PUT" : "POST";

      const requestBody = evaluation
        ? { id: evaluation.id, ...evaluationData, element_scores: [] }
        : { ...evaluationData, element_scores: [] };

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "저장에 실패했습니다.");
      }

      router.push("/dashboard/evaluations");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "저장에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const updateScore = (key: string, value: number) => {
    setScores({ ...scores, [key]: value });
  };

  const currentUnit = competencyUnits.find((u) => u.id === selectedUnit);
  const criteria = currentUnit?.evaluation_criteria || {};

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

          {!evaluation && (
            <>
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
                    >
                      <option value="">선택하세요</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.full_name || student.email}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </>
          )}

          {selectedUnit && currentUnit && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4">평가 기준</h3>
                <div className="space-y-3">
                  {Object.entries(criteria).map(
                    ([key, value]: [string, any]) => (
                      <div key={key} className="space-y-2">
                        <Label>{value.label || key}</Label>
                        <div className="flex items-center gap-4">
                          <Input
                            type="number"
                            min="0"
                            max={value.max || 100}
                            value={scores[key] || 0}
                            onChange={(e) =>
                              updateScore(key, parseInt(e.target.value) || 0)
                            }
                            className="w-24"
                          />
                          <span className="text-sm text-muted-foreground">
                            / {value.max || 100}점
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comments">평가 의견</Label>
                <Textarea
                  id="comments"
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">상태</Label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="draft">임시저장</option>
                  <option value="submitted">제출</option>
                  {evaluation && <option value="confirmed">확정</option>}
                </select>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={loading || !selectedUnit || !selectedStudent}
            >
              {loading ? "저장 중..." : evaluation ? "수정" : "저장"}
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
      </CardContent>
    </Card>
  );
}
