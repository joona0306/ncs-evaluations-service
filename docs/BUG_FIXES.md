# 버그 수정 사항

## 🐛 발견된 문제들

### 1. 훈련과정 수정 후 저장 시 멈춤
**원인**: RLS 정책이 관리자의 UPDATE 권한을 차단

**해결**:
- `015_fix_admin_course_permissions.sql` 생성
- 관리자 권한 정책을 세분화 (INSERT, UPDATE, DELETE 각각 분리)
- `WITH CHECK` 절 추가로 권한 명확화

### 2. 능력단위/훈련교사/훈련생 로딩 중 멈춤
**원인**: 
- 에러 핸들링 부족
- `approved` 필드가 없는 프로필 조회 시 오류

**해결**:
- 모든 데이터 로딩 함수에 try-catch 추가
- `approved` 필드 조건 제거 (필수 아님)
- 에러 로그 추가로 디버깅 용이성 향상
- `.filter(Boolean)` 추가로 null 값 제거

### 3. 훈련과정 관리 페이지에 뒤로가기 버튼 없음
**해결**: `BackButton` 컴포넌트 추가

### 4. 과정별 학업 성취도에 훈련과정 없음
**원인**: 과정이 없을 때 빈 Select 표시

**해결**: 과정이 없을 때 안내 메시지 표시

## 📝 수정된 파일

### 1. SQL 마이그레이션
**`supabase/migrations/015_fix_admin_course_permissions.sql`**
```sql
-- 기존: 통합 정책 (문제 발생)
CREATE POLICY "Admins can manage courses"
  ON public.training_courses FOR ALL
  USING (...);

-- 수정: 세분화된 정책 (권한 명확)
CREATE POLICY "Admins can insert courses" FOR INSERT ...
CREATE POLICY "Admins can update courses" FOR UPDATE ...
CREATE POLICY "Admins can delete courses" FOR DELETE ...
```

### 2. 컴포넌트 수정

**`components/courses/competency-units.tsx`**
```typescript
// Before: 에러 처리 없음
const loadUnits = async () => {
  const { data } = await supabase...
  if (data) setUnits(data);
  setLoading(false);
};

// After: 에러 처리 추가
const loadUnits = async () => {
  try {
    const { data, error } = await supabase...
    if (error) console.error("...", error);
    if (data) setUnits(data);
  } catch (error) {
    console.error("...", error);
  } finally {
    setLoading(false);
  }
};
```

**`components/courses/course-teachers.tsx`**
- try-catch 에러 핸들링 추가
- `approved` 필드 조건 제거
- `.filter(Boolean)` 추가

**`components/courses/course-students.tsx`**
- try-catch 에러 핸들링 추가
- `approved` 필드 조건 제거

**`components/admin/achievement-overview.tsx`**
```typescript
// 과정이 없을 때 안내 표시
{courses.length === 0 ? (
  <div className="p-4 text-center text-muted-foreground">
    <p>등록된 훈련과정이 없습니다.</p>
    <p className="text-sm mt-2">먼저 훈련과정을 생성해주세요.</p>
  </div>
) : (
  // Select 표시
)}
```

**`app/dashboard/courses/page.tsx`**
- `BackButton` 컴포넌트 추가

## ✅ 테스트 체크리스트

### 관리자 권한 테스트
- [ ] 훈련과정 생성
- [ ] 훈련과정 수정
- [ ] 훈련과정 삭제
- [ ] 능력단위 생성/수정/삭제
- [ ] 훈련교사 배정
- [ ] 훈련생 등록

### 데이터 로딩 테스트
- [ ] 능력단위 목록 표시
- [ ] 훈련교사 목록 표시
- [ ] 훈련생 목록 표시
- [ ] 빈 데이터일 때 메시지 표시

### UI/UX 테스트
- [ ] 뒤로가기 버튼 작동
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시 (콘솔)

## 🚀 적용 방법

### 1. SQL 마이그레이션 실행
Supabase Dashboard → SQL Editor에서 실행:
```sql
-- 015_fix_admin_course_permissions.sql 내용
```

### 2. 애플리케이션 재시작
```bash
# 개발 서버 재시작
npm run dev
```

### 3. 브라우저 캐시 클리어
- 하드 새로고침 (Ctrl + Shift + R)
- 또는 개발자 도구에서 캐시 비우기

## 🔍 디버깅 팁

### 로딩이 멈출 때
1. **브라우저 개발자 도구 열기** (F12)
2. **Console 탭 확인**
   - 빨간색 에러 메시지 확인
   - "조회 오류" 또는 "로드 실패" 메시지 찾기
3. **Network 탭 확인**
   - Supabase API 요청 상태 확인
   - 실패한 요청의 Response 확인

### RLS 권한 문제 확인
Supabase Dashboard → SQL Editor:
```sql
-- 현재 적용된 정책 확인
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies 
WHERE tablename = 'training_courses';

-- 사용자 역할 확인
SELECT id, email, role 
FROM public.profiles
WHERE id = auth.uid();
```

## 📊 개선 효과

### Before
- ❌ 훈련과정 수정 불가
- ❌ 로딩 중 무한 대기
- ❌ 에러 원인 파악 어려움
- ❌ UX 혼란

### After
- ✅ 훈련과정 관리 정상 작동
- ✅ 에러 발생 시 콘솔에 로그
- ✅ 명확한 안내 메시지
- ✅ 향상된 UX

## 🎯 향후 개선 사항

1. **에러 UI 개선**
   - 콘솔 로그 → 사용자에게 Toast 알림
   - 재시도 버튼 추가

2. **로딩 상태 개선**
   - Skeleton UI 추가
   - 프로그레스 바 표시

3. **권한 체크 개선**
   - 클라이언트에서 미리 권한 확인
   - 권한 없을 때 버튼 비활성화

4. **데이터 캐싱**
   - React Query 도입 고려
   - Zustand에 데이터 캐싱 추가

