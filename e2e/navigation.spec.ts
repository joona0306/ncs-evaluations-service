/**
 * 네비게이션 E2E 테스트
 * 페이지 간 이동, 링크 동작 확인
 */

import { test, expect } from '@playwright/test';

test.describe('네비게이션', () => {
  test('홈페이지에서 로그인 링크', async ({ page }) => {
    await page.goto('/');
    
    // 로그인 링크 클릭 (버튼 또는 링크)
    const loginLink = page.locator('a:has-text("로그인"), button:has-text("로그인")').first();
    await expect(loginLink).toBeVisible({ timeout: 5000 });
    await loginLink.click();
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test('홈페이지에서 회원가입 링크', async ({ page }) => {
    await page.goto('/');
    
    // 회원가입 링크 클릭 (버튼 또는 링크)
    const signupLink = page.locator('a:has-text("회원가입"), button:has-text("회원가입")').first();
    await expect(signupLink).toBeVisible({ timeout: 5000 });
    await signupLink.click();
    await expect(page).toHaveURL(/.*\/signup/, { timeout: 10000 });
  });

  test('로그인 페이지에서 회원가입 링크', async ({ page }) => {
    await page.goto('/login');
    
    // 회원가입 링크 확인
    const signupLink = page.locator('a:has-text("회원가입")').first();
    await expect(signupLink).toBeVisible({ timeout: 5000 });
    await signupLink.click();
    await expect(page).toHaveURL(/.*\/signup/, { timeout: 10000 });
  });
});

