// H-백줄김밥 사전 설문지 — 분석 규칙 확인. index.html 의 분석 블록을 그대로 실행합니다.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pick = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const core = pick('const FLOW = [', '/* ── 분석 시작') + pick('function analyze(d)', '/* ── 분석 끝');
const analyze = new Function(core + 'return analyze;')();

assert.ok(analyze({}).includes('아니오 0 / 10'));
const r = analyze({
  흐름1: '아니오', 흐름2: '아니오', 흐름9: '예',
  고민: ['손님이 적다'], 받고싶은도움: ['a', 'b', 'c'], 하기싫은것: '배달',
  하루줄수_평일: '80', 하루최대줄수: '150', 도시락: '관심은 있다',
  매출20: '일만 늘고 남는 건 비슷할 것 같다', 홍보시간: '10분 정도', 채널_배달앱: '없음',
});
assert.ok(r.includes('아니오 2 / 10'));
assert.ok(r.includes('1. [찾기] 네이버 플레이스'));
assert.ok(r.includes('우선순위 2개'));
assert.ok(r.includes('하기 싫은 것: 배달'));
assert.ok(r.includes('여유 70줄') && r.includes('전날 예약제'));
assert.ok(r.includes('원가·메뉴 구조'));
assert.ok(r.includes('한 번 하면 끝나는 일'));
assert.ok(r.includes('없는 채널: 배달앱'));
console.log('ok  분석 규칙 통과');
