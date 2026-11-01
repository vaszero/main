/**
 * 바스제로 사전 점검표 수신기 (구글 Apps Script)
 * 점검표 '보내기' → 이 구글시트에 한 줄 저장 + 컨설턴트 메일로 분석 리포트 발송.
 * 다른 업체 점검표도 같은 주소로 받으면 업체별 탭으로 나뉘어 쌓입니다.
 *
 * 설치: 구글시트 새로 만들기 → 확장 프로그램 > Apps Script → 이 코드 붙여넣기 → 저장
 *       → 배포 > 새 배포 > 유형 '웹 앱' / 실행: 나 / 액세스: 모든 사용자 → 배포 → 권한 허용
 *       → 나온 웹 앱 URL(…/exec)을 jh/index.html 의 SCRIPT_URL 에 넣기
 */
const RECIPIENT = 'tksgk22@naver.com';

function doPost(e) {
  const raw = (e && e.postData && e.postData.contents) || '';
  if (raw.length > 100000) return out('too large');
  let p;
  try { p = JSON.parse(raw); } catch (err) { return out('bad json'); }
  if (!p || typeof p.client !== 'string' || typeof p.answersText !== 'string') return out('bad payload');

  const client = p.client.slice(0, 40).replace(/[\[\]\*\?\/\\:]/g, '');
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(client) || ss.insertSheet(client);
  if (sh.getLastRow() === 0) sh.appendRow(['받은 시각', '업체', '구분', '분석', '응답', '원본(JSON)']);
  sh.appendRow([new Date(), client, String(p.round || ''), String(p.analysis || ''), p.answersText, JSON.stringify(p.answers || {})]);

  MailApp.sendEmail({
    to: RECIPIENT,
    subject: '[사전 점검표] ' + client + ' ' + (p.round || '') + ' 응답 도착',
    body: '바스제로 내부용 — 자동 분석\n\n' + (p.analysis || '') +
          '\n\n────────────\n대표님 응답 원문\n\n' + p.answersText +
          '\n\n시트: ' + ss.getUrl(),
  });
  return out('ok');
}

function out(msg) {
  return ContentService.createTextOutput(msg);
}
