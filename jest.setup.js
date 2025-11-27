// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

// Node.js 18+ 에서는 fetch가 내장되어 있지만, Jest 환경에서는 polyfill이 필요할 수 있습니다.
// 통합 테스트를 위해 fetch polyfill 추가
if (typeof global.fetch === 'undefined') {
  try {
    global.fetch = require('node-fetch');
  } catch (e) {
    // node-fetch가 설치되지 않은 경우, Node.js 18+ 내장 fetch 사용
    // 또는 빈 함수로 대체 (통합 테스트는 별도로 처리)
    console.warn('fetch polyfill을 사용할 수 없습니다. Node.js 18+를 사용하거나 node-fetch를 설치하세요.');
  }
}

