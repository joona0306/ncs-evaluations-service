/**
 * 스모크 테스트 (Smoke Tests)
 * 앱의 핵심 기능이 작동하는지 빠르게 확인
 */

import { test, expect } from '@playwright/test';

test.describe('스모크 테스트 - 핵심 기능 확인', () => {
  test('앱이 시작되고 홈페이지가 로드됨', async ({ page }) => {
    await page.goto('/');
    
    // 페이지가 로드되었는지 확인
    await expect(page).toHaveTitle(/.*NCS.*|.*훈련.*/i);
  });

  test('로그인 페이지가 정상적으로 로드됨', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 폼이 표시되는지 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('회원가입 페이지가 정상적으로 로드됨', async ({ page }) => {
    await page.goto('/signup');
    
    // 회원가입 폼이 표시되는지 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // 비밀번호 필드 (비밀번호 확인 필드도 있으므로 첫 번째 것만 확인)
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test('보호된 페이지는 로그인 없이 접근 불가', async ({ page }) => {
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('API 엔드포인트가 보호되어 있음', async ({ request }) => {
    const response = await request.get('/api/profiles', {
      maxRedirects: 0, // 리다이렉트를 따르지 않음
    });
    
    // 401 Unauthorized, 403 Forbidden, 또는 리다이렉트 확인
    const status = response.status();
    expect([401, 403, 302, 307, 308]).toContain(status);
  });
});

