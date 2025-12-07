"use client";

import dynamic from "next/dynamic";

const AchievementOverview = dynamic(
  () =>
    import("@/components/admin/achievement-overview").then((mod) => ({
      default: mod.AchievementOverview,
    })),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">로딩 중...</div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

export function AchievementOverviewClient() {
  return <AchievementOverview />;
}
