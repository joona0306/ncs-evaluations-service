"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface UserCourseAssignmentProps {
  userId: string;
  userRole: "teacher" | "student";
  onUpdate?: () => void;
}

export function UserCourseAssignment({
  userId,
  userRole,
  onUpdate,
}: UserCourseAssignmentProps) {
  const [courses, setCourses] = useState<any[]>([]);
  const [assignedCourses, setAssignedCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCourses();
    loadAssignedCourses();
  }, [userId]);

  const loadCourses = async () => {
    try {
      const response = await fetch("/api/courses");
      if (response.ok) {
        const data = await response.json();
        setCourses(data || []);
      }
    } catch (error) {
      console.error("훈련과정 로드 오류:", error);
    }
  };

  const loadAssignedCourses = async () => {
    try {
      if (userRole === "teacher") {
        const response = await fetch(`/api/course-teachers?teacher_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setAssignedCourses(data || []);
        }
      } else {
        const response = await fetch(`/api/course-students?student_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          setAssignedCourses(data.map((cs: any) => ({
            ...cs.training_courses,
            status: cs.status,
          })).filter((c: any) => c && c.id));
        }
      }
    } catch (error) {
      console.error("배정된 훈련과정 로드 오류:", error);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourse) return;
    setLoading(true);

    try {
      const url = userRole === "teacher" ? "/api/course-teachers" : "/api/course-students";
      
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          course_id: selectedCourse,
          [userRole === "teacher" ? "teacher_id" : "student_id"]: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련과정 배정에 실패했습니다.");
      }

      setSelectedCourse("");
      loadAssignedCourses();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("훈련과정 배정 오류:", error);
      alert(error.message || "훈련과정 배정에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (courseId: string) => {
    if (!confirm("이 훈련과정 배정을 취소하시겠습니까?")) return;
    setLoading(true);

    try {
      const url = userRole === "teacher" ? "/api/course-teachers" : "/api/course-students";
      const params = new URLSearchParams({
        course_id: courseId,
        [userRole === "teacher" ? "teacher_id" : "student_id"]: userId,
      });

      const response = await fetch(`${url}?${params}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련과정 제거에 실패했습니다.");
      }

      loadAssignedCourses();
      if (onUpdate) onUpdate();
    } catch (error: any) {
      console.error("훈련과정 제거 오류:", error);
      alert(error.message || "훈련과정 제거에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const availableCourses = courses.filter(
    (c) => !assignedCourses.some((ac) => ac.id === c.id)
  );

  return (
    <div className="space-y-2">
      {assignedCourses.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {assignedCourses.map((course) => (
            <div
              key={course.id}
              className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded"
            >
              <span>{course.name}</span>
              <button
                onClick={() => handleRemove(course.id)}
                className="hover:bg-blue-100 rounded p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs"
          disabled={loading || availableCourses.length === 0}
        >
          <option value="">훈련과정 선택</option>
          {availableCourses.map((course) => (
            <option key={course.id} value={course.id}>
              {course.name} ({course.code})
            </option>
          ))}
        </select>
        <Button
          size="sm"
          onClick={handleAssign}
          disabled={!selectedCourse || loading}
          className="h-8 text-xs"
        >
          배정
        </Button>
      </div>
    </div>
  );
}

