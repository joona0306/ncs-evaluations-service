import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { getPaginationParams, createPaginatedResponse } from "@/lib/api/pagination";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role");
    const { limit, offset } = getPaginationParams(searchParams);

    const supabase = await createClient();

    // 전체 개수 조회
    let countQuery = supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, phone, approved, created_at")
      .order("created_at", { ascending: false });

    if (role) {
      query = query.eq("role", role);
      countQuery = countQuery.eq("role", role);
    }

    // 페이징 적용
    query = query.range(offset, offset + limit - 1);

    const { data, error } = await query;
    const { count } = await countQuery;

    if (error) {
      console.error("사용자 목록 조회 오류:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // 페이징 정보와 함께 응답
    return NextResponse.json(
      createPaginatedResponse(data || [], limit, offset, count || undefined)
    );
  } catch (error: any) {
    console.error("사용자 목록 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { full_name, phone, birth_date, gender } = body;

    // full_name은 필수 필드
    if (full_name !== undefined && !full_name?.trim()) {
      return NextResponse.json(
        { error: "이름은 필수 항목입니다." },
        { status: 400 }
      );
    }

    // 본인 프로필만 수정 가능
    const supabase = await createClient();

    // 업데이트할 데이터 준비 (role, email, id는 변경 불가)
    const updateData: any = {};
    if (full_name !== undefined) updateData.full_name = full_name.trim();
    if (phone !== undefined) updateData.phone = phone?.trim() || null;
    if (birth_date !== undefined) updateData.birth_date = birth_date || null;
    if (gender !== undefined) updateData.gender = gender || null;
    // updated_at은 트리거가 자동으로 업데이트하므로 수동 설정 불필요
    // role, email, id는 보안상 업데이트 불가

    const { data, error: updateError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", profile.id)
      .select()
      .single();

    if (updateError) {
      console.error("프로필 업데이트 오류:", updateError);
      return NextResponse.json(
        { 
          error: updateError.message || "프로필 수정에 실패했습니다.",
          details: updateError.details,
          hint: updateError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error: any) {
    console.error("프로필 업데이트 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

