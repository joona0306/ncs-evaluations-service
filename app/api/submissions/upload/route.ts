import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const evaluationScheduleId = formData.get(
      "evaluation_schedule_id"
    ) as string;

    if (!file) {
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (!evaluationScheduleId) {
      return NextResponse.json(
        { error: "evaluation_schedule_id is required" },
        { status: 400 }
      );
    }

    // 파일 타입 검증 (이미지만 허용)
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // 파일 크기 검증 (5MB = 5 * 1024 * 1024 bytes)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be 5MB or less" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 평가일정 확인
    const { data: schedule } = await supabase
      .from("evaluation_schedules")
      .select("id, status")
      .eq("id", evaluationScheduleId)
      .single();

    if (!schedule) {
      return NextResponse.json(
        { error: "Evaluation schedule not found" },
        { status: 404 }
      );
    }

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${profile.id}/${Date.now()}.${fileExt}`;
    // bucket 이름이 이미 'submissions'이므로 경로에 포함하지 않음
    const filePath = fileName;

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("파일 업로드 오류:", uploadError);
      return NextResponse.json(
        { error: uploadError.message || "File upload failed" },
        { status: 500 }
      );
    }

    // Signed URL 생성 (1년 유효)
    const { data: urlData } = await supabase.storage
      .from("submissions")
      .createSignedUrl(filePath, 60 * 60 * 24 * 365);

    const signedUrl = urlData?.signedUrl || uploadData?.path;

    return NextResponse.json({
      url: signedUrl,
      path: filePath,
      file_name: file.name,
      file_size: file.size,
      content_type: file.type,
    });
  } catch (error: any) {
    console.error("파일 업로드 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
