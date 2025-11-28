"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";

/**
 * 사용자 설정에서 테마를 불러와서 적용하는 컴포넌트
 * ThemeProvider 내부에서 사용
 */
export function ThemeInitializer() {
  const { setTheme } = useTheme();

  useEffect(() => {
    const loadUserTheme = async () => {
      try {
        const response = await fetch("/api/user/preferences");
        if (response.ok) {
          const data = await response.json();
          if (data.theme && data.theme !== "system") {
            setTheme(data.theme);
          }
        }
      } catch (error) {
        // 로그인하지 않은 사용자이거나 설정이 없는 경우 무시
        console.debug("사용자 테마 설정을 불러올 수 없습니다:", error);
      }
    };

    loadUserTheme();
  }, [setTheme]);

  return null;
}

