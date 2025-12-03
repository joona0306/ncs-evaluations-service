/**
 * 관리자 승인 대기 페이지
 * 이메일 확인은 완료되었지만 관리자 승인이 아직 안 된 경우 표시
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Settings } from "lucide-react";

export default function WaitingApprovalPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApprovalStatus = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          router.push("/login");
          return;
        }

        // 이메일 확인 상태 확인
        if (!user.email_confirmed_at) {
          router.push("/verify-email");
          return;
        }

        // 프로필 확인
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("id, email, full_name, approved")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("프로필 조회 오류:", profileError);
        }

        if (profileData?.approved) {
          // 승인 완료된 경우 대시보드로
          router.push("/dashboard");
          return;
        }

        setProfile(profileData);
      } catch (error) {
        console.error("승인 상태 확인 오류:", error);
      } finally {
        setLoading(false);
      }
    };

    // 페이지 로드 시 한 번만 확인
    checkApprovalStatus();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8 pb-32">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">로딩 중...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-8 pb-32">
      <div className="absolute top-4 right-4">
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            설정
          </Button>
        </Link>
      </div>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>관리자 승인 대기</CardTitle>
          <CardDescription>
            계정 승인을 기다리고 있습니다
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-yellow-50 dark:bg-yellow-950/50 text-yellow-800 dark:text-yellow-400 rounded-md">
            <p className="text-sm font-medium mb-2">이메일 확인이 완료되었습니다.</p>
            <p className="text-sm">
              관리자가 계정을 승인하면 대시보드에 접근할 수 있습니다.
            </p>
          </div>

          {profile && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
              <p className="text-sm text-muted-foreground mb-1">계정 정보</p>
              <p className="text-sm font-medium">{profile.full_name || profile.email}</p>
              <p className="text-xs text-muted-foreground">{profile.email}</p>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400 rounded-md">
            <p className="text-xs">
              관리자가 계정을 승인하면 &quot;승인 상태 확인&quot; 버튼을 클릭하여 대시보드로 이동할 수 있습니다.
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                const supabase = createClient();
                supabase.auth.signOut();
                router.push("/login");
              }}
            >
              로그아웃
            </Button>
            <Button
              className="flex-1"
              onClick={async () => {
                // 승인 상태 확인 후 리다이렉트
                const supabase = createClient();
                const { data: { user } } = await supabase.auth.getUser();
                
                if (user) {
                  const { data: profileData } = await supabase
                    .from("profiles")
                    .select("approved")
                    .eq("id", user.id)
                    .maybeSingle();

                  if (profileData?.approved) {
                    router.push("/dashboard");
                  } else {
                    // 승인되지 않은 경우 페이지 새로고침
                    router.refresh();
                    window.location.reload();
                  }
                } else {
                  router.refresh();
                  window.location.reload();
                }
              }}
            >
              승인 상태 확인
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

