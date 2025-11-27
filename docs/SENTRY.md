# Sentry 에러 모니터링 가이드

## 📌 Sentry란?

**Sentry**는 실시간 에러 모니터링 및 성능 추적 플랫폼입니다. 프로덕션 환경에서 발생하는 에러를 자동으로 감지하고, 상세한 에러 정보를 제공합니다.

### 주요 기능

- ✅ **자동 에러 감지**: JavaScript, React, Next.js 에러 자동 캡처
- ✅ **상세한 에러 정보**: 스택 트레이스, 사용자 정보, 브라우저 정보 등
- ✅ **에러 알림**: 이메일, Slack 등으로 즉시 알림
- ✅ **성능 모니터링**: API 응답 시간, 페이지 로딩 시간 추적
- ✅ **Session Replay**: 사용자가 에러를 만났을 때의 화면 재생

---

## 🚀 초기 설정

### 1. Sentry 프로젝트 생성 및 DSN 얻기

#### 1-1. Sentry 계정 생성

1. [https://sentry.io](https://sentry.io) 접속
2. 무료 계정 생성 (Developer 플랜은 월 5,000개 이벤트 무료)
3. 로그인

#### 1-2. 프로젝트 생성

1. Sentry 대시보드에서 **"Create Project"** 클릭
2. 플랫폼 선택: **"Next.js"**
3. 프로젝트 이름 입력 (예: `ncs-training-management`)
4. **"Create Project"** 클릭

#### 1-3. DSN (Data Source Name) 복사

프로젝트 생성 후 표시되는 **DSN**을 복사합니다.

DSN 형식 예시:

```
https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o1234567.ingest.sentry.io/1234567
```

### 2. .env 파일 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# Sentry 설정
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o1234567.ingest.sentry.io/1234567

# 소스맵 업로드용 (선택사항)
SENTRY_ORG=your-org-slug          # Sentry URL에서 확인: sentry.io/organizations/{org-slug}/
SENTRY_PROJECT=your-project-slug   # 프로젝트 설정에서 확인
SENTRY_AUTH_TOKEN=your-auth-token   # Settings → Auth Tokens에서 생성
```

### 3. 개발 서버 재시작 (필수)

환경 변수를 로드하기 위해 개발 서버를 재시작하세요:

```bash
# 현재 실행 중인 서버 중지 (Ctrl + C)
# 그 다음 다시 시작
pnpm run dev
```

---

## 🧪 Sentry 작동 확인

### 테스트 API 엔드포인트 사용

브라우저에서 `http://localhost:3000/api/test-sentry` 접속하면 에러가 Sentry에 전송됩니다.

### Sentry 대시보드에서 확인

1. [Sentry 대시보드](https://sentry.io) 접속
2. 프로젝트 선택
3. **"Issues"** 탭에서 방금 발생한 에러 확인
4. 에러를 클릭하면 상세 정보 확인 가능:
   - 스택 트레이스
   - 발생 시간
   - 브라우저/OS 정보
   - 사용자 정보 (설정한 경우)

---

## 📊 프로덕션 환경 설정

### 1. 샘플링 비율 조정

**성능 최적화를 위해 프로덕션에서는 샘플링 비율을 낮췄습니다:**

| 환경                  | Traces 샘플링 | Session Replay | 설명                   |
| --------------------- | ------------- | -------------- | ---------------------- |
| 개발 (development)    | 100% (1.0)    | 100%           | 모든 성능 데이터 수집  |
| 프로덕션 (production) | 10% (0.1)     | 10%            | 성능 최적화, 비용 절감 |

**중요:** 에러는 항상 100% 캡처됩니다. 샘플링은 성능 추적(traces)에만 적용됩니다.

### 2. 환경별 설정 분리

#### 환경 변수 자동 감지

- `NODE_ENV`를 기반으로 자동으로 환경 구분
- `development`: 개발 환경
- `production`: 프로덕션 환경

#### 디버그 모드

- **개발 환경**: `debug: true` (상세한 로그 출력)
- **프로덕션**: `debug: false` (로그 최소화)

### 3. 보안 설정 (민감한 정보 마스킹)

프로덕션 환경에서 자동으로 제거되는 정보:

- ✅ **쿠키**: 모든 쿠키 데이터
- ✅ **Authorization 헤더**: 인증 토큰
- ✅ **비밀번호**: 요청 body의 password 필드
- ✅ **토큰**: 요청 body의 token, accessToken 필드

---

## 🎯 일상적인 사용

### 자동으로 캡처되는 에러

다음 에러들은 **자동으로** Sentry에 전송됩니다:

- ✅ React 컴포넌트 렌더링 에러
- ✅ Next.js API 라우트 에러
- ✅ 전역 에러 (`app/global-error.tsx`)
- ✅ 미처리된 Promise rejection

### 수동으로 에러 보고하기

중요한 에러나 특별한 컨텍스트가 필요한 경우:

```typescript
import * as Sentry from "@sentry/nextjs";

try {
  // ... 코드 ...
} catch (error) {
  Sentry.captureException(error, {
    tags: {
      feature: "course-creation",
      severity: "high",
    },
    extra: {
      userId: user.id,
      courseId: course.id,
    },
  });

  // 사용자에게 친화적인 에러 메시지 표시
  return NextResponse.json(
    { error: "과정 생성에 실패했습니다." },
    { status: 500 }
  );
}
```

### 사용자 정보 추가 (선택사항)

에러 발생 시 사용자 정보를 함께 전송:

```typescript
import * as Sentry from "@sentry/nextjs";

// 사용자 로그인 시
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.full_name,
});

// 로그아웃 시
Sentry.setUser(null);
```

---

## 🛠️ 문제 해결

### 에러가 Sentry 대시보드에 나타나지 않을 때

#### 1단계: DSN 확인

`.env.local` 파일에 DSN이 올바르게 설정되어 있는지 확인:

```env
NEXT_PUBLIC_SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx@o1234567.ingest.sentry.io/1234567
```

**확인 사항:**

- ✅ 파일명이 정확히 `.env.local`인지 확인
- ✅ `NEXT_PUBLIC_` 접두사가 있는지 확인
- ✅ DSN이 따옴표 없이 입력되어 있는지 확인
- ✅ 공백이나 줄바꿈이 없는지 확인

#### 2단계: 개발 서버 재시작

환경 변수는 서버 시작 시에만 로드됩니다:

```bash
# 1. 현재 서버 중지 (Ctrl + C)
# 2. 서버 재시작
pnpm run dev
```

#### 3단계: 디버그 모드 활성화

`/api/test-sentry` 엔드포인트를 사용하여 확인:

1. 브라우저에서 `http://localhost:3000/api/test-sentry` 접속
2. 응답 메시지 확인:
   - DSN이 설정되지 않았으면 경고 메시지 표시
   - DSN이 설정되었으면 성공 메시지 표시
3. **서버 콘솔 확인** (터미널):
   - `✅ Sentry에 에러 전송 시도:` 메시지 확인
   - DSN 값 확인

#### 4단계: Sentry 대시보드에서 확인

1. [Sentry 대시보드](https://sentry.io) 접속
2. 올바른 프로젝트 선택
3. **Issues** 탭 확인
4. 필터 확인:
   - "All Projects" 선택
   - "All Envs" 선택
   - 시간 범위 확인 (최근 1시간, 24시간 등)

#### 5단계: 네트워크 확인

브라우저 개발자 도구에서:

1. **Network** 탭 열기
2. `/api/test-sentry` 접속
3. `api.sentry.io` 또는 `ingest.sentry.io`로 시작하는 요청 확인
4. 요청이 없다면 Sentry가 초기화되지 않은 것

### 일반적인 문제와 해결 방법

#### 문제 1: DSN이 undefined

**증상:**

- 서버 콘솔에 "DSN 설정됨: false" 표시
- Sentry에 에러가 전송되지 않음

**해결:**

1. `.env.local` 파일 확인
2. 파일이 프로젝트 루트에 있는지 확인
3. 서버 재시작

#### 문제 2: 에러가 전송되지만 대시보드에 안 보임

**증상:**

- 서버 콘솔에 "Sentry에 에러 전송 시도" 메시지 표시
- 하지만 Sentry 대시보드에 에러가 없음

**해결:**

1. **올바른 프로젝트 선택**: Sentry 대시보드에서 프로젝트가 맞는지 확인
2. **필터 확인**:
   - "All Projects" 선택
   - "All Envs" 선택
   - 시간 범위를 넓게 설정 (24시간, 7일 등)
3. **에러 레벨 확인**: `level: "error"`로 설정해야 Issues에 표시됨

#### 문제 3: 클라이언트 에러는 안 보이지만 서버 에러는 보임 (또는 그 반대)

**원인:**

- 클라이언트와 서버가 다른 DSN을 사용하거나
- 하나의 설정 파일만 제대로 작동

**해결:**

1. `instrumentation-client.ts` (클라이언트) 확인
2. `sentry.server.config.ts` (서버) 확인
3. 둘 다 같은 DSN을 사용하는지 확인

---

## 📊 Sentry 대시보드 활용

### 1. 에러 모니터링

- **Issues**: 발생한 모든 에러 목록
- **Alerts**: 특정 에러 발생 시 알림 설정
- **Releases**: 배포 버전별 에러 추적

### 2. 알림 설정

1. **Settings** → **Alerts** → **Create Alert Rule**
2. 조건 설정:
   - 에러 발생 횟수
   - 특정 에러 타입
   - 특정 사용자에게만 발생하는 에러
3. 알림 채널 선택:
   - 이메일
   - Slack
   - Discord 등

---

## ⚠️ 주의사항

### 1. 개발 환경에서의 에러

개발 환경(`NODE_ENV=development`)에서도 에러가 Sentry에 전송됩니다.
테스트 에러가 많이 발생하지 않도록 주의하세요.

### 2. 민감한 정보

에러에 민감한 정보(비밀번호, 토큰 등)가 포함되지 않도록 주의:

```typescript
Sentry.init({
  beforeSend(event, hint) {
    // 민감한 정보 제거
    if (event.request) {
      delete event.request.cookies;
      delete event.request.headers?.Authorization;
    }
    return event;
  },
});
```

### 3. 무료 플랜 제한

- 월 5,000개 이벤트 제한
- 초과 시 알림이 오지 않을 수 있음
- 필요시 유료 플랜으로 업그레이드

---

## ✅ 체크리스트

### 초기 설정

- [ ] Sentry 계정 생성
- [ ] 프로젝트 생성
- [ ] DSN 복사
- [ ] `.env.local`에 DSN 추가
- [ ] 개발 서버 재시작
- [ ] 테스트 에러 발생시켜서 Sentry 작동 확인
- [ ] Sentry 대시보드에서 에러 확인

### 프로덕션 설정 (선택사항)

- [ ] 소스맵 업로드 설정
- [ ] 알림 설정
- [ ] 사용자 정보 추가

---

## 🆘 추가 도움말

1. **Sentry 공식 문서**: [Next.js 가이드](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
2. **Sentry 커뮤니티 포럼**: [forum.sentry.io](https://forum.sentry.io)
3. **디버그 모드 활성화**: `debug: true`로 설정하고 콘솔 로그 확인

---

## 💡 팁

- **프로덕션 배포 전**: 반드시 개발 환경에서 테스트 완료
- **에러 레벨**: `level: "error"`로 설정해야 Issues에 표시됨
- **환경 변수**: `.env.local`은 Git에 커밋하지 않도록 `.gitignore`에 추가
- **DSN 보안**: DSN은 공개되어도 괜찮지만, 민감한 정보는 포함하지 않음

---

이제 Sentry가 완전히 설정되었습니다! 프로덕션 배포 후 에러를 모니터링할 수 있습니다. 🎉
