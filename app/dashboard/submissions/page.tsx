"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/auth-store";
import { BackButton } from "@/components/ui/back-button";
import { SubmissionsList } from "@/components/submissions/submissions-list";

export default function SubmissionsPage() {
  const router = useRouter();
  const { profile } = useAuthStore();

  useEffect(() => {
    if (!profile) {
      router.push("/login");
      return;
    }

    if (profile.role !== "student") {
      router.push("/dashboard");
    }
  }, [profile, router]);

  if (!profile || profile.role !== "student") {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">과제물 제출</h2>
        <p className="text-muted-foreground">
          평가일정에 따라 과제물을 제출합니다
        </p>
      </div>

      <SubmissionsList />
    </div>
  );
}

