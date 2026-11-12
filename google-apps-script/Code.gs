/**
 * Máy chủ nhỏ cho thiệp cưới, chạy miễn phí trên Google Apps Script.
 *  - Lưu "Xác nhận tham dự" vào trang tính "Xác nhận tham dự"
 *  - Lưu "Lời chúc" (kèm chữ ký) vào trang tính "Lời chúc"
 *  - Trả danh sách lời chúc cho thiệp hiển thị (?action=wishes)
 * Muốn ẩn một lời chúc: gõ chữ x vào cột "Ẩn" của dòng đó.
 * Cách cài: xem mục "Lưu dữ liệu vào Google Sheets" trong README.md
 */
var RSVP_SHEET = 'Xác nhận tham dự';
var WISH_SHEET = 'Lời chúc';
var RSVP_HEAD = ['Thời gian', 'Tên', 'Khách của', 'Tham dự', 'Số người', 'Link mời (?to=)'];
var WISH_HEAD = ['Thời gian', 'Tên', 'Lời chúc', 'Chữ ký', 'Link mời (?to=)', 'Ẩn'];

function sheet_(name, head) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(name) || ss.insertSheet(name);
  if (sh.getLastRow() === 0) { sh.appendRow(head); sh.setFrozenRows(1); }
  return sh;
}

// Chặn công thức bị chèn vào ô (nội dung bắt đầu bằng = + - @)
function clean_(v, max) {
  v = String(v == null ? '' : v).slice(0, max || 1000);
  return /^[=+\-@]/.test(v) ? "'" + v : v;
}

function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var p = (e && e.parameter) || {};
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    if (p.type === 'wish') {
      var sig = String(p.signature || '');
      if (!/^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(sig) || sig.length > 48000) sig = '';
      sheet_(WISH_SHEET, WISH_HEAD).appendRow([
        new Date(), clean_(p.name, 80), clean_(p.message, 800), sig, clean_(p.invitedAs, 80), '',
      ]);
    } else {
      sheet_(RSVP_SHEET, RSVP_HEAD).appendRow([
        new Date(), clean_(p.name, 80),
        p.side === 'gai' ? 'Nhà gái' : 'Nhà trai',
        p.attending === 'yes' ? 'Có' : 'Không',
        Number(p.guests) || 0, clean_(p.invitedAs, 80),
      ]);
    }
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  var p = (e && e.parameter) || {};
  if (p.action !== 'wishes') return json_({ ok: true });
  var sh = sheet_(WISH_SHEET, WISH_HEAD);
  var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues() : [];
  var tz = Session.getScriptTimeZone();
  var wishes = rows
    .filter(function (r) { return r[1] && r[2] && !String(r[5]).trim(); })
    .reverse()
    .slice(0, 300)
    .map(function (r) {
      return {
        name: String(r[1]), message: String(r[2]), signature: String(r[3] || ''),
        time: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : String(r[0]).slice(0, 10),
      };
    });
  return json_({ wishes: wishes });
}
