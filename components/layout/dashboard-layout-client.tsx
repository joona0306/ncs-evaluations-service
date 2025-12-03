"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/components/providers/auth-provider";
import { useAuthStore } from "@/stores/auth-store";
import { Profile } from "@/types/common";
import { createClient } from "@/lib/supabase/client";
import { Settings } from "lucide-react";
import { Footer } from "./footer";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  initialProfile: Profile | null;
}

function DashboardHeader() {
  const profile = useAuthStore((state) => state.profile);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "teacher":
        return "훈련교사";
      case "student":
        return "훈련생";
      default:
        return role;
    }
  };

  return (
    <div className="border-b bg-white dark:bg-gray-900">
      <div className="container mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href="/dashboard" className="text-xl sm:text-2xl font-bold text-primary">
          NCS 훈련생 성적관리 시스템
        </Link>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
          {profile && (
            <Link href="/dashboard/profile" className="w-full sm:w-auto">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer block sm:inline">
                {profile.full_name} ({getRoleLabel(profile.role)})
              </span>
            </Link>
          )}
          <Link href="/dashboard/settings" className="w-full sm:w-auto">
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <Settings className="h-4 w-4 mr-2" />
              설정
            </Button>
          </Link>
          <form action="/api/auth/signout" method="post" className="w-full sm:w-auto">
            <Button type="submit" variant="outline" size="sm" className="w-full sm:w-auto">
              로그아웃
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

export function DashboardLayoutClient({
  children,
  initialProfile,
}: DashboardLayoutClientProps) {
  const setProfile = useAuthStore((state) => state.setProfile);
  const setUser = useAuthStore((state) => state.setUser);
  const isInitialized = useAuthStore((state) => state.isInitialized);
  const currentProfile = useAuthStore((state) => state.profile);

  // 서버에서 받은 초기 프로필을 store에 먼저 설정 (AuthProvider 초기화 전)
  // 렌더링 중 setState를 방지하기 위해 useEffect에서 처리
  useEffect(() => {
    if (initialProfile && !currentProfile) {
      // 초기 프로필을 즉시 설정
      setProfile(initialProfile);
      
      // user 정보도 가져오기 (비동기로 처리하여 렌더링 블로킹 방지)
      const loadUser = async () => {
        try {
          const supabase = createClient();
          const {
            data: { user },
          } = await supabase.auth.getUser();
          
          if (user) {
            setUser(user);
          }
        } catch (error) {
          // 민감한 정보를 제외하고 오류만 로깅
          const errorInfo = error instanceof Error 
            ? { message: error.message, name: error.name }
            : { error: String(error) };
          console.error("Failed to load user:", errorInfo);
        }
      };
      
      // 다음 틱에서 실행하여 렌더링 완료 후 실행
      setTimeout(() => {
        loadUser();
      }, 0);
    }
  }, [initialProfile, currentProfile, setProfile, setUser]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <DashboardHeader />
        <div className="flex-1">{children}</div>
        <Footer />
      </div>
    </AuthProvider>
  );
}

