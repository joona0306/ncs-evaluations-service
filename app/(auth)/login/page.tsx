"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // 세션을 명시적으로 확인
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (session) {
          // 이메일 확인 상태 확인
          const {
            data: { user: authUser },
          } = await supabase.auth.getUser();

          if (!authUser?.email_confirmed_at) {
            // 이메일 확인이 안 된 경우
            window.location.href = "/verify-email";
            return;
          }

          // 프로필 확인 (관리자 승인 상태)
          const { data: profile } = await supabase
            .from("profiles")
            .select("approved")
            .eq("id", authUser.id)
            .maybeSingle();

          if (!profile?.approved) {
            // 관리자 승인이 안 된 경우
            window.location.href = "/waiting-approval";
            return;
          }

          // 로그인 성공 후 페이지를 완전히 새로고침하여 쿠키가 서버에 반영되도록 함
          // 미들웨어가 로그인 페이지에서 사용자를 감지하면 자동으로 대시보드로 리다이렉트
          window.location.reload();
        } else {
          throw new Error("세션을 가져올 수 없습니다. 다시 시도해주세요.");
        }
      }
    } catch (err: any) {
      // 사용자 친화적인 오류 메시지 제공
      let errorMessage = "로그인에 실패했습니다.";

      if (
        err.status === 400 ||
        err.message?.includes("Invalid login credentials") ||
        err.message?.includes("invalid") ||
        err.message?.includes("credentials")
      ) {
        errorMessage =
          "이메일 또는 비밀번호가 올바르지 않습니다. 다시 확인해주세요.";
      } else if (err.message) {
        // 기타 오류는 원본 메시지를 사용하되, 영어 메시지는 한국어로 변환
        const message = err.message.toLowerCase();
        if (message.includes("network") || message.includes("fetch")) {
          errorMessage =
            "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
        } else if (message.includes("timeout")) {
          errorMessage = "요청 시간이 초과되었습니다. 다시 시도해주세요.";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>로그인</CardTitle>
          <CardDescription>
            NCS 훈련생 성적관리 시스템에 로그인하세요
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">이메일</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "로그인 중..." : "로그인"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              계정이 없으신가요?{" "}
              <Link href="/signup" className="text-primary hover:underline">
                회원가입
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
