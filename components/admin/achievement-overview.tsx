"use client";

import { useState, useEffect, useMemo } from "react";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CardSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { AchievementCharts } from "./achievement-charts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useCoursesQuery } from "@/lib/hooks/use-courses-query";
import { useAchievementsQuery } from "@/lib/hooks/use-achievements-query";

interface CourseAchievement {
  course_id: string;
  course_name: string;
  course_code: string;
  students: StudentAchievement[];
  course_average: number;
  competency_units?: any[];
  competency_unit_average?: number;
  score_distribution?: {
    over90: number;
    over80: number;
    over70: number;
    over60: number;
    under60: number;
    total: number;
  };
}

interface StudentAchievement {
  student_id: string;
  student_name: string;
  student_email: string;
  evaluations_count: number;
  average_score: number;
}

export function AchievementOverview() {
  const [selectedCourse, setSelectedCourse] = useState<string>("");

  // React Query를 사용한 데이터 페칭
  const {
    data: courses = [],
    isLoading: loadingCourses,
    error: coursesError,
  } = useCoursesQuery();

  const {
    data: achievement,
    isLoading: loadingAchievement,
    error: achievementError,
  } = useAchievementsQuery(selectedCourse || null);

  // 첫 번째 과정 자동 선택 (한 번만 실행)
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses.length]); // courses.length만 dependency로 사용하여 courses 배열 참조 변경 시에만 실행

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600 dark:text-green-400 font-bold";
    if (score >= 80) return "text-blue-600 dark:text-blue-400 font-semibold";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-500";
    if (score >= 60) return "text-orange-600 dark:text-orange-500";
    return "text-red-600 dark:text-red-400";
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
      ) : coursesError ? (
        <div className="p-4 text-center text-red-600">
          <p>훈련과정을 불러오는 중 오류가 발생했습니다.</p>
        </div>
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

          {achievementError ? (
            <div className="p-4 text-center text-red-600">
              <p>학업 성취도를 불러오는 중 오류가 발생했습니다.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* 과정 평균 - 로드되면 즉시 표시 */}
              {selectedCourse && (
                <Card>
                  <CardHeader>
                    <CardTitle>과정 평균 점수</CardTitle>
                    <CardDescription>
                      {achievement?.course_name || "로딩 중..."}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          평균 점수
                        </p>
                      </div>
                      <div className="text-right">
                        {loadingAchievement || !achievement ? (
                          <div className="h-12 w-20 bg-gray-200 dark:bg-gray-700 animate-pulse rounded" />
                        ) : (
                          <>
                            <p
                              className={`text-4xl font-bold ${getScoreColor(
                                achievement.course_average
                              )}`}
                            >
                              {achievement.course_average}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              / 100점
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* 학생별 성취도 테이블 - 로드되면 즉시 표시 */}
              {selectedCourse && (
                <Card>
                  <CardHeader>
                    <CardTitle>
                      훈련생별 평균 점수 (
                      {loadingAchievement || !achievement
                        ? "..."
                        : achievement.students.length}
                      명)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loadingAchievement || !achievement ? (
                      <TableSkeleton rows={5} cols={4} />
                    ) : achievement.students.length > 0 ? (
                      <div className="space-y-2">
                        {achievement.students.map((student, index) => (
                          <div
                            key={student.student_id}
                            className="flex justify-between items-center p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800/50 dark:bg-gray-900/30"
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
                  </CardContent>
                </Card>
              )}

              {/* 차트 섹션 - 필요한 데이터가 준비되면 순차적으로 표시 */}
              {selectedCourse &&
                (loadingAchievement || !achievement ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>평가결과 및 분석</CardTitle>
                      <CardDescription>
                        능력단위별 평가 결과와 점수 분포를 확인할 수 있습니다
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <CardSkeleton count={1} />
                    </CardContent>
                  </Card>
                ) : achievement.score_distribution &&
                  achievement.competency_unit_average !== undefined ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>평가결과 및 분석</CardTitle>
                      <CardDescription>
                        능력단위별 평가 결과와 점수 분포를 확인할 수 있습니다
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <AchievementCharts
                        scoreDistribution={achievement.score_distribution}
                        students={achievement.students}
                        competencyUnitAverage={
                          achievement.competency_unit_average
                        }
                      />
                    </CardContent>
                  </Card>
                ) : null)}

              {!selectedCourse && (
                <p className="text-sm text-muted-foreground">
                  과정을 선택해주세요.
                </p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
