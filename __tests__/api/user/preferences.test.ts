/**
 * 사용자 테마 설정 API 테스트
 *
 * Note: Next.js의 NextResponse를 완전히 mock하기 어려우므로,
 * 실제 API 로직의 핵심 부분만 테스트합니다.
 */

import { GET, POST } from "@/app/api/user/preferences/route";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUserProfile } from "@/lib/auth";
import { NextResponse } from "next/server";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: jest.fn((data, init) => {
      const response = new Response(JSON.stringify(data), init);
      response.json = async () => data;
      return response;
    }),
  },
}));

// Mock dependencies
jest.mock("@/lib/supabase/server");
jest.mock("@/lib/auth");

const mockCreateClient = createClient as jest.MockedFunction<
  typeof createClient
>;
const mockGetCurrentUserProfile = getCurrentUserProfile as jest.MockedFunction<
  typeof getCurrentUserProfile
>;

describe("User Preferences API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /api/user/preferences", () => {
    it("인증된 사용자의 테마 설정을 반환해야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { theme: "dark" },
          error: null,
        }),
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ theme: "dark" });
      expect(mockSupabase.from).toHaveBeenCalledWith("user_preferences");
      expect(mockSupabase.eq).toHaveBeenCalledWith("user_id", "user-123");
    });

    it("설정이 없으면 기본값 'system'을 반환해야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { code: "PGRST116" },
        }),
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ theme: "system" });
    });

    it("인증되지 않은 사용자는 401을 반환해야 함", async () => {
      mockGetCurrentUserProfile.mockResolvedValue(null);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });
  });

  describe("POST /api/user/preferences", () => {
    it("유효한 테마 설정을 저장해야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "pref-123", user_id: "user-123", theme: "dark" },
          error: null,
        }),
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: "dark" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.theme).toBe("dark");
      expect(mockSupabase.upsert).toHaveBeenCalledWith(
        {
          user_id: "user-123",
          theme: "dark",
        },
        {
          onConflict: "user_id",
        }
      );
    });

    it("라이트 모드 테마를 저장할 수 있어야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "pref-123", user_id: "user-123", theme: "light" },
          error: null,
        }),
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: "light" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.theme).toBe("light");
    });

    it("시스템 설정 테마를 저장할 수 있어야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: { id: "pref-123", user_id: "user-123", theme: "system" },
          error: null,
        }),
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: "system" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.data.theme).toBe("system");
    });

    it("유효하지 않은 테마 값은 400을 반환해야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: "invalid" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid theme value");
    });

    it("테마 값이 없으면 400을 반환해야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain("Invalid theme value");
    });

    it("인증되지 않은 사용자는 401을 반환해야 함", async () => {
      mockGetCurrentUserProfile.mockResolvedValue(null);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: "dark" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
    });

    it("Supabase 오류 시 500을 반환해야 함", async () => {
      const mockProfile = {
        id: "user-123",
        email: "test@example.com",
        full_name: "Test User",
        role: "student",
      };

      const mockSupabase = {
        from: jest.fn().mockReturnThis(),
        upsert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      mockGetCurrentUserProfile.mockResolvedValue(mockProfile as any);
      mockCreateClient.mockResolvedValue(mockSupabase as any);

      const request = new Request(
        "http://localhost:3000/api/user/preferences",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ theme: "dark" }),
        }
      );

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Database error");
    });
  });
});
