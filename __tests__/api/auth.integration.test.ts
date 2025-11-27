/**
 * 인증 API 통합 테스트
 * 실제 서버(포트 3001)에 요청을 보내서 테스트합니다.
 */

describe("인증 API 통합 테스트", () => {
  const BASE_URL = "http://localhost:3001";

  describe("POST /api/auth/check-email", () => {
    it("이메일 중복 확인 API 응답 형식 확인", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email: "test@example.com" }),
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty("exists");
      expect(typeof data.exists).toBe("boolean");
    });

    it("이메일 파라미터 없이 요청 시 에러 반환", async () => {
      const response = await fetch(`${BASE_URL}/api/auth/check-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });

      expect([400, 500]).toContain(response.status);
    });
  });
});

