import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get("id");
    const filePath = searchParams.get("path");

    if (!submissionId && !filePath) {
      return NextResponse.json(
        { error: "id or path is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 제출 정보 확인
    if (submissionId) {
      const { data: submission, error: subError } = await supabase
        .from("submissions")
        .select(`
          *,
          competency_units(
            *,
            training_courses(*)
          )
        `)
        .eq("id", submissionId)
        .single();

      if (subError) {
        console.error("제출 정보 조회 오류:", subError);
        return NextResponse.json(
          { error: `Submission query error: ${subError.message}` },
          { status: 500 }
        );
      }

      if (!submission) {
        console.error("제출 정보 없음:", submissionId);
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }

      console.log("제출 정보 조회 성공:", {
        submissionId,
        competencyUnitId: submission.competency_unit_id,
        competencyUnit: submission.competency_units,
      });

      // 권한 확인
      if (profile.role === "student") {
        // 학생은 자신이 제출한 과제물만 볼 수 있음
        if (submission.student_id !== profile.id) {
          return NextResponse.json(
            { error: "Forbidden: You can only view your own submissions" },
            { status: 403 }
          );
        }
      } else if (profile.role === "teacher") {
        // 교사는 해당 훈련과정의 교사여야 함
        const courseId = submission.competency_units?.course_id || 
                         submission.competency_units?.training_courses?.id;
        if (courseId) {
          // course_teachers 테이블은 복합 기본 키를 사용하므로 course_id와 teacher_id만 선택
          const { data: courseTeacher, error: courseTeacherError } = await supabase
            .from("course_teachers")
            .select("course_id, teacher_id")
            .eq("course_id", courseId)
            .eq("teacher_id", profile.id)
            .maybeSingle();

          if (courseTeacherError) {
            console.error("교사 권한 확인 오류:", courseTeacherError);
            return NextResponse.json(
              { error: "Failed to verify permissions" },
              { status: 500 }
            );
          }

          if (!courseTeacher) {
            console.error("권한 없음:", { 
              submissionId, 
              courseId, 
              teacherId: profile.id,
              competencyUnit: submission.competency_units 
            });
            return NextResponse.json(
              { error: "Forbidden: You are not assigned to this course" },
              { status: 403 }
            );
          }
        } else {
          // course_id가 없는 경우 - 관리자는 허용, 교사는 거부
          console.warn("course_id가 없는 제출:", {
            submissionId,
            competencyUnit: submission.competency_units
          });
          // 교사는 course_id가 없으면 접근 불가
          return NextResponse.json(
            { error: "Forbidden: Course information not found" },
            { status: 403 }
          );
        }
      } else if (profile.role !== "admin") {
        // 관리자가 아닌 다른 역할은 접근 불가
        return NextResponse.json(
          { error: "Forbidden" },
          { status: 403 }
        );
      }

      // 이미지 타입이 아니면 오류
      if (submission.submission_type !== "image" || !submission.file_url) {
        return NextResponse.json(
          { error: "Not an image submission" },
          { status: 400 }
        );
      }

      // 파일 경로 추출
      let actualPath = submission.file_url;
      if (submission.file_url.startsWith("http")) {
        // URL에서 경로 추출
        const match = submission.file_url.match(/submissions\/(.+?)(\?|$)/);
        if (match) {
          actualPath = match[1];
        } else {
          // 이미 전체 경로인 경우
          actualPath = submission.file_url.replace(/^.*\/submissions\//, "");
        }
      }

      // Signed URL 생성 (1시간 유효)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("submissions")
        .createSignedUrl(actualPath, 3600);

      if (urlError || !signedUrlData) {
        console.error("Signed URL 생성 오류:", urlError);
        return NextResponse.json(
          { error: "Failed to generate image URL" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: signedUrlData.signedUrl,
        path: actualPath,
      });
    } else if (filePath) {
      // 직접 경로로 조회 (교사/관리자만, 학생은 submissionId를 통해 접근해야 함)
      if (profile.role === "student") {
        return NextResponse.json(
          { error: "Forbidden: Students cannot access files by path" },
          { status: 403 }
        );
      }

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("submissions")
        .createSignedUrl(filePath, 3600);

      if (urlError || !signedUrlData) {
        return NextResponse.json(
          { error: "Failed to generate image URL" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        url: signedUrlData.signedUrl,
        path: filePath,
      });
    }

    return NextResponse.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("과제물 이미지 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

