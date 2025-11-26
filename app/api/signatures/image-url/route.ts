import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");
    const path = searchParams.get("path");

    if (!imageUrl && !path) {
      return NextResponse.json(
        { error: "url or path is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // base64 데이터 URL인 경우 그대로 반환
    if (imageUrl && imageUrl.startsWith("data:")) {
      return NextResponse.json({ url: imageUrl });
    }

    // Storage 경로에서 서명된 URL 생성
    if (path) {
      const { data: signedUrlData } = await supabase.storage
        .from("signatures")
        .createSignedUrl(path, 31536000); // 1년

      if (signedUrlData?.signedUrl) {
        return NextResponse.json({ url: signedUrlData.signedUrl });
      }
    }

    // URL에서 경로 추출 시도 (HTTP URL인 경우)
    if (imageUrl && imageUrl.startsWith("http")) {
      // Supabase Storage URL 패턴 매칭
      // 공개 URL: .../storage/v1/object/public/signatures/...
      // 서명된 URL: .../storage/v1/object/sign/signatures/...
      const publicUrlMatch = imageUrl.match(/\/storage\/v1\/object\/public\/signatures\/(.+)$/);
      const signedUrlMatch = imageUrl.match(/\/storage\/v1\/object\/sign\/signatures\/(.+)$/);
      
      let filePath: string | null = null;
      
      if (publicUrlMatch) {
        filePath = publicUrlMatch[1];
      } else if (signedUrlMatch) {
        // 이미 서명된 URL인 경우 그대로 반환
        return NextResponse.json({ url: imageUrl });
      } else {
        // 다른 형식의 URL에서 경로 추출 시도
        const urlMatch = imageUrl.match(/signatures\/([^/?]+(?:\/[^/?]+)*)/);
        if (urlMatch) {
          filePath = urlMatch[1];
        }
      }
      
      if (filePath) {
        // 중복된 signatures/ 제거
        if (filePath.startsWith("signatures/")) {
          filePath = filePath.replace(/^signatures\//, "");
        }
        
        // 서명된 URL 생성
        const { data: signedUrlData } = await supabase.storage
          .from("signatures")
          .createSignedUrl(filePath, 31536000);

        if (signedUrlData?.signedUrl) {
          return NextResponse.json({ url: signedUrlData.signedUrl });
        }
      }
    }

    // 변환 실패 시 원본 URL 반환
    return NextResponse.json({ url: imageUrl || "" });
  } catch (error: any) {
    console.error("이미지 URL 생성 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

