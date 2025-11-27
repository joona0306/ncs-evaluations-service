import { redirect } from "next/navigation";
import { getCurrentUserProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CreateProfileButton } from "@/components/profile/create-profile-button";
import dynamic from "next/dynamic";

// AchievementOverview를 동적 임포트로 지연 로딩 (코드 스플리팅)
const AchievementOverviewLazy = dynamic(
  () => import("@/components/admin/achievement-overview").then((mod) => ({ default: mod.AchievementOverview })),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">
        로딩 중...
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);

// 캐싱 전략: 30초마다 재검증 (데이터가 자주 변경되지 않으므로)
export const revalidate = 30;

export default async function DashboardPage() {
  // 미들웨어에서 인증 확인 완료, 프로필만 조회
  let profile = null;
  try {
    profile = await getCurrentUserProfile();
  } catch (error) {
    console.error("프로필 조회 오류:", error);
  }

  if (!profile) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>프로필이 없습니다</CardTitle>
            <CardDescription>
              프로필을 생성해야 대시보드를 사용할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreateProfileButton />
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = await createClient();

  // 역할별 데이터 조회
  let courses: any[] = [];

  try {
    if (profile.role === "admin") {
      const { data, error } = await supabase
        .from("training_courses")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) {
        console.error("관리자 과정 조회 오류:", error);
      }
      courses = data || [];
    } else if (profile.role === "teacher") {
      const { data, error } = await supabase
        .from("course_teachers")
        .select(
          `
          training_courses!course_teachers_course_id_fkey (
            id,
            name,
            code,
            start_date,
            end_date,
            description
          )
        `
        )
        .eq("teacher_id", profile.id);

      if (error) {
        console.error("교사 과정 조회 오류:", error);
      }

      if (data) {
        courses = data.map((ct: any) => ct.training_courses).filter(Boolean);
      }
    } else if (profile.role === "student") {
      const { data, error } = await supabase
        .from("course_students")
        .select(
          `
          training_courses!course_students_course_id_fkey (
            id,
            name,
            code,
            start_date,
            end_date,
            description
          )
        `
        )
        .eq("student_id", profile.id)
        .eq("status", "active");

      if (error) {
        console.error("학생 과정 조회 오류:", error);
      }

      if (data) {
        courses = data.map((cs: any) => cs.training_courses).filter(Boolean);
      }
    }
  } catch (error) {
    console.error("과정 조회 중 예외 발생:", error);
    courses = [];
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">대시보드</h2>
        <p className="text-muted-foreground">
          환영합니다, {profile.full_name}님
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {profile.role === "admin" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>훈련과정 관리</CardTitle>
                <CardDescription>
                  훈련과정을 생성하고 관리합니다
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/courses">
                  <Button className="w-full">관리하기</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>사용자 관리</CardTitle>
                <CardDescription>사용자 계정을 관리합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/users">
                  <Button className="w-full">관리하기</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {profile.role === "teacher" && (
          <Card>
            <CardHeader>
              <CardTitle>평가 관리</CardTitle>
              <CardDescription>
                훈련생 평가를 작성하고 관리합니다
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/dashboard/evaluations">
                <Button className="w-full">관리하기</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {profile.role === "student" && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>과제물 제출</CardTitle>
                <CardDescription>평가일정에 따라 과제물을 제출합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/submissions">
                  <Button className="w-full">제출하기</Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>내 평가</CardTitle>
                <CardDescription>나의 평가 결과를 확인합니다</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/dashboard/my-evaluations">
                  <Button className="w-full">확인하기</Button>
                </Link>
              </CardContent>
            </Card>
          </>
        )}

        {profile.role !== "admin" && (
          <Card>
            <CardHeader>
              <CardTitle>내 훈련과정</CardTitle>
              <CardDescription>
                {courses.length > 0
                  ? `${courses.length}개의 훈련과정`
                  : "등록된 훈련과정이 없습니다"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {courses.length > 0 ? (
                <div className="space-y-2">
                  {courses.map((course: any) => (
                    <div key={course.id} className="p-2 border rounded">
                      <p className="font-medium">{course.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {course.code}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  등록된 훈련과정이 없습니다
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* 관리자 전용: 학업 성취도 현황 (동적 임포트로 코드 스플리팅) */}
      {profile.role === "admin" && (
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle>과정별 학업 성취도</CardTitle>
            </CardHeader>
            <CardContent>
              <AchievementOverviewLazy />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
