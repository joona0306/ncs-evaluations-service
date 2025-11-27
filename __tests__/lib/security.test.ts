import {
  sanitizeInput,
  validateEmail,
  validateFileType,
  validateFileSize,
} from "@/lib/security";

describe("sanitizeInput", () => {
  it("should remove HTML tags", () => {
    // sanitizeInput은 모든 HTML 태그를 제거하므로 빈 문자열이 반환됨
    expect(sanitizeInput("<script>alert('xss')</script>")).toBe("");
  });

  it("should remove dangerous HTML tags", () => {
    expect(sanitizeInput("<script>alert('xss')</script>Hello")).toBe("Hello");
    expect(sanitizeInput("<iframe src='evil.com'></iframe>")).toBe("");
    expect(sanitizeInput("<object data='evil.swf'></object>")).toBe("");
  });

  it("should remove event handlers", () => {
    expect(sanitizeInput("<div onclick='alert(1)'>Test</div>")).toBe("Test");
  });

  it("should remove javascript: protocol", () => {
    expect(sanitizeInput("<a href='javascript:alert(1)'>Link</a>")).toBe("Link");
  });

  it("should trim whitespace", () => {
    expect(sanitizeInput("  test  ")).toBe("test");
  });

  it("should limit length to 10000", () => {
    const longString = "a".repeat(20000);
    expect(sanitizeInput(longString).length).toBe(10000);
  });
});

describe("validateEmail", () => {
  it("should validate correct email", () => {
    expect(validateEmail("test@example.com")).toBe(true);
  });

  it("should reject invalid email", () => {
    expect(validateEmail("invalid-email")).toBe(false);
    expect(validateEmail("@example.com")).toBe(false);
    expect(validateEmail("test@")).toBe(false);
  });
});

describe("validateFileType", () => {
  it("should validate file type", () => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    expect(validateFileType(file, ["image/png", "image/jpeg"])).toBe(true);
  });

  it("should reject invalid file type", () => {
    const file = new File(["content"], "test.pdf", { type: "application/pdf" });
    expect(validateFileType(file, ["image/png", "image/jpeg"])).toBe(false);
  });
});

describe("validateFileSize", () => {
  it("should validate file size", () => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    // 1MB 파일
    Object.defineProperty(file, "size", { value: 1024 * 1024 });
    expect(validateFileSize(file, 5)).toBe(true);
  });

  it("should reject oversized file", () => {
    const file = new File(["content"], "test.png", { type: "image/png" });
    // 10MB 파일
    Object.defineProperty(file, "size", { value: 10 * 1024 * 1024 });
    expect(validateFileSize(file, 5)).toBe(false);
  });
});

