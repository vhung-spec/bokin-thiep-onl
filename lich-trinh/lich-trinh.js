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
    $('main').innerHTML = html;
    $('quick').innerHTML = quick;
    $('quick').hidden = !quick;
    document.title = (str(data.tieuDe) || 'Lịch trình ngày đón dâu') + ' · ' + (str(data.doiTen) || '');

    // Mở thẳng tới một mốc khi link có #ev-…
    if (location.hash) { var el = document.getElementById(location.hash.slice(1)); if (el) el.scrollIntoView(); }
  }

  /* Chạm ô nhắc giờ: cuộn tới mốc và nháy viền */
  $('quick').addEventListener('click', function (e) {
    var a = e.target.closest('a[data-target]');
    if (!a) return;
    var el = $(a.getAttribute('data-target'));
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView({ block: 'start' });
    el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
    if (history.replaceState) history.replaceState(null, '', '#' + el.id);
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
    var url = pageUrl();
    var msg = $('shareMsg');
    var title = document.title;
    var text = 'Lịch trình ngày đón dâu Văn Hùng & Tuyết Anh — Chủ nhật 29/11/2026';
    if (navigator.share) {
      navigator.share({ title: title, text: text, url: url }).catch(function (e) {
        if (!e || e.name !== 'AbortError') copy(url, msg);
      });
      return;
    }
    copy(url, msg);
  });
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
