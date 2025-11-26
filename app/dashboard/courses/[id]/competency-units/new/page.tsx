import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { CompetencyUnitForm } from "@/components/courses/competency-unit-form";

export default async function NewCompetencyUnitPage({
  params,
}: {
  params: { id: string };
}) {
  await requireAdmin();
  const supabase = await createClient();

  const { data: course } = await supabase
    .from("training_courses")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!course) {
    redirect("/dashboard/courses");
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <BackButton href={`/dashboard/courses/${params.id}`} />
      <h2 className="text-3xl font-bold mb-8">새 능력단위 생성</h2>
      <CompetencyUnitForm courseId={params.id} />
    </div>
  );
}

