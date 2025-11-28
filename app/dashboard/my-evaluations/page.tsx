import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/back-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = 'force-dynamic';

export default async function MyEvaluationsPage() {
  const profile = await getCurrentUserProfile();
  
  if (!profile || profile.role !== "student") {
    redirect("/dashboard");
  }

  const supabase = await createClient();

  const { data: evaluations } = await supabase
    .from("evaluations")
    .select(`
      *,
      competency_units(*),
      teacher:profiles!evaluations_teacher_id_fkey(*)
    `)
    .eq("student_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto px-4 py-8">
      <BackButton href="/dashboard" />
      <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">내 평가</h2>
          <p className="text-muted-foreground">
            나의 평가 결과를 확인합니다
          </p>
        </div>

        {evaluations && evaluations.length > 0 ? (
          <div className="space-y-4">
            {evaluations.map((evaluation) => (
              <Card key={evaluation.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>
                        {evaluation.competency_units?.name || "알 수 없음"}
                      </CardTitle>
                      <CardDescription>
                        {evaluation.competency_units?.code || ""} - 평가자: {evaluation.teacher?.full_name || evaluation.teacher?.email}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-2 py-1 text-xs rounded ${
                        evaluation.status === "confirmed" ? "bg-green-100 dark:bg-green-950/50 text-green-800 dark:text-green-400" :
                        evaluation.status === "submitted" ? "bg-blue-100 dark:bg-blue-950/50 text-blue-800 dark:text-blue-400" :
                        "bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                      }`}>
                        {evaluation.status === "confirmed" ? "확정" :
                         evaluation.status === "submitted" ? "제출" : "임시저장"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      {evaluation.evaluated_at && (
                        <p className="text-sm text-muted-foreground">
                          평가일: {new Date(evaluation.evaluated_at).toLocaleDateString("ko-KR")}
                        </p>
                      )}
                    </div>
                    <Link href={`/dashboard/evaluations/${evaluation.id}`}>
                      <Button variant="outline">상세보기</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">아직 평가가 없습니다.</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

