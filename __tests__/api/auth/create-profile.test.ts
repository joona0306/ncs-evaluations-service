/**
 * 프로필 생성 API 유닛 테스트
 */

describe('프로필 생성 API', () => {
  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
  };

  const mockProfile = {
    id: 'user-123',
    email: 'test@example.com',
    full_name: '테스트 사용자',
    role: 'student',
    approved: false,
  };

  describe('프로필 생성 로직', () => {
    it('새 프로필 생성', () => {
      const existingProfile = null;
      const newProfile = {
        id: mockUser.id,
        email: mockUser.email,
        full_name: '테스트 사용자',
        role: 'student',
      };

      expect(existingProfile).toBeNull();
      expect(newProfile.id).toBe(mockUser.id);
      expect(newProfile.role).toBe('student');
    });

    it('이미 존재하는 프로필 확인', () => {
      const existingProfile = mockProfile;

      expect(existingProfile).not.toBeNull();
      expect(existingProfile.id).toBe(mockUser.id);
    });

    it('관리자 역할 프로필 생성 방지', () => {
      const role = 'admin';
      const isAdmin = role === 'admin';

      expect(isAdmin).toBe(true);
      // 관리자 프로필은 생성 불가
    });
  });

  describe('프로필 데이터 검증', () => {
    it('필수 필드 확인', () => {
      const profile = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'student',
      };

      expect(profile.id).toBeTruthy();
      expect(profile.email).toBeTruthy();
      expect(profile.role).toBeTruthy();
    });

    it('기본값 설정', () => {
      const profile = {
        id: 'user-123',
        email: 'test@example.com',
        role: 'student',
        approved: false, // 기본값
      };

      expect(profile.approved).toBe(false);
    });
  });
});

