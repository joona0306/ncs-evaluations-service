# 관리자 계정 생성 가이드

관리자 계정은 회원가입을 통해 생성할 수 없으며, Supabase 대시보드에서 수동으로 생성해야 합니다.

## 방법 1: Supabase 대시보드에서 생성 (권장)

### 1단계: 사용자 생성
1. Supabase 대시보드에 로그인
2. **Authentication** > **Users** 메뉴로 이동
3. **Add user** 버튼 클릭
4. 다음 정보 입력:
   - **Email**: 관리자 이메일 (예: `admin@example.com`)
   - **Password**: 강력한 비밀번호
   - **Auto Confirm User**: 체크 (이메일 확인 없이 바로 사용 가능)
5. **Create user** 클릭

### 2단계: 사용자 UUID 확인
1. 생성된 사용자를 클릭하여 상세 정보 확인
2. **UUID** 값을 복사 (예: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`)

### 3단계: 프로필 생성
1. **SQL Editor**로 이동
2. 다음 쿼리를 실행 (UUID와 이메일을 실제 값으로 변경):

```sql
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  '여기에_실제_UUID_입력',
  'admin@example.com',
  '시스템 관리자',
  'admin'
)
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
```

## 방법 2: SQL 스크립트 사용

`supabase/migrations/003_create_admin_user.sql` 파일의 주석을 참고하여 실행하세요.

## 보안 권장사항

1. 관리자 비밀번호는 강력하게 설정하세요 (최소 12자 이상, 대소문자, 숫자, 특수문자 포함)
2. 관리자 이메일은 실제 사용하는 이메일로 설정하세요
3. 관리자 계정은 최소한의 개수만 유지하세요
4. 정기적으로 비밀번호를 변경하세요

## 문제 해결

### 프로필이 생성되지 않는 경우
- UUID가 정확한지 확인하세요
- 사용자가 auth.users 테이블에 존재하는지 확인하세요
- RLS 정책이 프로필 생성을 막고 있지 않은지 확인하세요

### 로그인이 안 되는 경우
- 이메일과 비밀번호가 정확한지 확인하세요
- Auto Confirm User가 체크되어 있는지 확인하세요
- 프로필의 role이 'admin'으로 설정되어 있는지 확인하세요

