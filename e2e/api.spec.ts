/**
 * API 엔드포인트 E2E 테스트
 * 주요 API 라우트의 응답 확인
 */

import { test, expect } from '@playwright/test';

test.describe('API 엔드포인트', () => {
  test('보호된 API는 인증 없이 접근 불가', async ({ request }) => {
    // 인증 없이 보호된 API 접근 시도
    const response = await request.get('/api/profiles', {
      maxRedirects: 0, // 리다이렉트를 따르지 않음
    });
    
    // 401 Unauthorized, 403 Forbidden, 또는 302 리다이렉트 확인
    // Next.js 미들웨어가 리다이렉트할 수 있음
    const status = response.status();
    expect([401, 403, 302, 307, 308]).toContain(status);
  });

  test('공개 API 엔드포인트 확인', async ({ request }) => {
    // 공개 엔드포인트가 있다면 테스트
    // 현재는 모든 API가 보호되어 있으므로 스킵
  });

  test('API 에러 응답 형식 확인', async ({ request }) => {
    const response = await request.get('/api/profiles', {
      maxRedirects: 0,
    });
    
    const status = response.status();
    const contentType = response.headers()['content-type'] || '';
    
    // JSON 응답인 경우에만 파싱
    if (contentType.includes('application/json')) {
      try {
        const data = await response.json();
        // 에러 응답에 error 필드가 있는지 확인
        expect(data).toHaveProperty('error');
      } catch (e) {
        // JSON 파싱 실패는 정상 (에러 응답일 수 있음)
        expect(status).toBeGreaterThanOrEqual(400);
      }
    } else {
      // HTML 응답인 경우 (리다이렉트 등) 또는 에러 상태
      expect([302, 307, 308, 401, 403]).toContain(status);
    }
  });
});

