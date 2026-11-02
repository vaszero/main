// 오푸스메디카 사전 설문지 — 분석 규칙 확인. index.html 의 분석 블록을 그대로 실행합니다.
const fs = require('fs');
const path = require('path');
const assert = require('assert');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const pick = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
const core = pick('const VISITORS', '/* ── 분석 시작') + pick('function analyze(d)', '/* ── 분석 끝');
const analyze = new Function(core + 'return analyze;')();

assert.ok(analyze({}).includes('최종 문구 승인자 미정'));
const r = analyze({
  Q1_이유: ['기술이전·공동연구 파트너 발굴', '투자자 대응', '채용'], Q2_0: '1', Q2_2: '2',
  Q17_언어: '한국어만', Q13_자료: ['국문 회사소개서'], Q14_채널: ['없음'], Q9_단계: ['대외 비공개'],
  Q5_시기: '1개월 이내', Q19_방식: '외주 제작', Q20_업데이트: '어려움', Q10_0: '출원 2건',
});
for (const s of ['1. 글로벌', '목적이 넓음', '영문 계획 한국어만', '영문 회사소개서 없음', '로고 원본', '링크드인 회사 페이지',
  '대외 비공개', '일정 위험', '소식 메뉴', '공개 가능 성과: 특허 출원·등록'])
  assert.ok(r.includes(s), s);
console.log('ok  분석 규칙 11건 통과');
