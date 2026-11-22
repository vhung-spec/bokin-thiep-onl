/*
 * Trang tạo link mời riêng (tao-link.html)
 * - Nhập tên khách (một hoặc nhiều), ghi khách nhà trai / nhà gái
 * - Chọn nhạc nền (YouTube hoặc mp3) gắn vào link
 * - Gửi lời mời kèm link riêng qua Zalo, Messenger, tin nhắn… (nút Chia sẻ của điện thoại)
 * Danh sách chỉ lưu trong trình duyệt của máy này (localStorage); tải CSV để lưu dự phòng.
 */
(function () {
  'use strict';
  var W = window.WEDDING, N = window.NHAC;
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var couple = W.groom.name + ' & ' + W.bride.name;
  var dm = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(W.date);
  var WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var weekday = WD[new Date(Date.UTC(+dm[1], dm[2] - 1, +dm[3])).getUTCDay()];
  var when = pad(+(dm[4] || 0)) + ':' + pad(+(dm[5] || 0)) + ', ' + weekday + ' ' + pad(+dm[3]) + '.' + pad(+dm[2]) + '.' + dm[1];
  var SIDE = { trai: 'Nhà trai', gai: 'Nhà gái' };
  var DEFAULT_TPL = 'Thân gửi {ten} 💌\n\n' + couple + ' trân trọng kính mời bạn tới dự lễ thành hôn của chúng mình vào lúc ' + when +
    ' tại ' + W.venue.name + '.\n\nThiệp mời dành riêng cho bạn: {link}\n\nSự hiện diện của bạn là niềm vui của chúng mình!';

  /* ---------- Lưu trên máy ---------- */
  var KEY = 'tao-link:' + couple + ':' + W.date;
  var S = load();
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    d = d || {};
    return { guests: Array.isArray(d.guests) ? d.guests : [], music: d.music || '', start: d.start || '', tpl: d.tpl || DEFAULT_TPL, base: d.base || '' };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* trình duyệt chặn lưu: vẫn dùng được trong phiên này */ } }

  /* ---------- Thông báo nhỏ ---------- */
  var toastT = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }
  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (ok, fail) {
      var t = document.createElement('textarea');
      t.value = text; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
      document.body.appendChild(t); t.select();
      var done = false; try { done = document.execCommand('copy'); } catch (e) { done = false; }
      t.remove(); if (done) ok(); else fail();
    });
  }

  /* ---------- Link thiệp ---------- */
  // link mời: shareUrl trong config.js; để trống thì lấy trang gốc của trang web đang mở
  // (trang này nằm trong xanh-pastel/, trang gốc tự chuyển thẳng vào thiệp nên link ngắn gọn hơn)
  var autoBase = (function () {
    try { return new URL(W.shareUrl).href; } catch (e) { /* để trống */ }
    return new URL(/\/xanh-pastel\//.test(location.pathname) ? '../' : './', location.href).href;
  })();
  function base() {
    var b = (S.base || autoBase).trim();
    try { b = new URL(b).href; } catch (e) { b = autoBase; }
    return b.split('#')[0].split('?')[0];
  }
  var defaultMusic = N.toParam(N.parse(W.music)); // nhạc trong config.js: link nào dùng đúng nhạc này thì không cần gắn
  function musicSpec(raw, start) {
    var sp = N.parse(raw);
    if (sp && sp.type === 'yt' && start !== '' && start != null && !isNaN(+start)) sp.start = Math.max(0, Math.floor(+start));
    return sp;
  }
  function chosenMusic() { return musicSpec(S.music, S.start); }
  function linkFor(g) {
    var p = new URLSearchParams();
    p.set('to', g.name);
    if (g.side) p.set('ben', g.side);
    var sp = g.music ? N.parse(g.music) : chosenMusic();
    var m = sp ? N.toParam(sp) : '';
    if (m && m !== defaultMusic) p.set('nhac', m);
    return base() + '?' + p.toString();
  }
  function message(g) {
    return (S.tpl || DEFAULT_TPL).split('{ten}').join(g.name).split('{link}').join(linkFor(g));
  }
  function prettyLink(u) { try { return decodeURI(u).replace(/^https?:\/\//, ''); } catch (e) { return u; } }

  /* ---------- 1. Nhạc nền ---------- */
  var musicInput = $('#musicInput'), musicStart = $('#musicStart'), musicInfo = $('#musicInfo'), preview = $('#musicPreview');
  musicInput.value = S.music;
  musicStart.value = S.start;
  function showMusicInfo() {
    var raw = musicInput.value.trim();
    var sp = musicSpec(raw, musicStart.value);
    musicStart.closest('.row').hidden = !(sp && sp.type === 'yt');
    musicInfo.className = 'hint';
    if (!raw) {
      musicInfo.textContent = W.music ? 'Đang dùng nhạc mặc định trong config.js: ' + N.describe(N.parse(W.music)) : 'Chưa chọn nhạc: thiệp sẽ không phát nhạc.';
      return;
    }
    if (!sp) {
      musicInfo.className = 'hint bad';
      musicInfo.textContent = 'Link chưa đúng. Dán link YouTube (youtube.com/watch?v=… hoặc youtu.be/…) hoặc link file .mp3.';
      return;
    }
    musicInfo.className = 'hint ok';
    musicInfo.textContent = '✓ ' + N.describe(sp) + ' — sẽ gắn vào mọi link mời.';
  }
  function onMusicChange() {
    var sp = musicSpec(musicInput.value, musicStart.value);
    // tự lấy giây bắt đầu từ link YouTube có ?t=
    if (sp && sp.type === 'yt' && sp.start && !musicStart.value) musicStart.value = sp.start;
    S.music = musicInput.value.trim();
    S.start = musicStart.value;
    save(); showMusicInfo(); renderList();
    preview.innerHTML = '';
  }
  musicInput.addEventListener('change', onMusicChange);
  musicInput.addEventListener('input', showMusicInfo);
  musicStart.addEventListener('change', onMusicChange);
  $('#musicNone').addEventListener('click', function () {
    musicInput.value = 'tat'; musicStart.value = ''; onMusicChange();
    toast('Các link mời sẽ không phát nhạc.');
  });
  $('#musicTest').addEventListener('click', function () {
    var sp = musicSpec(musicInput.value || W.music, musicStart.value);
    if (!sp || sp.type === 'off') { preview.innerHTML = ''; toast('Chưa có nhạc để nghe thử.'); return; }
    if (sp.type === 'yt') {
      preview.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + sp.id + '?autoplay=1&start=' + (sp.start || 0) +
        '&rel=0&playsinline=1" title="Nghe thử nhạc" allow="autoplay; encrypted-media" allowfullscreen></iframe>' +
        '<p class="hint">Nếu khung báo “Video không khả dụng”, video này không cho phát trên trang khác: hãy chọn video khác.</p>';
    } else {
      var src = /^https?:/i.test(sp.src) ? sp.src : new URL(sp.src, location.href).href; // file nhạc nằm cạnh trang này
      preview.innerHTML = '<audio controls autoplay src="' + esc(src) + '"></audio>';
      $('audio', preview).addEventListener('error', function () { musicInfo.className = 'hint bad'; musicInfo.textContent = 'Không mở được file nhạc này. Kiểm tra lại đường dẫn.'; });
    }
  });
  showMusicInfo();

  /* ---------- 2. Lời nhắn ---------- */
  var tpl = $('#tpl');
  tpl.value = S.tpl;
  tpl.addEventListener('input', function () { S.tpl = tpl.value; save(); });
  $('#tplReset').addEventListener('click', function () { tpl.value = S.tpl = DEFAULT_TPL; save(); toast('Đã dùng lại lời nhắn mẫu.'); });

  /* ---------- 3. Khách mời ---------- */
  var list = $('#guestList'), editing = null, openMore = null;
  function addGuest(name, side) {
    name = String(name || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    if (!name) return false;
    var dup = S.guests.some(function (g) { return g.name.toLowerCase() === name.toLowerCase() && (g.side || '') === (side || ''); });
    if (dup) return false;
    S.guests.unshift({ id: uid(), name: name, side: side || '', music: '', sent: false });
    return true;
  }
  $('#addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('#gName');
    if (addGuest(n.value, $('#gSide').value)) { save(); renderList(); toast('Đã thêm “' + n.value.trim() + '”.'); n.value = ''; }
    else toast(n.value.trim() ? 'Khách này đã có trong danh sách.' : 'Nhập tên khách trước nhé.');
    n.focus();
  });
  $('#bulkAdd').addEventListener('click', function () {
    var lines = $('#bulk').value.split(/\r?\n/), side = $('#bulkSide').value, added = 0;
    lines.reverse().forEach(function (l) { if (addGuest(l, side)) added++; });
    save(); renderList();
    $('#bulk').value = '';
    toast(added ? 'Đã thêm ' + added + ' khách.' : 'Không có tên mới để thêm.');
  });
  $('#search').addEventListener('input', renderList);
  $('#filter').addEventListener('change', renderList);

  function find(id) { for (var i = 0; i < S.guests.length; i++) if (S.guests[i].id === id) return S.guests[i]; return null; }

  function renderList() {
    var q = $('#search').value.trim().toLowerCase(), f = $('#filter').value;
    var shown = S.guests.filter(function (g) {
      if (q && g.name.toLowerCase().indexOf(q) < 0) return false;
      if (f === 'chua') return !g.sent;
      if (f === 'roi') return g.sent;
      if (f === 'trai' || f === 'gai') return g.side === f;
      return true;
    });
    list.innerHTML = shown.map(function (g) {
      var url = linkFor(g);
      if (editing === g.id) {
        return '<li class="g" data-id="' + g.id + '"><div class="g-edit">' +
          '<input class="inp" data-f="name" maxlength="80" value="' + esc(g.name) + '" aria-label="Tên khách">' +
          '<div class="row"><select class="inp" data-f="side" aria-label="Khách của bên nào">' +
          ['', 'trai', 'gai'].map(function (v) { return '<option value="' + v + '"' + (g.side === v ? ' selected' : '') + '>' + (v ? 'Khách ' + SIDE[v].toLowerCase() : 'Không ghi bên') + '</option>'; }).join('') +
          '</select></div>' +
          '<input class="inp" data-f="music" value="' + esc(g.music || '') + '" placeholder="Nhạc riêng cho khách này (để trống = nhạc chung)" aria-label="Nhạc riêng">' +
          '<div class="btns"><button class="btn" data-act="save">Lưu</button><button class="btn ghost" data-act="cancel">Huỷ</button></div>' +
          '</div></li>';
      }
      return '<li class="g' + (g.sent ? ' sent' : '') + '" data-id="' + g.id + '">' +
        '<div class="g-top"><span class="g-name">' + esc(g.name) + '</span>' +
        (g.side ? '<span class="chip ' + g.side + '">' + SIDE[g.side] + '</span>' : '') +
        (g.music ? '<span class="chip music">Nhạc riêng</span>' : '') +
        (g.sent ? '<span class="chip done">Đã gửi</span>' : '') + '</div>' +
        '<a class="g-link" href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(prettyLink(url)) + '</a>' +
        '<div class="g-actions">' +
        '<button class="btn share" data-act="share">Gửi lời mời</button>' +
        '<button class="btn ghost" data-act="copy-msg">Chép lời mời</button>' +
        '<button class="btn ghost" data-act="copy-link">Chép link</button>' +
        '<button class="btn ghost more" data-act="more" aria-label="Thêm thao tác cho ' + esc(g.name) + '" aria-expanded="' + (openMore === g.id) + '">⋯</button>' +
        '</div>' +
        '<div class="g-more"' + (openMore === g.id ? '' : ' hidden') + '>' +
        '<a class="btn ghost" href="' + esc(url) + '" target="_blank" rel="noopener">Xem thử thiệp</a>' +
        '<a class="btn ghost" href="sms:?&body=' + encodeURIComponent(message(g)) + '">Gửi tin nhắn SMS</a>' +
        '<button class="btn ghost" data-act="toggle-sent">' + (g.sent ? 'Đánh dấu chưa gửi' : 'Đánh dấu đã gửi') + '</button>' +
        '<button class="btn ghost" data-act="edit">Sửa</button>' +
        '<button class="btn ghost del" data-act="delete">Xoá</button>' +
        '</div></li>';
    }).join('');
    $('#empty').hidden = S.guests.length > 0;
    var sent = S.guests.filter(function (g) { return g.sent; }).length;
    var nt = S.guests.filter(function (g) { return g.side === 'trai'; }).length;
    var ng = S.guests.filter(function (g) { return g.side === 'gai'; }).length;
    $('#stats').textContent = S.guests.length ? S.guests.length + ' khách · ' + sent + ' đã gửi · ' + nt + ' nhà trai · ' + ng + ' nhà gái' +
      (shown.length !== S.guests.length ? ' · đang hiện ' + shown.length : '') : '';
    if (editing) { var inp = $('.g-edit input', list); if (inp) inp.focus(); }
    $('#openCard').href = linkFor({ name: 'Khách quý', side: '' });
  }

  function share(g) {
    var text = message(g);
    if (navigator.share) {
      navigator.share({ title: 'Thiệp cưới ' + couple, text: text }).then(function () {
        g.sent = true; save(); renderList(); toast('Đã gửi lời mời cho ' + g.name + '.');
      }).catch(function (err) {
        if (err && err.name === 'AbortError') return; // khách bấm huỷ
        copy(text).then(function () { toast('Đã chép lời mời. Dán vào Zalo hoặc Messenger để gửi.'); });
      });
    } else {
      copy(text).then(function () { toast('Đã chép lời mời. Dán vào Zalo hoặc Messenger để gửi.'); })
        .catch(function () { window.prompt('Chép lời mời này:', text); });
    }
  }

  list.addEventListener('click', function (e) {
    var b = e.target.closest('[data-act]');
    if (!b) return;
    var li = b.closest('.g'), g = find(li.getAttribute('data-id'));
    if (!g) return;
    var act = b.getAttribute('data-act');
    if (act === 'share') share(g);
    else if (act === 'copy-msg') copy(message(g)).then(function () { toast('Đã chép lời mời cho ' + g.name + '.'); }, function () { window.prompt('Chép lời mời này:', message(g)); });
    else if (act === 'copy-link') copy(linkFor(g)).then(function () { toast('Đã chép link của ' + g.name + '.'); }, function () { window.prompt('Chép link này:', linkFor(g)); });
    else if (act === 'more') { openMore = openMore === g.id ? null : g.id; renderList(); }
    else if (act === 'toggle-sent') { g.sent = !g.sent; save(); renderList(); }
    else if (act === 'edit') { editing = g.id; renderList(); }
    else if (act === 'cancel') { editing = null; renderList(); }
    else if (act === 'save') {
      var name = $('[data-f="name"]', li).value.replace(/\s+/g, ' ').trim().slice(0, 80);
      var mus = $('[data-f="music"]', li).value.trim();
      if (!name) { toast('Tên khách không được để trống.'); return; }
      if (mus && !N.parse(mus)) { toast('Link nhạc riêng chưa đúng.'); return; }
      g.name = name; g.side = $('[data-f="side"]', li).value; g.music = mus;
      editing = null; save(); renderList(); toast('Đã lưu.');
    } else if (act === 'delete') {
      if (!window.confirm('Xoá “' + g.name + '” khỏi danh sách?')) return;
      S.guests = S.guests.filter(function (x) { return x !== g; });
      openMore = null; save(); renderList();
    }
  });
  list.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.matches('.g-edit input')) { e.preventDefault(); $('[data-act="save"]', e.target.closest('.g')).click(); }
    if (e.key === 'Escape' && editing) { editing = null; renderList(); }
  });

  /* ---------- Tải / nhập danh sách CSV ---------- */
  function csvCell(v) { v = String(v == null ? '' : v); return /[",\n;]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
  $('#exportCsv').addEventListener('click', function () {
    if (!S.guests.length) { toast('Danh sách đang trống.'); return; }
    var rows = [['STT', 'Tên khách', 'Bên', 'Đã gửi', 'Nhạc riêng', 'Link']].concat(S.guests.slice().reverse().map(function (g, i) {
      return [i + 1, g.name, g.side ? SIDE[g.side] : '', g.sent ? 'Có' : '', g.music || '', linkFor(g)];
    }));
    var csv = '﻿' + rows.map(function (r) { return r.map(csvCell).join(','); }).join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    a.download = 'danh-sach-khach-moi.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  });
  function parseCsv(text) {
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; } else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',' || c === ';' || c === '\t') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(function (r) { return r.some(function (x) { return x.trim(); }); });
  }
  $('#importFile').addEventListener('change', function () {
    var f = this.files && this.files[0];
    if (!f) return;
    var reader = new FileReader();
    reader.onload = function () {
      var rows = parseCsv(String(reader.result).replace(/^﻿/, ''));
      var head = (rows[0] || []).map(function (h) { return h.trim().toLowerCase(); });
      var iName = head.findIndex(function (h) { return h.indexOf('tên') >= 0 || h === 'ten' || h === 'name'; });
      var iSide = head.findIndex(function (h) { return h.indexOf('bên') >= 0 || h === 'ben'; });
      var iSent = head.findIndex(function (h) { return h.indexOf('đã gửi') >= 0; });
      var iMusic = head.findIndex(function (h) { return h.indexOf('nhạc') >= 0; });
      if (iName >= 0) rows.shift(); else iName = 0;
      var added = 0;
      rows.reverse().forEach(function (r) {
        var sideTxt = iSide >= 0 ? (r[iSide] || '').toLowerCase() : '';
        var sd = /trai/.test(sideTxt) ? 'trai' : /gái|gai/.test(sideTxt) ? 'gai' : '';
        if (addGuest(r[iName], sd)) {
          added++;
          var g = S.guests[0];
          if (iSent >= 0 && /có|co|x|1|yes/i.test(r[iSent] || '')) g.sent = true;
          if (iMusic >= 0 && N.parse(r[iMusic] || '')) g.music = r[iMusic].trim();
        }
      });
      save(); renderList();
      toast(added ? 'Đã nhập ' + added + ' khách.' : 'Không có khách mới trong file.');
    };
    reader.readAsText(f, 'utf-8');
    this.value = '';
  });

  /* ---------- Cài đặt ---------- */
  var baseInp = $('#baseUrl');
  baseInp.value = S.base || autoBase;
  baseInp.addEventListener('change', function () {
    var v = baseInp.value.trim();
    try { new URL(v); S.base = v === autoBase ? '' : v; } catch (e) { S.base = ''; baseInp.value = autoBase; toast('Địa chỉ chưa đúng, đã dùng lại địa chỉ tự động.'); }
    save(); renderList();
  });
  $('#clearAll').addEventListener('click', function () {
    if (!S.guests.length) { toast('Danh sách đang trống.'); return; }
    if (!window.confirm('Xoá toàn bộ ' + S.guests.length + ' khách? Nên tải CSV dự phòng trước.')) return;
    S.guests = []; save(); renderList(); toast('Đã xoá danh sách.');
  });

  /* ---------- Bắt đầu ---------- */
  $('#couple').textContent = couple;
  document.title = 'Tạo link mời · ' + couple;
  renderList();
})();
