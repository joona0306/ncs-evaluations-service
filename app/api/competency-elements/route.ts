import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth";

export async function POST(request: Request) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      competency_unit_id,
      name,
      code,
      description,
      display_order,
    } = body;

    const { data, error } = await supabase
      .from("competency_elements")
      .insert({
        competency_unit_id,
        name,
        code,
        description,
        display_order,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("능력단위요소 생성 오류:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const profile = await getCurrentUserProfile();
    
    if (!profile) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const competencyUnitId = searchParams.get("competency_unit_id");

    if (!competencyUnitId) {
      return NextResponse.json(
        { error: "competency_unit_id is required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("competency_elements")
      .select("*")
      .eq("competency_unit_id", competencyUnitId)
      .order("display_order", { ascending: true });

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("능력단위요소 조회 오류:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

