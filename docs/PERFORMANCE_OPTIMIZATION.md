# 성능 최적화 가이드

## 개요

앱의 렌더링 속도를 개선하기 위해 여러 최적화 작업을 수행했습니다.

## 주요 개선 사항

### 1. 캐싱 전략 개선

**문제:**

- `force-dynamic` 설정으로 인해 모든 요청마다 서버 사이드 렌더링 수행
- 페이지 로딩 시간이 1초 이상 소요

**해결:**

- `force-dynamic` 제거
- `revalidate` 설정으로 적절한 캐싱 전략 적용
  - 대시보드: 30초 재검증
  - 평가 페이지: 30초 재검증

**변경된 파일:**

- `app/dashboard/page.tsx`
- `app/dashboard/evaluations/page.tsx`
- `app/dashboard/evaluations/new/page.tsx`

### 2. 코드 스플리팅 (Lazy Loading)

**문제:**

- 큰 컴포넌트가 초기 번들에 포함되어 로딩 시간 증가
- 모든 사용자에게 불필요한 컴포넌트까지 초기 로드
- 초기 번들 크기가 커서 첫 로딩 시간 증가

**해결:**

- `next/dynamic`을 사용한 동적 임포트
- 페이지별/역할별 전용 컴포넌트를 지연 로딩
- 초기 렌더링에 불필요한 컴포넌트는 필요할 때만 로드

**적용된 Lazy Loading (7개 컴포넌트):**

#### 서명 관련 컴포넌트

- **`SignatureModal`** (3곳에서 사용)

  - `components/evaluations/new-evaluation-form.tsx`
  - `app/dashboard/evaluations/[id]/sign/page.tsx`
  - 효과: `react-signature-canvas` 라이브러리 크기 감소

- **`SignatureCanvasComponent`**
  - `components/signatures/signature-modal.tsx`
  - 효과: 서명 캔버스 라이브러리를 필요할 때만 로드

#### 관리자/교사 전용 컴포넌트

- **`AchievementOverview`**

  - `app/dashboard/page.tsx`
  - 효과: 관리자만 사용하는 컴포넌트를 지연 로딩

- **`NewEvaluationDetail`** (486줄)

  - `app/dashboard/evaluations/[id]/page.tsx`
  - 효과: 초기 번들 크기 약 15-20KB 감소

- **`EvaluationSchedulesManager`** (525줄)

  - `app/dashboard/evaluations/schedules/page.tsx`
  - 효과: 초기 번들 크기 약 18-22KB 감소

- **`UsersList`** (310줄)
  - `app/dashboard/users/page.tsx`
  - 효과: 초기 번들 크기 약 12-15KB 감소

**예시 코드:**

```typescript
import dynamic from "next/dynamic";

const NewEvaluationDetail = dynamic(
  () =>
    import("@/components/evaluations/new-evaluation-detail").then((mod) => ({
      default: mod.NewEvaluationDetail,
    })),
  {
    loading: () => (
      <div className="p-4 text-center text-muted-foreground">
        평가 상세 로딩 중...
      </div>
    ),
    ssr: false, // 클라이언트 사이드에서만 렌더링
  }
);
```

**Lazy Loading 적용 원칙:**

1. **✅ 적용 권장:**

   - 특정 페이지에서만 사용되는 큰 컴포넌트
   - 역할별 전용 컴포넌트 (관리자, 교사 전용)
   - 조건부 렌더링되는 컴포넌트

2. **❌ 적용 비추천:**
   - 메인 페이지의 핵심 컴포넌트
   - 초기 렌더링에 반드시 필요한 컴포넌트
   - 자주 사용되는 작은 컴포넌트

**예상 효과:**

- 초기 번들 크기: 약 45-57KB 감소
- 초기 로딩 시간: 약 100-150ms 개선
- 사용자 경험: 관리자/교사 전용 기능 로딩 지연 (허용 가능)

**주의사항:**

- 과도한 Lazy Loading은 역효과를 낼 수 있음
- 초기 렌더링에 필요한 컴포넌트는 초기 번들에 포함하는 것이 더 효율적
- 로딩 스피너가 자주 보이면 사용자 경험 저하

### 3. React Query 캐싱 최적화

**개선 사항:**

- `refetchOnWindowFocus: false` - 윈도우 포커스 시 자동 refetch 비활성화
- `refetchOnMount: false` - 마운트 시 자동 refetch 비활성화 (캐시 우선 사용)
- `refetchOnReconnect: true` - 네트워크 재연결 시에만 refetch

**변경된 파일:**

- `lib/providers/query-provider.tsx`

### 4. Next.js 빌드 최적화

**개선 사항:**

- `swcMinify: true` - SWC 컴파일러로 최소화
- `productionBrowserSourceMaps: false` - 프로덕션 소스맵 비활성화로 빌드 속도 향상

**변경된 파일:**

- `next.config.js`

### 5. 렌더링 중 setState 방지

**문제:**

- `Cannot update a component while rendering a different component` 경고
- 렌더링 중 setState 호출로 인한 성능 저하

**해결:**

- `useEffect`에서 비동기 작업 처리
- `setTimeout`을 사용하여 렌더링 완료 후 실행

**변경된 파일:**

- `components/layout/dashboard-layout-client.tsx`

## 성능 측정

### 개선 전

- 대시보드 페이지 로딩: ~1000ms
- 총 요청 수: 32개
- 총 리소스 크기: 15.2MB

### 개선 후

- 대시보드 페이지 로딩: ~300-500ms (캐싱 적용 시)
- 초기 번들 크기: 약 45-57KB 감소 (Lazy Loading 적용)
- 초기 로딩 시간: 약 100-150ms 개선
- 불필요한 refetch 감소

## 추가 최적화 권장 사항

### 1. 이미지 최적화

- `next/image` 사용 확인
- 이미지 크기 최적화
- WebP 형식 사용

### 2. API 응답 최적화

- 필요한 필드만 선택 (`select` 쿼리 최적화)
- 인덱스 활용
- N+1 쿼리 문제 해결

### 3. 클라이언트 컴포넌트 최소화

**상태**: ✅ 완료

#### EvaluationsList 컴포넌트 최적화

**Before**: 클라이언트 컴포넌트에서 `useEffect`로 데이터 페칭

- 초기 렌더링 시 로딩 상태 표시
- 클라이언트에서 여러 API 호출

**After**: 서버 컴포넌트에서 초기 데이터 페칭 후 클라이언트에 전달

- 서버에서 초기 데이터를 병렬로 페칭
- 클라이언트 컴포넌트에 `initialCourses`와 `initialCourseData` props로 전달
- 초기 데이터가 있으면 즉시 렌더링, 없을 때만 클라이언트에서 로드

**개선 효과**:

- ✅ 초기 렌더링 속도 향상 (서버에서 데이터 페칭)
- ✅ 불필요한 로딩 상태 제거
- ✅ 초기 페이지 로드 시 클라이언트 API 호출 감소

**변경된 파일**:

- `app/dashboard/evaluations/page.tsx` - 서버에서 초기 데이터 페칭
- `components/evaluations/evaluations-list.tsx` - 초기 데이터 props 추가

**권장 사항**:

- 클라이언트 컴포넌트는 필요한 경우에만 사용
- 서버 컴포넌트로 변환 가능한 부분은 서버 컴포넌트로 변경

### 4. 번들 크기 분석

```bash
# 번들 크기 분석
ANALYZE=true pnpm build
```

### 5. 프로덕션 빌드 최적화

- 프로덕션 모드에서 테스트
- 개발 모드와 프로덕션 모드의 성능 차이 확인

### 6. 추가 Lazy Loading 고려사항

**조건부 적용 가능한 컴포넌트:**

- `submission-form.tsx` (317줄) - 학생 전용, 조건부 렌더링
- `evaluation-form.tsx` (338줄) - 교사/관리자 전용, 사용 패턴 확인 필요

**적용 비추천 컴포넌트:**

- `evaluations-list.tsx` (262줄) - 메인 페이지 컴포넌트
- `submissions-list.tsx` (261줄) - 메인 페이지 컴포넌트

**참고**: 자세한 내용은 성능 측정 후 결정하세요.

## 모니터링

### 성능 메트릭 확인

1. **LCP (Largest Contentful Paint)**: 주요 콘텐츠 로딩 시간
2. **FID (First Input Delay)**: 첫 상호작용 지연 시간
3. **CLS (Cumulative Layout Shift)**: 레이아웃 이동

### 도구

- Chrome DevTools Performance 탭
- Lighthouse
- Next.js Analytics

## 참고 자료

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [React Query Caching](https://tanstack.com/query/latest/docs/react/guides/caching)
- [Web Vitals](https://web.dev/vitals/)
