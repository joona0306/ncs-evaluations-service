"use client";

import { useState, useEffect } from "react";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";

interface CourseAchievement {
  course_id: string;
  course_name: string;
  course_code: string;
  students: StudentAchievement[];
  course_average: number;
}

interface StudentAchievement {
  student_id: string;
  student_name: string;
  student_email: string;
  evaluations_count: number;
  average_score: number;
}

export function AchievementOverview() {
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [achievement, setAchievement] = useState<CourseAchievement | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingAchievement, setLoadingAchievement] = useState(false);

  useEffect(() => {
    loadCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedCourse && courses.length > 0) {
      loadAchievement();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourse, courses.length]);

  const loadCourses = async () => {
    setLoadingCourses(true);
    try {
      const response = await fetch("/api/courses", {
        cache: "no-store",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "훈련과정을 불러올 수 없습니다.");
      }

      const data = await response.json();
      if (data && Array.isArray(data)) {
        setCourses(data);
        if (data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0].id);
        }
      } else {
        setCourses([]);
      }
    } catch (error: any) {
      console.error("훈련과정 로드 실패:", error);
      setCourses([]);
    } finally {
      setLoadingCourses(false);
    }
  };

  const loadAchievement = async () => {
    setLoadingAchievement(true);
    try {
      if (!selectedCourse) {
        setLoadingAchievement(false);
        return;
      }

      const response = await fetch(
        `/api/achievements?course_id=${selectedCourse}`,
        { cache: "no-store" }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "학업 성취도를 불러올 수 없습니다.");
      }

      const data = await response.json();
      setAchievement(data);
    } catch (error: any) {
      console.error("성취도 조회 오류:", error);
      setAchievement(null);
    } finally {
      setLoadingAchievement(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 font-bold";
    if (score >= 80) return "text-blue-600 font-semibold";
    if (score >= 70) return "text-yellow-600";
    if (score >= 60) return "text-orange-600";
    return "text-red-600";
  };

  const getScoreGrade = (score: number) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  return (
    <div className="space-y-4">
      {loadingCourses ? (
        <CardSkeleton count={2} />
      ) : courses.length === 0 ? (
        <div className="p-4 text-center text-muted-foreground">
          <p>등록된 훈련과정이 없습니다.</p>
          <p className="text-sm mt-2">먼저 훈련과정을 생성해주세요.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            <Label htmlFor="course">훈련과정 선택</Label>
            <Select
              id="course"
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name} ({course.code})
                </option>
              ))}
            </Select>
          </div>

          {loadingAchievement ? (
            <div className="space-y-4">
              <CardSkeleton count={1} />
              <TableSkeleton rows={5} cols={4} />
            </div>
          ) : achievement ? (
            <div className="space-y-4">
              {/* 과정 평균 */}
              <div className="p-4 border rounded-lg bg-blue-50">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      과정 평균 점수
                    </p>
                    <p className="text-lg font-semibold">
                      {achievement.course_name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-4xl font-bold ${getScoreColor(
                        achievement.course_average
                      )}`}
                    >
                      {achievement.course_average}
                    </p>
                    <p className="text-sm text-muted-foreground">/ 100점</p>
                  </div>
                </div>
              </div>

              {/* 학생별 성취도 */}
              <div>
                <h4 className="font-semibold mb-3">
                  훈련생별 평균 점수 ({achievement.students.length}명)
                </h4>
                {achievement.students.length > 0 ? (
                  <div className="space-y-2">
                    {achievement.students.map((student, index) => (
                      <div
                        key={student.student_id}
                        className="flex justify-between items-center p-3 border rounded hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground w-6">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium">
                              {student.student_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {student.student_email}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          {student.evaluations_count > 0 ? (
                            <>
                              <p
                                className={`text-2xl font-bold ${getScoreColor(
                                  student.average_score
                                )}`}
                              >
                                {student.average_score}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                평가 {student.evaluations_count}건 ·{" "}
                                {getScoreGrade(student.average_score)} 등급
                              </p>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              평가 없음
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    등록된 훈련생이 없습니다.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              과정을 선택해주세요.
            </p>
          )}
        </>
      )}
    </div>
  );
}
