# 데이터 마이그레이션 가이드

## 개요

이 문서는 Supabase에서 노션으로 데이터를 마이그레이션하는 단계별 가이드를 제공합니다.

## 1. 데이터 추출 (Supabase)

Supabase에서 데이터를 CSV 또는 JSON 형식으로 추출합니다.

### SQL 쿼리 예시

#### 프로필 데이터 추출

```sql
SELECT 
  id,
  email,
  full_name,
  role,
  phone,
  approved,
  agreed_terms_at,
  agreed_privacy_at,
  agreed_marketing,
  agreed_marketing_at,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at;
```

#### 훈련과정 데이터 추출

```sql
SELECT 
  id,
  name,
  code,
  start_date,
  end_date,
  description,
  created_at,
  updated_at
FROM training_courses
ORDER BY created_at;
```

#### 관계 데이터 추출

**훈련과정-교사 관계**:
```sql
SELECT 
  ct.course_id,
  ct.teacher_id,
  tc.name as course_name,
  p.full_name as teacher_name,
  ct.created_at
FROM course_teachers ct
JOIN training_courses tc ON ct.course_id = tc.id
JOIN profiles p ON ct.teacher_id = p.id
ORDER BY ct.created_at;
```

**훈련과정-학생 관계**:
```sql
SELECT 
  cs.course_id,
  cs.student_id,
  tc.name as course_name,
  p.full_name as student_name,
  cs.enrollment_date,
  cs.status,
  cs.created_at
FROM course_students cs
JOIN training_courses tc ON cs.course_id = tc.id
JOIN profiles p ON cs.student_id = p.id
ORDER BY cs.created_at;
```

### CSV 내보내기

1. Supabase 대시보드 → Table Editor
2. 테이블 선택
3. "Export" 버튼 클릭
4. CSV 형식 선택
5. 다운로드

---

## 2. 데이터 변환

CSV 데이터를 노션에 맞게 변환합니다.

### 변환 작업

#### 1. UUID → 이름

**문제**: 노션은 UUID를 직접 사용할 수 없음

**해결**:
- UUID 대신 실제 이름이나 코드 사용
- 관계는 나중에 수동으로 연결

**예시**:
```csv
# Before (Supabase)
id,full_name,email
550e8400-e29b-41d4-a716-446655440000,홍길동,hong@example.com

# After (Notion)
이름,이메일
홍길동,hong@example.com
```

#### 2. Enum → Select

**문제**: Enum 값을 Select 옵션으로 변환 필요

**해결**:
- Enum 값을 그대로 사용 (노션에서 Select 옵션으로 추가)
- 또는 미리 Select 옵션을 생성한 후 매핑

**예시**:
```csv
# Before (Supabase)
role
admin
teacher
student

# After (Notion)
역할
Admin
Teacher
Student
```

#### 3. 날짜 형식

**문제**: 날짜 형식 변환 필요

**해결**:
- ISO 8601 형식 사용: `YYYY-MM-DD` 또는 `YYYY-MM-DD HH:MM:SS`
- 노션은 자동으로 인식

**예시**:
```csv
# Before (Supabase)
created_at
2024-01-15 10:30:00+00

# After (Notion)
생성일
2024-01-15 10:30:00
```

#### 4. 관계 데이터

**문제**: 관계는 CSV로 임포트 불가

**해결**:
- 관계 데이터는 별도로 저장
- 데이터 임포트 후 수동으로 연결

---

## 3. 노션 데이터베이스에 임포트

### 방법 1: CSV 임포트 (권장)

#### 단계별 가이드

1. **데이터베이스 생성**
   - 노션에서 새 페이지 생성
   - `/database` 입력
   - 데이터베이스 이름 입력

2. **CSV 임포트**
   - 데이터베이스 우측 상단 "..." 메뉴
   - "Import" → "CSV" 선택
   - CSV 파일 업로드

3. **속성 매핑**
   - 노션이 자동으로 속성 유형 추론
   - 필요시 속성 유형 수정:
     - Text → Title
     - Date → Date
     - Boolean → Checkbox
     - Enum → Select

4. **확인 및 조정**
   - 데이터가 올바르게 임포트되었는지 확인
   - 속성 이름 조정
   - Select 옵션 색상 설정

### 방법 2: 수동 입력

데이터가 적은 경우 수동으로 입력할 수 있습니다.

#### 단계별 가이드

1. **템플릿 생성**
   - 데이터베이스에서 "템플릿" 버튼 클릭
   - 템플릿 페이지 생성
   - 기본값 설정

2. **각 레코드 수동 입력**
   - 템플릿 사용하여 레코드 생성
   - 데이터 입력

3. **관계 수동 연결**
   - 각 레코드에서 관계 속성 클릭
   - 연결할 레코드 선택

---

## 4. 관계 설정

데이터 임포트 후 관계를 설정합니다.

### 단계별 가이드

#### 1. 관계형 속성 추가

**자세한 내용**: [관계 설정 방법](./05-relationships.md)

#### 2. 각 레코드에서 관계 연결

**방법 1: 일괄 연결 (관계 속성 사용)**

1. 관계 속성 클릭
2. 연결할 레코드 검색 및 선택
3. 저장

**방법 2: 수동 연결**

1. 레코드 열기
2. 관계 속성 클릭
3. 연결할 레코드 선택

#### 3. 롤업 속성 추가 및 확인

관계가 설정된 후 롤업 속성을 추가합니다.

**자세한 내용**: [롤업 및 수식 속성 활용](./06-rollups-formulas.md)

---

## 5. 검증

다음 사항을 확인합니다:

### 1. 데이터 무결성 확인

- [ ] 모든 레코드가 정상적으로 임포트되었는지
- [ ] 속성 값이 올바른지
- [ ] 날짜 형식이 올바른지
- [ ] Select 옵션이 올바르게 설정되었는지

### 2. 관계 확인

- [ ] 관계가 올바르게 설정되었는지
- [ ] 모든 관계가 연결되었는지
- [ ] 중복 연결이 없는지

### 3. 롤업 속성 확인

- [ ] 롤업 속성이 정확한지
- [ ] Count, Sum, Average 등이 올바르게 계산되는지
- [ ] Unique values가 올바르게 표시되는지

### 4. 수식 속성 확인

- [ ] 수식 속성이 올바르게 계산되는지
- [ ] 오류가 없는지
- [ ] 예상한 값이 나오는지

---

## 6. 문제 해결

자세한 문제 해결 방법은 **[문제 해결 및 트러블슈팅](./12-troubleshooting.md)** 문서를 참고하세요.

### 문제 1: CSV 임포트 실패

**원인**: 
- 파일 형식 오류
- 인코딩 문제
- 데이터 형식 불일치
- 필드 수 불일치

**해결**:
1. CSV 파일을 UTF-8 인코딩으로 저장
2. 날짜 형식 확인 (YYYY-MM-DD 또는 YYYY-MM-DD HH:MM:SS)
3. 특수 문자 제거 또는 이스케이프
4. 헤더와 데이터 행의 필드 수 일치 확인

**구체적인 에러 케이스**:
- "Invalid date format": ISO 8601 형식으로 변환
- "Too many columns": 필요한 열만 포함하거나 여러 파일로 분할
- "Character encoding error": UTF-8로 저장

### 문제 2: 관계 연결 실패

**원인**: 
- 레코드 이름이 일치하지 않음
- 관계 속성이 설정되지 않음
- 권한 문제

**해결**:
1. 레코드 이름 확인 (정확한 이름, 대소문자)
2. 관계 속성이 올바르게 설정되었는지 확인
3. 연결할 레코드가 존재하는지 확인
4. 수동으로 연결

### 문제 3: 롤업 속성이 0으로 표시됨

**원인**: 
- 관계가 설정되지 않음
- 롤업 설정이 잘못됨
- 관계된 레코드가 실제로 연결되지 않음

**해결**:
1. 관계 속성 확인
2. 롤업 속성 재설정
3. 관계된 레코드가 실제로 연결되어 있는지 확인
4. 롤업 함수와 속성 선택 확인

---

## 7. 모범 사례

### 1. 단계별 마이그레이션

- 한 번에 모든 데이터를 마이그레이션하지 말고 단계별로 진행
- 각 단계마다 검증

### 2. 백업

- 마이그레이션 전 Supabase 데이터 백업
- 마이그레이션 중간 결과 저장

### 3. 테스트

- 소량의 데이터로 먼저 테스트
- 문제가 없으면 전체 데이터 마이그레이션

### 4. 문서화

- 마이그레이션 과정 문서화
- 문제 및 해결 방법 기록

---

## 다음 단계

이제 다음 문서를 읽어보세요:

1. **[대시보드 페이지 제작 가이드](./10-dashboard-guide.md)** - 대시보드 구성
2. **[추가 팁 및 모범 사례](./11-best-practices.md)** - 최적화 방법

---

**이전**: [데이터베이스 생성 순서](./08-creation-order.md)  
**다음**: [대시보드 페이지 제작 가이드](./10-dashboard-guide.md)

