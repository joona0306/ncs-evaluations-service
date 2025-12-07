"use client";

import dynamic from "next/dynamic";
import { User } from "@/types/common";

const UsersList = dynamic(
  () =>
    import("@/components/users/users-list").then((mod) => ({
      default: mod.UsersList,
    })),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">
        사용자 목록 로딩 중...
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

interface UsersListClientProps {
  initialUsers: User[];
}

export function UsersListClient({ initialUsers }: UsersListClientProps) {
  return <UsersList initialUsers={initialUsers} />;
}
