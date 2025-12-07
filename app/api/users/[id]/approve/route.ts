import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized", details: userError?.message },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden", details: "Admin access required" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { approved } = body;

  // 먼저 대상 사용자가 존재하는지 확인
  const { data: targetUser, error: checkError } = await supabase
    .from("profiles")
    .select("id, approved")
    .eq("id", id)
    .maybeSingle();

  if (checkError) {
    console.error("API: 사용자 조회 오류:", checkError);
    return NextResponse.json(
      { error: "Failed to check user", details: checkError.message },
      { status: 500 }
    );
  }

  if (!targetUser) {
    console.error("API: 사용자를 찾을 수 없음. 사용자 ID:", id);
    return NextResponse.json(
      { error: "User not found", details: "The user does not exist" },
      { status: 404 }
    );
  }

  // 업데이트 실행 (RLS 정책 확인 포함)
  const { data, error } = await supabase
    .from("profiles")
    .update({ approved })
    .eq("id", id)
    .select();

  if (error) {
    console.error("API: 사용자 승인 상태 변경 오류:", error);
    console.error("에러 코드:", error.code);
    console.error("에러 메시지:", error.message);
    console.error("에러 상세:", error.details);
    console.error("에러 힌트:", error.hint);
    return NextResponse.json(
      { error: error.message, details: error.details, hint: error.hint },
      { status: 500 }
    );
  }

  if (!data || data.length === 0) {
    console.error("API: 업데이트 후 데이터를 찾을 수 없음. 사용자 ID:", id);
    console.error("RLS 정책 문제일 수 있습니다. 관리자 권한을 확인해주세요.");
    return NextResponse.json(
      {
        error: "Update failed",
        details:
          "The update was successful but the data could not be retrieved. This may be due to RLS policies.",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: data[0] }, { status: 200 });
}
