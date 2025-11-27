import { z } from "zod";
import { sanitizeInput } from "@/lib/security";

// 공통 유틸리티 함수: sanitizeInput을 적용한 문자열 스키마
const sanitizedString = (min: number = 1, max: number = 10000) =>
  z
    .string()
    .min(min, `최소 ${min}자 이상 입력해주세요.`)
    .max(max, `최대 ${max}자까지 입력 가능합니다.`)
    .transform((val) => sanitizeInput(val));

// 훈련과정 스키마
export const CreateCourseSchema = z.object({
  name: sanitizedString(1, 200),
  code: sanitizedString(1, 50),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다."),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "날짜 형식이 올바르지 않습니다."),
  description: z.string().max(5000).transform((val) => sanitizeInput(val)).optional().nullable(),
});

export const UpdateCourseSchema = CreateCourseSchema.extend({
  id: z.string().uuid("유효하지 않은 ID 형식입니다."),
});

// 평가 스키마
export const CreateEvaluationSchema = z.object({
  competency_unit_id: z.string().uuid("유효하지 않은 능력단위 ID입니다."),
  student_id: z.string().uuid("유효하지 않은 학생 ID입니다."),
  teacher_id: z.string().uuid("유효하지 않은 교사 ID입니다."),
  comments: z.string().max(5000).transform((val) => sanitizeInput(val)).optional().nullable(),
  status: z.enum(["draft", "submitted", "confirmed"]),
  submission_id: z.string().uuid().optional().nullable(),
  evaluated_at: z.string().datetime().optional().nullable(),
  element_scores: z.array(
    z.object({
      criteria_id: z.string().uuid(),
      score: z.number().min(0).max(100),
      comments: z.string().max(1000).transform((val) => sanitizeInput(val)).optional().nullable(),
    })
  ),
});

export const UpdateEvaluationSchema = CreateEvaluationSchema.partial().extend({
  id: z.string().uuid("유효하지 않은 평가 ID입니다."),
});

// 과제물 제출 스키마
const SubmissionSchemaBase = z.object({
  evaluation_schedule_id: z.string().uuid("유효하지 않은 평가일정 ID입니다."),
  competency_unit_id: z.string().uuid("유효하지 않은 능력단위 ID입니다."),
  submission_type: z.enum(["image", "url"]),
  file_url: z.string().url().optional().nullable(),
  url: z.string().url("유효하지 않은 URL 형식입니다.").optional().nullable(),
  file_name: z.string().max(255).optional().nullable(),
  file_size: z.number().max(5 * 1024 * 1024, "파일 크기는 5MB 이하여야 합니다.").optional().nullable(),
  comments: z.string().max(2000).transform((val) => sanitizeInput(val)).optional().nullable(),
});

export const CreateSubmissionSchema = SubmissionSchemaBase.refine(
  (data) => {
    if (data.submission_type === "image") {
      return !!data.file_url;
    }
    if (data.submission_type === "url") {
      return !!data.url;
    }
    return true;
  },
  {
    message: "submission_type에 맞는 필드가 필요합니다.",
  }
);

export const UpdateSubmissionSchema = SubmissionSchemaBase.partial()
  .extend({
    id: z.string().uuid("유효하지 않은 과제물 ID입니다."),
  })
  .refine(
    (data) => {
      // submission_type이 제공된 경우에만 검증
      if (data.submission_type) {
        if (data.submission_type === "image") {
          return !!data.file_url;
        }
        if (data.submission_type === "url") {
          return !!data.url;
        }
      }
      return true;
    },
    {
      message: "submission_type에 맞는 필드가 필요합니다.",
    }
  );

// 수행준거 스키마
export const CreatePerformanceCriteriaSchema = z.object({
  competency_element_id: z.string().uuid("유효하지 않은 능력단위요소 ID입니다."),
  name: sanitizedString(1, 200),
  code: sanitizedString(1, 50),
  difficulty: z.enum(["high", "medium", "low"]),
  max_score: z.number().int().min(1).max(100),
  description: z.string().max(2000).transform((val) => sanitizeInput(val)).optional().nullable(),
  display_order: z.number().int().min(0).default(0),
});

export const UpdatePerformanceCriteriaSchema = CreatePerformanceCriteriaSchema.partial().extend({
  id: z.string().uuid("유효하지 않은 수행준거 ID입니다."),
});

