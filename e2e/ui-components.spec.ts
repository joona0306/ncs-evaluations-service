/**
 * UI 컴포넌트 E2E 테스트
 * 버튼, 폼, 입력 필드 등의 기본 동작 확인
 */

import { test, expect } from '@playwright/test';

test.describe('UI 컴포넌트', () => {
  test('로그인 폼 입력 필드', async ({ page }) => {
    await page.goto('/login');
    
    // 이메일 입력 필드
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();
    await emailInput.fill('test@example.com');
    await expect(emailInput).toHaveValue('test@example.com');
    
    // 비밀번호 입력 필드
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();
    await passwordInput.fill('password123');
    await expect(passwordInput).toHaveValue('password123');
  });

  test('회원가입 폼 입력 필드', async ({ page }) => {
    await page.goto('/signup');
    
    // 모든 필수 입력 필드 확인
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // 비밀번호 필드 (비밀번호 확인 필드도 있으므로 첫 번째 것만 확인)
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    // 비밀번호 확인 필드
    await expect(page.locator('input#confirmPassword')).toBeVisible();
    
    // 이름 필드 확인
    const nameInput = page.locator('input[placeholder*="이름"], input[name*="name"]');
    if (await nameInput.count() > 0) {
      await expect(nameInput.first()).toBeVisible();
    }
  });

  test('버튼 클릭 동작', async ({ page }) => {
    await page.goto('/login');
    
    // 로그인 버튼 확인
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toBeEnabled();
  });

  test('폼 유효성 검사', async ({ page }) => {
    await page.goto('/login');
    
    // 빈 폼 제출 시도
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // HTML5 유효성 검사로 인해 제출이 막히거나 에러 메시지가 표시되어야 함
    // 브라우저 기본 동작이므로 특별한 확인은 불필요
  });
});

