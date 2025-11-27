#!/bin/bash

# 성능 테스트 스크립트
# localhost:3001 서버의 주요 페이지 응답 시간 측정

echo "=== 성능 테스트 시작 ==="
echo "서버: http://localhost:3001"
echo ""

# 로그인 페이지
echo "1. 로그인 페이지 (/login)"
curl -s -o /dev/null -w "   응답 시간: %{time_total}s\n   크기: %{size_download} bytes\n   HTTP 상태: %{http_code}\n" http://localhost:3001/login
echo ""

# 대시보드 (리다이렉트 예상)
echo "2. 대시보드 (/dashboard)"
curl -s -o /dev/null -w "   응답 시간: %{time_total}s\n   크기: %{size_download} bytes\n   HTTP 상태: %{http_code}\n" http://localhost:3001/dashboard
echo ""

# 평가 목록 (리다이렉트 예상)
echo "3. 평가 목록 (/dashboard/evaluations)"
curl -s -o /dev/null -w "   응답 시간: %{time_total}s\n   크기: %{size_download} bytes\n   HTTP 상태: %{http_code}\n" http://localhost:3001/dashboard/evaluations
echo ""

echo "=== 테스트 완료 ==="
echo ""
echo "참고: 인증이 필요한 페이지는 리다이렉트(307)될 수 있습니다."
echo "실제 성능 측정은 브라우저에서 Chrome DevTools를 사용하세요:"
echo "  1. F12 → Performance 탭"
echo "  2. Record 클릭"
echo "  3. 페이지 새로고침"
echo "  4. Stop 클릭"
echo "  5. Total Load Time 확인"

