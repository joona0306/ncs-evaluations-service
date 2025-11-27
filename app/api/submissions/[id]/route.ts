import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("submissions")
      .select(
        `
        *,
        evaluation_schedules(
          id,
          title,
          start_date,
          end_date,
          status,
          competency_units(
            id,
            name,
            code
          )
        ),
        student:profiles!submissions_student_id_fkey(
          id,
          full_name,
          email
        ),
        competency_units(
          id,
          name,
          code
        )
      `
      )
      .eq("id", params.id)
      .single();

    if (error) {
      console.error("과제물 조회 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 권한 확인: 학생은 자신의 과제물만 조회 가능
    if (profile.role === "student" && data.student_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("과제물 조회 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { submission_type, file_url, url, file_name, file_size, comments } =
      body;

    const supabase = await createClient();

    // 기존 제출 조회
    const { data: existing } = await supabase
      .from("submissions")
      .select(
        "id, student_id, evaluation_schedule_id, evaluation_schedules(status)"
      )
      .eq("id", params.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 학생은 자신의 과제물만 수정 가능
    if (existing.student_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 평가 기간 제한 없음 - 모든 상태에서 수정 가능

    // 파일 크기 검증
    if (file_size && file_size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size must be 5MB or less" },
        { status: 400 }
      );
    }

    // submission_type에 따른 검증
    if (submission_type === "image" && !file_url) {
      return NextResponse.json(
        { error: "file_url is required for image submission" },
        { status: 400 }
      );
    }

    if (submission_type === "url" && !url) {
      return NextResponse.json(
        { error: "url is required for url submission" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (submission_type !== undefined)
      updateData.submission_type = submission_type;
    if (file_url !== undefined) updateData.file_url = file_url;
    if (url !== undefined) updateData.url = url;
    if (file_name !== undefined) updateData.file_name = file_name;
    if (file_size !== undefined) updateData.file_size = file_size;
    if (comments !== undefined) updateData.comments = comments;

    const { data, error } = await supabase
      .from("submissions")
      .update(updateData)
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error("과제물 수정 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("과제물 수정 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const profile = await getCurrentUserProfile();

    if (!profile || profile.role !== "student") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    // 기존 제출 조회
    const { data: existing } = await supabase
      .from("submissions")
      .select("id, student_id, file_url")
      .eq("id", params.id)
      .single();

    if (!existing) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    // 학생은 자신의 과제물만 삭제 가능
    if (existing.student_id !== profile.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Supabase Storage에서 파일 삭제 (이미지인 경우)
    if (existing.file_url) {
      try {
        const { error: storageError } = await supabase.storage
          .from("submissions")
          .remove([existing.file_url]);

        if (storageError) {
          console.error("파일 삭제 오류:", storageError);
          // 파일 삭제 실패해도 DB 레코드는 삭제 진행
        }
      } catch (storageErr) {
        console.error("파일 삭제 중 예외:", storageErr);
        // 파일 삭제 실패해도 DB 레코드는 삭제 진행
      }
    }

    // DB에서 제출 삭제
    const { error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", params.id);

    if (error) {
      console.error("과제물 삭제 오류:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("과제물 삭제 실패:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
