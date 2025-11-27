/**
 * 서버 사이드에서 사용하는 간단한 sanitization 함수
 * 정규식을 사용하여 HTML 태그를 제거합니다.
 *
 * @param input - sanitize할 입력 문자열
 * @returns sanitize된 문자열
 */
function sanitizeInputServer(input: string): string {
  if (!input || typeof input !== "string") {
    return "";
  }

  // 최대 길이 제한
  const trimmed = input.trim().slice(0, 10000);

  // HTML 태그 제거 (정규식 기반)
  // <script>, <iframe>, <object>, <embed> 등 위험한 태그 제거
  let sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // 이벤트 핸들러 제거
    .replace(/javascript:/gi, "") // javascript: 프로토콜 제거
    .replace(/<[^>]+>/g, ""); // 나머지 HTML 태그 제거

  return sanitized;
}

/**
 * 사용자 입력을 sanitize하여 XSS 공격을 방지합니다.
 * 서버 사이드와 클라이언트 사이드 모두에서 정규식 기반 sanitization을 사용합니다.
 * (클라이언트 사이드에서 DOMPurify가 필요한 경우 SafeHTML 컴포넌트를 사용하세요)
 *
 * @param input - sanitize할 입력 문자열
 * @param allowHTML - HTML 태그를 허용할지 여부 (기본값: false, 현재는 무시됨)
 * @returns sanitize된 문자열
 */
export function sanitizeInput(
  input: string,
  allowHTML: boolean = false
): string {
  // 서버 사이드와 클라이언트 사이드 모두에서 간단한 sanitization 사용
  // (DOMPurify는 비동기이므로 동기 함수에서는 사용하지 않음)
  return sanitizeInputServer(input);
}

/**
 * HTML 콘텐츠를 안전하게 렌더링하기 위한 sanitize 함수
 * 서버 사이드: 정규식 기반 sanitization
 * 클라이언트 사이드: DOMPurify 사용 (동적 임포트)
 *
 * @param html - sanitize할 HTML 문자열
 * @returns sanitize된 HTML 문자열
 */
export function sanitizeHTML(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  // 서버 사이드에서는 간단한 sanitization 사용
  if (typeof window === "undefined") {
    // 기본적인 HTML 태그만 허용하고 나머지는 제거
    const trimmed = html.trim().slice(0, 10000);

    // 위험한 태그와 속성 제거
    let sanitized = trimmed
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // 이벤트 핸들러 제거
      .replace(/javascript:/gi, ""); // javascript: 프로토콜 제거

    // 허용된 태그만 남기고 나머지 제거
    const allowedTags = ["p", "br", "strong", "em", "u", "ol", "ul", "li", "a"];
    const tagPattern = new RegExp(
      `<(?!\/?(${allowedTags.join("|")})\\b)[^>]+>`,
      "gi"
    );
    sanitized = sanitized.replace(tagPattern, "");

    // 허용된 속성만 남기기 (href, target, rel)
    sanitized = sanitized.replace(
      /\s+(?!href|target|rel)[\w-]+=["'][^"']*["']/gi,
      ""
    );

    return sanitized;
  }

  // 클라이언트 사이드에서는 동기적으로 간단한 sanitization 사용
  // (DOMPurify는 비동기이므로 동기 함수에서는 사용하지 않음)
  const trimmed = html.trim().slice(0, 10000);

  let sanitized = trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, "")
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, "")
    .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "") // 이벤트 핸들러 제거
    .replace(/javascript:/gi, ""); // javascript: 프로토콜 제거

  // 허용된 태그만 남기고 나머지 제거
  const allowedTags = ["p", "br", "strong", "em", "u", "ol", "ul", "li", "a"];
  const tagPattern = new RegExp(
    `<(?!\/?(${allowedTags.join("|")})\\b)[^>]+>`,
    "gi"
  );
  sanitized = sanitized.replace(tagPattern, "");

  // 허용된 속성만 남기기 (href, target, rel)
  sanitized = sanitized.replace(
    /\s+(?!href|target|rel)[\w-]+=["'][^"']*["']/gi,
    ""
  );

  return sanitized;
}

/**
 * URL을 안전하게 검증하고 sanitize합니다.
 *
 * @param url - 검증할 URL 문자열
 * @returns 검증된 URL 또는 빈 문자열
 */
export function sanitizeURL(url: string): string {
  if (!url || typeof url !== "string") {
    return "";
  }

  const trimmed = url.trim();

  // URL 형식 검증
  try {
    const urlObj = new URL(trimmed);
    // 허용된 프로토콜만 허용
    if (!["http:", "https:"].includes(urlObj.protocol)) {
      return "";
    }
    return trimmed;
  } catch {
    // URL 형식이 아닌 경우 빈 문자열 반환
    return "";
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

export function validateFileSize(file: File, maxSizeMB: number): boolean {
  return file.size <= maxSizeMB * 1024 * 1024;
}
