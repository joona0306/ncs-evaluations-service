"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function SettingsForm() {
  const { theme, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<string>("system");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  // hydration mismatch 방지
  useEffect(() => {
    setMounted(true);
  }, []);

  // 사용자 설정 불러오기
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          setSelectedTheme(data.theme || "system");
          // 테마도 즉시 적용
          if (data.theme && data.theme !== "system") {
            setTheme(data.theme);
          }
        }
      } catch (error) {
        console.error("설정 로드 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      loadPreferences();
    }
  }, [mounted, setTheme]);

  const handleThemeChange = async (newTheme: string) => {
    // 이전 테마 저장 (복원용)
    const previousTheme = selectedTheme;
    setSelectedTheme(newTheme);
    setSaving(true);

    try {
      // 서버에 먼저 저장
      const response = await fetch("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: newTheme }),
      });

      if (!response.ok) {
        throw new Error("설정 저장에 실패했습니다.");
      }

      // 저장 성공 후 테마 적용 (깜빡임 방지)
      setTheme(newTheme);
    } catch (error: any) {
      console.error("설정 저장 실패:", error);
      // 실패 시 이전 값으로 복원 (깜빡임 최소화)
      setSelectedTheme(previousTheme);
      // 테마는 변경하지 않음 (이미 변경되지 않았으므로)
      alert("설정 저장에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>설정</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>테마 설정</CardTitle>
          <CardDescription>
            애플리케이션의 테마를 선택하세요. 설정은 자동으로 저장됩니다.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="theme">테마</Label>
            <Select
              id="theme"
              value={selectedTheme}
              onChange={(e) => handleThemeChange(e.target.value)}
              disabled={saving}
              className="w-full sm:w-[300px]"
            >
              <option value="light">라이트 모드</option>
              <option value="dark">다크 모드</option>
              <option value="system">시스템 설정 따르기</option>
            </Select>
            {saving && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>저장 중...</span>
              </div>
            )}
            <p className="text-sm text-muted-foreground">
              선택한 테마는 다음 방문 시에도 자동으로 적용됩니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

