/**
 * 성능 테스트
 * 페이지 로딩 시간, API 응답 시간 등 확인
 */

import { test, expect } from '@playwright/test';

test.describe('성능 테스트', () => {
  test('홈페이지 로딩 시간', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // 15초 이내에 로드되어야 함 (네트워크 상태에 따라 다를 수 있음)
    expect(loadTime).toBeLessThan(15000);
    console.log(`홈페이지 로딩 시간: ${loadTime}ms`);
  });

  test('로그인 페이지 로딩 시간', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - startTime;
    
    // 10초 이내에 로드되어야 함 (네트워크 상태에 따라 다를 수 있음)
    expect(loadTime).toBeLessThan(10000);
    console.log(`로그인 페이지 로딩 시간: ${loadTime}ms`);
  });

  test('API 응답 시간', async ({ request }) => {
    const startTime = Date.now();
    const response = await request.get('/api/profiles', {
      maxRedirects: 0,
    });
    const responseTime = Date.now() - startTime;
    
    // API가 빠르게 응답해야 함 (에러 응답이어도)
    // 네트워크 상태에 따라 다를 수 있으므로 5초로 여유있게 설정
    expect(responseTime).toBeLessThan(5000);
    console.log(`API 응답 시간: ${responseTime}ms`);
  });
});

