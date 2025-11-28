/**
 * 설정 폼 컴포넌트 테스트
 */

import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsForm } from "@/components/settings/settings-form";
import { useTheme } from "next-themes";

// Mock next-themes
jest.mock("next-themes", () => ({
  useTheme: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe("SettingsForm", () => {
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

  it("로딩 중일 때 로더를 표시해야 함", () => {
    render(<SettingsForm />);

    // 로더 아이콘(Loader2)이 표시되는지 확인
    const loader = document.querySelector('.lucide-loader-circle');
    expect(loader).toBeInTheDocument();
  });

  it("사용자 설정을 불러와서 표시해야 함", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ theme: "dark" }),
    });

    await act(async () => {
      render(<SettingsForm />);
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/preferences");
    });

    await waitFor(() => {
      const select = screen.getByLabelText(/테마/i) as HTMLSelectElement;
      expect(select.value).toBe("dark");
    });
  });

  it("테마 변경 시 API를 호출하고 테마를 업데이트해야 함", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: "system" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

    await act(async () => {
      render(<SettingsForm />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/테마/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/테마/i) as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(select, "dark");
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/user/preferences", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ theme: "dark" }),
      });
    });

    expect(mockSetTheme).toHaveBeenCalledWith("dark");
  });

  it("API 저장 실패 시 에러 메시지를 표시해야 함", async () => {
    const user = userEvent.setup();
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: "system" }),
      })
      .mockResolvedValueOnce({
        ok: false,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: "system" }),
      });

    await act(async () => {
      render(<SettingsForm />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/테마/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/테마/i) as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(select, "dark");
    });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        expect.stringContaining("설정 저장에 실패했습니다")
      );
    });

    alertSpy.mockRestore();
  });

  it("설정이 없으면 기본값 'system'을 표시해야 함", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ theme: "system" }),
    });

    await act(async () => {
      render(<SettingsForm />);
    });

    await waitFor(() => {
      const select = screen.getByLabelText(/테마/i) as HTMLSelectElement;
      expect(select.value).toBe("system");
    });
  });

  it("저장 중일 때 로딩 상태를 표시해야 함", async () => {
    const user = userEvent.setup();

    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ theme: "system" }),
      })
      .mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ ok: true, json: async () => ({ success: true }) }), 100)
          )
      );

    await act(async () => {
      render(<SettingsForm />);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/테마/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/테마/i) as HTMLSelectElement;
    await act(async () => {
      await user.selectOptions(select, "dark");
    });

    await waitFor(() => {
      expect(screen.getByText(/저장 중/i)).toBeInTheDocument();
    });
  });
});

