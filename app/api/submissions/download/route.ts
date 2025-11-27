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

    // 교사와 관리자만 다운로드 가능
    if (profile.role !== "admin" && profile.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
        .select("*, competency_units(*, training_courses(*))")
        .eq("id", submissionId)
        .single();

      if (subError || !submission) {
        return NextResponse.json(
          { error: "Submission not found" },
          { status: 404 }
        );
      }

      // 권한 확인: 교사는 해당 훈련과정의 교사여야 함
      if (profile.role === "teacher") {
        const courseId =
          submission.competency_units?.course_id ||
          submission.competency_units?.training_courses?.id;
        if (courseId) {
          // course_teachers 테이블은 복합 기본 키를 사용하므로 course_id와 teacher_id만 선택
          const { data: courseTeacher } = await supabase
            .from("course_teachers")
            .select("course_id, teacher_id")
            .eq("course_id", courseId)
            .eq("teacher_id", profile.id)
            .maybeSingle();

          if (!courseTeacher) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
          }
        }
      }

      // 파일 경로 추출
      const pathToUse = submission.file_url || submission.url;
      if (!pathToUse) {
        return NextResponse.json(
          { error: "File not found in submission" },
          { status: 404 }
        );
      }

      // Storage 경로에서 실제 파일 경로 추출
      let actualPath = pathToUse;
      if (pathToUse.startsWith("http")) {
        // URL에서 경로 추출
        const match = pathToUse.match(/submissions\/(.+?)(\?|$)/);
        if (match) {
          actualPath = match[1];
        } else {
          // 이미 전체 경로인 경우
          actualPath = pathToUse.replace(/^.*\/submissions\//, "");
        }
      }

      // Signed URL 생성 (1시간 유효)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("submissions")
        .createSignedUrl(actualPath, 3600);

      if (urlError || !signedUrlData) {
        console.error("Signed URL 생성 오류:", urlError);
        return NextResponse.json(
          { error: "Failed to generate download URL" },
          { status: 500 }
        );
      }

      // 파일 다운로드를 위해 리다이렉트
      return NextResponse.redirect(signedUrlData.signedUrl);
    } else if (filePath) {
      // 직접 경로로 다운로드 (교사/관리자만)
      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("submissions")
        .createSignedUrl(filePath, 3600);

      if (urlError || !signedUrlData) {
        return NextResponse.json(
          { error: "Failed to generate download URL" },
          { status: 500 }
        );
      }

      return NextResponse.redirect(signedUrlData.signedUrl);
    }

    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  } catch (error: any) {
    console.error("과제물 다운로드 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
