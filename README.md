# NCS 훈련생 성적관리 시스템

NCS 훈련생 성적관리 및 평가 시스템입니다.

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **백엔드**: Supabase (PostgreSQL, Auth, Storage)
- **UI 컴포넌트**: shadcn/ui

## 시작하기

### 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 다음 정보를 확인합니다:
   - Project URL (예: `https://xxxxx.supabase.co`)
   - API Key > anon/public key

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# 선택사항: Connection Pooler 사용 (성능 개선)
# Supabase 대시보드 > Settings > Database > Connection Pooling에서 확인
# 예: https://your-project-id.pooler.supabase.co
NEXT_PUBLIC_SUPABASE_POOLER_URL=https://your-project-id.pooler.supabase.co
```

**Supabase 키 확인 방법**:

1. **Project URL 및 Anon Key**:

   - Supabase 대시보드 > 프로젝트 선택
   - 좌측 메뉴에서 **Settings** (⚙️) 클릭
   - **API** 메뉴 클릭
   - **Project URL** 복사 → `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **anon public** 키 복사 → `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용

2. **Connection Pooler URL** (선택사항, 성능 개선):
   - Supabase 대시보드 > **Settings** > **Database** > **Connection Pooling** 메뉴 클릭
   - Connection string에서 URL 추출 (예: `https://xxxxx.pooler.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_POOLER_URL`에 설정
   - **효과**: 동시 연결 수 증가, 동시 사용자 증가 시 성능 저하 완화

**중요**:

- `your-project-id`를 실제 Supabase 프로젝트 ID로 변경하세요
- `your-anon-key-here`를 실제 anon key로 변경하세요
- URL에 `https://`가 포함되어 있는지 확인하세요
- URL 끝에 `/`가 없어야 합니다

### 3. 데이터베이스 마이그레이션 실행

Supabase 대시보드의 SQL Editor에서 다음 파일을 순서대로 실행하세요:

1. `supabase/migrations/000_consolidated_schema.sql` - 전체 내용 복사하여 실행
2. `supabase/migrations/035_add_performance_indexes.sql` - 성능 개선 인덱스 추가 (권장)

**참고**: 통합 스키마 파일 하나로 전체 데이터베이스를 구축할 수 있습니다. 자세한 내용은 `supabase/migrations/README.md`를 참고하세요.

**성능 최적화**: `035_add_performance_indexes.sql` 마이그레이션을 실행하면 쿼리 성능이 크게 향상됩니다.

### 4. 관리자 계정 생성

관리자 계정은 회원가입을 통해 생성할 수 없습니다. 다음 방법으로 생성하세요:

1. Supabase 대시보드 > **Authentication** > **Users**에서 새 사용자 생성
2. 생성된 사용자의 UUID 확인
3. SQL Editor에서 다음 쿼리 실행 (UUID와 이메일을 실제 값으로 변경):

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '실제_UUID_여기',
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

자세한 내용은 `scripts/create-admin.md` 파일을 참고하세요.

### 5. Storage 설정

Supabase 대시보드에서:

1. Storage 메뉴로 이동
2. `signatures` 및 `submissions` 버킷이 생성되었는지 확인
3. 필요시 수동으로 생성 (통합 스키마 파일에 포함되어 있음)

### 6. 의존성 설치 및 개발 서버 실행

```bash
# npm 사용 시
npm install
npm run dev

# pnpm 사용 시 (권장)
pnpm install
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 문제 해결

#### 환경 변수 오류가 발생하는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt`가 아님)
3. 환경 변수 값에 따옴표나 공백이 없는지 확인
4. 개발 서버를 재시작하세요 (환경 변수 변경 후 반드시 재시작 필요)

#### Supabase 연결 오류

- URL 형식 확인: `https://xxxxx.supabase.co` (끝에 `/` 없음)
- API 키가 올바른지 확인 (anon/public key 사용)
- Supabase 프로젝트가 활성화되어 있는지 확인

#### 이메일 중복 확인이 작동하지 않는 경우

- `check_email_exists` 함수가 Supabase에 생성되어 있는지 확인
- Supabase SQL Editor에서 함수 생성 SQL 실행 (마이그레이션 파일 참고)
- 환경 변수 변경 후 개발 서버를 재시작하세요

#### 404 에러 해결

**증상**: `/login` 등 특정 경로에서 404 에러 발생

**해결 방법**:

1. **빌드 캐시 삭제 및 서버 재시작**:

   ```bash
   # .next 캐시 삭제
   rmdir /s /q .next  # Windows
   # 또는
   rm -rf .next       # Mac/Linux

   # 개발 서버 재시작
   pnpm dev
   ```

2. **파일 구조 확인**: `app/(auth)/login/page.tsx` 파일이 올바른 위치에 있는지 확인

3. **포트 충돌 확인**: 다른 포트에서 서버가 실행 중인지 확인

4. **전체 재설치** (필요한 경우):
   ```bash
   rmdir /s /q .next node_modules
   pnpm install
   pnpm dev
   ```

자세한 내용은 [docs/TROUBLESHOOTING_404.md](./docs/TROUBLESHOOTING_404.md)를 참고하세요.

## 주요 기능

- **인증 시스템**: 역할 기반 인증 (관리자, 훈련교사, 훈련생)
- **훈련과정 관리**: 훈련과정 생성, 수정, 삭제
- **능력단위 관리**: 능력단위 생성 및 평가 기준 설정
- **평가 기능**: 훈련생 평가 작성 및 관리
- **서명 기능**: Canvas 기반 손글씨 서명 및 이미지 업로드 서명

## 프로젝트 구조

```
ncs/
├── app/                    # Next.js App Router 페이지
│   ├── (auth)/            # 인증 관련 페이지
│   ├── (dashboard)/       # 대시보드 페이지
│   └── api/               # API 라우트
├── components/            # React 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   ├── auth/             # 인증 컴포넌트
│   ├── courses/          # 훈련과정 컴포넌트
│   ├── evaluations/      # 평가 컴포넌트
│   └── signatures/       # 서명 컴포넌트
├── lib/                   # 유틸리티 함수
│   ├── supabase/         # Supabase 클라이언트
│   └── utils/            # 공통 유틸리티
├── types/                 # TypeScript 타입 정의
└── supabase/             # Supabase 마이그레이션
    └── migrations/
```

## 역할별 권한

- **관리자**: 모든 기능 접근 가능
- **훈련교사**: 평가 작성 및 관리, 자신이 담당한 훈련과정 조회
- **훈련생**: 자신의 평가 조회 및 확인

## 라이선스

MIT
