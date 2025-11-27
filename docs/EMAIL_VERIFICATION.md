# 이메일 인증 및 관리자 승인 가이드

## 전체 플로우

```
회원가입
  ↓
이메일 확인 링크 발송
  ↓
이메일 확인 완료
  ↓
관리자 승인 대기
  ↓
관리자 승인 완료
  ↓
대시보드 접근 가능
```

---

## Supabase 설정

### 1. 이메일 인증 활성화

1. Supabase 대시보드에 로그인
2. 프로젝트 선택
3. **Authentication** → **Settings** 메뉴로 이동
4. **Email Auth** 섹션에서:
   - ✅ **Enable email confirmations** 체크
   - **Email confirmation template** 확인

### 2. 이메일 템플릿 설정

1. **Authentication** → **Email Templates** 메뉴로 이동
2. **Confirm signup** 템플릿 확인
3. 리다이렉트 URL 설정:
   ```
   {{ .SiteURL }}/verify-email?token={{ .TokenHash }}&type=email
   ```

### 3. SMTP 설정 (선택사항)

기본적으로 Supabase는 자체 SMTP를 사용하지만, 커스텀 SMTP를 사용할 수 있습니다:

1. **Authentication** → **Settings** → **SMTP Settings**
2. SMTP 제공자 정보 입력 (Gmail, SendGrid 등)

---

## 환경 변수

`.env.local` 파일에 다음 변수가 설정되어 있어야 합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 사용자 플로우

### 1. 회원가입 (`/signup`)

1. 사용자가 회원가입 폼 작성
2. 중복 계정 체크 (이미 존재하는 이메일인 경우 에러 메시지 표시)
3. `supabase.auth.signUp()` 호출
4. 이메일 확인 링크 발송
5. **이메일 확인 메시지 표시** (대시보드로 이동하지 않음)

**에러 처리:**
- 이미 존재하는 계정: "이미 존재하는 계정입니다. 로그인 페이지로 이동하세요."
- Rate limiting: 쿨다운 타이머 표시

### 2. 이메일 확인 (`/verify-email`)

1. 사용자가 이메일의 확인 링크 클릭
2. `/verify-email?token=...&type=email`로 리다이렉트
3. 토큰 검증 (Supabase가 자동으로 처리)
4. 이메일 확인 완료 메시지 표시
5. "승인 대기 페이지로" 버튼 클릭 → `/waiting-approval`로 이동

**에러 처리:**
- 토큰 만료/유효하지 않음: 에러 메시지 표시 및 이메일 재발송 버튼 제공

### 3. 관리자 승인 대기 (`/waiting-approval`)

1. 이메일 확인 완료 후 자동으로 이동
2. "승인 상태 확인" 버튼으로 수동 확인
3. 관리자가 승인하면 대시보드로 리다이렉트

**기능:**
- 계정 정보 표시
- 승인 상태 확인 버튼
- 로그아웃 버튼

### 4. 관리자 승인

1. **관리자 계정으로 로그인**
2. `/dashboard/users` 접속
3. 승인 대기 중인 사용자 찾기
4. "승인하기" 버튼 클릭
5. 사용자 프로필의 `approved` 필드가 `true`로 변경됨

### 5. 대시보드 접근

모든 조건이 충족되면:
- ✅ 이메일 확인 완료
- ✅ 관리자 승인 완료

대시보드에 접근할 수 있습니다.

---

## 로그인 시 상태 체크

### 미들웨어 동작

로그인 시 자동으로 상태를 확인하고 적절한 페이지로 리다이렉트합니다:

1. **미로그인**: `/login`으로 리다이렉트
2. **이메일 미확인**: `/verify-email`로 리다이렉트
3. **승인 전**: `/waiting-approval`로 리다이렉트
4. **모든 조건 충족**: `/dashboard` 접근 허용

---

## 빠른 테스트 체크리스트

### ✅ 1. 회원가입 테스트

1. 브라우저에서 `http://localhost:3000/signup` 접속
2. 새 계정 정보 입력
3. **회원가입** 버튼 클릭
4. ✅ 확인 사항:
   - [ ] "이메일 확인 링크를 발송했습니다" 메시지 표시
   - [ ] 대시보드로 이동하지 않음
   - [ ] 이메일 주소가 메시지에 표시됨

### ✅ 2. 중복 계정 테스트

1. 같은 이메일로 다시 회원가입 시도
2. ✅ 확인 사항:
   - [ ] "이미 존재하는 계정입니다" 에러 메시지 표시

### ✅ 3. 이메일 확인 테스트

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

### ✅ 4. 관리자 승인 대기 페이지 테스트

1. `http://localhost:3000/waiting-approval` 접속
2. ✅ 확인 사항:
   - [ ] "관리자 승인 대기" 제목 표시
   - [ ] 계정 정보 표시
   - [ ] "승인 상태 확인" 버튼 표시
   - [ ] "로그아웃" 버튼 표시

### ✅ 5. 관리자 승인 테스트

1. **관리자 계정으로 로그인**
2. `http://localhost:3000/dashboard/users` 접속
3. 테스트 사용자 찾기
4. "승인하기" 버튼 클릭
5. ✅ 확인 사항:
   - [ ] 승인 상태가 "승인됨"으로 변경
   - [ ] 승인 대기 페이지에서 "승인 상태 확인" 버튼 클릭 시 대시보드로 이동

### ✅ 6. 로그인 시 상태 체크 테스트

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

### ✅ 7. 대시보드 접근 제한 테스트

**테스트 1: 미로그인 상태**
1. 로그아웃 상태에서 `http://localhost:3000/dashboard` 접속
2. ✅ 확인 사항:
   - [ ] `/login` 페이지로 리다이렉트

**테스트 2: 이메일 미확인 상태**
1. 이메일 미확인 계정으로 로그인
2. `http://localhost:3000/dashboard` 직접 접속 시도
3. ✅ 확인 사항:
   - [ ] `/verify-email` 페이지로 리다이렉트

**테스트 3: 승인 전 상태**
1. 승인 전 계정으로 로그인
2. `http://localhost:3000/dashboard` 직접 접속 시도
3. ✅ 확인 사항:
   - [ ] `/waiting-approval` 페이지로 리다이렉트

---

## 개발 환경 빠른 테스트 (이메일 인증 비활성화)

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

---

## 예상 결과

### 정상 플로우
```
회원가입 → 이메일 확인 메시지 → 이메일 확인 → 승인 대기 → 관리자 승인 → 대시보드 접근 ✅
```

### 에러 케이스
- 중복 계정: "이미 존재하는 계정입니다" ✅
- 이메일 미확인 로그인: `/verify-email`로 리다이렉트 ✅
- 승인 전 로그인: `/waiting-approval`로 리다이렉트 ✅
- 승인 전 대시보드 접근: `/waiting-approval`로 리다이렉트 ✅

---

## 문제 해결

### 이메일이 오지 않는 경우

1. **Supabase 설정 확인**
   - Authentication → Settings → "Enable email confirmations" 활성화 확인
   - SMTP 설정 확인 (커스텀 SMTP 사용 시)

2. **스팸 폴더 확인**
   - 이메일이 스팸 폴더로 이동했을 수 있음

3. **이메일 템플릿 확인**
   - Authentication → Email Templates → Confirm signup 템플릿 확인

### 이메일 확인 링크가 작동하지 않는 경우

1. **토큰 만료 확인**
   - 이메일 확인 링크는 일정 시간 후 만료됨
   - `/verify-email` 페이지에서 "이메일 재발송" 버튼 사용

2. **리다이렉트 URL 확인**
   - 이메일 템플릿의 리다이렉트 URL이 올바른지 확인

### 관리자 승인이 반영되지 않는 경우

1. **프로필 확인**
   ```sql
   SELECT id, email, approved, role
   FROM public.profiles
   WHERE email = 'user@example.com';
   ```

2. **미들웨어 확인**
   - 개발 서버 재시작
   - 브라우저 캐시 클리어

---

이제 이메일 인증 및 관리자 승인 기능이 완전히 설정되었습니다! 🎉

