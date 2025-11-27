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

### 2. 코드 스플리팅

**문제:**
- 큰 컴포넌트가 초기 번들에 포함되어 로딩 시간 증가
- `AchievementOverview` 컴포넌트가 항상 로드됨

**해결:**
- `next/dynamic`을 사용한 동적 임포트
- 관리자 전용 컴포넌트를 지연 로딩

**예시:**
```typescript
const AchievementOverviewLazy = dynamic(
  () => import("@/components/admin/achievement-overview").then((mod) => ({ default: mod.AchievementOverview })),
  {
    loading: () => <div>로딩 중...</div>,
    ssr: false,
  }
);
```

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

### 개선 후 (예상)
- 대시보드 페이지 로딩: ~300-500ms (캐싱 적용 시)
- 초기 번들 크기 감소 (코드 스플리팅)
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

