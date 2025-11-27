# 페이지 로딩 2초 이하 달성 가이드

**현재 상태**: 대시보드 페이지 로딩 ~1000ms (캐싱 적용 시 ~300-500ms 예상)  
**목표**: 모든 페이지 로딩 2초 이하

---

## 🔴 Critical (즉시 개선 필요)

### 1. `cache: "no-store"` 제거 및 적절한 캐싱 적용

**현재 문제:**

- 여러 페이지에서 `cache: "no-store"` 사용
- 매 요청마다 서버에서 데이터 조회
- 불필요한 네트워크 요청 증가

**영향:**

- 페이지 로딩 시간 500-1000ms 증가
- 서버 부하 증가

**개선 작업:**

#### 1.1 평가 상세 페이지 (`app/dashboard/evaluations/[id]/page-client.tsx`)

```typescript
// Before
const response = await fetch(`/api/evaluations/${id}`, {
  cache: "no-store",
});

// After
const response = await fetch(`/api/evaluations/${id}`, {
  next: { revalidate: 30 }, // 30초 캐싱
});
```

#### 1.2 평가 수정 페이지 (`app/dashboard/evaluations/[id]/edit/page-client.tsx`)

```typescript
// Before
cache: "no-store";

// After
next: {
  revalidate: 0;
} // 수정 페이지는 항상 최신 데이터 필요
// 또는
cache: "force-cache"; // 짧은 시간 캐싱
```

#### 1.3 서명 페이지 (`app/dashboard/evaluations/[id]/sign/page.tsx`)

```typescript
// Before
cache: "no-store";

// After
next: {
  revalidate: 60;
} // 서명 데이터는 자주 변경되지 않음
```

#### 1.4 평가일정 페이지 (`app/dashboard/evaluations/schedules/page.tsx`)

```typescript
// Before
cache: "no-store";

// After
next: {
  revalidate: 60;
} // 일정 데이터는 자주 변경되지 않음
```

**예상 개선 효과**: 300-500ms 단축

---

### 2. N+1 쿼리 문제 완전 해결

**현재 문제:**

- `app/api/evaluations/by-course/route.ts`에서 루프 내 쿼리 실행
- 각 능력단위, 각 학생별로 개별 쿼리
- 10개 과정 × 5개 능력단위 × 10명 학생 = 500개 쿼리 가능

**영향:**

- API 응답 시간 1-3초 증가
- 데이터베이스 부하 증가

**개선 작업:**

#### 2.1 배치 쿼리로 변경

```typescript
// Before: 루프 내 개별 쿼리
for (const unit of competencyUnits) {
  for (const student of students) {
    const { data: evaluation } = await supabase
      .from("evaluations")
      .select("*")
      .eq("competency_unit_id", unit.id)
      .eq("student_id", student.id);
  }
}

// After: 단일 쿼리로 모든 데이터 조회
const unitIds = competencyUnits.map((u) => u.id);
const studentIds = students.map((s) => s.id);

const { data: evaluations } = await supabase
  .from("evaluations")
  .select("*")
  .in("competency_unit_id", unitIds)
  .in("student_id", studentIds);

// 메모리에서 그룹화
const evaluationsMap = new Map();
evaluations.forEach((eval) => {
  const key = `${eval.competency_unit_id}-${eval.student_id}`;
  evaluationsMap.set(key, eval);
});
```

**예상 개선 효과**: 1-2초 단축

---

### 3. API 응답 최적화 (필요한 필드만 선택)

**현재 문제:**

- 일부 API에서 `select("*")` 사용
- 불필요한 데이터 전송
- 네트워크 전송 시간 증가

**개선 작업:**

#### 3.1 평가 목록 API

```typescript
// Before
.select("*")

// After
.select("id, status, score, evaluated_at, student_id, competency_unit_id")
```

#### 3.2 과정 목록 API

```typescript
// Before
.select("*")

// After
.select("id, name, code, start_date, end_date")
```

**예상 개선 효과**: 100-200ms 단축

---

## 🟡 High Priority (강력 권장)

### 4. 데이터 페이징 구현

**현재 문제:**

- 모든 데이터를 한 번에 조회
- 대량 데이터 시 로딩 시간 증가

**개선 작업:**

#### 4.1 평가 목록 페이징

```typescript
// API에 페이징 파라미터 추가
GET /api/evaluations?limit=20&offset=0

// 클라이언트에서 무한 스크롤 또는 페이지네이션 구현
```

**예상 개선 효과**: 초기 로딩 500ms-1초 단축

---

### 5. 이미지 최적화

**현재 문제:**

- 일부 컴포넌트에서 `<img>` 태그 사용
- 이미지 크기 최적화 없음
- WebP 형식 미사용

**개선 작업:**

#### 5.1 모든 이미지를 `next/image`로 변경

```typescript
// Before
<img src={imageUrl} alt="..." />;

// After
import Image from "next/image";
<Image src={imageUrl} alt="..." width={800} height={600} />;
```

#### 5.2 이미지 크기 최적화

- 업로드 시 이미지 리사이징
- WebP 형식 사용 고려

**예상 개선 효과**: 이미지 로딩 200-500ms 단축

---

### 6. 불필요한 리렌더링 방지

**개선 작업:**

#### 6.1 React.memo 적용

```typescript
// 자주 리렌더링되는 컴포넌트에 적용
export const EvaluationItem = React.memo(({ evaluation }) => {
  // ...
});
```

#### 6.2 useMemo, useCallback 최적화

```typescript
// 계산 비용이 큰 값 메모이제이션
const filteredData = useMemo(() => {
  return data.filter(/* ... */);
}, [data]);

// 함수 메모이제이션
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);
```

**예상 개선 효과**: 렌더링 시간 100-200ms 단축

---

## 🟢 Medium Priority (권장)

### 7. 서버 컴포넌트 확대

**개선 작업:**

- 클라이언트 컴포넌트를 서버 컴포넌트로 변환 가능한 부분 식별
- 서버에서 데이터 페칭하여 props로 전달

**예상 개선 효과**: 초기 로딩 100-300ms 단축

---

### 8. 번들 크기 최적화

**개선 작업:**

- 사용하지 않는 라이브러리 제거
- 동적 임포트 확대
- 번들 분석 및 최적화

**예상 개선 효과**: 초기 번들 로딩 200-500ms 단축

---

## 📊 우선순위별 예상 개선 효과

### Critical (즉시 개선)

1. `cache: "no-store"` 제거: **300-500ms** 단축
2. N+1 쿼리 해결: **1-2초** 단축
3. API 응답 최적화: **100-200ms** 단축

**총 예상 개선**: **1.4-2.7초** 단축

### High Priority

4. 데이터 페이징: **500ms-1초** 단축
5. 이미지 최적화: **200-500ms** 단축
6. 리렌더링 방지: **100-200ms** 단축

**총 예상 개선**: **800ms-1.7초** 단축

### Medium Priority

7. 서버 컴포넌트 확대: **100-300ms** 단축
8. 번들 크기 최적화: **200-500ms** 단축

**총 예상 개선**: **300-800ms** 단축

---

## 🎯 목표 달성 전략

### Phase 1: Critical 개선 (1-2일)

- `cache: "no-store"` 제거
- N+1 쿼리 해결
- API 응답 최적화

**예상 결과**: 현재 1000ms → **500-700ms**

### Phase 2: High Priority 개선 (2-3일)

- 데이터 페이징
- 이미지 최적화
- 리렌더링 방지

**예상 결과**: 500-700ms → **300-500ms**

### Phase 3: Medium Priority 개선 (1-2일)

- 서버 컴포넌트 확대
- 번들 크기 최적화

**예상 결과**: 300-500ms → **200-400ms** (목표 달성!)

---

## ✅ 체크리스트

### Critical

- [x] `cache: "no-store"` 사용하는 모든 곳 제거
- [x] N+1 쿼리 문제 해결
- [x] API 응답에서 필요한 필드만 선택

### High Priority

- [x] 평가 목록 페이징 구현
- [x] 모든 이미지를 `next/image`로 변경
- [x] React.memo, useMemo, useCallback 적용
- [x] XSS 방지: DOMPurify 적용 및 sanitization 강화

### Medium Priority

- [x] 서버 컴포넌트 확대
- [x] 번들 크기 분석 및 최적화
- [x] 동적 임포트 확대 (SignatureModal, SignatureCanvas)

---

## 📊 성능 테스트 결과

**테스트 일자**: 2025년 11월 27일  
**테스트 환경**: 로컬 개발 서버 (http://localhost:3001)  
**최적화 단계**: Phase 1, 2, 3 완료

### 테스트 방법

#### 1. Chrome DevTools Performance 탭
1. F12 → Performance 탭
2. Record 클릭
3. 페이지 새로고침
4. Stop 클릭
5. Total Load Time 확인

#### 2. Lighthouse
1. F12 → Lighthouse 탭
2. Performance 선택
3. Analyze page load 클릭
4. 성능 점수 확인

#### 3. Network 탭
1. F12 → Network 탭
2. 페이지 새로고침
3. 총 요청 수, 크기, 로딩 시간 확인

### 측정 결과

#### 로그인 페이지 (`/login`)
- **응답 시간**: 0.18초 (183ms) ✅
- **크기**: 13KB
- **HTTP 상태**: 200 OK

#### 대시보드 페이지 (`/dashboard`)
- **예상 로딩 시간**: 300-500ms (캐싱 적용 시)
- **확인 사항**: 초기 데이터가 서버에서 로드되는지, AchievementOverview가 동적 임포트로 지연 로딩되는지

#### 평가 목록 페이지 (`/dashboard/evaluations`)
- **예상 로딩 시간**: 500-800ms
- **확인 사항**: 초기 데이터가 서버에서 전달되는지, 페이징이 적용되어 있는지

### 개선 전후 비교

#### Phase 1-3 개선 전 (예상)
- 대시보드: ~1000ms
- 평가 목록: ~1500ms
- 평가 상세: ~1200ms

#### Phase 1-3 개선 후 (목표)
- 대시보드: ~300-500ms (캐싱 적용 시)
- 평가 목록: ~500-800ms
- 평가 상세: ~400-600ms

### Core Web Vitals 목표

- **LCP**: 2.5초 이하
- **FID**: 100ms 이하
- **CLS**: 0.1 이하
- **FCP**: 1.8초 이하
- **TTFB**: 200ms 이하

자세한 성능 테스트 방법은 `scripts/quick-performance-test.md`를 참고하세요.

---

## 📝 성능 측정 방법

### 1. Chrome DevTools

```bash
# Performance 탭에서 측정
1. F12 → Performance 탭
2. Record 클릭
3. 페이지 새로고침
4. Stop 클릭
5. Total Load Time 확인
```

### 2. Lighthouse

```bash
# Lighthouse로 성능 점수 확인
1. F12 → Lighthouse 탭
2. Performance 선택
3. Analyze page load 클릭
4. Performance Score 확인 (목표: 90+)
```

### 3. Next.js Analytics

```typescript
// next.config.js에 추가
experimental: {
  instrumentationHook: true,
}
```

---

## 🎯 최종 목표

- **페이지 로딩 시간**: 2초 이하
- **Lighthouse Performance Score**: 90+
- **LCP (Largest Contentful Paint)**: 2.5초 이하
- **FID (First Input Delay)**: 100ms 이하
- **CLS (Cumulative Layout Shift)**: 0.1 이하

---

**문서 작성일**: 2025년 11월 27일  
**예상 완료 기간**: 4-7일
