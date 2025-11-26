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
    const evaluationId = searchParams.get("evaluation_id");

    if (!evaluationId) {
      return NextResponse.json(
        { error: "evaluation_id is required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("signatures")
      .select(`
        *,
        signer:profiles!signatures_signer_id_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .eq("evaluation_id", evaluationId)
      .order("signed_at", { ascending: false });

    if (error) {
      console.error("서명 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 캐시 방지를 위한 헤더 추가
    const response = NextResponse.json(data || []);
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");
    
    return response;
  } catch (error: any) {
    console.error("서명 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { evaluation_id, signer_id, signer_role, signature_type, signature_data } = body;

    if (!evaluation_id || !signer_id || !signer_role || !signature_type || !signature_data) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      );
    }

    // 본인 서명만 생성 가능
    if (signer_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = await createClient();

    console.log("서명 생성 시작:", {
      evaluationId: evaluation_id,
      signerId: signer_id,
      signerRole: signer_role,
      signatureType: signature_type,
      signatureDataLength: signature_data?.length || 0,
    });

    const { data, error } = await supabase
      .from("signatures")
      .insert({
        evaluation_id,
        signer_id,
        signer_role,
        signature_type,
        signature_data,
        signed_at: new Date().toISOString(),
      })
      .select(`
        *,
        signer:profiles!signatures_signer_id_fkey(
          id,
          full_name,
          email,
          role
        )
      `)
      .single();

    if (error) {
      console.error("서명 생성 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    console.log("서명 생성 완료:", {
      id: data?.id,
      evaluationId: evaluation_id,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("서명 생성 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

