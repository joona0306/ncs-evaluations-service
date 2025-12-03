import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/auth";
import { Footer } from "@/components/layout/footer";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>NCS 훈련생 성적관리 시스템</CardTitle>
            <CardDescription>
              훈련생 성적관리 및 평가 시스템에 오신 것을 환영합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <p className="text-sm text-muted-foreground">
                  이미 로그인되어 있습니다.
                </p>
                <Link href="/dashboard">
                  <Button className="w-full">대시보드로 이동</Button>
                </Link>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  시스템을 사용하려면 로그인해주세요.
                </p>
                <div className="flex flex-col space-y-2">
                  <Link href="/login">
                    <Button className="w-full">로그인</Button>
                  </Link>
                  <Link href="/signup">
                    <Button variant="outline" className="w-full">
                      회원가입
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
}
