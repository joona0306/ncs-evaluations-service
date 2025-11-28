import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { BackButton } from "@/components/ui/back-button";
import { SettingsForm } from "@/components/settings/settings-form";

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">설정</h2>
        <p className="text-muted-foreground">
          애플리케이션 설정을 관리합니다
        </p>
      </div>

      <SettingsForm />
    </div>
  );
}

