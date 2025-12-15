import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { CompetencyUnitForm } from "@/components/courses/competency-unit-form";

export default async function EditCompetencyUnitPage({
  params,
}: {
  params: Promise<{ id: string; unitId: string }>;
}) {
  const { id, unitId } = await params;
  await requireAdmin();
  const supabase = await createClient();

  const { data: unit } = await supabase
    .from("competency_units")
    .select("*")
    .eq("id", unitId)
    .single();

  if (!unit) {
    redirect(`/dashboard/courses/${id}`);
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <BackButton href={`/dashboard/courses/${id}`} />
      <h2 className="text-3xl font-bold mb-8">능력단위 수정</h2>
      <CompetencyUnitForm courseId={id} unit={unit} />
    </div>
  );
}

