import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BackButton } from "@/components/ui/back-button";
import { UsersList } from "@/components/users/users-list";

export default async function UsersPage() {
  await requireAdmin();
  const supabase = await createClient();

  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">사용자 관리</h2>
        <p className="text-muted-foreground">
          시스템 사용자를 승인하고 관리합니다
        </p>
      </div>

      <UsersList initialUsers={users || []} />

    </div>
  );
}

