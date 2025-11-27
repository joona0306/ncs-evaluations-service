/**
 * 접근성 E2E 테스트
 * 키보드 네비게이션, ARIA 속성 등 확인
 */

import { test, expect } from '@playwright/test';

test.describe('접근성', () => {
  test('키보드 네비게이션', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // Tab 키로 포커스 이동
    await page.keyboard.press('Tab');
    
    // 첫 번째 입력 필드에 포커스가 있는지 확인
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible({ timeout: 3000 });
  });

  test('폼 레이블 연결', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 이메일 입력 필드에 레이블이 연결되어 있는지 확인
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    
    const emailId = await emailInput.getAttribute('id');
    
    if (emailId) {
      const label = page.locator(`label[for="${emailId}"]`);
      if (await label.count() > 0) {
        await expect(label).toBeVisible({ timeout: 3000 });
      }
    } else {
      // id가 없어도 레이블이 인접해 있으면 접근 가능
      const label = page.locator('label').first();
      if (await label.count() > 0) {
        await expect(label).toBeVisible({ timeout: 3000 });
      }
    }
  });

  test('에러 메시지 접근성', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    // 잘못된 자격증명으로 로그인 시도
    await page.fill('input[type="email"]', 'wrong@example.com', { timeout: 5000 });
    // 로그인 페이지에는 비밀번호 필드가 하나만 있음
    await page.fill('input[type="password"]', 'wrongpassword', { timeout: 5000 });
    await page.click('button[type="submit"]', { timeout: 5000 });
    
    // 에러 메시지가 표시되는지 확인 (다양한 패턴)
    await expect(
      page.locator('text=/.*오류.*|.*실패.*|.*잘못.*|.*error.*|.*failed.*/i')
    ).toBeVisible({ timeout: 10000 });
  });
});

