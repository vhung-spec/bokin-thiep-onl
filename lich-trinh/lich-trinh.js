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

  /* ---------- Số điện thoại, bản đồ: chỉ hiện nút khi dữ liệu dùng được ---------- */
  function telHref(raw) {
    var s = str(raw).replace(/[\s.\-()]/g, '');
    if (/^\+84\d{9,10}$/.test(s) || /^0\d{9,10}$/.test(s)) return 'tel:' + s;
    return '';
  }
  function mapHref(dd) {
    if (!dd || dd.daXacNhan !== true) return '';
    var m = str(dd.banDo);
    if (/^https:\/\//i.test(m)) return m;
    var a = str(dd.diaChi);
    if (a) return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent((str(dd.ten) ? str(dd.ten) + ', ' : '') + a);
    return '';
  }

  /* ---------- Một mốc ---------- */
  function renderEvent(ev) {
    var t = timeLabel(ev);
    var dd = ev.diaDiem || {};
    var html = '<li class="ev' + (ev.xeChay ? ' xe' : '') + '" id="ev-' + esc(ev.id || '') + '">';

    html += '<div class="time-row"><p class="time' + (t.rel ? ' rel' : '') + '">' + esc(t.text) + '</p>';
    if (ev.xeChay) html += '<span class="tag car">Giờ xe chạy</span>';
    if (str(ev.batDau) && str(ev.khiNao)) html += '<span class="tag wait">' + esc(ev.khiNao) + '</span>';
    html += '</div>';
    html += '<h3>' + esc(ev.viec) + '</h3>';
    if (!str(ev.batDau) && !str(ev.nhanGio)) html += '<p class="time-note">Giờ cụ thể: chờ gia đình cập nhật.</p>';
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
    if (more) html += '<details class="more"><summary>Xem chi tiết</summary><div class="more-body">' + more + '</div></details>';

    return html + '</li>';
  }

  /* ---------- Lộ trình cho lái xe ---------- */
  function viaPoint(v) { return typeof v === 'string' ? { ten: str(v), toaDo: '' } : { ten: str(v && v.ten), toaDo: str(v && v.toaDo) }; }
  function routeHref(l) {
    var dest = str(l.toaDoDen) || str(l.diemDen);
    if (!str(l.diemDen)) return '';
    var via = (l.quaDiem || []).map(viaPoint).map(function (v) { return v.toaDo || v.ten; }).filter(Boolean).slice(0, 3);
    // Không ghi điểm xuất phát: Google Maps dẫn đường từ vị trí hiện tại của điện thoại
    return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=' + encodeURIComponent(dest) +
      (via.length ? '&waypoints=' + via.map(encodeURIComponent).join('%7C') : '');
  }
  function renderRoute(r) {
    if (!r || !(r.luot || []).length) return '';
    var html = '<section class="route-sec" id="lo-trinh" aria-labelledby="lt-h"><h2 id="lt-h">' + ICON.car + 'Lộ trình xe</h2>';
    if (str(r.gioiThieu)) html += '<p class="route-intro">' + esc(r.gioiThieu) + '</p>';

    (r.luot || []).forEach(function (l) {
      html += '<article class="leg" id="' + esc(l.id || '') + '"><h3>' + esc(l.ten) + '</h3>';
      if (str(l.gio)) html += '<p class="leg-time">' + esc(l.gio) + '</p>';
      // Bản đồ cung đường cố định (vẽ sẵn, không đổi theo tình trạng tắc đường)
      html += '<div class="map-wrap" data-luot="' + esc(l.id) + '"><div class="map" id="map-' + esc(l.id) + '" role="img" aria-label="Bản đồ cung đường ' + esc(l.ten) + '"></div>' +
        '<button class="map-close" type="button" hidden>Đóng bản đồ lớn ✕</button></div>' +
        '<div class="acts map-acts"><button class="btn" type="button" data-gps="' + esc(l.id) + '">' + ICON.pin + 'Vị trí của tôi</button>' +
        '<button class="btn ghost" type="button" data-full="' + esc(l.id) + '">Phóng to bản đồ</button></div>' +
        '<p class="gps-msg" id="gps-' + esc(l.id) + '" role="status" aria-live="polite"></p>';
      var via = (l.quaDiem || []).map(viaPoint).filter(function (v) { return v.ten; });
      html += '<ol class="stops">';
      html += '<li><span class="lbl">Đi từ</span>' + esc(str(l.diemDi) || 'Vị trí hiện tại') + '</li>';
      via.forEach(function (v) { html += '<li class="via"><span class="lbl">Qua</span>' + esc(v.ten) + '</li>'; });
      html += '<li class="end"><span class="lbl">Đến</span>' + esc(str(l.tenDiemDen) || str(l.diemDen) || 'Chưa có địa chỉ') + '</li></ol>';
      var steps = (l.cacBuoc || []).map(str).filter(Boolean);
      if (steps.length) html += '<ol class="steps">' + steps.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol>';
      var href = routeHref(l);
      if (href) html += '<div class="acts"><a class="btn ghost" href="' + esc(href) + '" target="_blank" rel="noopener">' + ICON.map + 'Dẫn đường bằng Google Maps</a></div>' +
        '<p class="leg-note">Google Maps buộc đi qua đúng các điểm trên nhưng vẫn có thể gợi ý đường khác khi tắc: khi đó đi theo đường kẻ trên bản đồ này và xe dẫn đoàn.</p>';
      else if (str(l.khiThieuDiemDen)) html += '<p class="leg-note warn">' + esc(l.khiThieuDiemDen) + '</p>';
      html += '<p class="leg-note"><a href="' + esc(l.id) + '.gpx" download>Tải file lộ trình (GPX)</a> cho ứng dụng dẫn đường theo file như OsmAnd, Vietmap.</p>';
      html += '</article>';
    });

    // Đi theo đoàn
    var lead = r.xeDanDoan || {}, box = '';
    if (str(lead.taiXe) || str(lead.bienSo)) box += '<p><b>Xe dẫn đoàn:</b> ' + esc([str(lead.taiXe), str(lead.bienSo)].filter(Boolean).join(' · ')) + '</p>';
    var cars = (r.danhSachXe || []).map(str).filter(Boolean);
    if (cars.length) box += '<p><b>Các xe trong đoàn:</b></p><ul>' + cars.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    var waits = (r.diemChoNhau || []).map(str).filter(Boolean);
    if (waits.length) box += '<p><b>Điểm chờ nhau:</b></p><ul>' + waits.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    var rules = (r.quyTac || []).map(str).filter(Boolean);
    if (rules.length) box += '<ul class="rules">' + rules.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    var acts = '', tel = telHref(lead.soDienThoai);
    if (tel) acts += '<a class="btn" href="' + esc(tel) + '">' + ICON.phone + 'Gọi xe dẫn đoàn</a>';
    if (/^https:\/\/zalo\.me\//i.test(str(r.nhomZalo))) acts += '<a class="btn ghost" href="' + esc(r.nhomZalo) + '" target="_blank" rel="noopener">' + ICON.zalo + 'Nhóm Zalo đoàn xe</a>';
    if (acts) box += '<div class="acts">' + acts + '</div>';
    if (box) html += '<div class="convoy"><h3>Đi theo đoàn</h3>' + box + '</div>';

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
  function setupMaps() {
    var wraps = document.querySelectorAll('.map-wrap');
    if (!wraps.length) return;
    loadLeaflet(function () {
      var got = geo ? Promise.resolve(geo) : fetch(GEO_URL + '?t=' + Date.now(), { cache: 'no-store' }).then(function (r) { return r.json(); });
      got.then(function (g) {
        geo = g;
        wraps.forEach(function (w) { drawMap(w.getAttribute('data-luot')); });
      }).catch(function () {
        wraps.forEach(function (w) { w.querySelector('.map').innerHTML = '<p class="map-err">Chưa tải được đường kẻ lộ trình. Vẫn đi theo các bước bên dưới.</p>'; });
      });
    });
  }
  function drawMap(id) {
    var el = $('map-' + id);
    if (!el || !geo) return;
    var line = null, pts = [];
    geo.features.forEach(function (f) {
      if (f.properties.luot !== id) return;
      if (f.geometry.type === 'LineString') line = f;
      else pts.push(f);
    });
    if (!line) return;
    var latlngs = line.geometry.coordinates.map(function (c) { return [c[1], c[0]]; });
    var map = L.map(el, { dragging: false, touchZoom: false, scrollWheelZoom: false, doubleClickZoom: false, boxZoom: false, keyboard: false, tap: false, zoomControl: false, attributionControl: true });
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
    maps[id] = { map: map, line: latlngs, bounds: bounds, me: null, acc: null };
    // chú thích điểm mốc ngay dưới bản đồ (đọc được không cần chạm)
    var legend = document.createElement('ol'); legend.className = 'marks';
    legend.innerHTML = pts.map(function (f) { return '<li><b>' + f.properties.stt + '</b> ' + esc(f.properties.ten) + '</li>'; }).join('');
    el.parentNode.appendChild(legend);
  }
  function setFull(id, on) {
    var m = maps[id]; if (!m) return;
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
    var m = maps[id], msg = $('gps-' + id);
    if (!m) return;
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
      if (d <= lim) { msg.className = 'gps-msg ok'; msg.textContent = '✓ Đang đi đúng cung đường của đoàn.'; }
      else {
        msg.className = 'gps-msg off';
        msg.textContent = 'Đang cách cung đường khoảng ' + (d >= 1000 ? (d / 1000).toFixed(1).replace('.', ',') + ' km' : Math.round(d / 10) * 10 + ' m') + '. Quay về đường kẻ xanh mực trên bản đồ.';
      }
    }, function (err) {
      msg.className = 'gps-msg off';
      msg.textContent = err.code === 1 ? 'Chưa được phép dùng vị trí. Vào cài đặt trình duyệt / Zalo, cho phép Vị trí rồi bấm lại.' : 'Chưa lấy được vị trí, thử lại sau vài giây.';
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 });
  }

  function render(data, note) {
    if (str(data.doiTen)) $('couple').textContent = data.doiTen;
    if (str(data.tieuDe)) { $('title').textContent = data.tieuDe; }
    if (str(data.ngayHienThi)) $('date').textContent = data.ngayHienThi;
    if (data.hanhTrinh && data.hanhTrinh.length) $('route').textContent = data.hanhTrinh.join(' → ');
    $('dayNote').textContent = str(data.ghiChuNgay);
    $('dayNote').hidden = !str(data.ghiChuNgay);

    var quick = '', html = note ? '<p class="alert">' + esc(note) + '</p>' : '';
    (data.chang || []).forEach(function (st, i) {
      html += '<section class="stage" aria-labelledby="st-' + i + '"><h2 id="st-' + i + '"><span class="k">Chặng ' + (i + 1) + '</span>' + esc(st.ten) + '</h2><ol class="tl">';
      (st.suKien || []).forEach(function (ev) {
        html += renderEvent(ev);
        if (str(ev.nhacNhanh)) {
          quick += '<a href="#ev-' + esc(ev.id) + '" data-target="ev-' + esc(ev.id) + '"><span class="t">' + esc(timeLabel(ev).text) + '</span><span class="l">' + esc(ev.nhacNhanh) + '</span></a>';
        }
      });
      html += '</ol></section>';
    });
    html += renderRoute(data.loTrinh);
    $('main').innerHTML = html;
    maps = {};
    setupMaps();
    $('routeLink').hidden = !(data.loTrinh && (data.loTrinh.luot || []).length);
    $('quick').innerHTML = quick;
    $('quick').hidden = !quick;
    document.title = (str(data.tieuDe) || 'Lịch trình ngày đón dâu') + ' · ' + (str(data.doiTen) || '');

    // Mở thẳng tới một mốc khi link có #ev-…
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
  }

  /* Chạm ô nhắc giờ: cuộn tới mốc và nháy viền */
  function jump(e) {
    var a = e.target.closest('a[data-target]');
    if (!a) return;
    var el = $(a.getAttribute('data-target'));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ block: 'start' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    if (history.replaceState) history.replaceState(null, '', '#' + el.id);
  }
  $('quick').addEventListener('click', jump);
  $('main').addEventListener('click', function (e) {
    jump(e);
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
  function copy(url, msg) {
    function fallback() {
      msg.innerHTML = 'Chạm giữ đường dẫn dưới đây để sao chép:<input class="copy-box" readonly value="' + esc(url) + '">';
      var box = msg.querySelector('input'); box.focus(); box.select();
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(url).then(function () {
        msg.textContent = 'Đã sao chép đường dẫn. Mở Zalo và dán vào tin nhắn.';
      }, fallback);
    } else fallback();
  }

  load();
  loadUpdated();
})();
