(function () {
  'use strict';
  var W = window.WEDDING;
  var I = window.ILLUSTRATIONS;
  var body = document.body;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(s, root) { return (root || document).querySelector(s); }
  function $$(s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, W); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      if (val === null) localStorage.removeItem(key); else localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }

  /* ---------- Ngày cưới ---------- */
  var date = new Date(W.date);
  var dd = pad(date.getDate()), mm = pad(date.getMonth() + 1), yyyy = date.getFullYear();
  var weekday = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'][date.getDay()];
  var couple = W.groom + ' & ' + W.bride;

  /* ---------- Khách được mời (?to=Tên) ---------- */
  var guest = (new URLSearchParams(location.search).get('to') || '').trim().slice(0, 60);

  /* ---------- Điền nội dung ---------- */
  $$('[data-text]').forEach(function (el) { el.textContent = get(el.getAttribute('data-text')) || ''; });
  document.title = 'Thiệp cưới ' + couple;
  $('#guest').textContent = guest || W.cover.defaultGuest;
  $('#coverDate').textContent = dd + ' · ' + mm + ' · ' + yyyy;
  $('#heroNames').textContent = couple;
  $('#whenWhere').textContent = weekday + ' ' + dd + '.' + mm + '.' + yyyy +
    ', chúng mình rất vui được đón bạn tại ' + W.venue.name + ', ' + W.venue.address;
  $('#mapBtn').href = W.venue.mapUrl;
  $('#footerNames').textContent = couple + ' · ' + dd + '.' + mm + '.' + yyyy;

  $('#illCouple').innerHTML = I.couple(dd, mm);
  $('#illBanquet').innerHTML = I.banquet();
  $('#times').innerHTML = W.schedule.items.map(function (it) {
    return '<li class="reveal"><span class="t">' + esc(it.time) + '</span><span class="l">' + esc(it.label) + '</span></li>';
  }).join('');

  var details = [
    { c: W.dressCode, ill: I.wardrobe(), side: 'left',
      extra: '<div class="swatches">' + (W.dressCode.colors || []).map(function (c) {
        return '<span style="background:' + esc(c) + '"></span>';
      }).join('') + '</div>' },
    { c: W.gift, ill: I.gifts(), side: 'right',
      extra: W.gift.qrImage ? '<button class="btn" type="button" id="qrBtn">' + esc(W.gift.qrButton) + '</button>' : '' },
    { c: W.flowers, ill: I.bouquet(), side: 'left', extra: '' },
    { c: W.contact, ill: I.telephone(), side: 'right',
      extra: W.contact.url ? '<a class="btn" href="' + esc(W.contact.url) + '" target="_blank" rel="noopener">' + esc(W.contact.button) + '</a>' : '' },
  ];
  $('#details').innerHTML = details.map(function (d) {
    return '<article class="detail" data-side="' + d.side + '">' +
      '<div class="d-row"><div class="d-ill">' + d.ill + '</div>' +
      '<div class="d-title"><h3 class="script write">' + esc(d.c.title) + '</h3>' + I.arrow(d.side === 'left') + '</div></div>' +
      '<div class="d-body reveal"><p>' + esc(d.c.text) + '</p>' + d.extra + '</div></article>';
  }).join('');

  /* ---------- Chữ viết tay: bọc nội dung để hiệu ứng cắt không ảnh hưởng việc dò cuộn ---------- */
  function wrapWrite(el) {
    if (!el.querySelector('.wr')) el.innerHTML = '<span class="wr">' + el.innerHTML + '</span>';
  }
  $$('.write').forEach(wrapWrite);

  /* ---------- Hiệu ứng vẽ nét ---------- */
  function prepDraw(svg) {
    var els = $$('path, rect, circle, text', svg);
    var hasOrder = els.some(function (e) { return e.hasAttribute('data-o'); });
    var last = 0, max = 0;
    els.forEach(function (el, i) {
      var o = hasOrder ? (el.hasAttribute('data-o') ? +el.getAttribute('data-o') : last) : i;
      last = o; el._o = o; if (o > max) max = o;
    });
    var isHero = svg.closest('.hero-ill');
    var span = isHero ? 3.0 : svg.classList.contains('arrow') ? 0.3 : 1.9;
    var du = isHero ? 0.9 : svg.classList.contains('arrow') ? 0.9 : 0.75;
    els.forEach(function (el) {
      var len = 0;
      if (el.tagName.toLowerCase() !== 'text' && el.getTotalLength) {
        try { len = el.getTotalLength(); } catch (e) { len = 0; }
      }
      el.setAttribute('data-d', '');
      el.style.setProperty('--len', (len + 1).toFixed(1));
      el.style.setProperty('--dl', (max ? el._o / max * span : 0).toFixed(2) + 's');
      el.style.setProperty('--du', du + 's');
    });
    svg.classList.add('prep');
  }
  if (!reduceMotion) $$('.ill').forEach(prepDraw);

  /* ---------- Hiện dần khi cuộn tới ---------- */
  var io = null;
  function startObserving() {
    var targets = $$('.reveal, .write, .ill.prep');
    if (!('IntersectionObserver' in window) || reduceMotion) {
      targets.forEach(function (t) { t.classList.add('in'); });
      return;
    }
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  /* ---------- Khung lượn sóng trên bìa ---------- */
  function buildWave() {
    var col = $('.cover-col'), w = col.clientWidth, h = col.clientHeight;
    if (!w || !h) return;
    var svg = $('#wave');
    svg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    var mX = Math.max(20, w * 0.075), mY = Math.max(24, h * 0.04);
    var x0 = mX, y0 = mY, x1 = w - mX, y1 = h - mY, r = Math.min(w, h) * 0.09;
    var sw = x1 - x0 - 2 * r, sh = y1 - y0 - 2 * r, arc = Math.PI * r / 2;
    var L = 2 * sw + 2 * sh + 4 * arc;
    function at(s) {
      s = ((s % L) + L) % L;
      var a;
      if (s < sw) return [x0 + r + s, y0, 0, -1]; s -= sw;
      if (s < arc) { a = -Math.PI / 2 + s / r; return [x1 - r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } s -= arc;
      if (s < sh) return [x1, y0 + r + s, 1, 0]; s -= sh;
      if (s < arc) { a = s / r; return [x1 - r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } s -= arc;
      if (s < sw) return [x1 - r - s, y1, 0, 1]; s -= sw;
      if (s < arc) { a = Math.PI / 2 + s / r; return [x0 + r + r * Math.cos(a), y1 - r + r * Math.sin(a), Math.cos(a), Math.sin(a)]; } s -= arc;
      if (s < sh) return [x0, y1 - r - s, -1, 0]; s -= sh;
      a = Math.PI + s / r; return [x0 + r + r * Math.cos(a), y0 + r + r * Math.sin(a), Math.cos(a), Math.sin(a)];
    }
    var waves = Math.max(10, Math.round(L / (w * 0.3)));
    var amp = w * 0.024, n = waves * 10, pts = [];
    for (var i = 0; i < n; i++) {
      var s = i / n * L, p = at(s), k = 2 * Math.PI * waves * s / L;
      var off = amp * (Math.sin(k) + 0.18 * Math.sin(2.3 * k + 1));
      pts.push([p[0] + p[2] * off, p[1] + p[3] * off]);
    }
    var d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (var j = 0; j < n; j++) {
      var p0 = pts[(j - 1 + n) % n], p1 = pts[j], p2 = pts[(j + 1) % n], p3 = pts[(j + 2) % n];
      d += ' C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) +
        ' ' + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) +
        ' ' + p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    var path = $('#wavePath');
    path.setAttribute('d', d + ' Z');
    path.style.strokeWidth = Math.max(5, w * 0.016).toFixed(1);
  }
  buildWave();
  if ('ResizeObserver' in window) new ResizeObserver(buildWave).observe($('.cover-col'));
  else window.addEventListener('resize', buildWave);

  /* ---------- Nhạc nền ---------- */
  var audio = null, musicBtn = $('#musicBtn');
  function setPlaying(on) {
    musicBtn.classList.toggle('playing', on);
    musicBtn.classList.toggle('muted', !on);
  }
  if (W.music) {
    audio = new Audio();
    audio.loop = true;
    audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', function () { musicBtn.hidden = false; });
    audio.addEventListener('error', function () { musicBtn.hidden = true; audio = null; });
    audio.src = W.music;
    musicBtn.addEventListener('click', function () {
      if (!audio) return;
      if (audio.paused) audio.play().then(function () { setPlaying(true); }).catch(function () {});
      else { audio.pause(); setPlaying(false); }
    });
  }

  /* ---------- Mở bìa thiệp ---------- */
  var cover = $('#cover'), opened = false;
  function openCover() {
    if (opened) return;
    opened = true;
    cover.classList.add('opened');
    body.classList.remove('locked');
    body.classList.add('open');
    window.scrollTo(0, 0);
    setTimeout(function () { cover.classList.add('gone'); }, reduceMotion ? 0 : 1150);
    setTimeout(startObserving, reduceMotion ? 0 : 550);
    if (audio) audio.play().then(function () { setPlaying(true); }).catch(function () { setPlaying(false); });
  }
  cover.addEventListener('click', openCover);
  cover.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openCover(); }
  });

  /* ---------- Mã QR mừng cưới (tuỳ chọn) ---------- */
  var qrBtn = $('#qrBtn'), qrDialog = $('#qrDialog');
  if (qrBtn && qrDialog && qrDialog.showModal) {
    $('#qrImg').src = W.gift.qrImage;
    qrBtn.addEventListener('click', function () { qrDialog.showModal(); });
  }

  /* ---------- Hồi âm ---------- */
  var form = $('#rsvpForm'), done = $('#rsvpDone'), err = $('#formError');
  var guestsSel = $('#rsvpGuests'), guestsField = $('#guestsField');
  var storeKey = 'rsvp:' + couple + ':' + W.date;
  $('#rsvpNote').textContent = 'Bạn báo giúp chúng mình trước ngày ' + W.rsvp.deadline + ' nhé.';
  $('#msgLabel').textContent = 'Lời nhắn cho ' + (W.contact.name ? W.contact.name + ' và ' : '') + 'hai đứa';
  for (var g = 1; g <= (W.rsvp.maxGuests || 5); g++) {
    var opt = document.createElement('option');
    opt.value = opt.textContent = g;
    guestsSel.appendChild(opt);
  }
  guestsSel.value = guest ? 1 : 2;
  if (guest) $('#rsvpName').value = guest;

  function attendingValue() { return (form.querySelector('input[name="attending"]:checked') || {}).value; }
  $$('input[name="attending"]', form).forEach(function (r) {
    r.addEventListener('change', function () { guestsField.classList.toggle('hide', attendingValue() === 'no'); });
  });

  function showDone(data, sent) {
    var yes = data.attending === 'yes';
    var title = $('#doneTitle');
    title.textContent = (yes ? 'Hẹn gặp ' : 'Cảm ơn ') + data.name + ' nhé!';
    $('#doneNote').innerHTML = esc(!sent
      ? 'Đây là lời hồi âm xem thử; chưa gửi đi.'
      : yes ? 'Chúng mình đã nhận được hồi âm của bạn.' : 'Tiếc quá, hẹn gặp bạn dịp khác nhé.') +
      (sent ? '<br><a href="#hoi-am" id="redo" class="redo">Gửi lại hồi âm</a>' : '');
    form.hidden = true;
    done.hidden = false;
    title.classList.add('write');
    wrapWrite(title);
    requestAnimationFrame(function () { requestAnimationFrame(function () { title.classList.add('in'); }); });
    var redo = $('#redo');
    if (redo) redo.addEventListener('click', function (e) {
      e.preventDefault(); store(storeKey, null); done.hidden = true; form.hidden = false;
      title.classList.remove('in');
    });
  }

  var saved = store(storeKey);
  if (saved && saved.name) showDone(saved, true);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    var data = {
      name: form.name.value.trim(),
      attending: attendingValue(),
      guests: attendingValue() === 'yes' ? guestsSel.value : '0',
      message: form.message.value.trim(),
      invitedAs: guest,
    };
    if (!data.name) { err.textContent = 'Bạn cho chúng mình biết tên nhé.'; form.name.focus(); return; }
    if (!W.rsvp.endpoint) { showDone(data, false); return; }

    var btn = $('#rsvpSubmit');
    btn.disabled = true; btn.textContent = 'Đang gửi…';
    fetch(W.rsvp.endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) })
      .then(function () { store(storeKey, data); showDone(data, true); })
      .catch(function () { err.textContent = 'Gửi chưa được, bạn kiểm tra mạng rồi thử lại giúp chúng mình nhé.'; })
      .then(function () { btn.disabled = false; btn.textContent = 'Gửi hồi âm'; });
  });
})();
