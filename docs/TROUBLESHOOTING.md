# 문제 해결 가이드

이 문서는 프로젝트에서 발생할 수 있는 일반적인 문제와 해결 방법을 포함합니다.

---

## 📋 목차

1. [404 에러 해결](#404-에러-해결)
2. [isomorphic-dompurify ESM 모듈 문제](#isomorphic-dompurify-esm-모듈-문제)
3. [환경 변수 오류](#환경-변수-오류)
4. [Supabase 연결 오류](#supabase-연결-오류)

---

## 404 에러 해결

### 문제: `/login` 경로에서 404 에러 발생

#### 증상
- `/login` 경로 접근 시 404 Not Found 에러 발생
- 터미널에 반복적으로 `GET /login 404` 로그 출력

#### 원인
Next.js의 빌드 캐시가 오래되어 라우트가 제대로 인식되지 않는 경우가 있습니다.

#### 해결 방법

##### 1. 빌드 캐시 삭제 및 서버 재시작

```bash
# .next 캐시 삭제
rm -rf .next

# 또는 Windows에서
rmdir /s /q .next

# 개발 서버 재시작
pnpm dev
```

##### 2. 파일 구조 확인

`app/(auth)/login/page.tsx` 파일이 올바른 위치에 있는지 확인:

```
app/
  (auth)/
    login/
      page.tsx  ← 이 파일이 존재해야 함
    signup/
      page.tsx
    verify-email/
      page.tsx
    waiting-approval/
      page.tsx
```

##### 3. Next.js 라우트 그룹 확인

`(auth)`는 Next.js의 라우트 그룹입니다. 이는 URL 경로에 포함되지 않으므로:
- 파일 경로: `app/(auth)/login/page.tsx`
- 실제 URL: `/login` ✅

##### 4. 미들웨어 확인

`middleware.ts` 파일이 루트에 있고 올바르게 설정되어 있는지 확인

##### 5. 개발 서버 완전 재시작

1. 현재 실행 중인 개발 서버 종료 (Ctrl+C)
2. `.next` 폴더 삭제
3. `node_modules/.cache` 폴더 삭제 (있는 경우)
4. 개발 서버 재시작

##### 6. 포트 충돌 확인

다른 포트에서 서버가 실행 중일 수 있습니다:

```bash
# 포트 3000 사용 중인 프로세스 확인
netstat -ano | findstr :3000

# 프로세스 종료 (PID는 위 명령어 결과에서 확인)
taskkill /F /PID <PID>
```

### 예방 방법

1. **정기적인 캐시 정리**: 개발 중 문제가 발생하면 `.next` 폴더 삭제
2. **서버 재시작**: 코드 변경 후 서버가 제대로 반영되지 않으면 재시작
3. **포트 확인**: 여러 서버가 동시에 실행되지 않도록 주의

### 여전히 문제가 발생하는 경우

1. **전체 재설치**:
   ```bash
   rm -rf .next node_modules
   pnpm install
   pnpm dev
   ```

2. **Next.js 버전 확인**:
   ```bash
   pnpm list next
   ```

3. **로그 확인**: 개발 서버 콘솔에서 더 자세한 에러 메시지 확인

---

## isomorphic-dompurify ESM 모듈 문제

### 문제

서버 사이드에서 `isomorphic-dompurify`를 사용할 때 다음과 같은 에러가 발생했습니다:

```
Module not found: ESM packages (parse5) need to be imported. Use 'import' to reference the package instead.
```

이는 `isomorphic-dompurify`가 서버 사이드에서 `jsdom`을 사용하고, `jsdom`이 `parse5`를 ESM으로 import하려고 하는데 Next.js가 이를 처리하지 못하기 때문입니다.

### 해결 방법

#### 1. 서버 사이드와 클라이언트 사이드 분리

`lib/security.ts`를 두 파일로 분리했습니다:

- **`lib/security.ts`**: sanitization 함수만 (서버/클라이언트 모두 사용 가능)
- **`lib/auth-access.ts`**: 접근 제어 함수들 (서버 전용)

이렇게 하면 `lib/utils/safe-render.tsx`가 `lib/security.ts`를 import해도 서버 전용 코드가 포함되지 않습니다.

#### 2. 서버 사이드: 정규식 기반 sanitization

`lib/security.ts`의 `sanitizeInput`과 `sanitizeHTML` 함수를 수정하여 서버 사이드에서는 `isomorphic-dompurify`를 사용하지 않고 정규식 기반 sanitization을 사용하도록 변경했습니다.

```typescript
// 서버 사이드에서는 항상 간단한 sanitization 사용
if (typeof window === "undefined") {
  return sanitizeInputServer(input);
}
```

#### 3. 클라이언트 사이드: DOMPurify 동적 임포트

클라이언트 사이드에서는 `SafeHTML` 컴포넌트에서 `isomorphic-dompurify`를 동적으로 임포트하여 사용합니다.

#### 4. Next.js Webpack 설정

`next.config.js`에서 서버 사이드 번들에 `isomorphic-dompurify`와 `jsdom`을 제외하도록 설정했습니다:

```javascript
if (isServer) {
  config.externals = config.externals || [];
  config.externals.push({
    'isomorphic-dompurify': 'commonjs isomorphic-dompurify',
    'jsdom': 'commonjs jsdom',
  });
}
```

### 변경 사항

- `lib/security.ts`: 서버 전용 코드 제거, `isomorphic-dompurify` import 제거
- `lib/auth-access.ts`: 서버 전용 접근 제어 함수 분리
- `lib/utils/safe-render.tsx`: DOMPurify 동적 임포트
- `next.config.js`: 서버 사이드 번들에서 ESM 모듈 제외 설정

### 테스트

서버를 재시작한 후 다음을 확인하세요:

1. API 라우트가 정상적으로 작동하는지
2. 서버 사이드에서 ESM 모듈 에러가 발생하지 않는지
3. 클라이언트 사이드에서 DOMPurify가 정상적으로 작동하는지

---

## 환경 변수 오류

### 문제

환경 변수가 제대로 로드되지 않거나 오류가 발생하는 경우

### 해결 방법

#### 1. `.env.local` 파일 확인

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt`가 아님)
3. 환경 변수 값에 따옴표나 공백이 없는지 확인

#### 2. 환경 변수 형식 확인

```env
# 올바른 형식
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 잘못된 형식 (따옴표 사용하지 않음)
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"  # ❌
```

#### 3. 개발 서버 재시작

환경 변수 변경 후 반드시 개발 서버를 재시작하세요:

```bash
# Ctrl+C로 서버 중지 후
pnpm dev
```

#### 4. 환경 변수 확인

환경 변수가 제대로 로드되었는지 확인:

```typescript
// app/api/test-env/route.ts (임시)
export async function GET() {
  return Response.json({
    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
```

---

## Supabase 연결 오류

### 문제

Supabase 연결이 실패하거나 인증 오류가 발생하는 경우

### 해결 방법

#### 1. URL 형식 확인

- URL 형식: `https://xxxxx.supabase.co` (끝에 `/` 없음)
- API 키가 올바른지 확인 (anon/public key 사용)
- Supabase 프로젝트가 활성화되어 있는지 확인

#### 2. 이메일 중복 확인이 작동하지 않는 경우

- `check_email_exists` 함수가 Supabase에 생성되어 있는지 확인
- Supabase SQL Editor에서 함수 생성 SQL 실행 (마이그레이션 파일 참고)
- 환경 변수 변경 후 개발 서버를 재시작하세요

#### 3. RLS 정책 확인

Row Level Security (RLS) 정책이 올바르게 설정되어 있는지 확인:

1. Supabase 대시보드 > Authentication > Policies
2. 각 테이블의 RLS 정책 확인
3. 필요시 마이그레이션 파일 재실행

---

## 추가 문제 해결

### 문제가 계속되는 경우

1. **전체 재설치**:
   ```bash
   rm -rf .next node_modules
   pnpm install
   pnpm dev
   ```

2. **Supabase 프로젝트 재확인**:
   - Supabase 대시보드에서 프로젝트 상태 확인
   - API 키 재생성 후 `.env.local` 업데이트

3. **로그 확인**:
   - 개발 서버 콘솔에서 에러 메시지 확인
   - 브라우저 콘솔에서 클라이언트 사이드 에러 확인

---

**문서 작성일**: 2025년 11월 27일  
**마지막 업데이트**: 2025년 11월 27일

