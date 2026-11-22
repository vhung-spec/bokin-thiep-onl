/*
 * Trang thống kê khách mời (thong-ke.html)
 * Lấy danh sách xác nhận tham dự từ Google Apps Script (cần mật khẩu MAT_KHAU đặt trong Apps Script),
 * ghép với danh sách khách ở trang tạo link (lưu trên máy này) để biết ai chưa phản hồi.
 */
(function () {
  'use strict';
  var W = window.WEDDING;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function norm(s) { return String(s || '').replace(/\s+/g, ' ').trim().toLowerCase(); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  var couple = W.groom.name + ' & ' + W.bride.name;
  var SIDE = { trai: 'Nhà trai', gai: 'Nhà gái' };
  var KEY_PASS = 'thong-ke:' + couple + ':key';
  var INVITES = 'tao-link:' + couple + ':' + W.date; // danh sách khách của trang tạo link
  $('#couple').textContent = couple;
  document.title = 'Thống kê khách mời · ' + couple;

  var toastT = null;
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function getStore(k) { try { return localStorage.getItem(k) || sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function setStore(k, v, persist) {
    try { localStorage.removeItem(k); sessionStorage.removeItem(k); if (v) (persist ? localStorage : sessionStorage).setItem(k, v); } catch (e) { /* bỏ qua */ }
  }
  function invites() {
    try { var d = JSON.parse(localStorage.getItem(INVITES) || 'null'); return d && Array.isArray(d.guests) ? d.guests : null; } catch (e) { return null; }
  }

  /* ---------- Lấy dữ liệu ---------- */
  var rows = [], sheetUrl = '', demo = false, tab = 'yes';
  function fetchStats(key) {
    var body = new URLSearchParams({ type: 'stats', key: key });
    return fetch(W.endpoint, { method: 'POST', body: body, redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
      .then(function (j) {
        if (j && j.ok === true && Array.isArray(j.rows)) return j;
        var err = new Error((j && j.error) || 'old-version');
        throw err;
      });
  }
  var MSG = {
    'no-password': 'Apps Script chưa có mật khẩu. Vào Cài đặt dự án → Thuộc tính tập lệnh, thêm MAT_KHAU = mật khẩu bạn muốn, rồi thử lại.',
    'wrong-password': 'Sai mật khẩu.',
    'old-version': 'Apps Script đang chạy bản cũ. Dán lại file Code.gs mới, rồi Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới.',
    'http': 'Không kết nối được Google Sheets. Kiểm tra mạng và link endpoint trong config.js.',
  };
  function load(key, quiet) {
    var msg = $('#loginMsg'), btn = $('#loginBtn');
    msg.className = 'hint'; msg.textContent = 'Đang tải…'; btn.disabled = true;
    return fetchStats(key).then(function (j) {
      rows = j.rows; sheetUrl = j.sheet || ''; demo = false;
      msg.textContent = '';
      show();
      if (!quiet) toast('Đã tải ' + rows.length + ' phản hồi.');
      return true;
    }).catch(function (e) {
      msg.className = 'hint bad';
      msg.textContent = MSG[e && e.message] || (e && e.name === 'TypeError' ? MSG.http : 'Chưa tải được: ' + ((e && e.message) || 'lỗi không rõ'));
      if (e && e.message === 'wrong-password') setStore(KEY_PASS, '');
      return false;
    }).then(function (r) { btn.disabled = false; return r; });
  }

  /* ---------- Gộp phản hồi với danh sách khách đã mời ---------- */
  function merged() {
    var list = rows.map(function (r) {
      return { name: r.name, via: r.invitedAs, side: r.side, status: r.attending ? 'yes' : 'no', guests: r.attending ? Math.max(1, r.guests || 1) : 0, time: r.time };
    });
    var inv = invites();
    if (inv) {
      inv.forEach(function (g) {
        var k = norm(g.name);
        var answered = rows.some(function (r) { return norm(r.invitedAs) === k || norm(r.name) === k; });
        if (!answered) list.push({ name: g.name, via: '', side: g.side || '', status: 'wait', guests: 0, time: '', sent: !!g.sent });
      });
    }
    return { list: list, hasInvites: !!inv };
  }

  function fmtTime(t) {
    var m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(t || '');
    return m ? m[3] + '/' + m[2] + ' ' + m[4] + ':' + m[5] : '';
  }

  function show() {
    $('#loginCard').hidden = true;
    $('#summaryCard').hidden = false;
    $('#listCard').hidden = false;
    $('#demoChip').hidden = !demo;
    var m = merged(), list = m.list;
    var yes = list.filter(function (x) { return x.status === 'yes'; });
    var no = list.filter(function (x) { return x.status === 'no'; });
    var wait = list.filter(function (x) { return x.status === 'wait'; });
    var people = yes.reduce(function (a, x) { return a + x.guests; }, 0);
    $('#tPeople').textContent = people;
    $('#tPeopleSub').textContent = 'từ ' + yes.length + ' phản hồi';
    $('#tNo').textContent = no.length;
    $('#tResp').textContent = yes.length + no.length;
    $('#tWait').textContent = m.hasInvites ? wait.length : '—';
    $('#waitHint').textContent = m.hasInvites ? '' :
      '“Chưa phản hồi” lấy từ danh sách ở trang Tạo link mời trên máy bạn dùng để gửi. Mở trang này trên máy đó (hoặc nhập file CSV danh sách khách ở trang Tạo link) để xem.';
    // theo bên
    var by = { trai: 0, gai: 0, '': 0 };
    yes.forEach(function (x) { by[x.side || ''] += x.guests; });
    var max = Math.max(1, by.trai, by.gai, by['']);
    $('#bars').innerHTML = [['trai', 'Nhà trai'], ['gai', 'Nhà gái'], ['', 'Chưa ghi bên']].filter(function (s) { return s[0] || by[''] > 0; }).map(function (s) {
      return '<div class="bar"><span class="bar-l">' + s[1] + '</span><span class="bar-t"><i style="width:' + Math.round(by[s[0]] / max * 100) + '%"></i></span><b>' + by[s[0]] + ' người</b></div>';
    }).join('');
    var now = new Date();
    $('#updated').textContent = demo ? 'Đây là dữ liệu mẫu để xem giao diện.' : 'Cập nhật lúc ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ', ' + pad(now.getDate()) + '/' + pad(now.getMonth() + 1);
    var os = $('#openSheet'); os.hidden = !sheetUrl; if (sheetUrl) os.href = sheetUrl;
    // nhãn số lượng trên các tab
    var counts = { yes: yes.length, no: no.length, wait: m.hasInvites ? wait.length : null, all: list.length };
    $$('#tabs button').forEach(function (b) {
      var t = b.getAttribute('data-tab');
      b.textContent = { yes: 'Tham dự', no: 'Không tham dự', wait: 'Chưa phản hồi', all: 'Tất cả' }[t] + (counts[t] == null ? '' : ' (' + counts[t] + ')');
      b.hidden = t === 'wait' && !m.hasInvites;
      b.setAttribute('aria-selected', String(t === tab));
    });
    renderList(list);
  }

  function renderList(list) {
    list = list || merged().list;
    var q = norm($('#search').value);
    var shown = list.filter(function (x) {
      if (tab !== 'all' && x.status !== tab) return false;
      return !q || norm(x.name).indexOf(q) >= 0 || norm(x.via).indexOf(q) >= 0;
    });
    // tham dự: đông người trước; còn lại theo tên
    shown.sort(function (a, b) { return (b.guests - a.guests) || a.name.localeCompare(b.name, 'vi'); });
    $('#list').innerHTML = shown.map(function (x) {
      var st = x.status === 'yes' ? '<span class="chip yes">Tham dự · ' + x.guests + ' người</span>'
        : x.status === 'no' ? '<span class="chip no">Không tham dự</span>'
          : '<span class="chip wait">' + (x.sent ? 'Đã gửi link, chưa trả lời' : 'Chưa gửi link') + '</span>';
      return '<li class="g"><div class="g-top"><span class="g-name">' + esc(x.name) + '</span>' +
        (x.side ? '<span class="chip ' + x.side + '">' + SIDE[x.side] + '</span>' : '') + st + '</div>' +
        ((x.via && norm(x.via) !== norm(x.name)) || x.time ? '<p class="g-sub">' +
          (x.via && norm(x.via) !== norm(x.name) ? 'Link mời: ' + esc(x.via) : '') +
          (x.via && norm(x.via) !== norm(x.name) && x.time ? ' · ' : '') + (x.time ? 'Trả lời ' + fmtTime(x.time) : '') + '</p>' : '') +
        '</li>';
    }).join('');
    var empty = $('#empty');
    empty.hidden = shown.length > 0;
    empty.textContent = q ? 'Không tìm thấy khách nào.' : tab === 'yes' ? 'Chưa có ai xác nhận tham dự.' : tab === 'no' ? 'Chưa có ai báo vắng.' : tab === 'wait' ? 'Mọi khách đã phản hồi.' : 'Chưa có dữ liệu.';
  }

  $('#tabs').addEventListener('click', function (e) {
    var b = e.target.closest('button[data-tab]');
    if (!b) return;
    tab = b.getAttribute('data-tab');
    $$('#tabs button').forEach(function (x) { x.setAttribute('aria-selected', String(x === b)); });
    renderList();
  });
  $('#search').addEventListener('input', function () { renderList(); });

  /* ---------- Tải file thống kê (CSV, mở bằng Excel / Google Sheets) ---------- */
  function cell(v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  $('#exportCsv').addEventListener('click', function () {
    var list = merged().list;
    if (!list.length) { toast('Chưa có dữ liệu.'); return; }
    var lab = { yes: 'Tham dự', no: 'Không tham dự', wait: 'Chưa phản hồi' };
    var out = [['STT', 'Tên', 'Link mời', 'Khách của', 'Trạng thái', 'Số người', 'Thời gian trả lời']].concat(list.map(function (x, i) {
      return [i + 1, x.name, x.via, x.side ? SIDE[x.side] : '', lab[x.status], x.guests || '', x.time ? x.time.replace('T', ' ') : ''];
    }));
    var yes = list.filter(function (x) { return x.status === 'yes'; });
    out.push([], ['', 'Tổng số người tham dự', '', '', '', yes.reduce(function (a, x) { return a + x.guests; }, 0)]);
    var csv = '﻿' + out.map(function (r) { return r.map(cell).join(','); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'thong-ke-khach-moi.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });

  /* ---------- Đăng nhập / tải lại / thoát ---------- */
  $('#loginForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var key = $('#pass').value;
    load(key).then(function (okk) { if (okk) setStore(KEY_PASS, key, $('#remember').checked); });
  });
  $('#reload').addEventListener('click', function () {
    if (demo) { show(); return; }
    var key = getStore(KEY_PASS) || $('#pass').value;
    load(key).then(function (okk) { if (!okk) { $('#loginCard').hidden = false; } });
  });
  $('#logout').addEventListener('click', function () {
    setStore(KEY_PASS, ''); rows = []; demo = false; $('#pass').value = '';
    $('#summaryCard').hidden = true; $('#listCard').hidden = true; $('#loginCard').hidden = false;
  });
  $('#demoBtn').addEventListener('click', function () {
    demo = true; sheetUrl = '';
    var d = new Date(), iso = function (h) { var x = new Date(d.getTime() - h * 36e5); return x.getFullYear() + '-' + pad(x.getMonth() + 1) + '-' + pad(x.getDate()) + 'T' + pad(x.getHours()) + ':' + pad(x.getMinutes()); };
    rows = [
      { name: 'Anh Thắng', invitedAs: 'Anh Thắng và người thương', side: 'trai', attending: true, guests: 2, time: iso(30) },
      { name: 'Cô Lan', invitedAs: 'Cô Lan', side: 'gai', attending: true, guests: 3, time: iso(20) },
      { name: 'Minh Anh', invitedAs: 'Minh Anh', side: 'gai', attending: false, guests: 0, time: iso(9) },
      { name: 'Chú Bình', invitedAs: '', side: '', attending: true, guests: 1, time: iso(2) },
    ];
    show();
  });

  /* ---------- Bắt đầu ---------- */
  if (!W.endpoint) {
    $('#loginForm').hidden = true;
    $('#noEndpoint').hidden = false;
  } else {
    var saved = getStore(KEY_PASS);
    if (saved) {
      $('#pass').value = saved;
      try { $('#remember').checked = !!localStorage.getItem(KEY_PASS); } catch (e) { /* bỏ qua */ }
      load(saved, true);
    }
  }
})();
