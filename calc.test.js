// 연차대장 계산기 — 계산 규칙 검증
// index.html 안의 순수 계산 함수 블록을 그대로 뽑아 실행하므로,
// 배포되는 코드와 테스트 대상이 항상 같습니다.
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');
const start = html.indexOf('  function parseDate(v){');
const end = html.indexOf('  /* ── 상태 ');
if (start < 0 || end < 0 || end <= start) {
  console.error('index.html 에서 계산 함수 블록을 찾지 못했습니다.');
  process.exit(1);
}
const core = html.slice(start, end);
const api = new Function(core + `
  return { parseDate, iso, addMonths, addDays, fmt, ceilHalf, monthlyDates,
           fiscalGrant, buildLedger, anniversaryTotal, promoDates, settleExit, shortWork };
`)();

let pass = 0, fail = 0;
const near = (a, b) => Math.abs(a - b) < 1e-9;
function check(name, actual, expected) {
  const ok = typeof expected === 'number' ? near(actual, expected) : actual === expected;
  if (ok) { pass++; console.log(`  ok   ${name}  →  ${actual}`); }
  else { fail++; console.log(`  FAIL ${name}  →  got ${actual}, want ${expected}`); }
}
function group(t) { console.log(`\n${t}`); }

const D = api.parseDate;
const total = rows => rows.reduce((a, r) => a + r.raw, 0);

/* ── 1. 문서 4쪽 연차 계산 표 (입사 2021-04-01, 기준 2024) ── */
group('문서 4쪽 표 · 비례-15-15-16');
const L = api.buildLedger(D('2021-04-01'), 2024);
check('행 개수', L.length, 5);
check('1년차 미만(월차)', L[0].raw, 8);
check('1년차 미만 라벨', L[0].label, '1년차 미만(월차)');
check('2년차 비례 (15 × 9/12)', L[1].raw, 11.25);
check('2년차 발생일자', L[1].when, '2022-01-01');
check('2년차(월차)', L[2].raw, 3);
check('3년차', L[3].raw, 15);
check('4년차', L[4].raw, 15);
check('총계', total(L), 52.25);
check('월차 합계는 법정 상한 11일', L[0].raw + L[2].raw, 11);

/* ── 2. 소수점 반일단위 올림 ── */
group('소수점 처리 · 반일단위 올림');
check('11.25 → 11.5', api.ceilHalf(11.25), 11.5);
check('13.75 → 14', api.ceilHalf(13.75), 14);
check('15 → 15 (올림 없음)', api.ceilHalf(15), 15);
check('1.25 → 1.5', api.ceilHalf(1.25), 1.5);

/* ── 3. 문서 5쪽 상황1 · 2월 입사자 비례 ── */
group('상황1 · 2월 입사자');
check('15 × 11/12', api.fiscalGrant(2, 2).raw, 13.75);
check('산식 표기', api.fiscalGrant(2, 2).formula, '15 × 11/12');
check('1월 입사자는 15 × 12/12', api.fiscalGrant(2, 1).raw, 15);
check('12월 입사자는 15 × 1/12', api.fiscalGrant(2, 12).raw, 1.25);

/* ── 4. 근속 가산 (입사 첫해를 근속년수에 미포함) ── */
group('근속 가산 · 5년차부터 +1일, 2년마다');
check('3년차', api.fiscalGrant(3, 4).raw, 15);
check('4년차', api.fiscalGrant(4, 4).raw, 15);
check('5년차', api.fiscalGrant(5, 4).raw, 16);
check('6년차', api.fiscalGrant(6, 4).raw, 16);
check('7년차', api.fiscalGrant(7, 4).raw, 17);
check('1년차는 회계연도 부여 없음', api.fiscalGrant(1, 4), null);
check('상한 25일', api.fiscalGrant(60, 4).raw, 25);

/* ── 5. 문서 2~3쪽 연차촉진 (1/1 입사자) ── */
group('연차촉진 · 1월 1일 입사자');
const P = api.promoDates(D('2024-01-01'));
check('최초 1년 종료일', api.iso(P.end), '2024-12-31');
check('1차 촉진 기준일 (3개월 전)', api.iso(P.d3), '2024-10-01');
check('1차 촉진 창구 종료 (+9일)', api.iso(api.addDays(P.d3, 9)), '2024-10-10');
check('계획서 제출 마감 (+19일)', api.iso(api.addDays(P.d3, 19)), '2024-10-20');
check('나머지분 1차 촉진 시작 (1개월 전)', api.iso(P.d1), '2024-12-01');
check('나머지분 1차 촉진 종료 (+4일)', api.iso(api.addDays(P.d1, 4)), '2024-12-05');
check('나머지분 계획서 제출 (+9일)', api.iso(api.addDays(P.d1, 9)), '2024-12-10');
check('나머지분 계획서 마감 (+14일)', api.iso(api.addDays(P.d1, 14)), '2024-12-15');
check('기준일 이전 발생분', P.cntA, 9);
check('기준일 이후 발생분', P.cntB, 2);

group('연차촉진 · 4월 1일 입사자');
const P2 = api.promoDates(D('2021-04-01'));
check('최초 1년 종료일', api.iso(P2.end), '2022-03-31');
check('1차 촉진 기준일', api.iso(P2.d3), '2022-01-01');
check('9개 + 2개 분리', `${P2.cntA}+${P2.cntB}`, '9+2');

/* ── 6. 문서 5쪽 퇴직정산 예시 ── */
group('퇴직정산 · 문서 예시 1 (회계 31 / 입사일 26 / 부여 15 / 사용 11)');
const E1 = api.settleExit(31, 26, 15, 11);
check('차이', E1.diff, 5);
check('조정 후 부여해야 할 연차', E1.adjusted, 10);
check('정산 (음수 = 환수)', E1.settle, -1);

group('퇴직정산 · 문서 예시 2 (회계 31 / 입사일 35 / 부여 15 / 사용 10)');
const E2 = api.settleExit(31, 35, 15, 10);
check('차이', E2.diff, -4);
check('조정 후 부여해야 할 연차', E2.adjusted, 19);
check('퇴사 전 사용 가능', E2.settle, 9);

/* ── 7. 입사일 기준 누적 발생 (법정) ── */
group('입사일 기준 누적 발생일수');
check('입사 11개월 시점 = 월차 11일 미만', api.anniversaryTotal(D('2021-04-01'), D('2022-02-15')), 10);
check('만 1년 = 월차 11 + 연차 15', api.anniversaryTotal(D('2021-04-01'), D('2022-04-01')), 26);
check('만 2년 = 11 + 15 + 15', api.anniversaryTotal(D('2021-04-01'), D('2023-04-01')), 41);
check('만 3년 = 11 + 15 + 15 + 16', api.anniversaryTotal(D('2021-04-01'), D('2024-04-01')), 57);

/* ── 8. 문서 5쪽 단축근로 상황 2·3 ── */
group('단축근로 · 상황2 (30일, 20% 이내)');
const W2 = api.shortWork(247, 30, 6, 15, 8);
check('20% 기준일수', W2.limit, 49.4);
check('초과 여부', W2.over, false);

group('단축근로 · 상황3 (60일, 20% 초과)');
const W3 = api.shortWork(247, 60, 6, 15, 8);
check('초과 여부', W3.over, true);
check('단축 구간 = 15×(60/247)×6', W3.hShort, 15 * (60 / 247) * 6);
check('정상 구간 = 15×(187/247)×8', W3.hNormal, 15 * (187 / 247) * 8);
check('합계 시간', W3.hTotal, 15 * (60 / 247) * 6 + 15 * (187 / 247) * 8);
check('일수 환산 (소수 2자리)', api.fmt(W3.days), '14.09');

/* ── 9. 경계 조건 ── */
group('경계 조건');
check('1월 1일 입사 → 첫해 월차 11일', api.buildLedger(D('2024-01-01'), 2024)[0].raw, 11);
check('12월 15일 입사 → 첫해 월차 0일', api.buildLedger(D('2024-12-15'), 2024).length, 0);
check('월말 입사 월차일 보정 (1/31 + 1개월)', api.iso(api.addMonths(D('2024-01-31'), 1)), '2024-02-29');
check('기준연도 = 입사년도면 월차만', api.buildLedger(D('2021-04-01'), 2021).length, 1);

console.log(`\n${'─'.repeat(48)}`);
console.log(`통과 ${pass} · 실패 ${fail}`);
process.exit(fail ? 1 : 0);
