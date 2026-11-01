// JH 사전 점검표 — 분석 규칙 확인. index.html 의 분석 블록을 그대로 실행합니다.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pick = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const core = pick('const FLOW = [', '/* ── 분석 시작') + pick('function analyze(d)', '/* ── 분석 끝');
const analyze = new Function(core + 'return analyze;')();

// 빈 응답도 깨지지 않음
assert.ok(analyze({}).includes('아니오 0 / 응답 0'));

const r = analyze({
  흐름1: '아니오', 흐름2: '아니오', 흐름3: '예', 흐름9: '아니오',
  의뢰경로: ['지인·기존 의뢰인 소개'], '채널_네이버 블로그': '있음', '채널주인_네이버 블로그': '대행업체',
  '채널_인스타그램': '없음', 홍보시간_주: '1', AI걱정: ['기밀 유출'],
});
assert.ok(r.includes('아니오 3 / 응답 4'));
assert.ok(r.includes('가장 약한 구간: 찾기'));
assert.ok(r.includes('1. [찾기] 네이버 플레이스'));
assert.ok(r.includes('소개·연계 의존형'));
assert.ok(r.includes('재의뢰 관리'));
assert.ok(r.includes('소유권 확인'));
assert.ok(r.includes('주 1시간'));
assert.ok(r.includes('기밀 우려'));
console.log('ok  분석 규칙 9건 통과');
