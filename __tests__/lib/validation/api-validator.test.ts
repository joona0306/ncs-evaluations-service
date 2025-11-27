/**
 * API Validator 단위 테스트
 * Next.js 서버 환경을 모킹하여 테스트합니다.
 */

// Next.js 서버 타입 모킹
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({
      status: init?.status || 200,
      json: async () => data,
    })),
  },
}));

import { validateRequest } from "@/lib/validation/api-validator";
import { z } from "zod";

describe("validateRequest", () => {
  const TestSchema = z.object({
    name: z.string().min(1),
    age: z.number().min(0),
  });

  it("should return success with valid data", () => {
    const result = validateRequest(TestSchema, {
      name: "Test",
      age: 25,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        name: "Test",
        age: 25,
      });
    }
  });

  it("should return error response with invalid data", () => {
    const result = validateRequest(TestSchema, {
      name: "",
      age: -1,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });

  it("should return error response with missing fields", () => {
    const result = validateRequest(TestSchema, {});

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.response.status).toBe(400);
    }
  });
});

