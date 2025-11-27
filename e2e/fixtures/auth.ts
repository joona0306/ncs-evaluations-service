/**
 * 인증 관련 테스트 픽스처
 * 로그인된 상태를 시뮬레이션하는 헬퍼 함수
 */

import { test as base } from '@playwright/test';

type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  // 인증된 페이지를 제공하는 픽스처
  // 실제 환경에서는 Supabase 세션을 사용해야 함
  authenticatedPage: async ({ page }, use) => {
    // 실제 환경에서는 여기서 로그인 프로세스를 수행
    // 현재는 플레이스홀더
    await use(page);
  },
});

export { expect } from '@playwright/test';

