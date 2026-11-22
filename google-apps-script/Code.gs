/**
 * Máy chủ nhỏ cho thiệp cưới, chạy miễn phí trên Google Apps Script.
 *  - Lưu "Xác nhận tham dự" vào trang tính "Xác nhận tham dự"
 *  - Lưu "Lời chúc" (kèm chữ ký) vào trang tính "Lời chúc"
 *  - Trả danh sách lời chúc cho thiệp hiển thị (?action=wishes)
 *  - Đếm lượt thả tim (mẫu xanh pastel)
 * Dùng chung cho cả mẫu đỏ rượu và mẫu xanh pastel.
 * Cột "Câu hỏi thêm" lưu câu trả lời cho câu hỏi tuỳ chọn của mẫu xanh pastel (vd. có trẻ em đi cùng không).
 * Muốn ẩn một lời chúc: gõ chữ x vào cột "Ẩn" của dòng đó.
 * Luôn trả về JSON: {"ok": true} khi đã ghi xong, {"ok": false, "error": "..."} khi chưa ghi được.
 * Mẫu xanh pastel chỉ báo khách "đã lưu" khi nhận được {"ok": true}.
 * Khách gửi lại xác nhận (cùng tên, cùng link mời) thì cập nhật dòng cũ, không thêm dòng trùng.
 * Trang tính "Thống kê" tự tạo: số phản hồi, số người tham dự, chia theo nhà trai / nhà gái.
 * Trang xanh-pastel/thong-ke.html xem danh sách khi nhập đúng mật khẩu. Đặt mật khẩu một trong hai cách:
 *   - gõ vào dòng  var MAT_KHAU = '…'  bên dưới, NGAY TRONG trình soạn Apps Script (đừng đưa mật khẩu lên GitHub);
 *   - hoặc Cài đặt dự án (bánh răng) → Thuộc tính tập lệnh → thêm MAT_KHAU = mật khẩu.
 * Cách cài: xem mục "Lưu dữ liệu vào Google Sheets" trong README.md
 */
var RSVP_SHEET = 'Xác nhận tham dự';
var WISH_SHEET = 'Lời chúc';
var RSVP_HEAD = ['Thời gian', 'Tên', 'Khách của', 'Tham dự', 'Số người', 'Link mời (?to=)', 'Câu hỏi thêm'];
var STAT_SHEET = 'Thống kê';
var MAT_KHAU = ''; // ← mật khẩu xem trang thống kê (gõ trong Apps Script, để trống ở bản trên GitHub)
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
  try {
    lock.waitLock(10000);
    if (p.type === 'heart') {
      var props = PropertiesService.getScriptProperties();
      var n = Math.max(0, Math.min(50, Number(p.n) || 0));
      props.setProperty('hearts', String((Number(props.getProperty('hearts')) || 0) + n));
    } else if (p.type === 'wish') {
      var sig = String(p.signature || '');
      if (!/^data:image\/png;base64,[A-Za-z0-9+\/=]+$/.test(sig) || sig.length > 48000) sig = '';
      sheet_(WISH_SHEET, WISH_HEAD).appendRow([
        new Date(), clean_(p.name, 80), clean_(p.message, 800), sig, clean_(p.invitedAs, 80), '',
      ]);
    } else if (p.type === 'stats') {
      return stats_(p.key);
    } else {
      if (!String(p.name || '').trim()) return json_({ ok: false, error: 'missing name' });
      var sh = sheet_(RSVP_SHEET, RSVP_HEAD);
      var row = [
        new Date(), clean_(p.name, 80),
        p.side === 'gai' ? 'Nhà gái' : p.side === 'trai' ? 'Nhà trai' : '',
        p.attending === 'yes' ? 'Có' : 'Không',
        p.attending === 'yes' ? Math.max(1, Math.min(50, Number(p.guests) || 1)) : 0, clean_(p.invitedAs, 80),
        clean_(p.extra, 120),
      ];
      var at = findRsvp_(sh, row[1], row[5]);
      if (at) sh.getRange(at, 1, 1, row.length).setValues([row]);
      else sh.appendRow(row);
      statsSheet_();
    }
    SpreadsheetApp.flush(); // ghi hẳn xuống trang tính trước khi báo thành công
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: String((err && err.message) || err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// Dòng đã có của cùng một khách: cùng tên và cùng link mời (không phân biệt hoa thường)
function findRsvp_(sh, name, invitedAs) {
  var n = sh.getLastRow() - 1;
  if (n < 1) return 0;
  var vals = sh.getRange(2, 1, n, 6).getValues();
  var k1 = String(name).trim().toLowerCase(), k2 = String(invitedAs || '').trim().toLowerCase();
  for (var i = vals.length - 1; i >= 0; i--) {
    if (String(vals[i][1]).trim().toLowerCase() === k1 && String(vals[i][5] || '').trim().toLowerCase() === k2) return i + 2;
  }
  return 0;
}

// Trang tính "Thống kê" (tạo một lần, công thức tự cập nhật)
function statsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss.getSheetByName(STAT_SHEET)) return;
  var sh = ss.insertSheet(STAT_SHEET);
  var R = "'" + RSVP_SHEET + "'!";
  var rows = [
    ['Thống kê khách mời', ''],
    ['Số khách đã phản hồi', '=COUNTA(' + R + 'B2:B)'],
    ['Sẽ tham dự (số phản hồi)', '=COUNTIF(' + R + 'D2:D,"Có")'],
    ['Tổng số người tham dự', '=SUMIF(' + R + 'D2:D,"Có",' + R + 'E2:E)'],
    ['   · khách nhà trai', '=SUMIFS(' + R + 'E2:E,' + R + 'D2:D,"Có",' + R + 'C2:C,"Nhà trai")'],
    ['   · khách nhà gái', '=SUMIFS(' + R + 'E2:E,' + R + 'D2:D,"Có",' + R + 'C2:C,"Nhà gái")'],
    ['   · chưa ghi bên', '=SUMIFS(' + R + 'E2:E,' + R + 'D2:D,"Có",' + R + 'C2:C,"")'],
    ['Không tham dự', '=COUNTIF(' + R + 'D2:D,"Không")'],
  ];
  sh.getRange(1, 1, rows.length, 2).setValues(rows.map(function (r) { return [r[0], '']; }));
  for (var i = 1; i < rows.length; i++) sh.getRange(i + 1, 2).setFormula(rows[i][1]);
  sh.getRange(1, 1).setFontWeight('bold').setFontSize(13);
  sh.setColumnWidth(1, 240);
}

// Danh sách phản hồi cho trang thong-ke.html (chỉ khi đúng mật khẩu MAT_KHAU)
function stats_(key) {
  var pass = MAT_KHAU || PropertiesService.getScriptProperties().getProperty('MAT_KHAU');
  if (!pass) return json_({ ok: false, error: 'no-password' });
  if (String(key || '') !== String(pass)) { Utilities.sleep(800); return json_({ ok: false, error: 'wrong-password' }); }
  var sh = sheet_(RSVP_SHEET, RSVP_HEAD);
  var n = sh.getLastRow() - 1;
  var vals = n > 0 ? sh.getRange(2, 1, n, 6).getValues() : [];
  var tz = Session.getScriptTimeZone();
  var rows = vals.filter(function (r) { return String(r[1]).trim(); }).map(function (r) {
    return {
      time: r[0] instanceof Date ? Utilities.formatDate(r[0], tz, "yyyy-MM-dd'T'HH:mm") : String(r[0]),
      name: String(r[1]),
      side: r[2] === 'Nhà trai' ? 'trai' : r[2] === 'Nhà gái' ? 'gai' : '',
      attending: r[3] === 'Có',
      guests: Number(r[4]) || 0,
      invitedAs: String(r[5] || ''),
    };
  });
  return json_({ ok: true, rows: rows, sheet: SpreadsheetApp.getActiveSpreadsheet().getUrl() });
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
  var hearts = Number(PropertiesService.getScriptProperties().getProperty('hearts')) || 0;
  return json_({ wishes: wishes, hearts: hearts });
}
