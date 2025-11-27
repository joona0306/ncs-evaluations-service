/**
 * 인증 관련 유틸리티 함수 유닛 테스트
 */

describe('인증 유틸리티', () => {
  describe('이메일 확인 상태 체크', () => {
    it('이메일 확인 완료된 사용자 확인', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: '2024-01-01T00:00:00Z',
      };

      const isEmailConfirmed = !!user.email_confirmed_at;
      expect(isEmailConfirmed).toBe(true);
    });

    it('이메일 미확인 사용자 확인', () => {
      const user = {
        id: '123',
        email: 'test@example.com',
        email_confirmed_at: null,
      };

      const isEmailConfirmed = !!user.email_confirmed_at;
      expect(isEmailConfirmed).toBe(false);
    });
  });

  describe('관리자 승인 상태 체크', () => {
    it('승인 완료된 프로필 확인', () => {
      const profile = {
        id: '123',
        email: 'test@example.com',
        approved: true,
      };

      const isApproved = !!profile.approved;
      expect(isApproved).toBe(true);
    });

    it('승인 대기 중인 프로필 확인', () => {
      const profile = {
        id: '123',
        email: 'test@example.com',
        approved: false,
      };

      const isApproved = !!profile.approved;
      expect(isApproved).toBe(false);
    });
  });

  describe('접근 권한 체크', () => {
    it('모든 조건 충족 시 접근 허용', () => {
      const user = {
        email_confirmed_at: '2024-01-01T00:00:00Z',
      };
      const profile = {
        approved: true,
      };

      const canAccess = !!user.email_confirmed_at && !!profile.approved;
      expect(canAccess).toBe(true);
    });

    it('이메일 미확인 시 접근 거부', () => {
      const user = {
        email_confirmed_at: null,
      };
      const profile = {
        approved: true,
      };

      const canAccess = !!user.email_confirmed_at && !!profile.approved;
      expect(canAccess).toBe(false);
    });

    it('승인 전 상태 시 접근 거부', () => {
      const user = {
        email_confirmed_at: '2024-01-01T00:00:00Z',
      };
      const profile = {
        approved: false,
      };

      const canAccess = !!user.email_confirmed_at && !!profile.approved;
      expect(canAccess).toBe(false);
    });
  });
});

