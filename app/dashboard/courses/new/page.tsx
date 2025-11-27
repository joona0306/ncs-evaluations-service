import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import Link from "next/link";
import { BackButton } from "@/components/ui/back-button";
import { CourseForm } from "@/components/courses/course-form";

export const dynamic = 'force-dynamic';

export default async function NewCoursePage() {
  await requireAdmin();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <BackButton href="/dashboard/courses" />
      <h2 className="text-3xl font-bold mb-8">새 훈련과정 생성</h2>
      <CourseForm />
    </div>
  );
}

