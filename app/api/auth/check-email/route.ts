/**
 * 이메일 중복 확인 API
 * 회원가입 전에 이메일이 이미 존재하는지 확인
 * anon key를 사용하여 profiles 테이블의 이메일만 조회
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "이메일이 필요합니다." },
        { status: 400 }
      );
    }

    // 이메일 정규화 (소문자 변환 및 공백 제거)
    const normalizedEmail = email.toLowerCase().trim();

    // anon key를 사용한 클라이언트로 이메일 중복 확인
    const supabase = await createClient();

    // 보안 함수를 사용하여 이메일 존재 여부 확인 (이메일만 확인, 다른 정보 노출 없음)
    // SECURITY DEFINER로 RLS를 우회하므로 별도의 RLS 정책이 필요 없습니다
    const { data: emailExists, error: functionError } = await supabase
      .rpc("check_email_exists", { check_email: normalizedEmail });

    if (functionError) {
      console.error("[이메일 중복 확인] 함수 호출 오류:", functionError);
      
      // 함수가 없는 경우 명확한 에러 메시지 반환
      if (functionError.message?.includes("function") || functionError.code === "42883") {
        return NextResponse.json(
          { 
            error: "이메일 확인 함수가 설정되지 않았습니다.",
            hint: "Supabase SQL Editor에서 'check_email_exists' 함수를 실행하세요."
          },
          { status: 500 }
        );
      }
      
      return NextResponse.json(
        { error: "이메일 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 함수가 true를 반환하면 이메일이 존재함
    if (emailExists === true) {
      return NextResponse.json({
        exists: true,
        message: "이미 가입된 계정입니다.",
      });
    }

    // profiles 테이블에 없으면 사용 가능
    // (signUp 시 Supabase가 auth.users 중복을 자동으로 체크함)
    return NextResponse.json({
      exists: false,
      message: "사용 가능한 이메일입니다.",
    });
  } catch (error: any) {
    console.error("이메일 확인 오류:", error);
    return NextResponse.json(
      { error: error.message || "이메일 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

