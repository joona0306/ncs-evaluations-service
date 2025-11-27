import { NextResponse } from "next/server";
import { ZodSchema, ZodError } from "zod";

/**
 * API 요청 본문을 Zod 스키마로 검증하는 헬퍼 함수
 * @param schema - Zod 스키마
 * @param data - 검증할 데이터
 * @returns 검증된 데이터 또는 에러 응답
 */
export function validateRequest<T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; response: NextResponse } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.join(".");
        return `${path}: ${err.message}`;
      });

      return {
        success: false,
        response: NextResponse.json(
          {
            error: "입력 검증 실패",
            details: errorMessages,
          },
          { status: 400 }
        ),
      };
    }

    return {
      success: false,
      response: NextResponse.json(
        {
          error: "입력 검증 중 오류가 발생했습니다.",
        },
        { status: 400 }
      ),
    };
  }
}

