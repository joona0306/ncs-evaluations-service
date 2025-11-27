import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { BackButton } from "@/components/ui/back-button";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";

export const dynamic = 'force-dynamic';

export default async function ProfilePage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/dashboard");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">프로필 수정</h2>
        <p className="text-muted-foreground">
          프로필 정보를 수정할 수 있습니다
        </p>
      </div>

      <ProfileEditForm profile={profile} />
    </div>
  );
}

