/*
 * Trang tạo link mời riêng (tao-link.html)
 * - Nhập tên khách (một hoặc nhiều), ghi khách nhà trai / nhà gái
 * - Chọn nhạc nền (YouTube hoặc mp3) gắn vào link
 * - Gửi lời mời kèm link riêng qua Zalo, Messenger, tin nhắn… (nút Chia sẻ của điện thoại)
 * Danh sách lưu trong trình duyệt của máy này (localStorage). Kết nối Google Sheet (mật khẩu xem thống kê)
 * thì danh sách được lưu lên trang tính "Khách mời" và dùng chung trên các máy đã kết nối.
 */
(function () {
  'use strict';
  var W = window.WEDDING, N = window.NHAC;
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  var couple = W.groom.name + ' & ' + W.bride.name;
  var WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  // "2026-11-28T10:30" → "10:30, Thứ Bảy 28.11.2026"
  function whenOf(date) {
    var dm = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(String(date || ''));
    if (!dm) return '';
    var weekday = WD[new Date(Date.UTC(+dm[1], dm[2] - 1, +dm[3])).getUTCDay()];
    return pad(+(dm[4] || 0)) + ':' + pad(+(dm[5] || 0)) + ', ' + weekday + ' ' + pad(+dm[3]) + '.' + pad(+dm[2]) + '.' + dm[1];
  }
  // giờ và nơi tổ chức theo bên của khách: nhà trai có bản riêng (config.js → sides.trai), còn lại dùng bản chính
  function eventOf(side) {
    var o = (W.sides || {})[side] || {}, v = o.venue || {};
    return { when: whenOf(o.date || W.date), place: v.name || W.venue.name };
  }
  var when = whenOf(W.date);
  var HAS_TRAI = !!(W.sides && W.sides.trai);
  var SIDE = { trai: 'Nhà trai', gai: 'Nhà gái' };
  var DEFAULT_TPL = 'Thân gửi {ten} 💌\n\n' + couple + ' trân trọng kính mời bạn tới dự lễ thành hôn của chúng mình vào lúc {thoigian}' +
    ' tại {diadiem}.\n\nThiệp mời dành riêng cho bạn: {link}\n\nSự hiện diện của bạn là niềm vui của chúng mình!';

  /* ---------- Lưu trên máy ---------- */
  var KEY = 'tao-link:' + couple + ':' + W.date;
  var S = load();
  // lời nhắn lưu từ trước còn ghi cứng giờ / nơi của bản chính: đổi thành {thoigian} / {diadiem} để khách nhà trai nhận đúng bản của mình
  if (when && S.tpl.indexOf(when) >= 0) S.tpl = S.tpl.split(when).join('{thoigian}');
  if (W.venue.name && S.tpl.indexOf(' tại ' + W.venue.name) >= 0) S.tpl = S.tpl.split(' tại ' + W.venue.name).join(' tại {diadiem}');
  function load() {
    var d = null;
    try { d = JSON.parse(localStorage.getItem(KEY) || 'null'); } catch (e) { d = null; }
    d = d || {};
    return {
      guests: Array.isArray(d.guests) ? d.guests : [], music: d.music || '', start: d.start || '', tpl: d.tpl || DEFAULT_TPL, base: d.base || '',
      // đồng bộ Google Sheet: rev = số lần sửa (khách có p là đang chờ lưu), dels = mã khách đã xoá chờ lưu, linked = máy đã từng kết nối
      rev: d.rev || 0, dels: Array.isArray(d.dels) ? d.dels : [], linked: !!d.linked, setP: d.setP || 0,
    };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* trình duyệt chặn lưu: vẫn dùng được trong phiên này */ } }
  function touch(g) { g.p = ++S.rev; } // khách vừa thêm / sửa: chờ lưu lên Google Sheet
  function forget(ids) { if (S.linked) ids.forEach(function (id) { if (S.dels.indexOf(id) < 0) S.dels.push(id); }); }
  function changed() { save(); renderList(); SYNC.soon(); }

  /* ---------- Thông báo nhỏ ---------- */
  var toastT = null;
  function toast(msg) {
    var t = $('#toast');
    t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, Math.max(2600, msg.length * 55));
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
  // giây bắt đầu (45 hoặc 1:05) áp cho cả YouTube lẫn file nhạc
  function musicSpec(raw, start) {
    var sp = N.parse(raw);
    if (sp && (sp.type === 'yt' || sp.type === 'audio') && String(start == null ? '' : start).trim() !== '') sp.start = N.seconds(start);
    return sp;
  }
  // bài đang chọn: bài trong ô (hoặc bài mặc định trong config.js) + giây bắt đầu
  function effRaw() { return (S.music || '').trim() || W.music || ''; }
  function chosenMusic() { return musicSpec(effRaw(), S.start); }
  // khách nhà trai: link vào cửa nha-trai/ (ảnh và lời xem trước trên Zalo / Messenger ghi đúng ngày nhà trai)
  function baseFor(side) {
    var b = base();
    if (side !== 'trai' || !HAS_TRAI) return b;
    return new URL('nha-trai/', b.replace(/xanh-pastel\/(index\.html)?$/, '')).href;
  }
  function linkFor(g) {
    var p = new URLSearchParams();
    p.set('to', g.name);
    if (g.side) p.set('ben', g.side);
    var sp = g.music ? N.parse(g.music) : chosenMusic();
    var m = sp ? N.toParam(sp) : '';
    if (m && m !== defaultMusic) p.set('nhac', m);
    return baseFor(g.side) + '?' + p.toString();
  }
  function message(g) {
    var ev = eventOf(g.side);
    return (S.tpl || DEFAULT_TPL).split('{ten}').join(g.name).split('{thoigian}').join(ev.when).split('{diadiem}').join(ev.place)
      .split('{link}').join(linkFor(g));
  }
  function prettyLink(u) { try { return decodeURI(u).replace(/^https?:\/\//, ''); } catch (e) { return u; } }
  // link hiện trên thẻ khách: hiện đủ, tên khách được tô đậm để thấy rõ đây là link riêng
  function linkHtml(u) {
    var q = u.indexOf('?');
    if (q < 0) return esc(prettyLink(u));
    var html = '<span class="lk-base">' + esc(prettyLink(u.slice(0, q))) + '</span>';
    new URLSearchParams(u.slice(q + 1)).forEach(function (v, k) {
      html += '<span class="lk-q">' + (html.indexOf('lk-q') < 0 ? '?' : '&amp;') + esc(k) + '=' + (k === 'to' ? '<b>' + esc(v) + '</b>' : esc(v)) + '</span>';
    });
    return html;
  }

  /* ---------- 1. Nhạc nền ---------- */
  var musicInput = $('#musicInput'), musicStart = $('#musicStart'), musicInfo = $('#musicInfo'), preview = $('#musicPreview');
  musicInput.value = S.music;
  musicStart.value = S.start;
  function showMusicInfo() {
    var raw = musicInput.value.trim();
    var sp = musicSpec(raw || W.music, musicStart.value);
    musicStart.closest('.row').hidden = !(sp && (sp.type === 'yt' || sp.type === 'audio'));
    musicInfo.className = 'hint';
    renderSongs();
    if (!raw) {
      musicInfo.className = sp ? 'hint ok' : 'hint';
      musicInfo.textContent = sp ? '✓ Bài mặc định: ' + N.describe(sp) + ' — phát trên mọi link mời.' : 'Chưa chọn nhạc: thiệp sẽ không phát nhạc.';
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
    // tự lấy giây bắt đầu từ link YouTube có ?t= (hoặc file có #t=)
    if (sp && sp.start && !musicStart.value.trim()) musicStart.value = sp.start;
    if (sp && sp.type === 'audio' && /#t=\d+$/.test(musicInput.value.trim())) musicInput.value = sp.src;
    S.music = musicInput.value.trim();
    S.start = musicStart.value;
    S.setP = ++S.rev; // nhạc chung: lưu lên Google Sheet để máy khác dùng cùng bài
    save(); showMusicInfo(); renderList(); SYNC.soon(4000);
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
      var au = $('audio', preview);
      var sought = !sp.start;
      function seek() { if (!sought && sp.start < au.duration - 1) { au.currentTime = sp.start; if (au.currentTime >= sp.start - .5) sought = true; } }
      au.addEventListener('loadedmetadata', seek);
      au.addEventListener('progress', seek);
      au.addEventListener('timeupdate', function () { if (!sought && au.currentTime < sp.start - 1) seek(); });
      au.addEventListener('error', function () { musicInfo.className = 'hint bad'; musicInfo.textContent = 'Không mở được file nhạc này. Kiểm tra lại đường dẫn.'; });
    }
  });
  showMusicInfo();

  /* ---------- Tải file nhạc lên (lưu vào repo GitHub, GitHub Pages phát lại) ---------- */
  var GH = W.github || {};
  var TOKEN_KEY = 'tao-link:gh-token', MAX_MB = 20, AUDIO = /\.(mp3|m4a|aac|ogg)$/i;
  var mp3File = $('#mp3File'), mp3Info = $('#mp3Info'), upBtn = $('#mp3Upload'), tokenBox = $('#tokenBox'), ghToken = $('#ghToken');
  var picked = null;
  function getToken() { try { return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY) || ''; } catch (e) { return ''; } }
  function setToken(t, persist) {
    try { localStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(TOKEN_KEY); if (t) (persist ? localStorage : sessionStorage).setItem(TOKEN_KEY, t); } catch (e) { /* bỏ qua */ }
  }
  // tên file không dấu, không khoảng trắng: "Nơi Này Có Anh.mp3" → "noi-nay-co-anh.mp3"
  function slugFile(name) {
    var m = /^(.*?)(\.[a-z0-9]+)?$/i.exec(name), base = m[1], ext = (m[2] || '.mp3').toLowerCase();
    base = base.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase()
      .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'nhac-nen';
    return base + ext;
  }
  // đường dẫn file nhạc tính từ trang này (trang này nằm trong xanh-pastel/)
  function relPath(fname) { return (GH.musicDir || 'xanh-pastel/assets/nhac').replace(/^xanh-pastel\//, '') + '/' + fname; }
  function gh(path, opts) {
    opts = opts || {};
    var h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
    var tok = ghToken.value.trim() || getToken();
    if (tok && opts.auth !== false) h.Authorization = 'Bearer ' + tok;
    if (opts.body) h['Content-Type'] = 'application/json';
    return fetch('https://api.github.com/repos/' + GH.repo + path, { method: opts.method || 'GET', headers: h, body: opts.body, cache: 'no-store' });
  }
  function readBase64(file) {
    return new Promise(function (ok, fail) {
      var r = new FileReader();
      r.onload = function () { ok(String(r.result).split(',')[1] || ''); };
      r.onerror = function () { fail(new Error('Không đọc được file')); };
      r.readAsDataURL(file);
    });
  }
  function mb(n) { return (n / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
  function useSong(rel, quiet) {
    musicInput.value = rel; musicStart.value = '';
    onMusicChange();
    if (!quiet) toast('Đã chọn nhạc ' + rel.split('/').pop() + ' cho mọi link mời.');
  }
  // danh sách bài: các file đã tải lên (lấy từ GitHub) + bài mặc định trong config.js
  var songsCache = [];
  function renderSongs() {
    var list = (songsCache || []).slice(), def = N.parse(W.music), cur = chosenMusic();
    if (def && def.type === 'audio' && list.indexOf(def.src) < 0) list.unshift(def.src);
    $('#songs').hidden = !list.length;
    $('#songList').innerHTML = list.map(function (rel) {
      var on = !!(cur && cur.type === 'audio' && cur.src === rel), isDef = !!(def && def.type === 'audio' && def.src === rel);
      return '<button type="button" role="radio" aria-checked="' + on + '" class="song' + (on ? ' on' : '') + '" data-rel="' + esc(rel) + '">' +
        (on ? '✓ ' : '♪ ') + '<span class="nm">' + esc(decodeURIComponent(rel.split('/').pop())) + '</span>' + (isDef ? ' <small>(mặc định)</small>' : '') + '</button>';
    }).join('');
  }
  function loadSongs() {
    renderSongs();
    if (!GH.repo) return Promise.resolve();
    return gh('/contents/' + GH.musicDir + '?ref=' + encodeURIComponent(GH.branch || ''), { auth: !!getToken() })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (list) {
        songsCache = (Array.isArray(list) ? list : []).filter(function (f) { return f.type === 'file' && AUDIO.test(f.name); })
          .map(function (f) { return relPath(f.name); });
        renderSongs();
      }).catch(function () { /* không tải được danh sách: bỏ qua */ });
  }
  $('#songList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-rel]');
    if (!b) return;
    useSong(b.getAttribute('data-rel'));
    loadSongs();
  });
  // chờ GitHub Pages đăng file mới (thường 1–2 phút)
  function waitLive(rel) {
    var url = new URL(rel, location.href).href, tries = 0;
    mp3Info.className = 'hint';
    mp3Info.textContent = 'Đã lưu lên GitHub. Đang chờ GitHub đăng file (thường 1–2 phút)…';
    (function check() {
      fetch(url + '?v=' + Date.now(), { method: 'HEAD', cache: 'no-store' }).then(function (r) {
        if (r.ok) { mp3Info.className = 'hint ok'; mp3Info.textContent = '✓ File nhạc đã sẵn sàng. Bấm “Nghe thử” để nghe.'; toast('File nhạc đã sẵn sàng.'); return; }
        throw new Error('chưa có');
      }).catch(function () {
        if (++tries < 24) setTimeout(check, 10000);
        else { mp3Info.className = 'hint'; mp3Info.textContent = 'GitHub vẫn đang đăng file. Vài phút nữa bấm “Nghe thử” lại nhé.'; }
      });
    })();
  }
  mp3File.addEventListener('change', function () {
    picked = mp3File.files && mp3File.files[0] || null;
    mp3Info.className = 'hint';
    if (!picked) { upBtn.disabled = true; mp3Info.textContent = ''; return; }
    if (!AUDIO.test(picked.name)) { picked = null; upBtn.disabled = true; mp3Info.className = 'hint bad'; mp3Info.textContent = 'Chỉ nhận file nhạc .mp3, .m4a, .aac hoặc .ogg.'; return; }
    if (picked.size > MAX_MB * 1048576) { picked = null; upBtn.disabled = true; mp3Info.className = 'hint bad'; mp3Info.textContent = 'File lớn quá (tối đa ' + MAX_MB + ' MB).'; return; }
    upBtn.disabled = false;
    mp3Info.textContent = picked.name + ' · ' + mb(picked.size) + ' → sẽ lưu thành ' + slugFile(picked.name);
    if (!getToken()) { tokenBox.hidden = false; }
  });
  $('#tokenToggle').addEventListener('click', function () { tokenBox.hidden = !tokenBox.hidden; if (!tokenBox.hidden) ghToken.focus(); });
  upBtn.addEventListener('click', function () {
    if (!picked) return;
    var tok = ghToken.value.trim() || getToken();
    if (!tok) { tokenBox.hidden = false; ghToken.focus(); toast('Dán mã GitHub trước nhé.'); return; }
    var fname = slugFile(picked.name), path = GH.musicDir + '/' + fname;
    upBtn.disabled = true; upBtn.textContent = 'Đang tải lên…';
    mp3Info.className = 'hint'; mp3Info.textContent = 'Đang gửi ' + fname + ' lên GitHub…';
    readBase64(picked).then(function (content) {
      // file trùng tên thì ghi đè (cần mã sha của file cũ)
      return gh('/contents/' + path + '?ref=' + encodeURIComponent(GH.branch || '')).then(function (r) {
        if (r.status === 401) throw new Error('401');
        return r.ok ? r.json() : null;
      }).then(function (old) {
        var body = { message: 'Thêm nhạc nền ' + fname + ' (từ trang tạo link)', content: content, branch: GH.branch || undefined };
        if (old && old.sha) body.sha = old.sha;
        return gh('/contents/' + path, { method: 'PUT', body: JSON.stringify(body) });
      });
    }).then(function (r) {
      if (r.ok) return r.json();
      throw new Error(String(r.status));
    }).then(function () {
      setToken(tok, $('#ghRemember').checked);
      tokenBox.hidden = true; $('#tokenToggle').hidden = false;
      var rel = relPath(fname);
      useSong(rel, true);
      waitLive(rel);
      loadSongs();
      mp3File.value = ''; picked = null;
    }).catch(function (err) {
      var c = err && err.message;
      mp3Info.className = 'hint bad';
      mp3Info.textContent = c === '401' ? 'Mã GitHub không đúng hoặc đã hết hạn. Tạo mã mới theo hướng dẫn bên dưới.'
        : c === '403' || c === '404' ? 'Mã GitHub chưa có quyền ghi vào repo bokin-thiep-onl (cần Contents: Read and write).'
          : c === '409' || c === '422' ? 'GitHub chưa nhận file (mã ' + c + '). Thử lại sau ít giây.'
            : 'Chưa tải lên được (' + (c || 'lỗi mạng') + '). Kiểm tra mạng rồi thử lại.';
      if (c === '401' || c === '403' || c === '404') { tokenBox.hidden = false; setToken(''); }
    }).then(function () { upBtn.textContent = 'Tải lên'; upBtn.disabled = !picked; });
  });
  if (!GH.repo) $('#upload').hidden = true;
  else {
    ghToken.value = getToken();
    try { $('#ghRemember').checked = !!localStorage.getItem(TOKEN_KEY); } catch (e) { /* bỏ qua */ }
    $('#tokenToggle').hidden = !ghToken.value;
    loadSongs();
  }

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
    S.guests.unshift({ id: uid(), name: name, side: side || '', music: '', sent: false, p: ++S.rev });
    return true;
  }
  $('#addForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var n = $('#gName');
    if (addGuest(n.value, $('#gSide').value)) { changed(); toast('Đã thêm “' + n.value.trim() + '”.'); n.value = ''; }
    else toast(n.value.trim() ? 'Khách này đã có trong danh sách.' : 'Nhập tên khách trước nhé.');
    n.focus();
  });
  $('#bulkAdd').addEventListener('click', function () {
    var lines = $('#bulk').value.split(/\r?\n/), side = $('#bulkSide').value, added = 0;
    lines.reverse().forEach(function (l) { if (addGuest(l, side)) added++; });
    changed();
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
        '<a class="g-link" href="' + esc(url) + '" target="_blank" rel="noopener">' + linkHtml(url) + '</a>' +
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
    if (HAS_TRAI) $('#openCardTrai').href = linkFor({ name: 'Khách quý', side: 'trai' });
  }

  function share(g) {
    var text = message(g);
    if (navigator.share) {
      navigator.share({ title: 'Thiệp cưới ' + couple, text: text }).then(function () {
        var cur = find(g.id) || g; // danh sách có thể vừa tải lại từ Google Sheet trong lúc chia sẻ
        cur.sent = true; touch(cur); changed(); toast('Đã gửi lời mời cho ' + g.name + '.');
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
    else if (act === 'copy-link') copy(linkFor(g)).then(function () { toast('Đã chép link riêng của ' + g.name + '. Khách mở ra sẽ thấy “' + ((W.cover && W.cover.guestPrefix) || 'Thân gửi') + ' ' + g.name + '”.'); }, function () { window.prompt('Chép link này:', linkFor(g)); });
    else if (act === 'more') { openMore = openMore === g.id ? null : g.id; renderList(); }
    else if (act === 'toggle-sent') { g.sent = !g.sent; touch(g); changed(); }
    else if (act === 'edit') { editing = g.id; renderList(); }
    else if (act === 'cancel') { editing = null; renderList(); }
    else if (act === 'save') {
      var name = $('[data-f="name"]', li).value.replace(/\s+/g, ' ').trim().slice(0, 80);
      var mus = $('[data-f="music"]', li).value.trim();
      if (!name) { toast('Tên khách không được để trống.'); return; }
      if (mus && !N.parse(mus)) { toast('Link nhạc riêng chưa đúng.'); return; }
      g.name = name; g.side = $('[data-f="side"]', li).value; g.music = mus; touch(g);
      editing = null; changed(); toast('Đã lưu.');
    } else if (act === 'delete') {
      if (!window.confirm('Xoá “' + g.name + '” khỏi danh sách?')) return;
      S.guests = S.guests.filter(function (x) { return x !== g; });
      forget([g.id]); openMore = null; changed();
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
      changed();
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
    save(); renderList(); SYNC.soon(4000);
  });
  $('#clearAll').addEventListener('click', function () {
    if (!S.guests.length) { toast('Danh sách đang trống.'); return; }
    if (!window.confirm('Xoá toàn bộ ' + S.guests.length + ' khách' + (SYNC.on() ? ', cả trên Google Sheet' : '') + '? Nên tải CSV dự phòng trước.')) return;
    forget(S.guests.map(function (g) { return g.id; }));
    S.guests = []; changed(); toast('Đã xoá danh sách.');
  });

  /* ---------- Lưu danh sách lên Google Sheet (Apps Script, cùng mật khẩu với trang Thống kê) ---------- */
  var SYNC = (function () {
    var KEY_PASS = 'thong-ke:' + couple + ':key';
    var stEl = $('#syncStatus'), msgEl = $('#syncMsg');
    var busy = false, again = false, timer = null, retry = 0, gsText = '', follow = false;
    function getKey() { try { return localStorage.getItem(KEY_PASS) || sessionStorage.getItem(KEY_PASS) || ''; } catch (e) { return ''; } }
    function setKey(v, persist) {
      try { localStorage.removeItem(KEY_PASS); sessionStorage.removeItem(KEY_PASS); if (v) (persist ? localStorage : sessionStorage).setItem(KEY_PASS, v); } catch (e) { /* bỏ qua */ }
    }
    function on() { return !!(W.endpoint && getKey()); }
    function status(cls, text) { stEl.className = 'sync-status' + (cls ? ' ' + cls : ''); stEl.textContent = text; }
    function view() {
      var c = on();
      $('#syncLogin').hidden = c;
      $('#syncOn').hidden = !c;
      $('#storeNote').textContent = c ? 'Danh sách lưu trên Google Sheet, dùng chung trên các máy đã kết nối.' : 'Danh sách chỉ lưu trên máy này.';
    }
    function post(params) {
      var ctl = window.AbortController ? new AbortController() : null;
      var t = ctl ? setTimeout(function () { ctl.abort(); }, 45000) : 0;
      return fetch(W.endpoint, { method: 'POST', body: new URLSearchParams(params), redirect: 'follow', signal: ctl ? ctl.signal : undefined })
        .then(function (r) { if (!r.ok) throw new Error('http'); return r.json(); })
        .then(function (j) {
          clearTimeout(t);
          if (j && j.ok === true && Array.isArray(j.guests)) return j;
          // bản Code.gs cũ không biết type=guests: coi như một xác nhận thiếu tên (không ghi gì)
          throw new Error(!j || j.ok === true || j.error === 'missing name' ? 'old-version' : String(j.error));
        }, function (e) { clearTimeout(t); throw e; });
    }
    // Danh sách trên Google Sheet là bản chính; khách sửa trên máy này trong lúc đang lưu thì vẫn giữ bản của máy
    function apply(list, sentP, sentDels) {
      var out = list.map(function (x) {
        return { id: String(x.id), name: String(x.name), side: x.side || '', music: x.music || '', sent: !!x.sent, sl: x.link || '' };
      }).reverse(); // mới thêm lên đầu
      var pos = {};
      out.forEach(function (g, i) { pos[g.id] = i; });
      S.guests.forEach(function (g) {
        if (!g.p || sentP[g.id] === g.p) return;
        if (g.id in pos) { g.sl = out[pos[g.id]].sl; out[pos[g.id]] = g; } else out.unshift(g);
      });
      S.dels = S.dels.filter(function (id) { return sentDels.indexOf(id) < 0; });
      S.guests = S.dels.length ? out.filter(function (g) { return S.dels.indexOf(g.id) < 0; }) : out;
    }
    // nhạc chung (bài + giây bắt đầu) dùng chung giữa các máy; máy vừa đổi nhạc mà chưa lưu xong thì giữ bản của máy
    function applyMusic(j, setP) {
      if (S.setP && S.setP === setP) S.setP = 0;
      if (S.setP || !('settings' in j)) return;
      var st = j.settings;
      if (st && typeof st === 'object') {
        var m = String(st.music || ''), t = String(st.start || '');
        if (m === S.music && t === String(S.start || '')) return;
        S.music = m; S.start = t;
        musicInput.value = m; musicStart.value = t; preview.innerHTML = '';
        showMusicInfo(); renderSongs();
      } else if (S.music || S.start) { S.setP = ++S.rev; again = true; } // trên Google Sheet chưa có: đưa nhạc của máy này lên
    }
    function run() {
      clearTimeout(timer); timer = null;
      if (!on()) return;
      if (busy) { again = true; return; }
      busy = true; again = false;
      var first = !S.linked;
      if (first) S.guests.forEach(function (g) { if (!g.p) g.p = ++S.rev; }); // lần đầu: đưa cả danh sách trên máy lên
      var sentP = {}, up = [], links = {};
      S.guests.slice().reverse().forEach(function (g) { // cũ trước, mới sau: trang tính xếp theo thứ tự thêm
        if (g.p) { sentP[g.id] = g.p; up.push({ id: g.id, name: g.name, side: g.side || '', sent: !!g.sent, music: g.music || '' }); }
        var l = linkFor(g);
        if (l !== g.sl) links[g.id] = l;
      });
      var dels = S.dels.slice(), failed = false, setP = S.setP || 0;
      var data = { up: up, del: dels, links: links };
      if (setP) data.set = { music: S.music, start: S.start };
      status('', up.length || dels.length ? 'Đang lưu lên Google Sheet…' : 'Đang tải danh sách từ Google Sheet…');
      post({ type: 'guests', key: getKey(), data: JSON.stringify(data) }).then(function (j) {
        apply(j.guests, sentP, dels);
        applyMusic(j, setP);
        S.linked = true; retry = 0;
        save();
        if (!editing) renderList();
        if (j.sheet) { $('#syncSheet').href = j.sheet; $('#syncSheet').hidden = false; }
        $('#syncOld').hidden = true;
        var now = new Date();
        status('ok', '✓ Đã lưu trên Google Sheet lúc ' + pad(now.getHours()) + ':' + pad(now.getMinutes()) + ' · ' + S.guests.length + ' khách');
        if (first) toast('Đã kết nối Google Sheet: ' + S.guests.length + ' khách.');
        // khách mới từ máy khác / gõ tay trên trang tính chưa có link mời: gửi link ở lượt sau (chỉ một lượt)
        var stale = S.guests.some(function (g) { return linkFor(g) !== g.sl; });
        if (stale && !follow) { follow = true; soon(1500); } else follow = false;
      }).catch(function (e) {
        failed = true;
        var c = e && e.message;
        if (c === 'wrong-password' || c === 'no-password') {
          setKey(''); view();
          msgEl.className = 'hint bad';
          msgEl.textContent = c === 'wrong-password' ? 'Sai mật khẩu. Đây là mật khẩu xem trang Thống kê (dòng MAT_KHAU trong Apps Script).'
            : 'Apps Script chưa có mật khẩu: gõ mật khẩu vào dòng var MAT_KHAU = \'\' rồi triển khai phiên bản mới.';
        } else if (c === 'old-version') {
          status('bad', 'Apps Script đang chạy bản cũ nên chưa lưu được danh sách khách. Cập nhật theo 4 bước dưới đây (danh sách vẫn giữ trên máy này):');
          $('#syncOld').hidden = false;
          prefetchGs();
        } else {
          retry = Math.min(retry + 1, 5);
          status('bad', 'Chưa lưu được lên Google Sheet (kiểm tra mạng). Sẽ tự thử lại; danh sách vẫn giữ trên máy này.');
          timer = setTimeout(run, [5, 10, 20, 40, 60][retry - 1] * 1000);
        }
      }).then(function () {
        busy = false;
        if (again && !failed) soon(300);
      });
    }
    function soon(ms) {
      if (!on()) return;
      clearTimeout(timer);
      timer = setTimeout(run, ms == null ? 1500 : ms);
    }
    // mã Code.gs mới (cùng trang web) để chép dán vào Apps Script
    function prefetchGs() {
      if (gsText) return;
      fetch(new URL('../google-apps-script/Code.gs', location.href).href, { cache: 'no-cache' })
        .then(function (r) { return r.ok ? r.text() : ''; })
        .then(function (t) { if (/function doPost/.test(t)) gsText = t; })
        .catch(function () { /* bỏ qua */ });
    }
    $('#copyGs').addEventListener('click', function () {
      var url = 'https://github.com/' + GH.repo + '/blob/' + GH.branch + '/google-apps-script/Code.gs';
      if (!gsText) { window.open(url, '_blank', 'noopener'); return; }
      copy(gsText).then(function () { toast('Đã chép mã Code.gs mới. Dán vào Apps Script nhé.'); }, function () { window.open(url, '_blank', 'noopener'); });
    });
    $('#syncForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = $('#syncPass').value;
      if (!v) return;
      setKey(v, $('#syncRemember').checked);
      msgEl.textContent = '';
      $('#syncPass').value = '';
      view();
      retry = 0; run();
    });
    $('#syncNow').addEventListener('click', function () { retry = 0; run(); });
    $('#syncOff').addEventListener('click', function () {
      if (!window.confirm('Ngắt kết nối Google Sheet trên máy này? Danh sách trên Google Sheet vẫn giữ nguyên.')) return;
      setKey(''); clearTimeout(timer); view();
      toast('Đã ngắt kết nối. Danh sách vẫn giữ trên máy này.');
    });
    document.addEventListener('visibilitychange', function () { if (!document.hidden) soon(300); });
    window.addEventListener('online', function () { soon(300); });
    function start() {
      if (!W.endpoint) return;
      $('#sync').hidden = false;
      view();
      if (on()) run();
    }
    return { soon: soon, on: on, start: start };
  })();

  /* ---------- Bắt đầu ---------- */
  if (HAS_TRAI) {
    var evT = eventOf('trai'), evG = eventOf('');
    $('#openCardTrai').hidden = false;
    $('#sideHint').innerHTML = '<b>Khách nhà trai</b> nhận bản nhà trai: ' + esc(evT.when) + ' tại ' + esc(evT.place) + '.<br>' +
      '<b>Khách nhà gái</b> và khách không ghi bên: ' + esc(evG.when) + ' tại ' + esc(evG.place) + '.';
    $('#sideHint').hidden = false;
  }
  $('#couple').textContent = couple;
  document.title = 'Tạo link mời · ' + couple;
  renderList();
  SYNC.start();
})();
