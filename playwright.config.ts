import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E 테스트 설정
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  /* 테스트 실행 최대 시간 */
  timeout: 30 * 1000,
  expect: {
    /* Assertion 타임아웃 */
    timeout: 5000,
  },
  /* 테스트를 병렬로 실행 */
  fullyParallel: true,
  /* CI에서 실패 시 재시도 */
  retries: process.env.CI ? 2 : 0,
  /* 병렬 실행할 워커 수 */
  workers: process.env.CI ? 1 : undefined,
  /* 리포트 설정 */
  reporter: "html",
  /* 공유 설정 */
  use: {
    /* 기본 타임아웃 */
    actionTimeout: 0,
    /* Base URL */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3001",
    /* 실패 시 스크린샷 */
    screenshot: "only-on-failure",
    /* 실패 시 비디오 */
    video: "retain-on-failure",
    /* 트레이스 */
    trace: "on-first-retry",
  },

  /* 프로젝트별 설정 */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Firefox와 WebKit은 필요시 설치 후 활성화
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  /* 개발 서버 설정 */
  // 개발 서버가 이미 실행 중인 경우 주석 처리
  // webServer: {
  //   command: 'pnpm dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
