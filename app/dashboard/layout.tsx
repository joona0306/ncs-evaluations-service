import { getCurrentUserProfile } from "@/lib/auth";
import { DashboardLayoutClient } from "@/components/layout/dashboard-layout-client";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 서버에서 초기 프로필 로드 (SSR)
  let profile = null;
  try {
    profile = await getCurrentUserProfile();
  } catch (error) {
    console.error("프로필 로드 오류:", error);
  }

  return <DashboardLayoutClient initialProfile={profile}>{children}</DashboardLayoutClient>;
}
