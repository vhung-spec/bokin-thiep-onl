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
 *   Mật khẩu gõ trong mã được nhớ luôn vào Thuộc tính tập lệnh, nên lần sau dán bản Code.gs mới không phải gõ lại.
 * Danh sách khách mời của trang tạo link (xanh-pastel/tao-link.html) lưu ở trang tính "Khách mời" (cùng mật khẩu):
 *   các máy đã kết nối dùng chung một danh sách và cùng một bài nhạc nền (lưu trong Thuộc tính tập lệnh NHAC_CHUNG). Có thể sửa thẳng trên trang tính (tên, bên, đã gửi);
 *   thêm khách bằng tay thì gõ tên vào dòng trống cuối bảng. Cột "Mã" bị ẩn: đừng sửa, đừng chèn cột vào giữa.
 * Cách cài: xem mục "Lưu dữ liệu vào Google Sheets" trong README.md
 *   Dán file này vào Apps Script (tạo từ Google Sheet, hoặc tạo riêng ở script.google.com — khi đó
 *   bảng tính lưu phản hồi được tạo tự động trong Google Drive của bạn), chọn hàm caiDat → Chạy
 *   để cấp quyền, rồi Triển khai → Ứng dụng web (Bất kỳ ai).
 * Cập nhật bản mới: dán đè toàn bộ file, Lưu, rồi Triển khai → Quản lý các bản triển khai → Chỉnh sửa (bút chì)
 *   → Phiên bản: Phiên bản mới → Triển khai. Link /exec giữ nguyên.
 */
var RSVP_SHEET = 'Xác nhận tham dự';
var WISH_SHEET = 'Lời chúc';
var RSVP_HEAD = ['Thời gian', 'Tên', 'Khách của', 'Tham dự', 'Số người', 'Link mời (?to=)', 'Câu hỏi thêm'];
var STAT_SHEET = 'Thống kê';
var MAT_KHAU = ''; // ← mật khẩu xem trang thống kê (gõ trong Apps Script, để trống ở bản trên GitHub)
var WISH_HEAD = ['Thời gian', 'Tên', 'Lời chúc', 'Chữ ký', 'Link mời (?to=)', 'Ẩn'];
var GUEST_SHEET = 'Khách mời';
var GUEST_HEAD = ['Tên khách', 'Bên', 'Đã gửi', 'Nhạc riêng', 'Link mời', 'Ngày thêm', 'Mã'];
var G_ID = 6; // cột "Mã" (đếm từ 0), ẩn trên trang tính
var DEL_SHEET = 'Khách đã xoá'; // trang tính ẩn: mã các khách đã xoá, để máy khác không thêm lại

// Bảng tính lưu dữ liệu: bảng tính chứa dự án này; nếu dự án tạo riêng thì tự tạo một bảng tính và nhớ lại
function ss_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (ss) return ss;
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty('SHEET_ID');
  if (id) {
    try { return SpreadsheetApp.openById(id); } catch (e) { /* bảng tính đã bị xoá: tạo lại */ }
  }
  ss = SpreadsheetApp.create('Thiệp cưới – phản hồi của khách');
  props.setProperty('SHEET_ID', ss.getId());
  return ss;
}

// Chạy một lần trong trình soạn Apps Script (chọn caiDat → Chạy) để cấp quyền và tạo sẵn bảng tính
function caiDat() {
  var ss = ss_();
  sheet_(RSVP_SHEET, RSVP_HEAD);
  statsSheet_();
  var pass = pass_();
  Logger.log('Đã sẵn sàng. Bảng tính lưu phản hồi: ' + ss.getUrl());
  Logger.log(pass ? 'Đã có mật khẩu xem thống kê.' : 'CHƯA có mật khẩu: gõ vào dòng var MAT_KHAU = \'\' rồi Lưu.');
  Logger.log('Bước tiếp: Triển khai → Tùy chọn triển khai mới → Ứng dụng web → Người có quyền truy cập: Bất kỳ ai.');
}

function sheet_(name, head) {
  var ss = ss_();
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
    } else if (p.type === 'guests') {
      return guests_(p);
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
  var ss = ss_();
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

// Mật khẩu: dòng MAT_KHAU ở trên, hoặc Thuộc tính tập lệnh MAT_KHAU.
// Có mật khẩu trong mã thì nhớ luôn vào Thuộc tính tập lệnh (lần sau dán bản mới, để trống dòng MAT_KHAU vẫn chạy).
function pass_() {
  var props = PropertiesService.getScriptProperties();
  var saved = props.getProperty('MAT_KHAU') || '';
  if (MAT_KHAU && MAT_KHAU !== saved) { props.setProperty('MAT_KHAU', MAT_KHAU); saved = MAT_KHAU; }
  return saved;
}
function checkKey_(key) {
  var pass = pass_();
  if (!pass) return 'no-password';
  if (String(key || '') !== String(pass)) { Utilities.sleep(800); return 'wrong-password'; }
  return '';
}

/* ---------- Danh sách khách mời (trang tạo link) ---------- */
function guestSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(GUEST_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(GUEST_SHEET);
  sh.appendRow(GUEST_HEAD);
  sh.setFrozenRows(1);
  sh.getRange(1, 1, 1, GUEST_HEAD.length).setFontWeight('bold');
  sh.setColumnWidth(1, 220);
  sh.setColumnWidth(5, 320);
  sh.hideColumns(G_ID + 1); // cột "Mã": trang tạo link dùng để nhận ra từng khách
  return sh;
}
function delSheet_() {
  var ss = ss_(), sh = ss.getSheetByName(DEL_SHEET);
  if (sh) return sh;
  sh = ss.insertSheet(DEL_SHEET);
  sh.appendRow(['Mã', 'Xoá lúc']);
  sh.hideSheet();
  return sh;
}
function sideLabel_(s, ban) {
  if (ban === 'nguoi-nha') return s === 'gai' ? 'Người nhà gái' : 'Người nhà trai';
  return s === 'trai' ? 'Nhà trai' : s === 'gai' ? 'Nhà gái' : '';
}
function sideOf_(v) { v = String(v || '').toLowerCase(); return /trai/.test(v) ? 'trai' : /gái|gai/.test(v) ? 'gai' : ''; }
// loại khách riêng (bản thiệp riêng): "Người nhà trai" → 'nguoi-nha'
function banOf_(v) { return /người nhà|nguoi nha/i.test(String(v || '')) ? 'nguoi-nha' : ''; }
function sentOf_(v) { return v === true || /^(có|co|x|✓|✔|1|yes|true|rồi|roi|đã gửi|da gui)$/i.test(String(v == null ? '' : v).trim()); }
function guestKey_(name, side, ban) { return String(name || '').replace(/\s+/g, ' ').trim().toLowerCase() + '|' + side + '|' + (ban || ''); }
function newId_() { return 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function guestList_(rows) {
  return rows.filter(function (r) { return String(r[0]).trim(); }).map(function (r) {
    return { id: String(r[G_ID]), name: String(r[0]).trim(), side: sideOf_(r[1]), ban: banOf_(r[1]), sent: sentOf_(r[2]), music: String(r[3] || '').trim(), link: String(r[4] || '') };
  });
}

// Trang tạo link gửi: up = khách thêm / sửa trên máy đó, del = mã khách đã xoá, links = link mời mới của từng khách.
// Trả lại cả danh sách trên trang tính (thêm bằng tay trên trang tính cũng có).
// Chỉ ghi những ô đổi, không ghi đè cả bảng.
function guests_(p) {
  var bad = checkKey_(p.key);
  if (bad) return json_({ ok: false, error: bad });
  var d;
  try { d = JSON.parse(String(p.data || '{}')) || {}; } catch (e) { return json_({ ok: false, error: 'bad-data' }); }
  var W = GUEST_HEAD.length, sh = guestSheet_(), now = new Date();
  function read() { var n = sh.getLastRow() - 1; return n > 0 ? sh.getRange(2, 1, n, W).getValues() : []; }
  var rows = read();

  // 1. Xoá: xoá hẳn dòng, ghi mã vào trang tính ẩn để máy chưa cập nhật không thêm lại
  var ds = delSheet_(), gone = {}, dn = ds.getLastRow() - 1;
  if (dn > 0) ds.getRange(2, 1, dn, 1).getValues().forEach(function (r) { gone[String(r[0])] = true; });
  var dels = Array.isArray(d.del) ? d.del.slice(0, 5000) : [], newGone = [], kill = {};
  dels.forEach(function (id) {
    id = String(id || '').slice(0, 40);
    if (!id) return;
    if (!gone[id]) { gone[id] = true; newGone.push([id, now]); }
    rows.forEach(function (r, i) { if (String(r[G_ID]) === id) kill[i + 2] = true; });
  });
  if (newGone.length) ds.getRange(ds.getLastRow() + 1, 1, newGone.length, 2).setValues(newGone);
  var rn = Object.keys(kill).map(Number).sort(function (a, b) { return b - a; });
  if (rn.length) {
    // trang tính phải còn ít nhất một dòng không cố định: thêm dòng trống trước khi xoá
    if (sh.getMaxRows() - rn.length < 2) sh.insertRowsAfter(sh.getMaxRows(), rn.length);
    for (var a = 0; a < rn.length;) { // xoá theo từng khúc liền nhau (nhanh hơn xoá từng dòng)
      var b = a;
      while (b + 1 < rn.length && rn[b + 1] === rn[b] - 1) b++;
      sh.deleteRows(rn[b], b - a + 1);
      a = b + 1;
    }
    rows = read();
  }

  // 2. Dòng gõ tay trên trang tính: cấp mã
  rows.forEach(function (r, i) {
    if (!String(r[0]).trim() || String(r[G_ID]).trim()) return;
    r[G_ID] = newId_();
    if (!r[5]) r[5] = now;
    sh.getRange(i + 2, 6, 1, 2).setValues([[r[5], r[G_ID]]]);
  });

  // 3. Thêm / sửa (bỏ qua khách đã xoá; khách trùng tên cùng bên thêm từ máy khác thì không thêm lần nữa)
  var byId = {}, byKey = {};
  rows.forEach(function (r, i) {
    byId[String(r[G_ID])] = i;
    var k = guestKey_(r[0], sideOf_(r[1]), banOf_(r[1]));
    if (String(r[0]).trim() && !(k in byKey)) byKey[k] = i;
  });
  var add = [];
  (Array.isArray(d.up) ? d.up.slice(0, 3000) : []).forEach(function (g) {
    if (!g) return;
    var id = String(g.id || '').slice(0, 40), name = String(g.name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!id || !name || gone[id]) return;
    var side = g.side === 'trai' || g.side === 'gai' ? g.side : '';
    var ban = g.ban === 'nguoi-nha' ? g.ban : '';
    var vals = [clean_(name, 80), sideLabel_(side, ban), g.sent ? 'Có' : '', clean_(g.music || '', 300)];
    var i = byId[id];
    if (i !== undefined) {
      for (var j = 0; j < 4; j++) rows[i][j] = vals[j];
      sh.getRange(i + 2, 1, 1, 4).setValues([vals]);
      return;
    }
    var k = guestKey_(name, side, ban);
    if (k in byKey) return;
    var row = vals.concat([clean_((d.links && d.links[id]) || '', 2000), now, id]);
    add.push(row);
    rows.push(row);
    byId[id] = byKey[k] = rows.length - 1;
  });
  var first = sh.getLastRow() + 1;
  if (add.length) sh.getRange(first, 1, add.length, W).setValues(add);

  // 4. Link mời (đổi khi đổi nhạc chung): ghi cả cột một lần
  var links = d.links && typeof d.links === 'object' ? d.links : {}, col = [], linkChanged = false;
  var old = rows.length - add.length;
  for (var r = 0; r < old; r++) {
    var id2 = String(rows[r][G_ID]), l = links.hasOwnProperty(id2) ? clean_(links[id2], 2000) : rows[r][4];
    if (l !== rows[r][4]) { rows[r][4] = l; linkChanged = true; }
    col.push([rows[r][4]]);
  }
  if (linkChanged) sh.getRange(2, 5, old, 1).setValues(col);

  // 5. Nhạc chung của các link mời (bài + giây bắt đầu): các máy dùng cùng một bài
  var props = PropertiesService.getScriptProperties(), settings = null;
  if (d.set && typeof d.set === 'object') {
    props.setProperty('NHAC_CHUNG', JSON.stringify({ music: String(d.set.music || '').slice(0, 500), start: String(d.set.start || '').slice(0, 20) }));
  }
  try { settings = JSON.parse(props.getProperty('NHAC_CHUNG') || 'null'); } catch (e) { settings = null; }

  SpreadsheetApp.flush();
  // ver: phiên bản Code.gs (3 = có loại khách "Người nhà"); trang tạo link dựa vào đây để nhắc cập nhật
  return json_({ ok: true, ver: 3, guests: guestList_(rows), settings: settings, sheet: ss_().getUrl() + '#gid=' + sh.getSheetId() });
}

// Danh sách phản hồi cho trang thong-ke.html (chỉ khi đúng mật khẩu MAT_KHAU)
function stats_(key) {
  var bad = checkKey_(key);
  if (bad) return json_({ ok: false, error: bad });
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
  // danh sách khách mời (nếu trang tạo link đã lưu lên đây): để trang thống kê biết ai chưa phản hồi trên mọi máy
  var gs = ss_().getSheetByName(GUEST_SHEET), invites = null;
  if (gs) {
    var gn = gs.getLastRow() - 1;
    invites = guestList_(gn > 0 ? gs.getRange(2, 1, gn, GUEST_HEAD.length).getValues() : []).map(function (g) {
      return { name: g.name, side: g.side, sent: g.sent };
    });
  }
  return json_({ ok: true, rows: rows, invites: invites, sheet: ss_().getUrl() });
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
