(function () {
  'use strict';
  var W = window.WEDDING, A = window.ART, L = window.Lunar;
  var body = document.body;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tiện ích ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, W); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  // '2027-03-07T07:00' -> Date theo giờ địa phương (tránh trình duyệt hiểu thành giờ UTC)
  function parseLocal(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(String(s || ''));
    return m ? new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : new Date(s);
  }
  var WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  function dmy(d) { return pad(d.getDate()) + '.' + pad(d.getMonth() + 1) + '.' + d.getFullYear(); }
  function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  function initials(name) {
    var w = String(name || '').trim().split(/\s+/).filter(Boolean);
    return (w.length > 1 ? w[w.length - 2][0] + w[w.length - 1][0] : (w[0] || '?')[0]).toUpperCase();
  }

  A.installDefs();
  var qs = new URLSearchParams(location.search);
  var guest = (qs.get('to') || '').trim().slice(0, 80);
  var main = parseLocal(W.date);
  var couple = W.groom.name + ' & ' + W.bride.name;
  var key = 'thiep:' + couple + ':' + W.date;

  /* ---------- Điền nội dung chung ---------- */
  $$('[data-text]').forEach(function (el) { el.textContent = get(el.getAttribute('data-text')) || ''; });
  // Ảnh hiện dần khi tải xong thay vì bật ra đột ngột
  function fadeIn(img) {
    if (img.classList.contains('lz')) return;
    img.classList.add('lz');
    function ok() { img.classList.add('ok'); }
    if (img.complete && img.naturalWidth) ok();
    else { img.addEventListener('load', ok); img.addEventListener('error', ok); }
  }
  $$('img[data-src]').forEach(function (img) {
    var src = get(img.getAttribute('data-src'));
    if (!src) { img.closest('section, figure').hidden = true; return; }
    if (!img.closest('.intro, .hero')) img.loading = 'lazy';
    img.decoding = 'async';
    img.src = src;
    fadeIn(img);
  });
  var seal = A.waxSeal((W.groom.short[0] + W.bride.short[0]).toUpperCase());
  var arts = { bouquet0: A.bouquet(0), bouquet1: A.bouquet(1), sprig: A.stemSprig() };
  $$('[data-art]').forEach(function (el) { el.innerHTML = arts[el.getAttribute('data-art')] || ''; });
  // Phong bì: cùng một cấu trúc cho bìa và phần mở thiệp để chuyển cảnh liền mạch
  function buildEnv(el) {
    el.insertAdjacentHTML('afterbegin',
      '<div class="back">' + A.envelopeBack() + '</div>' +
      '<div class="flap"><div class="face in">' + A.envelopeFlapIn() + '</div><div class="face out">' + A.envelopeFlapOut() + '</div></div>');
    el.insertAdjacentHTML('beforeend', '<div class="front">' + A.envelopeFront() + '</div><div class="seal">' + seal + '</div>');
  }
  buildEnv($('#introEnv'));
  buildEnv($('#heroEnv'));
  $$('[data-icon]').forEach(function (el) { el.insertAdjacentHTML('afterbegin', A.icon(el.getAttribute('data-icon'))); });

  document.title = 'Thiệp cưới ' + couple;
  $('#introNames').textContent = couple;
  $('#introDate').textContent = dmy(main);
  $('#capNames').textContent = W.groom.short + ' ♡ ' + W.bride.short;
  $('#capDate').textContent = dmy(main);
  $('#guestName').textContent = guest || W.invitation.defaultGuest;
  $('#groomName').textContent = W.groom.name;
  $('#brideName').textContent = W.bride.name;
  $('#famTraiLabel').textContent = W.families.trai.label;
  $('#famTrai').textContent = W.families.trai.parents.join('\n');
  $('#famGaiLabel').textContent = W.families.gai.label;
  $('#famGai').textContent = W.families.gai.parents.join('\n');
  $('#mono').innerHTML = A.monogram(W.groom.short[0], W.bride.short[0]);
  $('#bdDate').textContent = WD[main.getDay()] + ' · ' + dmy(main);
  $('#bdHeart').insertAdjacentHTML('afterbegin', A.heart('heart'));
  $('#giftOpen').insertAdjacentHTML('beforeend', esc(W.gift.button));
  $('.music').innerHTML = A.icon('music');
  $$('.dlg-x').forEach(function (b) { b.innerHTML = A.icon('x'); });
  $('#lbPrev').innerHTML = A.icon('left');
  $('#lbNext').innerHTML = A.icon('right');
  $$('#stepper button').forEach(function (b) { b.innerHTML = A.icon(b.getAttribute('data-step') > 0 ? 'plus' : 'minus'); });

  /* ---------- Lịch tháng ---------- */
  (function () {
    var y = main.getFullYear(), m = main.getMonth();
    $('#calTitle').textContent = 'Tháng ' + pad(m + 1) + ' - ' + y;
    var html = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(function (d) { return '<span class="dow">' + d + '</span>'; }).join('');
    var offset = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < offset; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) {
      html += d === main.getDate()
        ? '<span class="d wed" aria-label="Ngày cưới">' + A.heart('heart') + '<span>' + d + '</span></span>'
        : '<span class="d">' + d + '</span>';
    }
    $('#calGrid').innerHTML = html;
  })();

  /* ---------- Đếm ngược ---------- */
  var cdEls = $$('[data-cd]');
  function tick() {
    var t = Math.max(0, main.getTime() - Date.now());
    var v = { d: Math.floor(t / 864e5), h: Math.floor(t / 36e5) % 24, m: Math.floor(t / 6e4) % 60, s: Math.floor(t / 1e3) % 60 };
    cdEls.forEach(function (el) {
      var k = el.getAttribute('data-cd'), txt = String(k === 'd' ? v.d : pad(v[k]));
      if (el.textContent === txt) return;
      var first = !el.getAttribute('data-ok');
      el.textContent = txt;
      el.setAttribute('data-ok', '1');
      if (!first && !reduce && el.animate && !document.hidden) {
        el.animate([{ transform: 'translateY(-40%)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Các lễ theo nhà trai / nhà gái ---------- */
  var sides = ['gai', 'trai'].filter(function (s) { return W.families[s]; });
  if (W.firstTab === 'trai') sides.reverse();
  var active = W.families[qs.get('nha')] ? qs.get('nha') : sides[0];
  function eventCard(ev) {
    var t = parseLocal(ev.time);
    return '<article class="card ev">' +
      '<h3>' + esc(ev.title) + '</h3>' +
      '<p class="when">Được tổ chức vào lúc ' + hm(t) + ' - ' + WD[t.getDay()] + '</p>' +
      '<p class="date">' + dmy(t) + '</p>' +
      '<p class="lunar">(Nhằm ' + L.lunarText(t) + ')</p>' +
      '<div class="pin">' + A.icon('pin') + '</div>' +
      '<p class="script place">Tại ' + esc(ev.place) + '</p>' +
      '<p class="addr">' + esc(ev.address) + '</p>' +
      (ev.map ? '<a class="map" href="' + esc(ev.map) + '" target="_blank" rel="noopener">Xem bản đồ</a>' : '') +
      '</article>';
  }
  var evWrap = $('#eventCards'), switching = false;
  evWrap.classList.add('ev-wrap');
  evWrap.innerHTML = sides.map(function (s) {
    return '<div class="ev-group" data-side="' + s + '"' + (s === active ? '' : ' hidden') + '>' +
      W.families[s].events.map(eventCard).join('') + '</div>';
  }).join('');
  function markTabs() {
    $$('#tabs button').forEach(function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-side') === active)); });
  }
  function showSide(s) {
    if (s === active || switching) return;
    var cur = $('.ev-group[data-side="' + active + '"]', evWrap), next = $('.ev-group[data-side="' + s + '"]', evWrap);
    active = s; markTabs();
    if (reduce || !evWrap.animate) { cur.hidden = true; next.hidden = false; return; }
    switching = true;
    var h0 = evWrap.offsetHeight;
    cur.animate([{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(-10px)' }],
      { duration: 200, easing: 'ease-in' }).onfinish = function () {
      cur.hidden = true; next.hidden = false;
      var h1 = evWrap.offsetHeight;
      evWrap.classList.add('anim');
      evWrap.animate([{ height: h0 + 'px' }, { height: h1 + 'px' }], { duration: 420, easing: 'cubic-bezier(.22,.61,.36,1)' })
        .onfinish = function () { evWrap.classList.toggle('anim', false); };
      $$('.ev', next).forEach(function (card, i) {
        card.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }],
          { duration: 520, delay: i * 90, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
      });
      switching = false;
    };
  }
  $('#tabs').innerHTML = sides.map(function (s) {
    return '<button type="button" role="tab" data-side="' + s + '">' + esc(W.families[s].label) + '</button>';
  }).join('');
  $$('#tabs button').forEach(function (b) { b.addEventListener('click', function () { showSide(b.getAttribute('data-side')); }); });
  markTabs();

  /* ---------- Lịch trình & dress code ---------- */
  $('#tlList').innerHTML = W.schedule.items.map(function (it) {
    return '<li><span class="t">' + esc(it.time) + '</span><span class="dot"></span><span class="l">' + esc(it.label) + '</span></li>';
  }).join('');
  $('#dressDots').innerHTML = (W.dressCode.colors || []).map(function (c) { return '<span style="background:' + esc(c) + '"></span>'; }).join('');

  /* ---------- Album + xem ảnh lớn ---------- */
  var photos = W.album.photos || [];
  $('#albumGrid').innerHTML = photos.map(function (src, i) {
    return '<figure class="reveal' + (i % 4 > 1 ? ' small' : '') + '" data-i="' + i + '" style="transition-delay:' + (i % 2) * 0.12 + 's">' +
      '<img src="' + esc(src) + '" alt="Ảnh cưới ' + (i + 1) + '" loading="lazy" decoding="async"></figure>';
  }).join('');
  $$('#albumGrid img').forEach(fadeIn);
  var lb = $('#lightbox'), lbIdx = 0, lbImg = $('#lbImg');
  function lbShow(i, dir) {
    lbIdx = (i + photos.length) % photos.length;
    lbImg.src = photos[lbIdx];
    if (dir && lbImg.animate && !reduce) {
      lbImg.animate([{ opacity: 0, transform: 'translateX(' + dir * 40 + 'px) scale(.98)' }, { opacity: 1, transform: 'none' }],
        { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }
  $$('#albumGrid figure').forEach(function (f) {
    f.addEventListener('click', function () { lbShow(+f.getAttribute('data-i')); openDialog(lb); });
  });
  $('#lbPrev').addEventListener('click', function () { lbShow(lbIdx - 1, -1); });
  $('#lbNext').addEventListener('click', function () { lbShow(lbIdx + 1, 1); });
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 40) lbShow(lbIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'ArrowLeft') lbShow(lbIdx - 1, -1);
    if (e.key === 'ArrowRight') lbShow(lbIdx + 1, 1);
  });

  /* ---------- Hộp thoại ---------- */
  function openDialog(d) { d.classList.toggle('closing', false); if (d.showModal) d.showModal(); else d.setAttribute('open', ''); }
  function closeDialog(d) {
    if (!d.open || d.classList.contains('closing')) return;
    function done() { d.classList.toggle('closing', false); if (d.close) d.close(); else d.removeAttribute('open'); }
    if (reduce) return done();
    d.classList.add('closing');
    setTimeout(done, 230);
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(d); });
    d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); });
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { closeDialog(d); }); });
  });

  /* ---------- Gửi dữ liệu lên Google Sheets ---------- */
  function post(data) {
    if (!W.endpoint) return Promise.resolve({ preview: true });
    return fetch(W.endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) })
      .then(function () { return { preview: false }; });
  }

  /* ---------- Xác nhận tham dự ---------- */
  var form = $('#rsvpForm'), count = 1, maxGuests = W.rsvp.maxGuests || 10;
  var choice = { side: active === 'gai' ? 'gai' : 'trai', attending: 'yes' };
  function syncSeg() {
    $$('.seg', form).forEach(function (seg) {
      var name = seg.getAttribute('data-name');
      $$('button', seg).forEach(function (b) {
        var on = b.getAttribute('data-v') === choice[name];
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
    });
    $('#stepper').classList.toggle('off', choice.attending === 'no');
  }
  $$('.seg button', form).forEach(function (b) {
    b.addEventListener('click', function () { choice[b.parentNode.getAttribute('data-name')] = b.getAttribute('data-v'); syncSeg(); });
  });
  $$('#stepper button').forEach(function (b) {
    b.addEventListener('click', function () {
      count = Math.min(maxGuests, Math.max(1, count + +b.getAttribute('data-step')));
      $('#guestCount').textContent = count;
    });
  });
  syncSeg();
  if (guest) $('#rsvpName').value = guest;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#rsvpMsg'), name = form.name.value.trim();
    msg.className = 'form-msg';
    if (!name) { msg.textContent = 'Bạn cho chúng mình biết tên nhé.'; form.name.focus(); return; }
    var data = {
      type: 'rsvp', name: name, side: choice.side, attending: choice.attending,
      guests: choice.attending === 'yes' ? count : 0, invitedAs: guest,
    };
    var btn = $('#rsvpSubmit'); btn.disabled = true;
    post(data).then(function (r) {
      store(key + ':rsvp', data);
      msg.className = 'form-msg ok';
      msg.innerHTML = esc(choice.attending === 'yes' ? 'Hẹn gặp ' + name + ' nhé!' : 'Cảm ơn ' + name + ' đã báo nhé!') +
        '<small>' + (r.preview ? 'Đây là xác nhận xem thử, chưa gửi đi' : 'Chúng mình đã nhận được xác nhận của bạn') + '</small>';
    }).catch(function () {
      msg.textContent = 'Gửi chưa được, bạn kiểm tra mạng rồi thử lại giúp chúng mình nhé.';
    }).then(function () { btn.disabled = false; });
  });

  /* ---------- Sổ lưu bút ---------- */
  var wishes = [], shown = 0, pageSize = W.guestbook.pageSize || 5;
  var SIG_RE = /^data:image\/png;base64,[A-Za-z0-9+/=]+$/;
  function fmtDate(t) {
    var d = parseLocal(t);
    return isNaN(d) ? '' : pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function wishHTML(w, isNew) {
    var sig = w.signature && SIG_RE.test(w.signature) && w.signature.length < 60000
      ? '<img src="' + w.signature + '" alt="Chữ ký của ' + esc(w.name) + '">'
      : '<span class="ini" aria-hidden="true">' + esc(initials(w.name)) + '</span>';
    return '<article class="card wish' + (isNew ? ' new' : '') + '"><div class="wish-top">' + sig +
      '<span class="who">' + esc(w.name) + '</span><time>' + esc(fmtDate(w.time)) + '</time></div>' +
      '<p>' + esc(w.message) + '</p></article>';
  }
  function renderWishes(from) {
    var list = $('#wishList');
    shown = Math.max(shown, Math.min(pageSize, wishes.length));
    list.innerHTML = wishes.length
      ? wishes.slice(0, shown).map(function (w, i) {
        return from != null && i >= from
          ? wishHTML(w, true).replace('class="card wish new"', 'class="card wish new" style="--wd:' + ((i - from) * 0.08).toFixed(2) + 's"')
          : wishHTML(w);
      }).join('')
      : '<p class="wish-empty caps">Hãy là người đầu tiên gửi lời chúc nhé!</p>';
    $('#wishCount').textContent = wishes.length + ' lời chúc';
    $('#sigBadge').textContent = wishes.length + ' chữ ký';
    $('#wishMore').hidden = shown >= wishes.length;
  }
  $('#wishMore').addEventListener('click', function () { var from = shown; shown += pageSize; renderWishes(from); });
  function localWishes() { return store(key + ':wishes') || []; }
  function loadWishes() {
    if (!W.endpoint) {
      wishes = localWishes().concat(W.guestbook.samples || []);
      renderWishes();
      return;
    }
    $('#wishList').innerHTML = '<p class="wish-empty caps">Đang tải lời chúc…</p>';
    fetch(W.endpoint + (W.endpoint.indexOf('?') < 0 ? '?' : '&') + 'action=wishes')
      .then(function (r) { return r.json(); })
      .then(function (j) { wishes = (j && j.wishes) || []; })
      .catch(function () { wishes = []; })
      .then(renderWishes);
  }
  loadWishes();

  /* Khung ký tên */
  var pad2 = (function () {
    var cv = $('#sigPad'), ctx = cv.getContext('2d'), drawing = false, empty = true, last = null, ratio = 1;
    function size() {
      var r = cv.getBoundingClientRect();
      if (!r.width) return;
      ratio = window.devicePixelRatio || 1;
      cv.width = Math.round(r.width * ratio); cv.height = Math.round(r.height * ratio);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#1d1d1d'; ctx.lineWidth = 2.3 * ratio;
      empty = true; $('#sigHint').hidden = false;
    }
    function pos(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * ratio, y: (e.clientY - r.top) * ratio }; }
    cv.addEventListener('pointerdown', function (e) {
      drawing = true; last = pos(e); cv.setPointerCapture(e.pointerId);
      ctx.beginPath(); ctx.arc(last.x, last.y, ctx.lineWidth / 2, 0, Math.PI * 2); ctx.fillStyle = '#1d1d1d'; ctx.fill();
      if (empty) { empty = false; $('#sigHint').hidden = true; }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!drawing) return;
      var p = pos(e), mid = { x: (last.x + p.x) / 2, y: (last.y + p.y) / 2 };
      ctx.beginPath(); ctx.moveTo(last.lastMid ? last.lastMid.x : last.x, last.lastMid ? last.lastMid.y : last.y);
      ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y); ctx.stroke();
      p.lastMid = mid; last = p;
    });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (t) { cv.addEventListener(t, function () { drawing = false; }); });
    function exportPNG() {
      if (empty) return '';
      for (var h = 90; h >= 40; h -= 25) {
        var c = document.createElement('canvas'), k = h / cv.height;
        c.width = Math.round(cv.width * k); c.height = h;
        c.getContext('2d').drawImage(cv, 0, 0, c.width, c.height);
        var url = c.toDataURL('image/png');
        if (url.length < 45000) return url;
      }
      return '';
    }
    return { size: size, exportPNG: exportPNG, clear: size };
  })();
  $('#sigClear').addEventListener('click', pad2.clear);

  var wishDlg = $('#wishDialog'), wishForm = $('#wishForm');
  $('#wishOpen').addEventListener('click', function () {
    openDialog(wishDlg);
    if (guest && !wishForm.name.value) wishForm.name.value = guest;
    requestAnimationFrame(pad2.size);
  });
  wishForm.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#wishMsg'), name = wishForm.name.value.trim(), message = wishForm.message.value.trim();
    if (!name || !message) { msg.textContent = 'Bạn điền tên và lời chúc giúp chúng mình nhé.'; return; }
    var w = { type: 'wish', name: name, message: message, signature: pad2.exportPNG(), invitedAs: guest };
    var btn = $('#wishSubmit'); btn.disabled = true; msg.textContent = '';
    post(w).then(function (r) {
      w.time = new Date().toISOString().slice(0, 10);
      delete w.type;
      if (r.preview) store(key + ':wishes', [w].concat(localWishes()).slice(0, 50));
      wishes.unshift(w); shown += 1; renderWishes();
      var first = $('#wishList .wish'); if (first) first.classList.add('new');
      wishForm.reset(); closeDialog(wishDlg);
      $('#wishList').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }).catch(function () {
      msg.textContent = 'Gửi chưa được, bạn kiểm tra mạng rồi thử lại nhé.';
    }).then(function () { btn.disabled = false; });
  });

  /* ---------- Quà mừng ---------- */
  function qrSrc(a) {
    if (a.qr) return a.qr;
    if (!a.bankId || !a.number) return '';
    return 'https://img.vietqr.io/image/' + encodeURIComponent(a.bankId) + '-' + encodeURIComponent(a.number) +
      '-compact2.png?accountName=' + encodeURIComponent(a.holder || '') + '&addInfo=' + encodeURIComponent('Mung cuoi ' + W.groom.short + ' ' + W.bride.short);
  }
  $('#giftCards').innerHTML = (W.gift.accounts || []).map(function (a, i) {
    var src = qrSrc(a);
    return '<div class="card gcard"><p class="side">' + esc(a.side) + '</p>' +
      (src ? '<img src="' + esc(src) + '" alt="Mã QR ' + esc(a.side) + '" data-qr>' : '<div class="noqr">Mã QR đang được cập nhật</div>') +
      '<p class="bank">' + esc(a.bankName || '') + '</p>' +
      (a.number ? '<p class="acc"><span>' + esc(a.number) + '</span><button type="button" data-copy="' + esc(a.number) + '" aria-label="Sao chép số tài khoản">' + A.icon('copy') + '</button></p>' : '') +
      '<p class="holder">' + esc(a.holder || '') + '</p></div>';
  }).join('');
  $$('#giftCards img[data-qr]').forEach(function (img) {
    img.addEventListener('error', function () { img.outerHTML = '<div class="noqr">Mã QR đang được cập nhật</div>'; });
  });
  $$('#giftCards [data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(function () {
        b.innerHTML = A.icon('check'); setTimeout(function () { b.innerHTML = A.icon('copy'); }, 1500);
      }).catch(function () { window.prompt('Số tài khoản', v); });
    });
  });
  $('#giftOpen').addEventListener('click', function () { openDialog($('#giftDialog')); });

  /* ---------- Nhạc nền ---------- */
  var audio = null, musicBtn = $('#musicBtn');
  function setPlaying(on) { musicBtn.classList.toggle('playing', on); musicBtn.classList.toggle('muted', !on); }
  if (W.music) {
    audio = new Audio();
    audio.loop = true; audio.preload = 'metadata';
    audio.addEventListener('loadedmetadata', function () { musicBtn.hidden = false; });
    audio.addEventListener('error', function () { musicBtn.hidden = true; audio = null; });
    audio.src = W.music;
    musicBtn.addEventListener('click', function () {
      if (!audio) return;
      if (audio.paused) audio.play().then(function () { setPlaying(true); }).catch(function () {});
      else { audio.pause(); setPlaying(false); }
    });
  }

  /* ---------- Tim rơi ---------- */
  function startHearts() {
    if (reduce) return;
    var box = $('#hearts'), colors = ['#e0505f', '#f2a0a8', '#c8374b', '#f6c3c8', '#7a1530'], html = '';
    var n = window.innerWidth < 360 ? 11 : 15;
    function r(a, b) { return a + Math.random() * (b - a); }
    for (var i = 0; i < n; i++) {
      var size = r(8, 19), dur = r(9, 16);
      html += '<i class="' + (Math.random() < 0.3 ? 'o' : '') + '" style="' +
        'left:' + r(1, 95).toFixed(1) + '%;width:' + size.toFixed(0) + 'px;height:' + size.toFixed(0) + 'px;' +
        'color:' + colors[i % colors.length] + ';--o:' + r(0.5, 0.95).toFixed(2) + ';' +
        '--d:' + dur.toFixed(1) + 's;--dl:' + (-r(0, dur)).toFixed(1) + 's;--sw:' + r(2.4, 4.2).toFixed(1) + 's;' +
        '--a:' + r(8, 22).toFixed(0) + 'px;--r:' + r(-140, 140).toFixed(0) + 'deg"><b>' + A.heart('') + '</b></i>';
    }
    box.innerHTML = html;
    requestAnimationFrame(function () { box.classList.add('on'); });
    // Tạm dừng khi chuyển tab/khoá màn hình để tiết kiệm pin
    document.addEventListener('visibilitychange', function () { box.classList.toggle('paused', document.hidden); });
  }

  /* ---------- Hiện dần khi cuộn tới (các phần cùng lúc hiện lần lượt) ---------- */
  function startReveal() {
    var els = $$('.reveal');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      var shown = entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; });
      shown.forEach(function (e, i) {
        e.target.style.setProperty('--rd', Math.min(i * 0.09, 0.45).toFixed(2) + 's');
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Mở phong bì ----------
     1. Ảnh trượt vào phong bì, dấu sáp nhún.
     2. Phong bì của phần mở thiệp được đặt đè đúng vị trí phong bì trên bìa (kỹ thuật FLIP),
        bìa mờ đi — người xem chỉ thấy một phong bì duy nhất.
     3. Phong bì bay lên chỗ của nó, nắp mở, hai ảnh trồi lên, hoa và chữ hiện dần. */
  var intro = $('#intro'), heroEnv = $('#heroEnv'), opened = false;
  function finish() {
    heroEnv.classList.add('open');
    body.classList.add('opened');
    body.classList.toggle('locked', false);
    startReveal();
  }
  function open() {
    if (opened) return;
    opened = true;
    if (audio) audio.play().then(function () { setPlaying(true); }).catch(function () { setPlaying(false); });
    if (reduce || !heroEnv.animate) {
      body.classList.add('opening', 'swap');
      finish();
      intro.hidden = true;
      return;
    }
    body.classList.add('opening');
    setTimeout(function () {
      window.scrollTo(0, 0);
      var a = $('#introEnv').getBoundingClientRect(), b = heroEnv.getBoundingClientRect();
      var s = a.width / b.width, dx = a.left - b.left, dy = a.top - b.top;
      heroEnv.style.transformOrigin = '0 0';
      var delay = 260, dur = 880;
      var fly = heroEnv.animate([
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + s + ')' },
        { transform: 'none' },
      ], { duration: dur, delay: delay, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' });
      body.classList.add('swap');
      startHearts();
      // Nắp bắt đầu mở khi phong bì gần tới nơi, để hai chuyển động nối liền nhau
      setTimeout(finish, delay + dur * 0.78);
      fly.onfinish = function () { heroEnv.style.transformOrigin = ''; };
      setTimeout(function () { intro.hidden = true; }, 700);
    }, 560);
  }
  intro.addEventListener('click', open);
  intro.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });

  /* ---------- Bìa hiện ra khi font đã tải (tránh chữ nhảy) ---------- */
  var readyDone = false;
  function ready() { if (!readyDone) { readyDone = true; body.classList.add('ready'); } }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready);
  setTimeout(ready, 1500);
})();
