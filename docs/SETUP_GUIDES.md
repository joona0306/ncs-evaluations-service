# 설정 가이드

이 문서는 프로젝트 초기 설정 및 관리에 필요한 가이드들을 포함합니다.

---

## 📋 목차

1. [관리자 계정 생성](#관리자-계정-생성)
2. [이메일 인증 빠른 테스트](#이메일-인증-빠른-테스트)
3. [성능 테스트](#성능-테스트)

---

## 관리자 계정 생성

관리자 계정은 회원가입을 통해 생성할 수 없으며, Supabase 대시보드에서 수동으로 생성해야 합니다.

### 방법 1: Supabase 대시보드에서 생성 (권장)

#### 1단계: 사용자 생성

1. Supabase 대시보드에 로그인
2. **Authentication** > **Users** 메뉴로 이동
3. **Add user** 버튼 클릭
4. 다음 정보 입력:
   - **Email**: 관리자 이메일 (예: `admin@example.com`)
   - **Password**: 강력한 비밀번호
   - **Auto Confirm User**: 체크 (이메일 확인 없이 바로 사용 가능)
5. **Create user** 클릭

#### 2단계: 사용자 UUID 확인

1. 생성된 사용자를 클릭하여 상세 정보 확인
2. **UUID** 값을 복사 (예: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

#### 3단계: 프로필 생성

1. **SQL Editor**로 이동
2. 다음 쿼리를 실행 (UUID와 이메일을 실제 값으로 변경):

```sql
-- 프로필이 없으면 생성, 있으면 업데이트
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'UID 입력',
  'admin@example.com',
  '시스템 관리자',
  'admin'
)
ON CONFLICT (id)
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role;
```

### 보안 권장사항

1. 관리자 비밀번호는 강력하게 설정하세요 (최소 12자 이상, 대소문자, 숫자, 특수문자 포함)
2. 관리자 이메일은 실제 사용하는 이메일로 설정하세요
3. 관리자 계정은 최소한의 개수만 유지하세요
4. 정기적으로 비밀번호를 변경하세요

### 문제 해결

#### 프로필이 생성되지 않는 경우

- UUID가 정확한지 확인하세요
- 사용자가 auth.users 테이블에 존재하는지 확인하세요
- RLS 정책이 프로필 생성을 막고 있지 않은지 확인하세요

#### 로그인이 안 되는 경우

- 이메일과 비밀번호가 정확한지 확인하세요
- Auto Confirm User가 체크되어 있는지 확인하세요
- 프로필의 role이 'admin'으로 설정되어 있는지 확인하세요

---

## 이메일 인증 빠른 테스트

### 빠른 테스트 체크리스트

#### ✅ 1. 회원가입 테스트

1. 브라우저에서 `http://localhost:3001/signup` 접속
2. 새 계정 정보 입력:
   - 이메일: `test-user-1@example.com`
   - 비밀번호: `test123456`
   - 이름: `테스트 사용자1`
   - 전화번호: `010-1234-5678`
   - 역할: `훈련생`
3. **회원가입** 버튼 클릭
4. ✅ 확인 사항:
   - [ ] "이메일 확인 링크를 발송했습니다" 메시지 표시
   - [ ] 대시보드로 이동하지 않음
   - [ ] 이메일 주소가 메시지에 표시됨

#### ✅ 2. 중복 계정 테스트

1. 같은 이메일로 다시 회원가입 시도
2. ✅ 확인 사항:
   - [ ] "이미 존재하는 계정입니다" 에러 메시지 표시

#### ✅ 3. 이메일 확인 테스트 (이메일 인증 활성화 시)

**옵션 A: 이메일 인증 활성화된 경우**
1. 이메일에서 확인 링크 클릭
2. ✅ 확인 사항:
   - [ ] `/verify-email` 페이지로 이동
   - [ ] "이메일 확인이 완료되었습니다" 메시지 표시
   - [ ] "승인 대기 페이지로" 버튼 표시

**옵션 B: 이메일 인증 비활성화된 경우 (개발용)**
1. Supabase 대시보드 → Authentication → Settings
2. "Enable email confirmations" 비활성화
3. 회원가입 시 자동으로 로그인됨
4. SQL로 이메일 확인 상태 수동 설정:
```sql
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test-user-1@example.com';
```

#### ✅ 4. 관리자 승인 대기 페이지 테스트

1. `http://localhost:3001/waiting-approval` 접속 (또는 이메일 확인 후 이동)
2. ✅ 확인 사항:
   - [ ] "관리자 승인 대기" 제목 표시
   - [ ] 계정 정보 표시
   - [ ] "승인 상태 확인" 버튼 표시
   - [ ] "로그아웃" 버튼 표시

#### ✅ 5. 관리자 승인 테스트

1. **관리자 계정으로 로그인**
   - 관리자 계정이 없으면 위의 [관리자 계정 생성](#관리자-계정-생성) 참고
2. `http://localhost:3001/dashboard/users` 접속
3. 테스트 사용자 찾기
4. "승인하기" 버튼 클릭
5. ✅ 확인 사항:
   - [ ] 승인 상태가 "승인됨"으로 변경
   - [ ] 승인 대기 페이지에서 "승인 상태 확인" 버튼 클릭 시 대시보드로 이동

#### ✅ 6. 로그인 시 상태 체크 테스트

**테스트 1: 이메일 미확인 상태**
1. 이메일 확인 전 계정으로 로그인 시도
2. ✅ 확인 사항:
   - [ ] `/verify-email` 페이지로 리다이렉트

**테스트 2: 승인 전 상태**
1. 이메일 확인 완료, 승인 전 계정으로 로그인
2. ✅ 확인 사항:
   - [ ] `/waiting-approval` 페이지로 리다이렉트

**테스트 3: 모든 조건 충족**
1. 이메일 확인 + 승인 완료 계정으로 로그인
2. ✅ 확인 사항:
   - [ ] 대시보드로 정상 이동

#### ✅ 7. 대시보드 접근 제한 테스트

**테스트 1: 미로그인 상태**
1. 로그아웃 상태에서 `http://localhost:3001/dashboard` 접속
2. ✅ 확인 사항:
   - [ ] `/login` 페이지로 리다이렉트

**테스트 2: 이메일 미확인 상태**
1. 이메일 미확인 계정으로 로그인
2. `http://localhost:3001/dashboard` 직접 접속 시도
3. ✅ 확인 사항:
   - [ ] `/verify-email` 페이지로 리다이렉트

**테스트 3: 승인 전 상태**
1. 승인 전 계정으로 로그인
2. `http://localhost:3001/dashboard` 직접 접속 시도
3. ✅ 확인 사항:
   - [ ] `/waiting-approval` 페이지로 리다이렉트

### 개발 환경 빠른 테스트 (이메일 인증 비활성화)

개발 환경에서 빠르게 테스트하려면:

1. **Supabase 설정**
   - Authentication → Settings → "Enable email confirmations" 비활성화

2. **회원가입 후 SQL로 상태 설정**
```sql
-- 이메일 확인 완료
UPDATE auth.users
SET email_confirmed_at = NOW()
WHERE email = 'test-user-1@example.com';

-- 관리자 승인
UPDATE public.profiles
SET approved = true
WHERE email = 'test-user-1@example.com';
```

3. **로그인 테스트**
   - 모든 조건이 충족되면 대시보드 접근 가능

### 예상 결과

#### 정상 플로우
```
회원가입 → 이메일 확인 메시지 → 이메일 확인 → 승인 대기 → 관리자 승인 → 대시보드 접근 ✅
```

#### 에러 케이스
- 중복 계정: "이미 존재하는 계정입니다" ✅
- 이메일 미확인 로그인: `/verify-email`로 리다이렉트 ✅
- 승인 전 로그인: `/waiting-approval`로 리다이렉트 ✅
- 승인 전 대시보드 접근: `/waiting-approval`로 리다이렉트 ✅

자세한 내용은 [EMAIL_VERIFICATION.md](./EMAIL_VERIFICATION.md)를 참고하세요.

---

## 성능 테스트

### 🚀 빠른 테스트 방법

#### 1. 브라우저에서 접속
```
http://localhost:3001
```

#### 2. Chrome DevTools 열기
- **F12** 또는 **Ctrl+Shift+I** (Windows/Linux)
- **Cmd+Option+I** (Mac)

#### 3. Performance 측정

##### 방법 A: Performance 탭
1. **Performance** 탭 클릭
2. **Record** 버튼 클릭 (또는 **Ctrl+E**)
3. 페이지 새로고침 (**Ctrl+R**)
4. 페이지가 완전히 로드될 때까지 대기
5. **Stop** 버튼 클릭
6. **Summary** 섹션에서 **Total Load Time** 확인

##### 방법 B: Lighthouse
1. **Lighthouse** 탭 클릭
2. **Performance** 체크박스만 선택
3. **Analyze page load** 클릭
4. 결과 확인:
   - **Performance Score**: 목표 90점 이상
   - **LCP**: 목표 2.5초 이하
   - **FID**: 목표 100ms 이하
   - **CLS**: 목표 0.1 이하

#### 4. Network 탭 확인
1. **Network** 탭 클릭
2. 페이지 새로고침
3. 확인 사항:
   - **총 요청 수**: 하단에 표시
   - **총 크기**: 하단에 표시
   - **로딩 시간**: 각 리소스별 확인
   - **캐시 상태**: (disk cache) 또는 (memory cache) 확인

### 📊 주요 페이지 테스트

#### 대시보드 (`/dashboard`)
1. 로그인 후 접속
2. Performance 탭에서 측정
3. **목표**: 2초 이하

#### 평가 목록 (`/dashboard/evaluations`)
1. 네비게이션 메뉴에서 "평가 관리" 클릭
2. Performance 탭에서 측정
3. **목표**: 2초 이하

#### 평가 상세 (`/dashboard/evaluations/[id]`)
1. 평가 목록에서 평가 하나 클릭
2. Performance 탭에서 측정
3. **목표**: 2초 이하

### ✅ 빠른 체크리스트

- [ ] 대시보드 로딩: 2초 이하
- [ ] 평가 목록 로딩: 2초 이하
- [ ] 평가 상세 로딩: 2초 이하
- [ ] Lighthouse 점수: 90점 이상
- [ ] LCP: 2.5초 이하
- [ ] Network 탭에서 캐시 히트 확인

### 🎯 예상 결과

#### 개선 전
- 대시보드: ~1000ms
- 평가 목록: ~1500ms
- 평가 상세: ~1200ms

#### 개선 후 (목표)
- 대시보드: ~300-500ms
- 평가 목록: ~500-800ms
- 평가 상세: ~400-600ms

자세한 내용은 [PERFORMANCE_2SEC_GOAL.md](./PERFORMANCE_2SEC_GOAL.md)를 참고하세요.

---

**문서 작성일**: 2025년 11월 27일  
**마지막 업데이트**: 2025년 11월 27일

