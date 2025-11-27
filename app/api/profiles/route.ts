import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { getPaginationParams, createPaginatedResponse } from "@/lib/api/pagination";

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

