"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState<"teacher" | "student">("student");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number | null>(null);
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
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

  // 이메일 변경 시 중복 확인 상태 초기화
  useEffect(() => {
    setEmailVerified(false);
    setEmailError(null);
  }, [email]);

  // 비밀번호 확인 검증
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
    } else {
      setPasswordError(null);
    }
  }, [password, confirmPassword]);

  // 이메일 중복 확인 버튼 핸들러
  const handleCheckEmail = async () => {
    if (!email || !email.includes("@")) {
      setEmailError("올바른 이메일 주소를 입력해주세요.");
      setEmailVerified(false);
      return;
    }

    setCheckingEmail(true);
    setEmailError(null);
    setEmailVerified(false);

    console.log("[클라이언트] 이메일 중복 확인 시작:", email);

    try {
      const response = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      console.log(
        "[클라이언트] API 응답 상태:",
        response.status,
        response.statusText
      );

      const result = await response.json();
      console.log("[클라이언트] API 응답 데이터:", result);

      if (result.exists) {
        console.log("[클라이언트] 중복 이메일 발견");
        setEmailError("이미 가입된 계정입니다.");
        setEmailVerified(false);
      } else {
        console.log("[클라이언트] 사용 가능한 이메일");
        setEmailError(null);
        setEmailVerified(true);
      }
    } catch (err: any) {
      console.error("[클라이언트] 이메일 확인 오류:", err);
      setEmailError("이메일 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      setEmailVerified(false);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    // 이미 로딩 중이거나 쿨다운 중이면 요청 차단
    if (loading || cooldownSeconds !== null) {
      return;
    }

    // 비밀번호 확인 검증
    if (password !== confirmPassword) {
      setPasswordError("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 이메일 중복 확인 필수
    if (!emailVerified) {
      setError("이메일 중복 확인을 먼저 진행해주세요.");
      return;
    }

    // 이메일 중복 확인
    if (emailError) {
      setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
      return;
    }

    setError(null);
    setEmailError(null);
    setPasswordError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      // signUp 호출 전에 이메일 중복 확인
      const checkEmailResponse = await fetch("/api/auth/check-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const checkEmailResult = await checkEmailResponse.json();

      if (checkEmailResult.exists) {
        setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
        setLoading(false);
        return;
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/verify-email`,
          data: {
            full_name: fullName,
            phone,
            role,
          },
        },
      });

      if (authError) {
        // 중복 이메일 에러 처리 (Supabase Authentication에서 이미 가입된 이메일인 경우)
        if (
          authError.message?.includes("already registered") ||
          authError.message?.includes("already exists") ||
          authError.message?.includes("User already registered") ||
          authError.message?.includes("email address is already registered") ||
          authError.message?.includes("이미 등록") ||
          authError.status === 422 // Validation error (이미 존재하는 경우)
        ) {
          setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
          setLoading(false);
          return;
        }

        // 429 에러 처리
        if (
          authError.status === 429 ||
          authError.message?.includes("Too Many Requests") ||
          (authError.message?.includes("after") &&
            authError.message?.includes("seconds"))
        ) {
          // 에러 메시지에서 대기 시간 추출 (다양한 형식 지원)
          const waitTimeMatch =
            authError.message?.match(/(\d+)\s*seconds?/i) ||
            authError.message?.match(/after\s+(\d+)\s*seconds?/i);
          const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;
          setCooldownSeconds(waitTime);
          setError(
            `보안을 위해 요청이 제한되었습니다. ${waitTime}초 후에 다시 시도해주세요.`
          );
          return;
        }
        throw authError;
      }

      if (authData.user) {
        // 세션이 없는 경우 (이메일 확인 필요 또는 이미 존재하는 계정)
        if (!authData.session) {
          // 사용자 정보를 가져와서 이메일 확인 상태 확인
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          // 이미 이메일이 확인된 사용자인 경우 = 이미 존재하는 계정
          if (currentUser?.email_confirmed_at) {
            setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
            setLoading(false);
            return;
          }

          // 추가 확인: profiles 테이블에서도 확인
          const checkEmailResponse2 = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          const checkEmailResult2 = await checkEmailResponse2.json();

          // 이미 존재하는 계정인 경우
          if (checkEmailResult2.exists) {
            setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
            setLoading(false);
            return;
          }

          // 새 계정이지만 이메일 확인이 필요한 경우
          // 이메일 확인 메시지 표시
          setShowEmailConfirmation(true);
          setLoading(false);
          return;
        }

        // 세션을 명시적으로 확인
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          // 세션이 없는 경우, 이미 존재하는 계정인지 확인
          // 사용자 정보를 가져와서 이메일 확인 상태 확인
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();

          // 이미 이메일이 확인된 사용자인 경우 = 이미 존재하는 계정
          if (currentUser?.email_confirmed_at) {
            setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
            setLoading(false);
            return;
          }

          // 추가 확인: profiles 테이블에서도 확인
          const checkEmailResponse3 = await fetch("/api/auth/check-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
          });

          const checkEmailResult3 = await checkEmailResponse3.json();

          // 이미 존재하는 계정인 경우
          if (checkEmailResult3.exists) {
            setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
            setLoading(false);
            return;
          }

          // 새 계정이지만 이메일 확인이 필요한 경우
          setShowEmailConfirmation(true);
          setLoading(false);
          return;
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
              console.error(
                `프로필 생성 시도 ${retries + 1}/${maxRetries} 실패:`,
                result.error
              );
            }
          } catch (err) {
            console.error(
              `프로필 생성 시도 ${retries + 1}/${maxRetries} 오류:`,
              err
            );
          }

          // 잠시 대기 후 재시도
          if (!profileCreated && retries < maxRetries - 1) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
          retries++;
        }

        if (!profileCreated) {
          throw new Error(
            "프로필 생성에 실패했습니다. 잠시 후 다시 시도해주세요."
          );
        }

        // 세션 쿠키가 서버에 반영되도록 전체 페이지 리로드
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      // 중복 이메일 에러 추가 처리 (catch 블록에서도)
      if (
        err.message?.includes("already registered") ||
        err.message?.includes("already exists") ||
        err.message?.includes("User already registered") ||
        err.message?.includes("email address is already registered") ||
        err.message?.includes("이미 등록") ||
        err.status === 422
      ) {
        setError("이미 가입된 계정입니다. 로그인 페이지로 이동하세요.");
        setLoading(false);
        return;
      }

      // 429 에러 처리
      if (
        err.status === 429 ||
        err.message?.includes("Too Many Requests") ||
        (err.message?.includes("after") && err.message?.includes("seconds"))
      ) {
        const waitTimeMatch =
          err.message?.match(/(\d+)\s*seconds?/i) ||
          err.message?.match(/after\s+(\d+)\s*seconds?/i);
        const waitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;
        setCooldownSeconds(waitTime);
        setError(
          `보안을 위해 요청이 제한되었습니다. ${waitTime}초 후에 다시 시도해주세요.`
        );
      } else {
        setError(err.message || "회원가입에 실패했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 이메일 확인 메시지가 표시되는 경우
  if (showEmailConfirmation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>이메일 확인 필요</CardTitle>
            <CardDescription>회원가입이 완료되었습니다</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-blue-50 text-blue-800 rounded-md">
              <p className="text-sm font-medium mb-2">
                이메일 확인 링크를 발송했습니다.
              </p>
              <p className="text-sm">
                <strong>{email}</strong>로 전송된 이메일을 확인하고 링크를
                클릭해주세요.
              </p>
            </div>
            <div className="p-4 bg-yellow-50 text-yellow-800 rounded-md">
              <p className="text-sm">
                이메일 확인 후 관리자가 계정을 승인하면 대시보드에 접근할 수
                있습니다.
              </p>
            </div>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowEmailConfirmation(false);
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setFullName("");
                  setPhone("");
                  setError(null);
                  setEmailError(null);
                  setPasswordError(null);
                }}
              >
                다시 회원가입
              </Button>
              <Link href="/login">
                <Button className="w-full">로그인 페이지로</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>회원가입</CardTitle>
          <CardDescription>새 계정을 생성하세요</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 rounded-md">
                <p>{error}</p>
                {error.includes("이미 가입된 계정") && (
                  <div className="mt-2">
                    <Link
                      href="/login"
                      className="text-primary hover:underline font-medium"
                    >
                      로그인 페이지로 이동 →
                    </Link>
                  </div>
                )}
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
              <div className="flex gap-2">
                <Input
                  id="email"
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={
                    emailError
                      ? "border-red-500"
                      : emailVerified
                      ? "border-green-500"
                      : ""
                  }
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCheckEmail}
                  disabled={checkingEmail || !email || !email.includes("@")}
                >
                  {checkingEmail ? "확인 중..." : "중복 확인"}
                </Button>
              </div>
              {checkingEmail && (
                <p className="text-xs text-muted-foreground">
                  이메일 확인 중...
                </p>
              )}
              {emailError && (
                <p className="text-xs text-red-600">{emailError}</p>
              )}
              {emailVerified && !emailError && (
                <p className="text-xs text-green-600">
                  ✓ 사용 가능한 이메일입니다.
                </p>
              )}
              {!emailVerified &&
                !emailError &&
                email &&
                email.includes("@") && (
                  <p className="text-xs text-muted-foreground">
                    중복 확인 버튼을 클릭해주세요.
                  </p>
                )}
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
                className={passwordError ? "border-red-500" : ""}
              />
              <p className="text-xs text-muted-foreground">
                최소 6자 이상 입력해주세요.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">비밀번호 확인</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className={passwordError ? "border-red-500" : ""}
              />
              {passwordError && (
                <p className="text-xs text-red-600">{passwordError}</p>
              )}
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
                onChange={(e) =>
                  setRole(e.target.value as "teacher" | "student")
                }
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
              disabled={
                loading ||
                cooldownSeconds !== null ||
                !!emailError ||
                !!passwordError ||
                !emailVerified ||
                checkingEmail
              }
            >
              {loading
                ? "가입 중..."
                : cooldownSeconds !== null
                ? `${cooldownSeconds}초 후 다시 시도`
                : !emailVerified
                ? "이메일 중복 확인 필요"
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
