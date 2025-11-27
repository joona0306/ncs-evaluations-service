"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useCanManage } from "@/stores/auth-store";

interface CourseStudentsProps {
  courseId: string;
}

export function CourseStudents({ courseId }: CourseStudentsProps) {
  const [students, setStudents] = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState("");
  const canManage = useCanManage();

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/course-students?course_id=${courseId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련생을 불러올 수 없습니다.");
      }

      const data = await response.json();
      setStudents(data || []);
    } catch (error: any) {
      console.error("훈련생 로드 실패:", error);
      setError(`훈련생 로드 중 예외 발생: ${error.message}`);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadAllStudents = useCallback(async () => {
    try {
      const response = await fetch(`/api/profiles?role=student`);

      if (!response.ok) {
        console.error("모든 훈련생 조회 오류");
        setAllStudents([]);
        return;
      }

      const responseData = await response.json();

      // 페이징 응답 형식 처리
      const studentsList = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || []);

      if (Array.isArray(studentsList)) {
        setAllStudents(studentsList);
      } else {
        setAllStudents([]);
      }
    } catch (error: any) {
      console.error("모든 훈련생 로드 실패:", error);
      setAllStudents([]);
    }
  }, []);

  useEffect(() => {
    loadStudents();
    loadAllStudents();
  }, [loadStudents, loadAllStudents]);

  const handleAdd = async () => {
    if (!selectedStudent) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/course-students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course_id: courseId, student_id: selectedStudent }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련생 추가에 실패했습니다.");
      }

      setSelectedStudent("");
      loadStudents();
    } catch (error: any) {
      console.error("훈련생 추가 중 예외 발생:", error);
      setError(`훈련생 추가 중 예외 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (studentId: string) => {
    if (!confirm("이 훈련생을 과정에서 제외하시겠습니까?")) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/course-students?course_id=${courseId}&student_id=${studentId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련생 삭제에 실패했습니다.");
      }

      loadStudents();
    } catch (error: any) {
      console.error("훈련생 삭제 중 예외 발생:", error);
      setError(`훈련생 삭제 중 예외 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (studentId: string, status: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/course-students", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          student_id: studentId,
          status,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "상태 변경에 실패했습니다.");
      }

      loadStudents();
    } catch (error: any) {
      console.error("상태 변경 중 예외 발생:", error);
      setError(`상태 변경 중 예외 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>훈련생</CardTitle>
            <CardDescription>이 훈련과정의 훈련생을 관리합니다</CardDescription>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Select
                value={selectedStudent}
                onChange={(e) => setSelectedStudent(e.target.value)}
                className="w-[200px]"
              >
                <option value="">학생 선택</option>
                {Array.isArray(allStudents) && allStudents
                  .filter(
                    (student) =>
                      !students.some((s) => s.student_id === student.id)
                  )
                  .map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name || student.email}
                    </option>
                  ))}
              </Select>
              <Button onClick={handleAdd} disabled={loading || !selectedStudent}>
                추가
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        ) : students.length > 0 ? (
          <div className="space-y-2">
            {students.map((student) => (
              <div
                key={student.student_id}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div>
                  <p className="font-medium">
                    {student.profiles?.full_name || student.profiles?.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {student.profiles?.email}
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(student.student_id)}
                    aria-label={`${student.profiles?.full_name || student.profiles?.email} 훈련생 삭제`}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">등록된 훈련생이 없습니다.</p>
        )}
      </CardContent>
    </Card>
  );
}

