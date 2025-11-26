"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthProvider } from "@/components/providers/auth-provider";
import { useAuthStore, Profile } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

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
    <div className="border-b bg-white">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="text-2xl font-bold text-primary">
          NCS 훈련생 성적관리 시스템
        </Link>
        <div className="flex items-center gap-4">
          {profile && (
            <Link href="/dashboard/profile">
              <span className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                {profile.full_name} ({getRoleLabel(profile.role)})
              </span>
            </Link>
          )}
          <form action="/api/auth/signout" method="post">
            <Button type="submit" variant="outline" size="sm">
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
  useEffect(() => {
    if (initialProfile && !currentProfile) {
      // 초기 프로필을 즉시 설정
      setProfile(initialProfile);
      
      // user 정보도 가져오기
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
          console.error("Failed to load user:", error);
        }
      };
      
      loadUser();
    }
  }, [initialProfile, currentProfile, setProfile, setUser]);

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader />
        <div>{children}</div>
      </div>
    </AuthProvider>
  );
}

