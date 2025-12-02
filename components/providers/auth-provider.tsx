"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { createClient } from "@/lib/supabase/client";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((state) => state.initialize);
  const setProfile = useAuthStore((state) => state.setProfile);
  const signOut = useAuthStore((state) => state.signOut);

  useEffect(() => {
    // 약간의 지연 후 초기화 (초기 프로필 설정 후)
    const timer = setTimeout(() => {
      initialize();
    }, 100);

    // Subscribe to auth changes
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        // Fetch profile on sign in
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (error) {
          // 민감한 정보를 제외하고 오류만 로깅
          console.error("Profile fetch error on sign in:", {
            message: error.message,
            code: error.code,
          });
        }

        if (profile) {
          setProfile(profile);
        }
      } else if (event === "SIGNED_OUT") {
        signOut();
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [initialize, setProfile, signOut]);

  return <>{children}</>;
}

