// 바스제로 지원사업 매칭표 → 구글 시트 연락처 저장
function doPost(e) {
  var d = JSON.parse(e.postData.contents);
  var clean = function (x, n) {
    x = String(x == null ? '' : x).slice(0, n);
    return /^[=+\-@]/.test(x) ? "'" + x : x; // 시트 수식 주입 방지
  };
  if (!d.company || !d.phone || d.consent !== true) return ContentService.createTextOutput('bad');
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheets()[0];
  if (sh.getLastRow() === 0) sh.appendRow(['받은 시간', '회사명', '성함', '휴대폰', '이메일', '메모', '조건', '추천 사업', 'PDF 만들기 링크', '자료 보냄']);
  sh.appendRow([new Date(), clean(d.company, 100), clean(d.name, 50), clean(d.phone, 20), clean(d.email, 100),
    clean(d.memo, 500), clean(d.conditions, 500), clean(d.programs, 1000), clean(d.link, 3000), '']);
  return ContentService.createTextOutput('ok');
}
