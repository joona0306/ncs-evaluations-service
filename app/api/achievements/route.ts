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

    // 과정 정보 조회
    const { data: course, error: courseError } = await supabase
      .from("training_courses")
      .select("id, name, code")
      .eq("id", courseId)
      .single();

    if (courseError || !course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // 해당 과정의 모든 학생 조회
    const { data: courseStudents, error: studentsError } = await supabase
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
      .eq("status", "active");

    if (studentsError) {
      console.error("학생 조회 오류:", studentsError);
      return NextResponse.json(
        { error: studentsError.message },
        { status: 500 }
      );
    }

    if (!courseStudents || courseStudents.length === 0) {
      return NextResponse.json({
        course_id: courseId,
        course_name: course.name,
        course_code: course.code,
        students: [],
        course_average: 0,
      });
    }

    // 각 학생의 평가 점수 조회
    const studentAchievements: any[] = [];
    let totalScore = 0;
    let totalEvaluations = 0;

    for (const cs of courseStudents) {
      const profile = Array.isArray(cs.profiles) ? cs.profiles[0] : cs.profiles;

      if (!profile) continue;

      // 해당 과정의 능력단위 ID 목록 조회
      const { data: competencyUnits } = await supabase
        .from("competency_units")
        .select("id")
        .eq("course_id", courseId);

      if (!competencyUnits || competencyUnits.length === 0) {
        studentAchievements.push({
          student_id: cs.student_id,
          student_name: profile.full_name || profile.email,
          student_email: profile.email,
          evaluations_count: 0,
          average_score: 0,
        });
        continue;
      }

      const unitIds = competencyUnits.map((cu) => cu.id);

      // 해당 학생의 평가 점수 조회
      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("id, total_score")
        .eq("student_id", cs.student_id)
        .in("competency_unit_id", unitIds)
        .not("total_score", "is", null);

      const scores =
        evaluations?.map((e) => e.total_score).filter((s) => s !== null) || [];
      const avgScore =
        scores.length > 0
          ? scores.reduce((a, b) => a + b, 0) / scores.length
          : 0;

      studentAchievements.push({
        student_id: cs.student_id,
        student_name: profile.full_name || profile.email,
        student_email: profile.email,
        evaluations_count: scores.length,
        average_score: Math.round(avgScore * 100) / 100,
      });

      if (scores.length > 0) {
        totalScore += avgScore;
        totalEvaluations++;
      }
    }

    const courseAverage =
      totalEvaluations > 0 ? totalScore / totalEvaluations : 0;

    // 능력단위별 평가 데이터 조회
    const { data: competencyUnits } = await supabase
      .from("competency_units")
      .select("id, name, code")
      .eq("course_id", courseId)
      .order("code", { ascending: true });

    const unitData: any[] = [];
    let totalUnitScore = 0;
    let totalUnitEvaluations = 0;

    if (competencyUnits && competencyUnits.length > 0) {
      for (const unit of competencyUnits) {
        // 해당 능력단위의 모든 평가 조회
        const { data: unitEvaluations } = await supabase
          .from("evaluations")
          .select("total_score")
          .eq("competency_unit_id", unit.id)
          .not("total_score", "is", null);

        const unitScores =
          unitEvaluations
            ?.map((e) => e.total_score)
            .filter((s) => s !== null) || [];
        const unitAverage =
          unitScores.length > 0
            ? unitScores.reduce((a, b) => a + b, 0) / unitScores.length
            : 0;

        unitData.push({
          unit_id: unit.id,
          unit_name: unit.name,
          unit_code: unit.code,
          average_score: Math.round(unitAverage * 100) / 100,
          evaluation_count: unitScores.length,
        });

        if (unitScores.length > 0) {
          totalUnitScore += unitAverage;
          totalUnitEvaluations++;
        }
      }
    }

    const competencyUnitAverage =
      totalUnitEvaluations > 0 ? totalUnitScore / totalUnitEvaluations : 0;

    // 점수 분포 계산 (모든 평가 점수 기준)
    const allScores: number[] = [];
    for (const cs of courseStudents) {
      const profile = Array.isArray(cs.profiles) ? cs.profiles[0] : cs.profiles;
      if (!profile) continue;

      const { data: competencyUnits } = await supabase
        .from("competency_units")
        .select("id")
        .eq("course_id", courseId);

      if (!competencyUnits || competencyUnits.length === 0) continue;

      const unitIds = competencyUnits.map((cu) => cu.id);
      const { data: evaluations } = await supabase
        .from("evaluations")
        .select("total_score")
        .eq("student_id", cs.student_id)
        .in("competency_unit_id", unitIds)
        .not("total_score", "is", null);

      const scores =
        evaluations?.map((e) => e.total_score).filter((s) => s !== null) || [];
      allScores.push(...scores);
    }

    // 점수 분포 계산
    const scoreDistribution = {
      over90: allScores.filter((s) => s >= 90).length,
      over80: allScores.filter((s) => s >= 80 && s < 90).length,
      over70: allScores.filter((s) => s >= 70 && s < 80).length,
      over60: allScores.filter((s) => s >= 60 && s < 70).length,
      under60: allScores.filter((s) => s < 60).length,
      total: allScores.length,
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
