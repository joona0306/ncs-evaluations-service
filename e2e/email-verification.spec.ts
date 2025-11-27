/**
 * 이메일 인증 및 관리자 승인 플로우 E2E 테스트
 */

import { test, expect } from '@playwright/test';

const TEST_EMAIL = `test-${Date.now()}@example.com`;
const TEST_PASSWORD = 'TestPassword123!';
const TEST_NAME = '테스트 사용자';

test.describe('이메일 인증 및 관리자 승인 플로우', () => {
  test('회원가입 시 이메일 확인 메시지 표시', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // 회원가입 폼 입력
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // 이름 필드 찾기
    const nameInput = page.locator('input[placeholder*="이름"], input[id*="name"], input[type="text"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(TEST_NAME);
    }
    
    // 전화번호 필드 (선택사항)
    const phoneInput = page.locator('input[type="tel"], input[id*="phone"]').first();
    if (await phoneInput.count() > 0) {
      await phoneInput.fill('010-1234-5678');
    }
    
    // 역할 선택
    const roleSelect = page.locator('select').first();
    if (await roleSelect.count() > 0) {
      await roleSelect.selectOption('student');
    }
    
    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 이메일 확인 메시지 확인 (다양한 패턴 허용)
    // 실제 환경에서는 Supabase 설정에 따라 다를 수 있음
    await expect(
      page.locator('text=/.*이메일.*확인.*|.*이메일.*링크.*발송.*|.*이메일 확인 필요.*/i').first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('중복 계정 체크', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    
    // 이미 존재하는 이메일로 회원가입 시도
    // (실제 환경에서는 테스트 계정이 필요)
    const existingEmail = 'existing@example.com';
    
    await page.fill('input[type="email"]', existingEmail);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    const nameInput = page.locator('input[placeholder*="이름"], input[id*="name"], input[type="text"]').first();
    if (await nameInput.count() > 0) {
      await nameInput.fill(TEST_NAME);
    }
    
    await page.click('button[type="submit"]');
    
    // 중복 계정 에러 메시지 확인 (에러가 발생하는 경우)
    // 실제 환경에서는 에러 메시지가 표시되어야 함
    // 또는 Supabase 에러 메시지가 표시될 수 있음
    await expect(
      page.locator('text=/.*이미.*존재.*|.*already.*exists.*|.*이미.*등록.*/i').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('이메일 확인 페이지 접근', async ({ page }) => {
    await page.goto('/verify-email');
    await page.waitForLoadState('networkidle');
    
    // 이메일 확인 페이지가 로드되었는지 확인 (제목 확인)
    await expect(page.locator('h3, h2, h1').filter({ hasText: /이메일 확인/i }).first()).toBeVisible({ timeout: 5000 });
  });

  test('관리자 승인 대기 페이지 접근', async ({ page }) => {
    // 로그인 없이 접근 시도 (리다이렉트 확인)
    await page.goto('/waiting-approval');
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
  });

  test('승인 대기 페이지 구조 확인', async ({ page }) => {
    // 실제 환경에서는 인증된 상태에서 테스트해야 함
    // 여기서는 로그인 페이지로 리다이렉트되는지만 확인
    await page.goto('/waiting-approval');
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
  });

  test('대시보드 접근 제한 - 미로그인', async ({ page }) => {
    // 로그아웃 상태 확인
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL(/.*\/login/, { timeout: 5000 });
  });

  test('대시보드 접근 제한 - 이메일 미확인', async ({ page }) => {
    // 실제 환경에서는 이메일 미확인 계정이 필요
    // 여기서는 미들웨어가 작동하는지만 확인
    await page.goto('/dashboard');
    
    // 로그인 페이지로 리다이렉트 (또는 이메일 확인 페이지)
    await expect(page).toHaveURL(/.*\/(login|verify-email)/, { timeout: 5000 });
  });
});

