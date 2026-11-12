/**
 * Nhận hồi âm từ thiệp cưới và ghi vào Google Sheets.
 * Cách cài: xem mục "Lưu hồi âm vào Google Sheets" trong README.md
 */
var SHEET_NAME = 'Hồi âm';

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(['Thời gian', 'Tên', 'Tham dự', 'Số người', 'Lời nhắn', 'Link mời (?to=)']);
      sheet.setFrozenRows(1);
    }
    var p = (e && e.parameter) || {};
    sheet.appendRow([
      new Date(),
      clean(p.name),
      p.attending === 'yes' ? 'Sẽ đến' : 'Không đến được',
      Number(p.guests) || 0,
      clean(p.message),
      clean(p.invitedAs),
    ]);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Chặn công thức bị chèn vào ô (vd. nội dung bắt đầu bằng "=")
function clean(v) {
  v = String(v == null ? '' : v).slice(0, 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}
