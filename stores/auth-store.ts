import { create } from "zustand";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types/common";

interface AuthState {
  // State
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  setUser: (user: any | null) => void;
  refreshProfile: () => Promise<void>;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: false,
  isInitialized: false,

  initialize: async () => {
    // 이미 초기화되었고 프로필이 있으면 스킵
    if (get().isInitialized && get().profile) return;

    set({ isLoading: true });

    try {
      const supabase = createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        // 민감한 정보를 제외하고 오류만 로깅
        console.error("Auth user fetch error:", {
          message: userError.message,
          status: userError.status,
        });
        set({
          user: null,
          profile: null,
          isInitialized: true,
          isLoading: false,
        });
        return;
      }

      if (user) {
        // 프로필이 이미 설정되어 있으면 다시 조회하지 않음
        if (get().profile && get().profile?.id === user.id) {
          set({
            user,
            isInitialized: true,
            isLoading: false,
          });
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          // 민감한 정보를 제외하고 오류만 로깅
          console.error("Profile fetch error:", {
            message: profileError.message,
            code: profileError.code,
          });
        }

        set({
          user,
          profile: profile || null,
          isInitialized: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          profile: null,
          isInitialized: true,
          isLoading: false,
        });
      }
    } catch (error) {
      // 민감한 정보를 제외하고 오류만 로깅
      const errorInfo = error instanceof Error 
        ? { message: error.message, name: error.name }
        : { error: String(error) };
      console.error("Auth initialization error:", errorInfo);
      set({
        user: null,
        profile: null,
        isInitialized: true,
        isLoading: false,
      });
    }
  },

  setProfile: (profile) => {
    set({ profile });
  },

  setUser: (user) => {
    set({ user });
  },

  refreshProfile: async () => {
    const { user } = get();
    if (!user) return;

    set({ isLoading: true });

    try {
      const supabase = createClient();
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      set({ profile, isLoading: false });
    } catch (error) {
      // 민감한 정보를 제외하고 오류만 로깅
      const errorInfo = error instanceof Error 
        ? { message: error.message, name: error.name }
        : { error: String(error) };
      console.error("Profile refresh error:", errorInfo);
      set({ isLoading: false });
    }
  },

  signOut: () => {
    set({
      user: null,
      profile: null,
      isInitialized: false,
    });
  },
}));

// Helper hook for role checking
export const useUserRole = () => {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role || null;
};

// Helper hook for checking if user is admin
export const useIsAdmin = () => {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role === "admin";
};

// Helper hook for checking if user is teacher
export const useIsTeacher = () => {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role === "teacher";
};

// Helper hook for checking if user is student
export const useIsStudent = () => {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role === "student";
};

// Helper hook for checking if user can manage (admin or teacher)
export const useCanManage = () => {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role === "admin" || profile?.role === "teacher";
};
