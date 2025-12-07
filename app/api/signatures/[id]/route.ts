import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // 서명 소유자 확인
    const { data: signature } = await supabase
      .from("signatures")
      .select("signer_id, evaluation_id")
      .eq("id", id)
      .single();

    if (!signature) {
      return NextResponse.json(
        { error: "Signature not found" },
        { status: 404 }
      );
    }

    // 본인 서명이거나 관리자인 경우만 삭제 가능
    if (signature.signer_id !== profile.id && profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    console.log("서명 삭제 시작:", {
      id: id,
      signerId: signature.signer_id,
      profileId: profile.id,
      isAdmin: profile.role === "admin",
    });

    const { error, count } = await supabase
      .from("signatures")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("서명 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("서명 삭제 완료:", {
      id: id,
      deleted: count !== null && count > 0,
    });

    return NextResponse.json({
      success: true,
      deleted: count !== null && count > 0,
    });
  } catch (error: any) {
    console.error("서명 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const supabase = await createClient();

    // 서명 소유자 확인
    const { data: signature } = await supabase
      .from("signatures")
      .select("signer_id, evaluation_id")
      .eq("id", id)
      .single();

    if (!signature) {
      return NextResponse.json(
        { error: "Signature not found" },
        { status: 404 }
      );
    }

    // 본인 서명만 수정 가능
    if (signature.signer_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { signature_data, signature_type } = body;

    if (!signature_data || !signature_type) {
      return NextResponse.json(
        { error: "signature_data and signature_type are required" },
        { status: 400 }
      );
    }

    console.log("서명 업데이트 시작:", {
      id: id,
      signerId: signature.signer_id,
      profileId: profile.id,
      signatureDataLength: signature_data?.length || 0,
    });

    // 업데이트 전 기존 데이터 확인
    const { data: beforeUpdate, error: beforeError } = await supabase
      .from("signatures")
      .select("signature_data, updated_at")
      .eq("id", id)
      .single();

    if (beforeError) {
      console.error("업데이트 전 데이터 조회 오류:", beforeError);
    } else {
      console.log("업데이트 전 데이터:", {
        signatureDataLength: beforeUpdate?.signature_data?.length || 0,
        updatedAt: beforeUpdate?.updated_at,
      });
    }

    // 업데이트 수행
    const {
      data: updateResult,
      error: updateError,
      count,
    } = await supabase
      .from("signatures")
      .update({
        signature_data,
        signature_type,
        signed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select();

    console.log("업데이트 결과:", {
      error: updateError?.message,
      resultCount: updateResult?.length || 0,
      count,
    });

    if (updateError) {
      console.error("서명 수정 오류:", updateError);
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // 업데이트된 데이터 조회 (관계 데이터 포함)
    const { data, error: selectError } = await supabase
      .from("signatures")
      .select(
        `
        *,
        signer:profiles!signatures_signer_id_fkey(
          id,
          full_name,
          email,
          role
        )
      `
      )
      .eq("id", id)
      .single();

    if (selectError) {
      console.error("서명 조회 오류:", selectError);
      return NextResponse.json({ error: selectError.message }, { status: 500 });
    }

    if (!data) {
      console.error("서명 조회 결과 없음:", { id: id });
      return NextResponse.json(
        { error: "서명을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 업데이트 확인 로깅
    const isUpdated = data.signature_data !== beforeUpdate?.signature_data;
    console.log("서명 업데이트 확인:", {
      id: id,
      updated: isUpdated,
      beforeLength: beforeUpdate?.signature_data?.length || 0,
      afterLength: data.signature_data?.length || 0,
      updatedAt: data.updated_at,
      signedAt: data.signed_at,
    });

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("서명 수정 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
