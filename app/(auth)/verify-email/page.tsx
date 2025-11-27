/**
 * 이메일 확인 완료 페이지
 * 이메일 인증 링크를 클릭한 후 리다이렉트되는 페이지
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("이메일 확인 중...");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const supabase = createClient();
        const token = searchParams.get("token");
        const type = searchParams.get("type");

        // 이메일 확인 토큰이 있는 경우
        if (token && type === "email") {
          // Supabase는 이메일 확인 링크를 클릭하면 자동으로 확인되므로
          // 여기서는 세션을 다시 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            setStatus("error");
            setMessage("이메일 확인에 실패했습니다. 링크가 만료되었거나 유효하지 않습니다.");
            return;
          }

          // 사용자 정보 다시 가져오기
          const { data: { user: authUser } } = await supabase.auth.getUser();
          
          if (authUser?.email_confirmed_at) {
            setStatus("success");
            setMessage("이메일 확인이 완료되었습니다. 관리자 승인 후 대시보드에 접근할 수 있습니다.");
          } else {
            setStatus("error");
            setMessage("이메일 확인이 완료되지 않았습니다. 다시 시도해주세요.");
          }
        } else {
          // 세션 확인
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();

          if (sessionError || !session) {
            setStatus("error");
            setMessage("세션을 확인할 수 없습니다. 다시 로그인해주세요.");
            return;
          }

          // 사용자 이메일 확인 상태 확인
          const { data: { user } } = await supabase.auth.getUser();

          if (user?.email_confirmed_at) {
            setStatus("success");
            setMessage("이메일 확인이 완료되었습니다. 관리자 승인 후 대시보드에 접근할 수 있습니다.");
          } else {
            setStatus("error");
            setMessage("이메일 확인이 완료되지 않았습니다. 이메일을 확인해주세요.");
          }
        }
      } catch (error: any) {
        console.error("이메일 확인 오류:", error);
        setStatus("error");
        setMessage("이메일 확인 중 오류가 발생했습니다.");
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>이메일 확인</CardTitle>
          <CardDescription>
            {status === "loading" && "이메일 확인 중입니다..."}
            {status === "success" && "이메일 확인 완료"}
            {status === "error" && "이메일 확인 실패"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`p-4 rounded-md ${
              status === "success"
                ? "bg-green-50 text-green-800"
                : status === "error"
                ? "bg-red-50 text-red-800"
                : "bg-blue-50 text-blue-800"
            }`}
          >
            <p className="text-sm">{message}</p>
          </div>

          {status === "success" && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                관리자가 계정을 승인하면 대시보드에 접근할 수 있습니다.
              </p>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={() => {
                    window.location.href = "/waiting-approval";
                  }}
                >
                  승인 대기 페이지로
                </Button>
                <Button asChild variant="outline" className="flex-1">
                  <Link href="/login">로그인 페이지로</Link>
                </Button>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/login">로그인 페이지로</Link>
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={async () => {
                  try {
                    const supabase = createClient();
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (user?.email) {
                      const response = await fetch("/api/auth/resend-confirmation", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ email: user.email }),
                      });

                      if (response.ok) {
                        setMessage("이메일 확인 링크를 재발송했습니다. 이메일을 확인해주세요.");
                        setStatus("loading");
                      } else {
                        const data = await response.json();
                        setMessage(data.error || "이메일 재발송에 실패했습니다.");
                      }
                    }
                  } catch (error) {
                    console.error("이메일 재발송 오류:", error);
                    setMessage("이메일 재발송 중 오류가 발생했습니다.");
                  }
                }}
              >
                이메일 재발송
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

