"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const router = useRouter();

  // 쿨다운 타이머
  useEffect(() => {
    if (cooldownSeconds !== null && cooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setCooldownSeconds(cooldownSeconds - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (cooldownSeconds === 0) {
      setCooldownSeconds(null);
    }
  }, [cooldownSeconds]);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 이미 로딩 중이거나 쿨다운 중이면 요청 차단
    if (loading || cooldownSeconds !== null) {
      return;
    }
    
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (authError) {
        // 429 에러 처리
        if (authError.status === 429 || 
            authError.message?.includes("Too Many Requests") ||
            authError.message?.includes("after") && authError.message?.includes("seconds")) {
          // 에러 메시지에서 대기 시간 추출 (다양한 형식 지원)
          const waitTimeMatch = authError.message?.match(/(\d+)\s*seconds?/i) ||
                               authError.message?.match(/after\s+(\d+)\s*seconds?/i);
          const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;
          setCooldownSeconds(waitTime);
          setError(`보안을 위해 요청이 제한되었습니다. ${waitTime}초 후에 다시 시도해주세요.`);
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // 세션을 명시적으로 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          throw new Error("세션을 가져올 수 없습니다. 다시 시도해주세요.");
        }

        // 서버 측 API를 통해 프로필 생성
        let profileCreated = false;
        let retries = 0;
        const maxRetries = 5;

        while (!profileCreated && retries < maxRetries) {
          try {
            const response = await fetch("/api/auth/create-profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                email,
                full_name: fullName,
                phone,
                role,
              }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
              profileCreated = true;
              break;
            } else {
              console.error(`프로필 생성 시도 ${retries + 1}/${maxRetries} 실패:`, result.error);
            }
          } catch (err) {
            console.error(`프로필 생성 시도 ${retries + 1}/${maxRetries} 오류:`, err);
          }

          // 잠시 대기 후 재시도
          if (!profileCreated && retries < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          retries++;
        }

        if (!profileCreated) {
          throw new Error("프로필 생성에 실패했습니다. 잠시 후 다시 시도해주세요.");
        }

        // 세션 쿠키가 서버에 반영되도록 전체 페이지 리로드
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      // 429 에러 추가 처리
      if (err.status === 429 || 
          err.message?.includes("Too Many Requests") ||
          (err.message?.includes("after") && err.message?.includes("seconds"))) {
        const waitTimeMatch = err.message?.match(/(\d+)\s*seconds?/i) ||
                             err.message?.match(/after\s+(\d+)\s*seconds?/i);
        const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;
        setCooldownSeconds(waitTime);
        setError(`보안을 위해 요청이 제한되었습니다. ${waitTime}초 후에 다시 시도해주세요.`);
      } else {
        setError(err.message || "회원가입에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>
            새 계정을 생성하세요
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="fullName">이름</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="홍길동"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>
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
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">전화번호</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="010-1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">역할</Label>
              <select
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value as "teacher" | "student")}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                required
              >
                <option value="student">훈련생</option>
                <option value="teacher">훈련교사</option>
              </select>
              <p className="text-xs text-muted-foreground">
                관리자 계정은 별도로 생성됩니다.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || cooldownSeconds !== null}
            >
              {loading 
                ? "가입 중..." 
                : cooldownSeconds !== null 
                ? `${cooldownSeconds}초 후 다시 시도` 
                : "회원가입"}
            </Button>
            <div className="text-sm text-center text-muted-foreground">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="text-primary hover:underline">
                로그인
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
