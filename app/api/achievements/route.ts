import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

// 캐싱 전략: 1분간 캐시 유지 (성취도 데이터는 자주 변경될 수 있음)
export const revalidate = 60;

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get("course_id");

    if (!courseId) {
      return NextResponse.json(
        { error: "course_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 1. 모든 필요한 데이터를 병렬로 한 번에 조회 (N+1 쿼리 문제 해결)
    const [courseResult, studentsResult, unitsResult] = await Promise.all([
      // 과정 정보
      supabase
        .from("training_courses")
        .select("id, name, code")
        .eq("id", courseId)
        .single(),

      // 학생 목록
      supabase
        .from("course_students")
        .select(
          `
          student_id,
          profiles!course_students_student_id_fkey (
            id,
            full_name,
            email
          )
        `
        )
        .eq("course_id", courseId)
        .eq("status", "active"),

      // 능력단위 목록 (한 번만 조회)
      supabase
        .from("competency_units")
        .select("id, name, code")
        .eq("course_id", courseId)
        .order("code", { ascending: true }),
    ]);

    if (courseResult.error || !courseResult.data) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const course = courseResult.data;
    const courseStudents = studentsResult.data || [];
    const competencyUnits = unitsResult.data || [];

    if (courseStudents.length === 0) {
      return NextResponse.json({
        course_id: courseId,
        course_name: course.name,
        course_code: course.code,
        students: [],
        course_average: 0,
        competency_units: [],
        competency_unit_average: 0,
        score_distribution: {
          over90: 0,
          over80: 0,
          over70: 0,
          over60: 0,
          under60: 0,
          total: 0,
        },
      });
    }

    // 2. 모든 평가를 한 번에 조회 (배치 쿼리)
    const unitIds = competencyUnits.map((u) => u.id);
    const studentIds = courseStudents
      .map((cs) => {
        const student = Array.isArray(cs.profiles)
          ? cs.profiles[0]
          : cs.profiles;
        return student?.id;
      })
      .filter(Boolean) as string[];

    // 능력단위나 학생이 없으면 빈 결과 반환
    if (unitIds.length === 0 || studentIds.length === 0) {
      return NextResponse.json({
        course_id: courseId,
        course_name: course.name,
        course_code: course.code,
        students: courseStudents.map((cs) => {
          const student = Array.isArray(cs.profiles)
            ? cs.profiles[0]
            : cs.profiles;
          return {
            student_id: cs.student_id,
            student_name: student?.full_name || student?.email || "",
            student_email: student?.email || "",
            evaluations_count: 0,
            average_score: 0,
          };
        }),
        course_average: 0,
        competency_units: competencyUnits.map((u) => ({
          unit_id: u.id,
          unit_name: u.name,
          unit_code: u.code,
          average_score: 0,
          evaluation_count: 0,
        })),
        competency_unit_average: 0,
        score_distribution: {
          over90: 0,
          over80: 0,
          over70: 0,
          over60: 0,
          under60: 0,
          total: 0,
        },
      });
    }

    // 모든 평가를 한 번에 조회
    const { data: allEvaluations } = await supabase
      .from("evaluations")
      .select("id, total_score, student_id, competency_unit_id")
      .in("competency_unit_id", unitIds)
      .in("student_id", studentIds)
      .not("total_score", "is", null);

    const evaluations = allEvaluations || [];

    // 3. 메모리에서 데이터 그룹화 및 계산
    // 학생별 평가 그룹화
    const studentEvaluationsMap = new Map<string, number[]>();
    evaluations.forEach((evaluation) => {
      if (!studentEvaluationsMap.has(evaluation.student_id)) {
        studentEvaluationsMap.set(evaluation.student_id, []);
      }
      studentEvaluationsMap
        .get(evaluation.student_id)!
        .push(evaluation.total_score);
    });

    // 학생별 성취도 계산
    const studentAchievements = courseStudents.map((cs) => {
      const student = Array.isArray(cs.profiles) ? cs.profiles[0] : cs.profiles;
      const scores = studentEvaluationsMap.get(cs.student_id) || [];
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      return {
        student_id: cs.student_id,
        student_name: student?.full_name || student?.email || "",
        student_email: student?.email || "",
        evaluations_count: scores.length,
        average_score: Math.round(avgScore * 100) / 100,
      };
    });

    // 과정 평균 계산
    const allStudentScores = Array.from(studentEvaluationsMap.values()).flat();
    const courseAverage =
      allStudentScores.length > 0
        ? allStudentScores.reduce((a, b) => a + b, 0) / allStudentScores.length
        : 0;

    // 능력단위별 평균 계산
    const unitEvaluationsMap = new Map<string, number[]>();
    evaluations.forEach((evaluation) => {
      const key = evaluation.competency_unit_id;
      if (!unitEvaluationsMap.has(key)) {
        unitEvaluationsMap.set(key, []);
      }
      unitEvaluationsMap.get(key)!.push(evaluation.total_score);
    });

    const unitData = competencyUnits.map((unit) => {
      const scores = unitEvaluationsMap.get(unit.id) || [];
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      return {
        unit_id: unit.id,
        unit_name: unit.name,
        unit_code: unit.code,
        average_score: Math.round(avgScore * 100) / 100,
        evaluation_count: scores.length,
      };
    });

    const competencyUnitAverage =
      unitData.length > 0 && unitData.some((u) => u.evaluation_count > 0)
        ? unitData
            .filter((u) => u.evaluation_count > 0)
            .reduce((sum, u) => sum + u.average_score, 0) /
          unitData.filter((u) => u.evaluation_count > 0).length
        : 0;

    // 점수 분포 계산 (이미 조회한 데이터 사용)
    const scoreDistribution = {
      over90: allStudentScores.filter((s) => s >= 90).length,
      over80: allStudentScores.filter((s) => s >= 80 && s < 90).length,
      over70: allStudentScores.filter((s) => s >= 70 && s < 80).length,
      over60: allStudentScores.filter((s) => s >= 60 && s < 70).length,
      under60: allStudentScores.filter((s) => s < 60).length,
      total: allStudentScores.length,
    };

    return NextResponse.json({
      course_id: courseId,
      course_name: course.name,
      course_code: course.code,
      students: studentAchievements.sort(
        (a, b) => b.average_score - a.average_score
      ),
      course_average: Math.round(courseAverage * 100) / 100,
      competency_units: unitData,
      competency_unit_average: Math.round(competencyUnitAverage * 100) / 100,
      score_distribution: scoreDistribution,
    });
  } catch (error: any) {
    console.error("학업 성취도 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
