import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { CreateCourseSchema, UpdateCourseSchema } from "@/lib/validation/schemas";
import { validateRequest } from "@/lib/validation/api-validator";

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    let courses: any[] = [];

    if (profile.role === "admin") {
      // 관리자는 모든 훈련과정 조회
      const { data, error } = await supabase
        .from("training_courses")
        .select("id, name, code, start_date, end_date, description, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("훈련과정 조회 오류:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      courses = data || [];
    } else if (profile.role === "teacher") {
      // 교사는 자신이 담당하는 훈련과정만 조회
      const { data, error } = await supabase
        .from("course_teachers")
        .select("training_courses(*)")
        .eq("teacher_id", profile.id);

      if (error) {
        console.error("훈련과정 조회 오류:", error);
        return NextResponse.json(
          { error: error.message },
          { status: 500 }
        );
      }

      courses = data?.map((ct: any) => ct.training_courses).filter(Boolean) || [];
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(courses);
  } catch (error: any) {
    console.error("훈련과정 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "사용자 정보를 확인할 수 없습니다." },
        { status: 403 }
      );
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validation = validateRequest(CreateCourseSchema, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { name, code, start_date, end_date, description } = validation.data;

    // 과정 생성
    const { data: course, error: insertError } = await supabase
      .from("training_courses")
      .insert({
        name,
        code,
        start_date,
        end_date,
        description: description || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("과정 생성 오류:", insertError);
      return NextResponse.json(
        { 
          error: insertError.message || "과정 생성에 실패했습니다.",
          details: insertError.details,
          hint: insertError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: course }, { status: 201 });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // 사용자 확인
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "인증되지 않은 사용자입니다." },
        { status: 401 }
      );
    }

    // 프로필 확인
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: "사용자 정보를 확인할 수 없습니다." },
        { status: 403 }
      );
    }

    if (profile.role !== "admin") {
      return NextResponse.json(
        { error: "관리자 권한이 필요합니다." },
        { status: 403 }
      );
    }

    // 요청 본문 파싱 및 검증
    const body = await request.json();
    const validation = validateRequest(UpdateCourseSchema, body);
    
    if (!validation.success) {
      return validation.response;
    }

    const { id, name, code, start_date, end_date, description } = validation.data;

    // 과정 수정
    const { data: course, error: updateError } = await supabase
      .from("training_courses")
      .update({
        name,
        code,
        start_date,
        end_date,
        description: description || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error("과정 수정 오류:", updateError);
      return NextResponse.json(
        { 
          error: updateError.message || "과정 수정에 실패했습니다.",
          details: updateError.details,
          hint: updateError.hint,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: course }, { status: 200 });
  } catch (error: any) {
    console.error("API 오류:", error);
    return NextResponse.json(
      { error: error.message || "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

