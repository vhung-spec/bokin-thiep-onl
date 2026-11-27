/*
 * Lịch trình ngày đón dâu — đọc lich-trinh.json và vẽ ra trang.
 * Gia đình KHÔNG cần sửa file này: mọi giờ, địa chỉ, đầu mối nằm trong lich-trinh.json.
 */
(function () {
  'use strict';

  var DATA_URL = 'lich-trinh.json';
  // Lấy thời điểm sửa lịch thật: lần commit gần nhất của lich-trinh.json trên nhánh đang chạy GitHub Pages
  var REPO = 'vhung-spec/bokin-thiep-onl';
  var BRANCH = 'claude/modest-maxwell-l2dq6l';
  var FILE_PATH = 'lich-trinh/lich-trinh.json';
  var KEY_DATA = 'lich-trinh:du-lieu';
  var KEY_UPDATED = 'lich-trinh:cap-nhat';

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function str(s) { return typeof s === 'string' ? s.trim() : ''; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  var ICON = {
    pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s-6.5-6.1-6.5-11a6.5 6.5 0 0 1 13 0c0 4.9-6.5 11-6.5 11z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.3" fill="currentColor"/></svg>',
    people: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3 20c.6-3.6 3-5.6 6-5.6s5.4 2 6 5.6M16 4.9a3.2 3.2 0 0 1 0 6.2M18 14.6c1.8.7 2.8 2.6 3.1 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    clock: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5V12l3 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    map: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l18-8-8 18-2-8-8-2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    car: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16V11.5L7 6.5h10l2 5V16M3.5 16h17M5 16v2.5M19 16v2.5M7.5 13.2h.01M16.5 13.2h.01" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    zalo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5h16v10H9l-5 4v-14z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 3.5h2.8l1.4 4-2 1.3a11 11 0 0 0 6.4 6.4l1.3-2 4 1.4v2.8a2 2 0 0 1-2.2 2C10 19 5 14 4.6 5.7a2 2 0 0 1 2-2.2z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
  };

  /* ---------- Giờ ---------- */
  function timeLabel(ev) {
    if (str(ev.nhanGio)) return { text: str(ev.nhanGio), rel: !str(ev.batDau) };
    if (str(ev.batDau)) return { text: str(ev.batDau) + (str(ev.ketThuc) ? '–' + str(ev.ketThuc) : ''), rel: false };
    return { text: str(ev.khiNao) || 'Chưa có giờ', rel: true };
  }

  /* ---------- Ghim dùng chung (diaDiemChung): nhà trai, nhà gái — sửa một chỗ ---------- */
  var PLACES = {};
  var LATLNG = /^\s*(-?\d{1,2}\.\d+)\s*,\s*(-?\d{1,3}\.\d+)\s*$/;
  function coord(s) { var m = LATLNG.exec(str(s)); return m ? m[1] + ',' + m[2] : ''; }
  function resolvePlace(dd) {
    dd = dd || {};
    if (!dd.ref || !PLACES[dd.ref]) return dd;
    var base = PLACES[dd.ref], out = {};
    Object.keys(base).forEach(function (k) { out[k] = base[k]; });
    Object.keys(dd).forEach(function (k) { if (k !== 'ref' && str(dd[k])) out[k] = dd[k]; });
    return out;
  }

  /* ---------- Số điện thoại, bản đồ: chỉ hiện nút khi dữ liệu dùng được ---------- */
  function telHref(raw) {
    var s = str(raw).replace(/[\s.\-()]/g, '');
    if (/^\+84\d{9,10}$/.test(s) || /^0\d{9,10}$/.test(s)) return 'tel:' + s;
    return '';
  }
  function mapHref(dd) {
    if (!dd || dd.daXacNhan !== true) return '';
    var c = coord(dd.toaDo);
    if (c) return 'https://www.google.com/maps/search/?api=1&query=' + c;
    var m = str(dd.banDo);
    if (/^https:\/\//i.test(m)) return m;
    var a = str(dd.diaChi);
    if (a) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((str(dd.ten) ? str(dd.ten) + ', ' : '') + a);
    return '';
  }

  /* ---------- Một mốc ---------- */
  function renderEvent(ev) {
    var t = timeLabel(ev);
    var dd = resolvePlace(ev.diaDiem);
    var hasTime = !!(str(ev.batDau) || str(ev.nhanGio));
    var timeTxt = hasTime ? t.text : (str(ev.gioNgan) || t.text);
    var chieu = ev.xeChay && EV_CHIEU[ev.id] ? ' chieu-' + EV_CHIEU[ev.id] : '';
    var html = '<li class="row' + (ev.xeChay ? ' xe' : '') + chieu + '"><details class="ev" id="ev-' + esc(ev.id || '') + '">' +
      '<summary' + (!hasTime || /–/.test(timeTxt) ? ' class="stack"' : '') + '><span class="r-time' + (hasTime ? '' : ' rel') + '">' + esc(timeTxt) + '</span>' +
      '<span class="r-what">' + esc(str(ev.tomTat) || str(ev.viec)) +
      (ev.xeChay ? '<span class="tag car">Giờ xe chạy</span>' : '') + '</span>' +
      '<span class="chev" aria-hidden="true"></span></summary><div class="r-body">';
    html += '<h3>' + esc(ev.viec) + '</h3>';
    if (!hasTime) html += '<p class="time-note">Giờ: chờ gia đình cập nhật.</p>';
    if (str(ev.ghiChuGio)) html += '<p class="time-note">' + esc(ev.ghiChuGio) + '</p>';

    html += '<div class="meta">';
    // Địa điểm
    var place = str(dd.ten), addr = str(dd.diaChi);
    if (place || addr) {
      html += '<p>' + ICON.pin + '<span>' + esc(place) + (place && addr ? '<br>' : '') +
        (addr ? '<span class="muted">' + esc(addr) + '</span>' : '') + '</span></p>';
    } else {
      html += '<p class="muted">' + ICON.pin + '<span>' + esc(str(dd.khiTrong) || 'Địa điểm: chờ gia đình bổ sung') + '</span></p>';
    }
    if (str(dd.ghiChuGhim)) html += '<p class="pin-note">' + esc(dd.ghiChuGhim) + '</p>';
    if (str(dd.luuY) && dd.daXacNhan !== true) html += '<p class="warn">' + ICON.pin + '<span>' + esc(dd.luuY) + '</span></p>';
    // Giờ có mặt (riêng với giờ xe chạy)
    if (str(ev.gioCoMat)) html += '<p>' + ICON.clock + '<span><b>Giờ có mặt: <span class="num">' + esc(ev.gioCoMat) + '</span></b></span></p>';
    else if (str(ev.gioCoMatKhiTrong)) html += '<p class="muted">' + ICON.clock + '<span>' + esc(ev.gioCoMatKhiTrong) + '</span></p>';
    // Người cần xem
    var who = (ev.nguoiCanXem || []).map(str).filter(Boolean);
    if (who.length) html += '<p>' + ICON.people + '<span><span class="muted">Người cần xem:</span> ' + esc(who.join(', ')) + '</span></p>';
    html += '</div>';

    if (str(ev.canChuanBi)) html += '<div class="prep"><b>Cần chuẩn bị</b>' + esc(ev.canChuanBi) + '</div>';

    // Nút Chỉ đường / Gọi đầu mối: chỉ khi gia đình đã nhập đủ và đúng
    var acts = '';
    var m = mapHref(dd);
    if (m) acts += '<a class="btn" href="' + esc(m) + '" target="_blank" rel="noopener">' + ICON.map + 'Chỉ đường</a>';
    var dm = ev.dauMoi || {};
    var tel = telHref(dm.soDienThoai);
    if (tel) acts += '<a class="btn ghost" href="' + esc(tel) + '">' + ICON.phone + 'Gọi ' + esc(str(dm.ten) || 'đầu mối') + '</a>';
    if (str(ev.loTrinh)) acts += '<a class="btn ghost" href="#' + esc(ev.loTrinh) + '" data-target="' + esc(ev.loTrinh) + '">' + ICON.car + 'Lộ trình xe</a>';
    if (acts) html += '<div class="acts">' + acts + '</div>';

    // Xem chi tiết: thông tin phụ (đầu mối, thứ tự nghi thức, số xe, hướng dẫn tập trung…)
    var more = '';
    if (str(dm.ten) || str(dm.soDienThoai)) {
      more += '<p><b>Đầu mối:</b> ' + esc(str(dm.ten) || '—') + (str(dm.soDienThoai) ? ' · <span class="num">' + esc(dm.soDienThoai) + '</span>' : '') + '</p>';
    }
    var steps = (ev.nghiThuc || []).map(str).filter(Boolean);
    if (steps.length) more += '<p><b>Thứ tự nghi thức:</b></p><ol>' + steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
    var extra = (ev.chiTiet || []).map(str).filter(Boolean);
    if (extra.length) more += '<ul>' + extra.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ul>';
    if (more) html += '<div class="more-body">' + more + '</div>';

    return html + '</div></details></li>';
  }

  /* ---------- Lộ trình cho lái xe ---------- */
  // Link Google Maps của một lượt: điểm đi, điểm đến cố định (từ diaDiemChung), 6 điểm khoá đúng thứ tự.
  // Toạ độ chỉ gồm số, dấu chấm, dấu phẩy nên ghi thẳng; dấu | giữa các điểm khoá viết %7C (mã hoá một lần).
  function legUrl(l) {
    var from = coord((PLACES[l.tu] || {}).toaDo), to = coord((PLACES[l.den] || {}).toaDo);
    var via = (l.quaDiem || []).map(function (v) { return coord(v && v.toaDo); });
    if (!from || !to || via.some(function (v) { return !v; })) return '';
    return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&origin=' + from + '&destination=' + to +
      (via.length ? '&waypoints=' + via.slice(0, 9).join('%7C') : '') + '&dir_action=navigate';
  }
  // Android: mở thẳng ứng dụng Google Maps (trình duyệt / Zalo chỉ giữ 3 điểm khoá, ứng dụng giữ đủ).
  // Máy không có ứng dụng thì quay về đúng link HTTPS ở trên. iPhone: dùng link HTTPS.
  function isAndroid() { return /Android/i.test(navigator.userAgent); }
  function appHref(url) {
    if (!isAndroid()) return url;
    return 'intent://' + url.replace(/^https:\/\//, '') + '#Intent;scheme=https;package=com.google.android.apps.maps;S.browser_fallback_url=' + encodeURIComponent(url) + ';end';
  }
  var LEG_URLS = {};
  function mainButton(l, extra) {
    var url = LEG_URLS[l.id];
    if (!url) return '';
    return '<a class="btn gm-main' + (extra || '') + '" href="' + esc(appHref(url)) + '" target="_blank" rel="noopener">' + ICON.map +
      '<span>' + esc(str(l.nutGoogle) || 'Mở Google Maps') + '</span></a>';
  }
  // Tiêu đề ô: "05:00 · Nhà trai → Nhà gái" — phần giờ in đậm, không xuống dòng
  function tripTitle(t) {
    var i = t.indexOf(' · ');
    if (i < 0) return esc(t);
    return '<span class="thead"><b class="tt">' + esc(t.slice(0, i)) + '</b> ·</span> <span class="tdir">' + esc(t.slice(i + 3)) + '</span>';
  }
  // Hai thẻ đầu trang: nhãn chiều / giờ / rời đâu / dự kiến đến / nút — giờ và nơi lấy từ lịch và ghim chung
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''; }
  function evTime(id) { var ev = EVENTS[id]; return ev ? timeLabel(ev).text : ''; }
  function tripCards(legs) {
    var html = '';
    legs.forEach(function (l) {
      var from = PLACES[l.tu] || {}, to = PLACES[l.den] || {};
      var chieu = /^(di|ve)$/.test(l.chieu) ? l.chieu : 'di';
      var leave = 'Rời ' + (str(from.goiNgan) || str(from.ten)) + (str(from.viTriNgan) ? ' · ' + str(from.viTriNgan) : '');
      var arriveT = evTime(l.suKienDen);
      // Giữ giờ và tên nơi đến trên một dòng (không ngắt "Vũ / Tuấn")
      var arrive = arriveT ? esc(str(l.dongDen) || 'Dự kiến {gio} đến {noi}')
        .replace('{gio}', '<span class="nw">' + esc(arriveT) + '</span>')
        .replace('{noi}', '<span class="nw">' + esc(str(to.goiNgan) || str(to.ten)) + '</span>') : '';
      html += '<div class="trip chieu-' + chieu + '" data-luot="' + esc(l.id) + '">' +
        '<p class="trip-k">' + esc(str(l.nhanChieu)) + '</p>' +
        '<p class="trip-tt">' + esc(evTime(l.suKienDi)) + '</p>' +
        '<p class="trip-l">' + esc(leave) + '</p>' +
        (arrive ? '<p class="trip-l">' + arrive + '</p>' : '') +
        (LEG_URLS[l.id] ? mainButton(l) : '<p class="leg-note warn">Chưa đủ toạ độ để mở Google Maps.</p>') +
        // Lưu ý ghim nhà trai (màu hổ phách) — nằm ở lượt có dùng ghim Phố Văn
        (str(from.ghiChuGhim || to.ghiChuGhim) ? '<p class="pin-note">' + esc(from.ghiChuGhim || to.ghiChuGhim) + '</p>' : '') + '</div>';
    });
    return html;
  }
  // Trợ giúp khi bản đồ mở trong Zalo: chỉ hiện khi chạm
  function zaloHelp(legs, key) {
    var copies = legs.filter(function (l) { return LEG_URLS[l.id]; }).map(function (l) {
      return '<button class="btn ghost small" type="button" data-copy="' + esc(l.id) + '">Sao chép link' +
        (legs.length > 1 ? ' · ' + esc(/ve$/.test(l.id) ? 'lượt về' : 'lượt đi') : '') + '</button>';
    }).join('');
    return '<details class="zalo-help"><summary>Nếu bản đồ mở trong Zalo</summary><div class="zh-body">' +
      '<ol><li>Bấm <b>⋯</b> góc trên Zalo, chọn mở bằng <b>Safari</b> (iPhone) hoặc <b>Chrome</b> (Android).</li>' +
      '<li>Bấm lại nút Google Maps, chọn ứng dụng <b>Google Maps</b>.</li>' +
      '<li>Hoặc sao chép link, dán vào Ghi chú rồi chạm vào.</li></ol>' +
      '<p class="zh-note">Mở trong Zalo chỉ giữ 3 trên 6 điểm khoá của đoàn.</p>' +
      '<div class="acts">' + copies + '</div><p class="share-msg" id="copyMsg-' + esc(key) + '" role="status" aria-live="polite"></p></div></details>';
  }
  function renderRoute(r) {
    if (!r || !(r.luot || []).length) return '';
    var html = '<section class="route-sec" id="lo-trinh" aria-labelledby="lt-h"><h2 id="lt-h">' + ICON.car + 'Lộ trình xe</h2>';
    if (str(r.gioiThieu)) html += '<p class="route-intro">' + esc(r.gioiThieu) + '</p>';

    (r.luot || []).forEach(function (l) {
      var from = PLACES[l.tu] || {}, to = PLACES[l.den] || {};
      html += '<details class="leg chieu-' + esc(/^(di|ve)$/.test(l.chieu) ? l.chieu : 'di') + '" id="' + esc(l.id || '') + '" data-luot="' + esc(l.id) + '"><summary>' +
        '<span class="leg-k">' + esc(str(l.nhanChieu)) + '</span>' +
        '<span class="leg-s1"><b class="tt">' + esc(evTime(l.suKienDi)) + '</b> · ' + esc(cap(str(from.goiNgan))) + ' → <span class="nw">' + esc(cap(str(to.goiNgan))) + '</span>' + '</span>' +
        '<span class="leg-s2">' + esc(str(l.tomTatMoRong) || 'Bản đồ, chỉ đường, GPX') + '</span><span class="chev" aria-hidden="true"></span></summary><div class="leg-body">';
      // Bản đồ cung đường cố định (vẽ khi mở mục, để Leaflet đo đúng kích thước)
      html += '<div class="map-wrap" data-luot="' + esc(l.id) + '"><div class="map" id="map-' + esc(l.id) + '" role="img" aria-label="Bản đồ cung đường ' + esc(l.ten) + '"></div>' +
        '<button class="map-close" type="button" hidden>Đóng bản đồ lớn ✕</button></div>' +
        '<p class="leg-note warn" id="pinwarn-' + esc(l.id) + '" hidden></p>' +
        '<div class="acts map-acts"><button class="btn" type="button" data-gps="' + esc(l.id) + '">' + ICON.pin + 'Vị trí của tôi</button>' +
        '<button class="btn ghost" type="button" data-full="' + esc(l.id) + '">Phóng to bản đồ</button></div>' +
        '<p class="gps-msg" id="gps-' + esc(l.id) + '" role="status" aria-live="polite"></p>' +
        '<p class="gps-elev" id="elev-' + esc(l.id) + '" hidden>Gần Vành đai 3, GPS dễ lẫn đường trên cao và đường dưới — xem biển chỉ dẫn.</p>';
      // Điểm đi – qua – đến
      html += '<h4 class="steps-h">Các điểm đi qua</h4><ol class="stops">';
      html += '<li><span class="lbl">Đi từ</span>' + esc(str(from.ten) + (str(from.diaChi) ? ' — ' + str(from.diaChi) : '')) +
        (str(from.ghiChuGhim) ? '<span class="pin-note">' + esc(from.ghiChuGhim) + '</span>' : '') + '</li>';
      (l.quaDiem || []).forEach(function (v) { if (str(v && v.ten)) html += '<li class="via"><span class="lbl">Qua</span>' + esc(v.ten) + '</li>'; });
      html += '<li class="end"><span class="lbl">Đến</span>' + esc(str(to.ten) + (str(to.diaChi) ? ' — ' + str(to.diaChi) : '')) +
        (str(to.ghiChuGhim) ? '<span class="pin-note">' + esc(to.ghiChuGhim) + '</span>' : '') + '</li></ol>';
      // Chỉ đường từng bước
      var steps = (l.cacBuoc || []).map(str).filter(Boolean);
      if (steps.length) html += '<h4 class="steps-h">Chỉ đường từng bước</h4><ol class="steps">' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
      // GPX
      html += '<h4 class="steps-h">Dành cho xe dẫn đoàn</h4><div class="gpx-body">' +
        '<p><a class="btn ghost small" href="' + esc(l.id) + '.gpx" download>Tải file GPX ' + esc(/ve$/.test(l.id) ? 'lượt về' : 'lượt đi') + '</a></p>' +
        '<p class="leg-note">Dùng cho OsmAnd: chọn “Theo dõi tuyến”.</p></div>';
      html += '</div></details>';
    });

    // Liên hệ đoàn xe: trường nào trống thì ẩn
    var c = r.lienHeDoanXe || {}, box = '', acts = '';
    if (str(c.nguoiPhuTrach) && !telHref(c.soDienThoai)) box += '<p><b>Người phụ trách điện thoại:</b> ' + esc(c.nguoiPhuTrach) + (str(c.vaiTro) ? ' <span class="muted">(' + esc(c.vaiTro) + ')</span>' : '') + '</p>';
    if (str(c.bienSoXeDanDoan)) box += '<p><b>Biển số xe dẫn đoàn:</b> <span class="num">' + esc(c.bienSoXeDanDoan) + '</span></p>';
    if (str(c.diemHenKhiTachDoan)) box += '<p><b>Điểm hẹn khi tách đoàn:</b> ' + esc(c.diemHenKhiTachDoan) + '</p>';
    var tel = telHref(c.soDienThoai);
    if (tel) acts += '<a class="btn" href="' + esc(tel) + '">' + ICON.phone + 'Gọi ' + esc(str(c.nguoiPhuTrach) || 'người phụ trách') + ' · <span class="num">' + esc(c.soDienThoai) + '</span></a>';
    if (/^https:\/\/zalo\.me\//i.test(str(c.nhomZalo))) acts += '<a class="btn ghost" href="' + esc(c.nhomZalo) + '" target="_blank" rel="noopener">' + ICON.zalo + 'Vào nhóm Zalo đoàn xe</a>';
    if (acts) box += '<div class="acts">' + acts + '</div>';
    if (!box) box = '<p class="muted">Gia đình đang cập nhật.</p>';
    html += '<div class="convoy" id="lien-he"><h3>Liên hệ đoàn xe</h3>' + box + '</div>';

    var rules = (r.quyTac || []).map(str).filter(Boolean);
    if (rules.length) html += '<div class="convoy"><h3>Đi theo đoàn</h3><ul class="rules">' + rules.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';

    html += '<div class="acts center"><button class="btn ghost" type="button" data-share="#lo-trinh">Gửi lộ trình cho lái xe</button></div><p class="share-msg" id="routeMsg" role="status" aria-live="polite"></p>';
    return html + '</section>';
  }

  /* ---------- Bản đồ cung đường cố định (Leaflet + OpenStreetMap) ---------- */
  var GEO_URL = 'lo-trinh-co-dinh.geojson';
  var maps = {}, geo = null, watchId = null, watchLeg = null;
  function loadLeaflet(cb) {
    if (window.L) return cb();
    var css = document.createElement('link');
    css.rel = 'stylesheet'; css.href = 'vendor/leaflet/leaflet.css';
    document.head.appendChild(css);
    var js = document.createElement('script');
    js.src = 'vendor/leaflet/leaflet.js';
    js.onload = cb;
    js.onerror = function () { document.querySelectorAll('.map').forEach(function (m) { m.innerHTML = '<p class="map-err">Chưa tải được bản đồ (mạng yếu?). Vẫn đi theo các bước bên dưới.</p>'; }); };
    document.head.appendChild(js);
  }
  function loadGeo() {
    if (geo) return Promise.resolve(geo);
    return fetch(GEO_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); }).then(function (g) { geo = g; return g; });
  }
  // Sau khi vẽ trang: chỉ tải đường vẽ để kiểm tra ghim; bản đồ vẽ khi người xem mở từng lượt
  function setupMaps() {
    if (!document.querySelector('.map-wrap')) return;
    loadGeo().then(function () {
      LEGS.forEach(function (l) {
        var line = lineOf(l.id);
        if (line) pinCheck(l.id, line);
      });
    }).catch(function () { /* mở mục lượt sẽ báo lỗi */ });
  }
  function lineOf(id) {
    var f = (geo && geo.features || []).filter(function (x) { return x.properties.luot === id && x.geometry.type === 'LineString' && x.properties.loai !== 'tren-cao'; })[0];
    return f ? f.geometry.coordinates.map(function (c) { return [c[1], c[0]]; }) : null;
  }
  var mapWaits = {};
  function ensureMap(id) {
    if (maps[id]) {
      // Đã vẽ: đo lại kích thước (mục vừa mở) rồi khung lại trọn tuyến
      return new Promise(function (ok) {
        requestAnimationFrame(function () { maps[id].map.invalidateSize(); if (!maps[id].follow) maps[id].map.fitBounds(maps[id].bounds, { padding: [16, 16] }); ok(maps[id]); });
      });
    }
    if (mapWaits[id]) return mapWaits[id];
    mapWaits[id] = new Promise(function (ok, fail) {
      loadLeaflet(function () {
        loadGeo().then(function () {
          requestAnimationFrame(function () { drawMap(id); delete mapWaits[id]; maps[id] ? ok(maps[id]) : fail(); });
        }).catch(function () {
          var el = $('map-' + id); if (el) el.innerHTML = '<p class="map-err">Chưa tải được đường kẻ lộ trình. Vẫn đi theo các bước bên dưới.</p>';
          delete mapWaits[id]; fail();
        });
      });
    });
    return mapWaits[id];
  }
  function drawMap(id) {
    var el = $('map-' + id);
    if (!el || !geo) return;
    var line = null, pts = [], elev = [];
    geo.features.forEach(function (f) {
      var p = f.properties;
      if (p.luot !== id) return;
      if (p.loai === 'tren-cao') elev = f.geometry.coordinates.map(function (seg) { return seg.map(function (c) { return [c[1], c[0]]; }); });
      else if (f.geometry.type === 'LineString') line = f;
      else if (f.geometry.type === 'Point') pts.push(f);
    });
    if (!line) return;
    var latlngs = line.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
    var map = L.map(el, { zoomSnap: 0.25, zoomDelta: 0.5, dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false, zoomControl: false, attributionControl: true });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    L.polyline(latlngs, { color: '#FFFFFF', weight: 9, opacity: .9 }).addTo(map);
    L.polyline(latlngs, { color: '#203E4B', weight: 5, opacity: 1 }).addTo(map);
    pts.forEach(function (f) {
      var p = f.properties, c = f.geometry.coordinates, last = p.stt === pts.length;
      var icon = L.divIcon({ className: 'mk' + (p.stt === 1 ? ' start' : last ? ' end' : ''), html: '<span>' + p.stt + '</span>', iconSize: [26, 26], iconAnchor: [13, 13] });
      L.marker([c[1], c[0]], { icon: icon, keyboard: false }).addTo(map)
        .bindPopup('<b>' + esc(p.stt + '. ' + p.ten) + '</b><br>' + esc(p.ghiChu));
    });
    var bounds = L.latLngBounds(latlngs);
    map.fitBounds(bounds, { padding: [16, 16] });
    maps[id] = { map: map, line: latlngs, elev: elev, bounds: bounds, me: null, acc: null };
    // Kiểm tra lại sau khi khung đã ổn định (phông chữ, thanh cuộn): vẫn thấy trọn tuyến
    setTimeout(function () { map.invalidateSize(); map.fitBounds(bounds, { padding: [16, 16] }); }, 250);
    // chú thích điểm mốc ngay dưới bản đồ (đọc được không cần chạm)
    var legend = document.createElement('ol'); legend.className = 'marks';
    legend.innerHTML = pts.map(function (f) { return '<li><b>' + f.properties.stt + '</b> ' + esc(f.properties.ten) + '</li>'; }).join('');
    el.parentNode.appendChild(legend);
  }
  // Ghim đổi mà chưa vẽ lại đường / GPX: nhắc người quản trị
  function metres(a, b) {
    var k = Math.cos(a[0] * Math.PI / 180), dx = (a[1] - b[1]) * k, dy = a[0] - b[0];
    return Math.sqrt(dx * dx + dy * dy) * 111195;
  }
  function pinCheck(id, line) {
    var l = (LEGS || []).filter(function (x) { return x.id === id; })[0], warn = $('pinwarn-' + id);
    if (!l || !warn) return;
    var off = [];
    [[l.tu, line[0]], [l.den, line[line.length - 1]]].forEach(function (pair) {
      var c = coord((PLACES[pair[0]] || {}).toaDo);
      if (!c) return;
      var p = c.split(',').map(Number);
      if (metres(p, pair[1]) > 150) off.push(str(PLACES[pair[0]].ten) || pair[0]);
    });
    if (off.length) {
      warn.textContent = 'Lưu ý cho người quản trị: ghim ' + off.join(', ') + ' vừa đổi nhưng đường vẽ và file GPX chưa cập nhật. Chạy lại tools/lo-trinh/tao_lo_trinh.py rồi kiểm tra đoạn nối từ ghim ra Quốc lộ 5.';
      warn.hidden = false;
    }
  }
  function setFull(id, on) {
    var m = maps[id];
    if (!m) { if (on) ensureMap(id).then(function () { setFull(id, true); }, function () {}); return; }
    var wrap = $('map-' + id).parentNode;
    wrap.classList.toggle('full', on);
    document.body.classList.toggle('map-open', on);
    wrap.querySelector('.map-close').hidden = !on;
    ['dragging', 'touchZoom', 'doubleClickZoom', 'scrollWheelZoom'].forEach(function (h) { m.map[h][on ? 'enable' : 'disable'](); });
    if (on && !m.zc) { m.zc = L.control.zoom({ position: 'bottomright' }); }
    if (m.zc) { if (on) m.zc.addTo(m.map); else m.zc.remove(); }
    setTimeout(function () { m.map.invalidateSize(); if (!on) m.map.fitBounds(m.bounds, { padding: [16, 16] }); }, 60);
  }
  // Khoảng cách (mét) từ một điểm tới đường kẻ
  function distToLine(lat, lng, line) {
    var k = Math.cos(lat * Math.PI / 180), R = 6371000 * Math.PI / 180, best = Infinity, at = null;
    for (var i = 1; i < line.length; i++) {
      var ax = (line[i - 1][1] - lng) * k, ay = line[i - 1][0] - lat, bx = (line[i][1] - lng) * k, by = line[i][0] - lat;
      var dx = bx - ax, dy = by - ay, t = (dx || dy) ? -(ax * dx + ay * dy) / (dx * dx + dy * dy) : 0;
      t = Math.max(0, Math.min(1, t));
      var x = ax + t * dx, y = ay + t * dy, d = Math.sqrt(x * x + y * y);
      if (d < best) { best = d; at = [lat + y, lng + x / k]; }
    }
    return { m: best * R, at: at };
  }
  function startGps(id) {
    if (!maps[id]) { ensureMap(id).then(function () { startGps(id); }, function () {}); return; }
    var m = maps[id], msg = $('gps-' + id);
    m.follow = true;
    if (!navigator.geolocation) { msg.textContent = 'Điện thoại không cho lấy vị trí.'; return; }
    msg.className = 'gps-msg'; msg.textContent = 'Đang tìm vị trí… (cho phép trình duyệt dùng vị trí nếu được hỏi)';
    if (watchId !== null) navigator.geolocation.clearWatch(watchId);
    watchLeg = id; var first = true;
    watchId = navigator.geolocation.watchPosition(function (pos) {
      var la = pos.coords.latitude, lo = pos.coords.longitude, acc = Math.round(pos.coords.accuracy || 0);
      if (!m.me) {
        m.me = L.circleMarker([la, lo], { radius: 8, color: '#fff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1 }).addTo(m.map);
        m.acc = L.circle([la, lo], { radius: acc, color: '#1a73e8', weight: 1, fillOpacity: .12 }).addTo(m.map);
      } else { m.me.setLatLng([la, lo]); m.acc.setLatLng([la, lo]).setRadius(acc); }
      var near = distToLine(la, lo, m.line), d = near.m, lim = Math.max(150, acc);
      if (first) {
        // Đúng đường: phóng gần. Lệch đường: khung nhìn chứa cả vị trí mình và điểm gần nhất trên đường kẻ
        if (d <= lim) m.map.setView([la, lo], 15);
        else m.map.fitBounds(L.latLngBounds([[la, lo], near.at]), { padding: [50, 50], maxZoom: 16 });
        first = false;
      }
      var dist = d >= 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(d / 10) * 10 + ' m';
      if (d <= lim) { msg.className = 'gps-msg ok'; msg.textContent = 'Vị trí đang gần tuyến của đoàn.'; }
      else { msg.className = 'gps-msg off'; msg.textContent = 'Cách tuyến vẽ khoảng ' + dist + '.'; }
      // Gần Vành đai 3 trên cao: GPS không phân biệt được đường trên cao và đường dưới
      var nearElev = (m.elev || []).some(function (seg) { return seg.length > 1 && distToLine(la, lo, seg).m < 400; });
      $('elev-' + id).hidden = !nearElev;
    }, function (err) {
      msg.className = 'gps-msg off';
      msg.textContent = err.code === 1 ? 'Chưa cho phép dùng vị trí. Bản đồ và nút Google Maps vẫn dùng được.' : 'Chưa lấy được vị trí, thử lại sau.';
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }

  var LEGS = [], EVENTS = {}, EV_CHIEU = {};
  function render(data, note) {
    EVENTS = {}; EV_CHIEU = {};
    (data.chang || []).forEach(function (st) { (st.suKien || []).forEach(function (ev) { if (ev.id) EVENTS[ev.id] = ev; }); });
    (((data.loTrinh || {}).luot) || []).forEach(function (l) { if (l.suKienDi && /^(di|ve)$/.test(l.chieu)) EV_CHIEU[l.suKienDi] = l.chieu; });
    PLACES = {};
    var dc = data.diaDiemChung || {};
    Object.keys(dc).forEach(function (k) { if (k.charAt(0) !== '_' && dc[k] && typeof dc[k] === 'object') PLACES[k] = dc[k]; });
    LEGS = (data.loTrinh && data.loTrinh.luot) || [];
    LEG_URLS = {};
    LEGS.forEach(function (l) { var u = legUrl(l); if (u) LEG_URLS[l.id] = u; });
    if (str(data.doiTen)) $('couple').textContent = data.doiTen;
    if (str(data.tieuDe)) { $('title').textContent = data.tieuDe; }
    if (str(data.ngayHienThi)) $('date').textContent = data.ngayHienThi;
    if (data.hanhTrinh && data.hanhTrinh.length) $('route').textContent = data.hanhTrinh.join(' → ');
    $('dayNote').textContent = str(data.ghiChuNgay);
    $('dayNote').hidden = !str(data.ghiChuNgay);

    var html = note ? '<p class="alert">' + esc(note) + '</p>' : '';
    html += '<section class="sched" aria-labelledby="sched-h"><h2 id="sched-h">Lịch cả buổi sáng</h2>' +
      '<p class="sched-hint">Chạm vào từng mốc để xem việc cần chuẩn bị.</p><ol class="rows">';
    (data.chang || []).forEach(function (st, i) {
      html += '<li class="stage-lbl">' + esc(st.ten) + '</li>';
      (st.suKien || []).forEach(function (ev) { html += renderEvent(ev); });
    });
    html += '</ol></section>';
    html += renderRoute(data.loTrinh);
    $('main').innerHTML = html;
    maps = {};
    setupMaps();
    $('routeLink').hidden = !(data.loTrinh && (data.loTrinh.luot || []).length);
    // Đầu trang: hai ô đi / về, mỗi ô một nút Google Maps
    var top = tripCards(LEGS);
    $('quick').innerHTML = top ? top +
      '<p class="gm-remind">Google Maps có thể đổi đường khi tắc — đi theo xe dẫn đoàn.</p>' +
      zaloHelp(LEGS.filter(function (l) { return LEG_URLS[l.id]; }), 'top') : '';
    $('quick').hidden = !top;
    document.title = (str(data.tieuDe) || 'Lịch trình ngày đón dâu') + ' · ' + (str(data.doiTen) || '');

    // Mở thẳng tới một mốc / một lượt khi link có #ev-… hoặc #lo-trinh-…
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) { openTarget(el); el.scrollIntoView(); } }
  }

  /* Mở mục (mốc lịch / lượt xe) nếu đang đóng */
  function openTarget(el) {
    if (el && el.tagName === 'DETAILS' && !el.open) el.open = true;
  }
  /* Chạm nút "Lộ trình xe" trong lịch: mở lượt tương ứng và cuộn tới */
  function jump(e) {
    var a = e.target.closest('a[data-target]');
    if (!a) return;
    var el = $(a.getAttribute('data-target'));
    if (!el) return;
    e.preventDefault();
    openTarget(el);
    el.scrollIntoView({ block: 'start' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    if (history.replaceState) history.replaceState(null, '', '#' + el.id);
  }
  $('quick').addEventListener('click', copyClick);
  // Sao chép link Google Maps HTTPS đầy đủ của đúng lượt
  function copyClick(e) {
    var b = e.target.closest('[data-copy]');
    if (!b) return;
    var url = LEG_URLS[b.getAttribute('data-copy')];
    var box = b.closest('.zh-body'), msg = box && box.querySelector('.share-msg');
    if (url && msg) copy(url, msg, 'Đã sao chép link Google Maps. Dán vào Ghi chú hoặc tin nhắn rồi chạm vào link.');
  }
  // Mở một lượt: vẽ bản đồ lúc này (khung đã hiện) để thấy trọn tuyến
  $('main').addEventListener('toggle', function (e) {
    var d = e.target;
    if (d.classList && d.classList.contains('leg') && d.open) ensureMap(d.getAttribute('data-luot')).catch(function () {});
  }, true);
  $('main').addEventListener('click', function (e) {
    jump(e);
    copyClick(e);
    var g = e.target.closest('[data-gps]'); if (g) startGps(g.getAttribute('data-gps'));
    var f = e.target.closest('[data-full]'); if (f) { var id = f.getAttribute('data-full'); setFull(id, true); if (watchLeg !== id) startGps(id); }
    var c = e.target.closest('.map-close'); if (c) setFull(c.parentNode.getAttribute('data-luot'), false);
    var b = e.target.closest('[data-share]');
    if (b) shareUrl(pageUrl() + b.getAttribute('data-share'), 'Lộ trình xe đón dâu Văn Hùng & Tuyết Anh — Chủ nhật 29/11/2026', $('routeMsg') || $('shareMsg'));
  });

  /* ---------- Tải dữ liệu (luôn lấy bản mới nhất; mất mạng thì dùng bản đã lưu) ---------- */
  function load() {
    fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
      .then(function (txt) {
        var data;
        try { data = JSON.parse(txt); } catch (e) { throw { syntax: true }; }
        store(KEY_DATA, txt);
        render(data);
      })
      .catch(function (err) {
        var cached = store(KEY_DATA);
        var why = err && err.syntax
          ? 'Tệp lịch trình vừa sửa đang sai định dạng (thường do thiếu dấu phẩy hoặc dấu ngoặc kép).'
          : 'Chưa tải được lịch mới (mạng yếu?).';
        if (cached) {
          try { render(JSON.parse(cached), why + ' Đang hiện bản đã xem lần trước trên máy này.'); return; } catch (e) { /* bỏ qua */ }
        }
        $('main').innerHTML = '<p class="alert">' + esc(why) + ' Hãy tải lại trang sau ít phút.</p>';
      });
  }

  /* ---------- Cập nhật lần cuối: thời điểm tệp lich-trinh.json được sửa (lịch sử GitHub) ---------- */
  function showUpdated(iso) {
    var d = new Date(iso);
    if (isNaN(d)) return;
    var opt = { timeZone: 'Asia/Ho_Chi_Minh' };
    var time, day;
    try {
      time = d.toLocaleTimeString('vi-VN', { timeZone: opt.timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
      day = d.toLocaleDateString('vi-VN', { timeZone: opt.timeZone, day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch (e) {
      var v = new Date(d.getTime() + 7 * 3600e3);
      var p = function (n) { return (n < 10 ? '0' : '') + n; };
      time = p(v.getUTCHours()) + ':' + p(v.getUTCMinutes());
      day = p(v.getUTCDate()) + '/' + p(v.getUTCMonth() + 1) + '/' + v.getUTCFullYear();
    }
    $('updated').innerHTML = 'Cập nhật lần cuối: <span class="num">' + esc(time) + ', ' + esc(day) + '</span>';
    $('updated').hidden = false;
  }
  function loadUpdated() {
    var cached = store(KEY_UPDATED);
    if (cached) showUpdated(cached);
    var api = 'https://api.github.com/repos/' + REPO + '/commits?per_page=1&sha=' + encodeURIComponent(BRANCH) + '&path=' + encodeURIComponent(FILE_PATH);
    fetch(api, { headers: { Accept: 'application/vnd.github+json' } })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (list) {
        var c = list && list[0] && list[0].commit;
        var iso = c && ((c.committer && c.committer.date) || (c.author && c.author.date));
        if (iso) { store(KEY_UPDATED, iso); showUpdated(iso); }
      })
      .catch(function () { /* không lấy được thì giữ bản đã lưu, hoặc ẩn dòng này */ });
  }

  /* ---------- Chia sẻ ---------- */
  function pageUrl() { return location.origin + location.pathname; }
  $('share').addEventListener('click', function () {
    shareUrl(pageUrl(), 'Lịch trình ngày đón dâu Văn Hùng & Tuyết Anh — Chủ nhật 29/11/2026', $('shareMsg'));
  });
  function shareUrl(url, text, msg) {
    var title = document.title;
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function (e) {
        if (!e || e.name !== 'AbortError') copy(url, msg);
      });
      return;
    }
    copy(url, msg);
  }
  function copy(url, msg, okText) {
    function fallback() {
      msg.innerHTML = 'Chạm giữ đường dẫn dưới đây để sao chép:<input class="copy-box" readonly value="' + esc(url) + '">';
      var box = msg.querySelector('input'); box.focus(); box.select();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        msg.textContent = okText || 'Đã sao chép đường dẫn. Mở Zalo và dán vào tin nhắn.';
      }, fallback);
    } else fallback();
  }

  load();
  loadUpdated();
})();
