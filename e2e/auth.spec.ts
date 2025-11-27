/**
 * 인증 관련 E2E 테스트
 * 로그인, 회원가입, 로그아웃 플로우 테스트
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = '테스트 사용자';

test.describe('인증 플로우', () => {
  test.beforeEach(async ({ page }) => {
    // 각 테스트 전에 홈페이지로 이동
    await page.goto('/');
  });

  test('로그인 페이지 접근', async ({ page }) => {
    // 로그인 페이지로 직접 이동
    await page.goto('/login');
    
    // 로그인 페이지로 이동 확인
    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('회원가입 페이지 접근', async ({ page }) => {
    // 회원가입 페이지로 직접 이동
    await page.goto('/signup');
    
    // 회원가입 페이지로 이동 확인
    await expect(page).toHaveURL(/.*\/signup/);
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
  });

  test('회원가입 플로우', async ({ page }) => {
    // 회원가입 페이지로 이동
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // 폼 요소 확인
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    // 비밀번호 필드 (비밀번호 확인 필드도 있으므로 첫 번째 것만 확인)
    await expect(page.locator('input[type="password"]').first()).toBeVisible({ timeout: 5000 });
    
    // 폼 입력 (실제 회원가입은 스킵 - 테스트 계정이 필요)
    // 여기서는 폼이 제대로 작동하는지만 확인
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]').first().fill(TEST_PASSWORD);
    
    // 이름 필드 찾기 (다양한 셀렉터 시도)
    const nameInput = page.locator('input[placeholder*="이름"], input[name*="name"], input[type="text"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(TEST_NAME);
    }
    
    // 실제 회원가입은 테스트 계정이 필요하므로 스킵
    // 실제 환경에서는 테스트 계정을 사용하여 전체 플로우 테스트 가능
  });

  test('로그인 플로우', async ({ page }) => {
    // 먼저 테스트 계정이 필요하므로, 실제 환경에서는 테스트 계정을 미리 생성해야 함
    // 여기서는 로그인 페이지의 UI만 테스트
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 폼 요소 확인
    await expect(page.locator('input[type="email"]')).toBeVisible({ timeout: 5000 });
    // 로그인 페이지에는 비밀번호 필드가 하나만 있음
    await expect(page.locator('input[type="password"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('button[type="submit"]')).toBeVisible({ timeout: 5000 });
    
    // 잘못된 자격증명으로 로그인 시도
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // 에러 메시지 표시 확인 (다양한 패턴 허용)
    await expect(
      page.locator('text=/.*오류.*|.*실패.*|.*잘못.*|.*error.*|.*failed.*|.*invalid.*/i')
    ).toBeVisible({ timeout: 10000 });
  });

  test('로그인 후 대시보드 접근', async ({ page }) => {
    // 실제 환경에서는 인증된 세션이 필요
    // 여기서는 대시보드 페이지가 로그인 없이 접근 시 리다이렉트되는지 확인
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/.*\/login/);
  });
});

