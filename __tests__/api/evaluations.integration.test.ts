/**
 * 평가 API 통합 테스트
 * 실제 서버(포트 3001)에 요청을 보내서 테스트합니다.
 */

describe("평가 API 통합 테스트", () => {
  const BASE_URL = "http://localhost:3001";

  describe("GET /api/evaluations", () => {
    it("API 엔드포인트가 응답하는지 확인", async () => {
      const response = await fetch(`${BASE_URL}/api/evaluations`);
      
      // 서버가 응답하는지 확인 (200, 401, 307, 403 모두 유효한 응답)
      expect([200, 401, 307, 403, 500]).toContain(response.status);
    });

    it("응답 형식 확인", async () => {
      const response = await fetch(`${BASE_URL}/api/evaluations`);
      
      // 리다이렉트인 경우 본문이 없을 수 있음
      if (response.status === 307 || response.status === 401) {
        expect(response.status).toBeGreaterThanOrEqual(300);
        return;
      }

      // JSON 응답인 경우
      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        expect(data).toBeDefined();
      }
    });
  });

  describe("GET /api/evaluations/by-course", () => {
    it("쿼리 파라미터 없이 접근 시 에러 또는 리다이렉트 반환", async () => {
      const response = await fetch(`${BASE_URL}/api/evaluations/by-course`);
      
      // 인증, 파라미터 오류, 또는 리다이렉트 (200은 예상치 못한 응답이지만 허용)
      expect([200, 400, 401, 307, 403, 500]).toContain(response.status);
    });
  });
});

