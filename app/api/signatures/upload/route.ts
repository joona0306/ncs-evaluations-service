import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const signerId = formData.get("signer_id") as string;

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400 }
      );
    }

    if (!signerId) {
      return NextResponse.json(
        { error: "signer_id is required" },
        { status: 400 }
      );
    }

    // 본인만 업로드 가능
    if (signerId !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 파일 타입 확인
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Only image files are allowed" },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 파일 확장자 추출
    const fileExt = file.name.split(".").pop();
    const fileName = `${signerId}/${Date.now()}.${fileExt}`;
    // bucket 이름이 이미 'signatures'이므로 경로에 포함하지 않음
    const filePath = fileName;

    console.log("서명 이미지 업로드 시작:", {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
    });

    // Supabase Storage에 업로드
    const { error: uploadError } = await supabase.storage
      .from("signatures")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("서명 이미지 업로드 오류:", uploadError);
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // 서명된 URL 생성 (만료 시간 1년)
    const { data: signedUrlData } = await supabase.storage
      .from("signatures")
      .createSignedUrl(filePath, 31536000); // 1년

    if (!signedUrlData || !signedUrlData.signedUrl) {
      // 서명된 URL 생성 실패 시 공개 URL 시도
      const { data: urlData } = supabase.storage
        .from("signatures")
        .getPublicUrl(filePath);

      console.log("서명 이미지 업로드 완료 (공개 URL):", {
        fileName,
        publicUrl: urlData.publicUrl,
      });

      return NextResponse.json({
        url: urlData.publicUrl,
        path: filePath,
      });
    }

    console.log("서명 이미지 업로드 완료 (서명된 URL):", {
      fileName,
      signedUrl: signedUrlData.signedUrl,
    });

    return NextResponse.json({
      url: signedUrlData.signedUrl,
      path: filePath,
    });
  } catch (error: any) {
    console.error("서명 이미지 업로드 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

