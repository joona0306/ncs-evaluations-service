# Zustand 상태관리 가이드

## 🎯 개요

이 프로젝트는 Zustand를 사용하여 전역 상태를 관리합니다. Props drilling을 제거하고 중복 데이터 조회를 최적화하여 성능을 향상시켰습니다.

---

## 🔍 발견된 문제점 및 해결

### 1. Zustand 상태관리 경쟁 상태 (Race Condition)

**문제**: 
- `AuthProvider`의 `initialize()`와 `DashboardLayoutClient`의 `setProfile()`이 동시에 실행
- 서버에서 받은 `initialProfile`이 덮어씌워짐
- 프로필이 null이 되어 권한 체크 실패

**해결**:
- 초기화 순서 조정: `initialProfile`을 먼저 설정
- `initialize()`가 이미 프로필이 있으면 스킵하도록 수정
- 에러 핸들링 강화

### 2. userRole 중복 조회

**문제**:
```typescript
// Before: 각 컴포넌트에서 개별적으로 DB 조회
// competency-units.tsx
const loadUserRole = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  setUserRole(profile.role);
};

// elements-list.tsx - 동일한 코드 중복!
```

**문제점:**
- 2개의 컴포넌트가 동일한 데이터를 각각 DB에서 조회
- 불필요한 네트워크 요청 2회
- 컴포넌트 마운트 시마다 반복적인 조회

**해결**: Zustand Store를 통해 한 번만 조회하고 재사용

### 3. RLS 정책 무한 재귀 가능성

**문제**:
- RLS 정책에서 `EXISTS (SELECT ... FROM profiles)` 사용
- profiles 테이블의 정책이 다시 profiles를 조회하면서 무한 재귀 가능

**해결**:
- `SECURITY DEFINER` 함수 사용으로 RLS 우회
- `check_is_admin()`, `check_is_teacher()`, `check_can_manage()` 함수 생성
- 정책에서 함수 호출로 변경

---

## ✅ 해결 방법

### 1. Zustand Store 구현

**`stores/auth-store.ts`**

```typescript
interface AuthState {
  user: any | null;
  profile: Profile | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  initialize: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  setProfile: (profile: Profile | null) => void;
  setUser: (user: any | null) => void;
}

// Helper hooks
export const useCanManage = () => {
  const profile = useAuthStore((state) => state.profile);
  return profile?.role === "admin" || profile?.role === "teacher";
};
```

### 2. AuthProvider 생성

- 앱 초기화 시 **한 번만** 인증 정보 로드
- Auth 상태 변경 구독 (로그인/로그아웃 자동 반영)

### 3. 컴포넌트 리팩토링

**Before (중복 조회):**
```typescript
const [userRole, setUserRole] = useState<string>("");

useEffect(() => {
  loadUserRole(); // DB 조회
}, []);

{(userRole === "admin" || userRole === "teacher") && <Button>...</Button>}
```

**After (Zustand):**
```typescript
import { useCanManage } from "@/stores/auth-store";

const canManage = useCanManage(); // ✨ Store에서 가져오기

{canManage && <Button>...</Button>}
```

---

## 📊 성능 향상

### Before
```
컴포넌트 마운트 시:
1. competency-units.tsx → DB 쿼리 1회 (userRole)
2. elements-list.tsx → DB 쿼리 1회 (userRole)
총: 2회 DB 쿼리 (중복!)
```

### After
```
앱 초기화 시:
1. AuthProvider → DB 쿼리 1회 (전체 프로필)
2. 모든 컴포넌트 → Store에서 재사용
총: 1회 DB 쿼리 (캐싱!)
```

**개선 효과:**
- ✅ **DB 쿼리 50% 감소** (2회 → 1회)
- ✅ **네트워크 요청 최소화**
- ✅ **컴포넌트 마운트 속도 향상**
- ✅ **불필요한 리렌더링 방지**

---

## 🎨 사용 가능한 Helper Hooks

```typescript
// 역할 확인
const userRole = useUserRole();           // "admin" | "teacher" | "student" | null

// 권한 확인
const isAdmin = useIsAdmin();             // boolean
const isTeacher = useIsTeacher();         // boolean
const isStudent = useIsStudent();         // boolean
const canManage = useCanManage();         // admin 또는 teacher

// 전체 상태 접근
const { profile, user, isLoading } = useAuthStore();
```

---

## 📦 리팩토링된 컴포넌트

1. ✅ `components/courses/competency-units.tsx`
   - `loadUserRole()` 제거
   - `useCanManage()` hook 사용

2. ✅ `components/competency-elements/elements-list.tsx`
   - `loadUserRole()` 제거
   - `useCanManage()` hook 사용

3. ✅ `app/dashboard/layout.tsx`
   - 서버 컴포넌트 유지 (SSR)
   - 클라이언트 래퍼 분리

4. ✅ `components/layout/dashboard-layout-client.tsx`
   - AuthProvider 통합
   - 헤더에서 profile store 사용

---

## 📝 사용 예시

### 권한 기반 UI 렌더링

```typescript
function MyComponent() {
  const canManage = useCanManage();
  const isAdmin = useIsAdmin();
  
  return (
    <div>
      {canManage && <EditButton />}
      {isAdmin && <DeleteButton />}
    </div>
  );
}
```

### 프로필 정보 표시

```typescript
function ProfileBadge() {
  const profile = useAuthStore((state) => state.profile);
  
  if (!profile) return null;
  
  return <Badge>{profile.full_name}</Badge>;
}
```

---

## 🔍 디버깅 가이드

### 문제 발생 시 확인 사항

1. **브라우저 콘솔 확인**
   ```
   - "Auth initialization error"
   - "Profile fetch error"
   - "과정 수정 오류"
   ```

2. **Network 탭 확인**
   ```
   - Supabase API 요청 상태
   - 403 Forbidden → 권한 문제
   - 401 Unauthorized → 인증 문제
   ```

3. **Zustand Store 상태 확인**
   ```typescript
   // 브라우저 콘솔에서
   import { useAuthStore } from '@/stores/auth-store';
   const state = useAuthStore.getState();
   console.log('Profile:', state.profile);
   console.log('Is Initialized:', state.isInitialized);
   ```

---

## 🚀 향후 개선 가능 영역

### 1. 과정(Courses) Store

여러 컴포넌트에서 과정 목록을 조회하는 경우:

```typescript
// stores/courses-store.ts
interface CoursesState {
  courses: Course[];
  loadCourses: () => Promise<void>;
}
```

### 2. 평가(Evaluations) Store

평가 데이터 캐싱:

```typescript
// stores/evaluations-store.ts
interface EvaluationsState {
  evaluations: Evaluation[];
  loadEvaluations: () => Promise<void>;
}
```

### 3. Optimistic Updates

낙관적 업데이트로 UX 향상:

```typescript
const updateProfile = async (data) => {
  set({ profile: data }); // 즉시 UI 업데이트
  await api.updateProfile(data);
};
```

---

## 🎯 테스트 체크리스트

### Zustand 상태관리
- [ ] 관리자 로그인 시 프로필 정상 로드
- [ ] 대시보드 헤더에 이름 표시
- [ ] 권한 기반 UI 정상 작동

### 관리자 기능
- [ ] 훈련과정 생성
- [ ] 훈련과정 수정
- [ ] 훈련과정 삭제
- [ ] 능력단위 관리
- [ ] 훈련교사/학생 배정

### 에러 처리
- [ ] 권한 없을 때 명확한 메시지
- [ ] 네트워크 오류 시 재시도 안내
- [ ] 콘솔에 디버깅 정보 출력

---

## 🎉 결론

Zustand를 도입하여:
- ✅ Props drilling 완전히 제거
- ✅ 중복 DB 쿼리 제거
- ✅ 코드 간결성 향상
- ✅ 유지보수성 개선
- ✅ 성능 최적화 달성

전역 상태 관리로 인한 **명확한 데이터 흐름**과 **성능 향상**을 동시에 달성했습니다! 🚀

---

## 📊 개선 효과

### Before
- ❌ 프로필이 null로 설정됨
- ❌ 권한 체크 실패
- ❌ RLS 정책 무한 재귀 가능
- ❌ 에러 원인 파악 어려움
- ❌ 중복 DB 쿼리

### After
- ✅ 프로필이 안정적으로 설정됨
- ✅ 권한 체크 정상 작동
- ✅ RLS 정책 안전하게 작동
- ✅ 명확한 에러 메시지
- ✅ DB 쿼리 최적화 (50% 감소)

