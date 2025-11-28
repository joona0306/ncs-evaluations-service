/**
 * ThemeInitializer 컴포넌트 테스트
 */

import React from "react";
import { render } from "@testing-library/react";
import { ThemeInitializer } from "@/components/providers/theme-initializer";
import { useTheme } from "next-themes";

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("ThemeInitializer", () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseTheme.mockReturnValue({
      theme: "system",
      setTheme: mockSetTheme,
      themes: ["light", "dark", "system"],
      systemTheme: "light",
      resolvedTheme: "light",
    } as any);
  });

  it("사용자 테마 설정을 불러와서 적용해야 함", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ theme: "dark" }),
    });

    render(<ThemeInitializer />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith("/api/user/preferences");
    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("시스템 테마는 적용하지 않아야 함", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ theme: "system" }),
    });

    render(<ThemeInitializer />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith("/api/user/preferences");
    expect(mockSetTheme).not.toHaveBeenCalled();
  });

  it("API 호출 실패 시 에러를 무시해야 함", async () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));

    render(<ThemeInitializer />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith("/api/user/preferences");
    expect(mockSetTheme).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("401 오류 시 에러를 무시해야 함", async () => {
    const consoleSpy = jest.spyOn(console, "debug").mockImplementation(() => {});

    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error("401 Unauthorized"));

    render(<ThemeInitializer />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(global.fetch).toHaveBeenCalledWith("/api/user/preferences");
    expect(mockSetTheme).not.toHaveBeenCalled();
    // 에러가 발생하면 console.debug가 호출됨
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("라이트 모드 테마를 적용할 수 있어야 함", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ theme: "light" }),
    });

    render(<ThemeInitializer />);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockSetTheme).toHaveBeenCalledWith("light");
  });
});

