"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

function ConsentPageContent() {
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  useEffect(() => {
    // 이미 동의한 사용자는 대시보드로 리다이렉트
    const checkConsent = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("agreed_terms_at, agreed_privacy_at")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.agreed_terms_at && profile?.agreed_privacy_at) {
          router.push(redirectTo);
        }
      } else {
        router.push("/login");
      }
    };

    checkConsent();
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreeTerms || !agreePrivacy) {
      setError("필수 동의 항목에 모두 동의해주세요.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const now = new Date().toISOString();

      // 프로필 업데이트
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          agreed_terms_at: now,
          agreed_privacy_at: now,
          agreed_marketing: false,
          agreed_marketing_at: null,
        })
        .eq("id", user.id);

      if (updateError) {
        throw updateError;
      }

      // 동의 완료 후 원래 페이지로 리다이렉트
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || "동의 처리 중 오류가 발생했습니다.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>약관 동의</CardTitle>
          <CardDescription>
            서비스 이용을 위해 약관에 동의해주세요.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/50 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  required
                  className="mt-1"
                />
                <label
                  htmlFor="agreeTerms"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                >
                  <span className="text-red-500">[필수]</span>{" "}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    이용약관
                  </Link>
                  에 동의합니다.
                </label>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreePrivacy"
                  checked={agreePrivacy}
                  onChange={(e) => setAgreePrivacy(e.target.checked)}
                  required
                  className="mt-1"
                />
                <label
                  htmlFor="agreePrivacy"
                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex-1"
                >
                  <span className="text-red-500">[필수]</span>{" "}
                  <Link
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    개인정보처리방침
                  </Link>
                  에 동의합니다.
                </label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !agreeTerms || !agreePrivacy}
            >
              {loading ? "처리 중..." : "동의하고 계속하기"}
            </Button>
            <div className="text-xs text-center text-muted-foreground">
              동의하지 않으시면 서비스를 이용하실 수 없습니다.
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ConsentPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>약관 동의</CardTitle>
              <CardDescription>로딩 중...</CardDescription>
            </CardHeader>
          </Card>
        </div>
      }
    >
      <ConsentPageContent />
    </Suspense>
  );
}
