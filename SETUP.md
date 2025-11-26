# 환경 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 가입하고 새 프로젝트를 생성합니다.
2. 프로젝트 설정에서 다음 정보를 확인합니다:
   - Project URL (예: `https://xxxxx.supabase.co`)
   - API Key > anon/public key

## 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**중요**:

- `your-project-id`를 실제 Supabase 프로젝트 ID로 변경하세요
- `your-anon-key-here`를 실제 anon key로 변경하세요
- URL에 `https://`가 포함되어 있는지 확인하세요
- URL 끝에 `/`가 없어야 합니다

## 3. 데이터베이스 마이그레이션 실행

Supabase 대시보드의 SQL Editor에서 다음 파일들을 순서대로 실행하세요:

1. `supabase/migrations/001_initial_schema.sql` - 전체 내용 복사하여 실행
2. `supabase/migrations/002_create_storage_bucket.sql` - 전체 내용 복사하여 실행
3. `supabase/migrations/004_prevent_admin_signup.sql` - 전체 내용 복사하여 실행 (관리자 역할 보호)
4. `supabase/migrations/005_auto_create_profile.sql` - 전체 내용 복사하여 실행 (자동 프로필 생성)
5. `supabase/migrations/007_simplify_profile_rls.sql` - 전체 내용 복사하여 실행 (RLS 정책 단순화 및 무한 재귀 해결)
6. `supabase/migrations/008_add_profile_fields.sql` - 전체 내용 복사하여 실행 (프로필에 생년월일, 성별 필드 추가)
7. `supabase/migrations/009_add_approval_status.sql` - 전체 내용 복사하여 실행 (사용자 승인 상태 필드 추가)
8. `supabase/migrations/010_add_admin_rls_policies.sql` - 전체 내용 복사하여 실행 (관리자가 모든 프로필 조회/수정 가능하도록 RLS 정책 추가)
9. `supabase/migrations/011_add_teacher_student_rls.sql` - 전체 내용 복사하여 실행 (교사-학생 간 프로필 조회 권한 추가)

## 4. 관리자 계정 생성

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
);
```

자세한 내용은 `scripts/create-admin.md` 파일을 참고하세요.

## 5. Storage 설정

Supabase 대시보드에서:

1. Storage 메뉴로 이동
2. `signatures` 버킷이 생성되었는지 확인
3. 필요시 수동으로 생성:
   - 버킷 이름: `signatures`
   - Public: `false` (비공개)

## 6. 개발 서버 실행

```bash
npm install
npm run dev
```

또는 pnpm을 사용하는 경우:

```bash
pnpm install
pnpm dev
```

## 문제 해결

### 환경 변수 오류가 발생하는 경우

1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 파일 이름이 정확히 `.env.local`인지 확인 (`.env.local.txt`가 아님)
3. 환경 변수 값에 따옴표나 공백이 없는지 확인
4. 개발 서버를 재시작하세요 (환경 변수 변경 후 반드시 재시작 필요)

### Supabase 연결 오류

- URL 형식 확인: `https://xxxxx.supabase.co` (끝에 `/` 없음)
- API 키가 올바른지 확인 (anon/public key 사용)
- Supabase 프로젝트가 활성화되어 있는지 확인
