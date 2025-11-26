import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { EvaluationsList } from "@/components/evaluations/evaluations-list";

// 항상 동적으로 렌더링하여 최신 데이터 표시
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EvaluationsPage() {
  const profile = await getCurrentUserProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.role === "student") {
    redirect("/dashboard/my-evaluations");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold mb-2">평가 관리</h2>
          <p className="text-muted-foreground">
            훈련생 평가를 작성하고 관리합니다
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/evaluations/competency-units">
            <Button variant="outline">능력단위 관리</Button>
          </Link>
          <Link href="/dashboard/evaluations/schedules">
            <Button variant="outline">평가일정 관리</Button>
          </Link>
          <Link href="/dashboard/evaluations/new">
            <Button>새 평가 작성</Button>
          </Link>
        </div>
      </div>

      <EvaluationsList profile={profile} />
    </div>
  );
}
