# 고급 주제 및 추가 기능

## 개요

이 문서는 노션 데이터베이스의 고급 기능과 추가 활용 방법을 설명합니다.

## 1. JSONB 필드 처리 전략

### Supabase의 JSONB 필드

Supabase에는 다음 JSONB 필드가 있습니다:
- `competency_units.evaluation_criteria` (JSONB)
- `evaluations.scores` (JSONB)

### 노션에서의 처리 방법

#### 방법 1: Text 속성으로 변환 (간단)

**장점**: 구현이 간단함

**단점**: 구조화된 데이터 활용 어려움

**구현**:
1. JSON을 문자열로 변환
2. Text 속성에 저장
3. 필요시 레코드 페이지에 상세 정보 작성

#### 방법 2: 별도 속성으로 분리 (권장)

**장점**: 구조화된 데이터 활용 가능

**단점**: JSON 구조를 미리 파악해야 함

**구현**:
1. JSON 구조 분석
2. 주요 필드를 개별 속성으로 분리
3. 예: `evaluation_criteria` → 평가 항목1, 평가 항목2 등

#### 방법 3: 레코드 페이지 활용 (상세 정보)

**장점**: 자유로운 구조화

**단점**: 데이터베이스 속성으로는 접근 불가

**구현**:
1. 레코드를 페이지로 열기
2. 구조화된 블록으로 정보 작성
3. 데이터베이스 속성에는 요약 정보만 저장

---

## 2. 노션 API 활용

### API 설정

#### 1. 노션 통합 생성

1. [노션 통합 페이지](https://www.notion.so/my-integrations) 접속
2. "새 통합" 클릭
3. 통합 이름 입력 (예: "NCS 평가 시스템")
4. 워크스페이스 선택
5. 권한 설정:
   - 콘텐츠 읽기
   - 콘텐츠 업데이트
   - 콘텐츠 삽입
6. "제출" 클릭
7. 내부 통합 토큰 복사

#### 2. 데이터베이스 연결

1. 노션 데이터베이스 열기
2. 우측 상단 "..." 메뉴
3. "연결" → 생성한 통합 선택
4. 연결 완료

### API 활용 예시

#### 예시 1: Supabase에서 노션 동기화

```python
import requests
from supabase import create_client

# Supabase 클라이언트
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# 노션 API 클라이언트
NOTION_TOKEN = "your_notion_token"
NOTION_DATABASE_ID = "your_database_id"

headers = {
    "Authorization": f"Bearer {NOTION_TOKEN}",
    "Content-Type": "application/json",
    "Notion-Version": "2022-06-28"
}

# Supabase에서 데이터 가져오기
profiles = supabase.table("profiles").select("*").execute()

# 노션에 데이터 추가
for profile in profiles.data:
    data = {
        "parent": {"database_id": NOTION_DATABASE_ID},
        "properties": {
            "이름": {
                "title": [{"text": {"content": profile["full_name"]}}]
            },
            "이메일": {
                "email": profile["email"]
            },
            "역할": {
                "select": {"name": profile["role"].capitalize()}
            }
        }
    }
    
    response = requests.post(
        "https://api.notion.com/v1/pages",
        headers=headers,
        json=data
    )
```

#### 예시 2: 평가 완료 시 알림

```python
def notify_evaluation_complete(evaluation_id):
    # 평가 정보 가져오기
    evaluation = get_evaluation(evaluation_id)
    
    # 노션 페이지에 댓글 추가
    comment_data = {
        "parent": {"page_id": evaluation["notion_page_id"]},
        "rich_text": [
            {
                "text": {
                    "content": f"평가가 완료되었습니다. 총점: {evaluation['total_score']}점"
                }
            }
        ]
    }
    
    requests.post(
        "https://api.notion.com/v1/comments",
        headers=headers,
        json=comment_data
    )
```

---

## 3. 대량 데이터 처리

### 성능 최적화 전략

#### 1. 필터 활용

대량의 데이터가 있는 경우 필터를 사용하여 필요한 데이터만 표시합니다.

**예시**:
- 날짜 범위 필터
- 상태 필터
- 역할 필터

#### 2. 페이지네이션

노션은 자동으로 페이지네이션을 처리하지만, 대량 데이터의 경우:

1. 필터로 데이터 제한
2. 정렬 기준 설정
3. 필요한 데이터만 로드

#### 3. 속성 최적화

- 불필요한 속성 숨김
- 자주 사용하는 속성만 표시
- 롤업 속성 최소화

---

## 4. 복잡한 롤업 체인

### 다단계 롤업

노션에서는 롤업의 롤업을 만들 수 있습니다.

#### 예시: 평가의 최대 점수 합계

**구조**:
```
평가 → 평가 점수 상세 (Rollup: Sum of score)
평가 → 평가 점수 상세 → 수행준거 (Rollup: Sum of max_score)
```

**설정 방법**:
1. 평가 점수 상세 데이터베이스:
   - `수행준거` (Relation → 수행준거)
   - `최대 점수` (Rollup → 수행준거의 max_score)

2. 평가 데이터베이스:
   - `평가 점수 상세` (Relation → 평가 점수 상세)
   - `최대 점수 합계` (Rollup → 평가 점수 상세의 최대 점수, Sum)

---

## 5. 조건부 표시 및 필터링

### 수식 기반 필터

수식 속성을 활용하여 조건부로 데이터를 표시할 수 있습니다.

#### 예시: 합격/불합격 표시

**수식**:
```
if(prop("총점 (백분율)") >= 70, "합격", "불합격")
```

**필터 활용**:
- 합격한 평가만 표시: `점수 등급` = "합격"
- 불합격한 평가만 표시: `점수 등급` = "불합격"

---

## 6. 템플릿 고급 활용

### 동적 템플릿

템플릿에 수식을 사용하여 동적으로 값을 설정할 수 있습니다.

#### 예시: 평가 템플릿

1. 템플릿 생성
2. 기본값 설정:
   - 상태: Draft
   - 평가일시: 비어있음
3. 가이드 작성
4. 수식 활용:
   - 이름: 자동 생성 (능력단위명 - 학생명)

---

## 7. 자동화 워크플로우

### 노션 API + 외부 서비스

#### 예시: 평가 완료 시 이메일 발송

```python
def on_evaluation_complete(evaluation_id):
    # 노션에서 평가 정보 가져오기
    evaluation = get_notion_page(evaluation_id)
    
    # 이메일 발송
    send_email(
        to=evaluation["student_email"],
        subject="평가 완료 알림",
        body=f"평가가 완료되었습니다. 총점: {evaluation['total_score']}점"
    )
```

---

## 8. 데이터 검증

### 수식 기반 검증

노션에서는 직접적인 데이터 검증 기능이 제한적이지만, 수식을 활용할 수 있습니다.

#### 예시: 점수 범위 검증

**수식**:
```
if(and(prop("점수") >= 0, prop("점수") <= prop("최대 점수")), "유효", "무효")
```

**필터 활용**:
- 무효한 점수만 표시하여 확인

---

## 9. 백업 및 복구 전략

### 자동 백업

노션은 클라우드 기반으로 자동 백업되지만, 추가 백업이 필요한 경우:

#### 방법 1: 노션 API로 데이터 추출

```python
def backup_database(database_id):
    # 노션 API로 모든 페이지 가져오기
    pages = get_all_pages(database_id)
    
    # JSON 파일로 저장
    with open("backup.json", "w") as f:
        json.dump(pages, f)
```

#### 방법 2: CSV 내보내기

1. 데이터베이스 열기
2. "..." 메뉴 → "내보내기"
3. CSV 형식 선택
4. 다운로드

---

## 10. 성능 모니터링

### 최적화 체크리스트

- [ ] 불필요한 롤업 속성 제거
- [ ] 복잡한 수식 단순화
- [ ] 필터로 데이터 제한
- [ ] 불필요한 속성 숨김
- [ ] 관계 최적화

---

## 다음 단계

이제 다음 문서를 읽어보세요:

1. **[문제 해결 및 트러블슈팅](./12-troubleshooting.md)** - 문제 해결 방법
2. **[추가 팁 및 모범 사례](./11-best-practices.md)** - 최적화 방법

---

**이전**: [추가 팁 및 모범 사례](./11-best-practices.md)  
**다음**: [문제 해결 및 트러블슈팅](./12-troubleshooting.md)

