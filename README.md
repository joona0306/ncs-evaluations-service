# NCS 훈련생 성적관리 시스템

NCS 훈련생 성적관리 및 평가 시스템입니다.

## 기술 스택

- **프론트엔드**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **백엔드**: Supabase (PostgreSQL, Auth, Storage)
- **UI 컴포넌트**: shadcn/ui

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 데이터베이스 설정

1. Supabase 프로젝트를 생성합니다.
2. SQL Editor에서 다음 파일들을 순서대로 실행합니다:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_create_storage_bucket.sql`
   - `supabase/migrations/004_prevent_admin_signup.sql` (관리자 역할 보호)
3. 관리자 계정 생성: `scripts/create-admin.md` 파일의 가이드를 따라 관리자 계정을 생성합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

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
