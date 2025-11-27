# 문서 인덱스

이 디렉토리는 프로젝트의 모든 문서를 포함합니다.

## 📚 주요 문서

### 설정 및 시작

- **[README.md](../README.md)** - 프로젝트 개요 및 시작 가이드
- **[MIGRATION_CONSOLIDATION.md](./MIGRATION_CONSOLIDATION.md)** - Supabase 마이그레이션 통합 가이드
- **[MIGRATION_SUMMARY.md](./MIGRATION_SUMMARY.md)** - 마이그레이션 파일 요약

### 기능 가이드

- **[API_DOCUMENTATION.md](./API_DOCUMENTATION.md)** - API 엔드포인트 문서
- **[EMAIL_VERIFICATION.md](./EMAIL_VERIFICATION.md)** - 이메일 인증 및 관리자 승인 가이드
- **[SENTRY.md](./SENTRY.md)** - Sentry 에러 모니터링 가이드
- **[ZUSTAND.md](./ZUSTAND.md)** - Zustand 상태관리 가이드

### 테스트 및 품질

- **[TESTING.md](./TESTING.md)** - 테스트 가이드 (유닛 테스트, 통합 테스트, E2E 테스트, Supabase 테스트 포함)
- **[PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md)** - 성능 최적화 가이드
- **[PERFORMANCE_2SEC_GOAL.md](./PERFORMANCE_2SEC_GOAL.md)** - 페이지 로딩 2초 이하 달성 가이드 (성능 테스트 결과 포함)
- **[COMPREHENSIVE_EVALUATION.md](./COMPREHENSIVE_EVALUATION.md)** - 종합 평가 보고서
- **[ROADMAP_TO_1.0.0.md](./ROADMAP_TO_1.0.0.md)** - 1.0.0 버전 로드맵

### 문제 해결

- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - 문제 해결 가이드 (404 에러, ESM 모듈 문제, 환경 변수, Supabase 연결 등)

### 설정 가이드

- **[SETUP_GUIDES.md](./SETUP_GUIDES.md)** - 설정 가이드 (관리자 계정 생성, 이메일 인증 테스트, 성능 테스트)
- **[VERSION_GUIDE.md](./VERSION_GUIDE.md)** - 버전 관리 가이드

---

## 빠른 링크

### 처음 시작하는 경우

1. [README.md](../README.md) - 프로젝트 설정
2. [MIGRATION_CONSOLIDATION.md](./MIGRATION_CONSOLIDATION.md) - 데이터베이스 설정
3. [SETUP_GUIDES.md](./SETUP_GUIDES.md) - 관리자 계정 생성 및 초기 설정

### 기능 개발 시

1. [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - API 참조
2. [ZUSTAND.md](./ZUSTAND.md) - 상태 관리
3. [EMAIL_VERIFICATION.md](./EMAIL_VERIFICATION.md) - 인증 플로우

### 문제 해결 시

1. [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 일반적인 문제 해결 (404 에러, ESM 모듈, 환경 변수 등)
2. [SENTRY.md](./SENTRY.md) - 에러 모니터링
3. [PERFORMANCE_OPTIMIZATION.md](./PERFORMANCE_OPTIMIZATION.md) - 성능 문제

### 테스트 작성 시

1. [TESTING.md](./TESTING.md) - 테스트 가이드 (유닛, 통합, E2E 테스트 모두 포함)

---

---

## 📝 문서 업데이트 이력

- **2025년 11월 27일**: 문서 통합 및 정리
  - 테스트 관련 문서 통합 (TEST_RESULTS.md, TEST_SUMMARY.md, E2E_TEST_RESULTS.md, TESTING_SUPABASE.md → TESTING.md)
  - 성능 테스트 문서 통합 (PERFORMANCE_TEST_RESULTS.md → PERFORMANCE_2SEC_GOAL.md)
  - 문제 해결 문서 통합 (TROUBLESHOOTING_404.md, FIX_ISOMORPHIC_DOMPURIFY.md → TROUBLESHOOTING.md)
  - 설정 가이드 통합 (scripts/create-admin.md, scripts/test-email-verification.md, scripts/performance-test.md → docs/SETUP_GUIDES.md)
  - 마이그레이션 가이드 통합 (supabase/migrations/README.md → MIGRATION_CONSOLIDATION.md)
  - E2E 테스트 가이드 통합 (e2e/README.md → TESTING.md)
  - 문서 인덱스 업데이트
