"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useCanManage } from "@/stores/auth-store";

interface CourseTeachersProps {
  courseId: string;
}

export function CourseTeachers({ courseId }: CourseTeachersProps) {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [allTeachers, setAllTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const canManage = useCanManage();

  const loadTeachers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/course-teachers?course_id=${courseId}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련교사를 불러올 수 없습니다.");
      }

      const data = await response.json();
      setTeachers(data || []);
    } catch (error: any) {
      console.error("훈련교사 로드 실패:", error);
      setError(`훈련교사 로드 중 예외 발생: ${error.message}`);
      setTeachers([]);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  const loadAllTeachers = useCallback(async () => {
    try {
      const response = await fetch(`/api/profiles?role=teacher`);

      if (!response.ok) {
        console.error("모든 훈련교사 조회 오류");
        setAllTeachers([]);
        return;
      }

      const responseData = await response.json();

      // 페이징 응답 형식 처리
      const teachersList = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || []);

      if (Array.isArray(teachersList)) {
        setAllTeachers(teachersList);
      } else {
        setAllTeachers([]);
      }
    } catch (error: any) {
      console.error("모든 훈련교사 로드 실패:", error);
      setAllTeachers([]);
    }
  }, []);

  useEffect(() => {
    loadTeachers();
    loadAllTeachers();
  }, [loadTeachers, loadAllTeachers]);

  const handleAdd = async () => {
    if (!selectedTeacher) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/course-teachers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: courseId,
          teacher_id: selectedTeacher,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련교사 추가에 실패했습니다.");
      }

      setSelectedTeacher("");
      loadTeachers();
    } catch (error: any) {
      console.error("훈련교사 추가 중 예외 발생:", error);
      setError(`훈련교사 추가 중 예외 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (teacherId: string) => {
    if (!confirm("이 훈련교사를 과정에서 제외하시겠습니까?")) return;

    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/course-teachers?course_id=${courseId}&teacher_id=${teacherId}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련교사 삭제에 실패했습니다.");
      }

      loadTeachers();
    } catch (error: any) {
      console.error("훈련교사 삭제 중 예외 발생:", error);
      setError(`훈련교사 삭제 중 예외 발생: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>훈련교사</CardTitle>
            <CardDescription>
              이 훈련과정의 훈련교사를 관리합니다
            </CardDescription>
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Select
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className="w-[200px]"
              >
                <option value="">교사 선택</option>
                {Array.isArray(allTeachers) && allTeachers
                  .filter(
                    (teacher) => !teachers.some((t) => t.teacher_id === teacher.id || t.id === teacher.id)
                  )
                  .map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name || teacher.email}
                    </option>
                  ))}
              </Select>
              <Button
                onClick={handleAdd}
                disabled={loading || !selectedTeacher}
              >
                추가
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md mb-4">
            {error}
          </div>
        )}
        {loading ? (
          <p className="text-sm text-muted-foreground">로딩 중...</p>
        ) : teachers.length > 0 ? (
          <div className="space-y-2">
            {teachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex justify-between items-center p-3 border rounded"
              >
                <div>
                  <p className="font-medium">
                    {teacher.full_name || teacher.email}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {teacher.email}
                  </p>
                </div>
                {canManage && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemove(teacher.id)}
                  >
                    삭제
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            등록된 훈련교사가 없습니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
