(function () {
  'use strict';
  var W = window.WEDDING, A = window.ART, L = window.Lunar;
  var body = document.body, root = document.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Tiện ích ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function get(path) { return path.split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, W); }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function esc(s) { var d = document.createElement('div'); d.textContent = s == null ? '' : String(s); return d.innerHTML; }

  // Ngày giờ cưới theo giờ Việt Nam, tách thành từng phần để không phụ thuộc múi giờ của máy khách
  var dm = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(String(W.date || ''));
  var D = { y: +dm[1], m: +dm[2], d: +dm[3], hh: +(dm[4] || 0), mm: +(dm[5] || 0) };
  var tzOff = W.timezoneOffset == null ? 7 : +W.timezoneOffset;
  var target = Date.UTC(D.y, D.m - 1, D.d, D.hh - tzOff, D.mm); // thời điểm cưới (mili giây, chuẩn UTC)
  function dow(y, m, d) { return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }
  var WD = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  var weekday = WD[dow(D.y, D.m, D.d)];
  var hhmm = pad(D.hh) + ':' + pad(D.mm);

  var qs = new URLSearchParams(location.search);
  var guest = (qs.get('to') || '').trim().slice(0, 80);
  var side = { trai: 'trai', gai: 'gai' }[(qs.get('ben') || '').toLowerCase()] || ''; // khách của nhà trai / nhà gái
  var couple = W.groom.name + ' & ' + W.bride.name;

  /* ---------- Hình vẽ & hoạ tiết ---------- */
  A.installDefs();
  function motif(file, flip) {
    return '<img class="motif' + (flip ? ' flip' : '') + '" src="assets/' + file + '" alt="" aria-hidden="true" decoding="async">';
  }
  // Cành lá vàng (góc lịch, góc album) và dải lá vàng (kết phần lịch, kết thiệp)
  var arts = {
    sprig: function () { return motif('canh-la-vang.webp'); },
    garland: function () { return motif('day-la-vang.webp'); },
  };
  /* ---------- Ảnh bìa của chủ thiệp (config.js → cover) ---------- */
  var cov = W.cover || {};
  // đường dẫn tuyệt đối để biến CSS không bị hiểu nhầm là tính từ thư mục css/
  function cssUrl(p) {
    var u = p;
    try { u = new URL(p, document.baseURI).href; } catch (e) { /* giữ nguyên */ }
    return 'url("' + String(u).replace(/"/g, '%22') + '")';
  }
  var SEAL = '<img class="seal-img" src="' + esc(cov.seal || 'assets/dau-sap-vang.webp') + '" alt="" aria-hidden="true" decoding="async">';
  if (cov.seal) body.classList.add('custom-seal');
  if (cov.inner) { root.style.setProperty('--inner-paper', cssUrl(cov.inner)); body.classList.add('custom-inner'); }
  if (cov.page) { root.style.setProperty('--page-paper', cssUrl(cov.page)); body.classList.add('custom-page'); }
  if (cov.cream) root.style.setProperty('--cream-paper', cssUrl(cov.cream));
  if (cov.creamColor) root.style.setProperty('--cream', cov.creamColor);
  // Bìa: hai cánh ghép thành đúng một ảnh phủ kín màn hình; dấu sáp đặt đúng chỗ của nó trên ảnh
  var coverReady = Promise.resolve();
  if (cov.paper) {
    var coverImg = new Image();
    root.style.setProperty('--cover-paper', cssUrl(cov.paper));
    body.classList.add('custom-cover');
    var fitCover = function () {
      if (!coverImg.naturalWidth) return;
      var vw = window.innerWidth, gw = Math.min(vw, 480), gh = window.innerHeight;
      var k = Math.max(gw / coverImg.naturalWidth, gh / coverImg.naturalHeight);
      var w = coverImg.naturalWidth * k, h = coverImg.naturalHeight * k;
      root.style.setProperty('--cov-size', w + 'px ' + h + 'px');
      root.style.setProperty('--cov-x-l', (gw - w) / 2 + 'px');
      root.style.setProperty('--cov-x-r', (gw - w) / 2 - gw / 2 + 'px');
      root.style.setProperty('--cov-y', (gh - h) / 2 + 'px');
      var at = cov.sealAt, go = $('#gateOpen');
      if (at && go) {
        go.style.left = (vw - gw) / 2 + (gw - w) / 2 + at.x * w + 'px';
        go.style.top = (gh - h) / 2 + at.y * h + 'px';
        go.style.width = at.w * w + 'px';
      }
      body.classList.add('cover-fit');
    };
    coverReady = new Promise(function (res) {
      coverImg.onload = function () { fitCover(); res(); };
      coverImg.onerror = function () { body.classList.remove('custom-cover'); res(); };
    });
    coverImg.src = cov.paper;
    window.addEventListener('resize', fitCover);
  }
  $$('[data-art]').forEach(function (el) { var f = arts[el.getAttribute('data-art')]; el.innerHTML = f ? f() : ''; });
  var tearColor = (W.cover && W.cover.creamColor) || undefined; // mép giấy xé cùng màu giấy kem
  $$('[data-tear]').forEach(function (el) {
    el.innerHTML = A.tear(+el.getAttribute('data-tear'), el.classList.contains('down') ? 'down' : 'up', tearColor);
  });
  $('#gateSeal').innerHTML = SEAL + '<span class="sheen"></span>';
  $('#heroSeal').innerHTML = SEAL;
  $('#ornHeart').innerHTML = A.heartArrow();
  $('#scrollHint').innerHTML = A.icon('down');
  $('#musicBtn').innerHTML = A.icon('music');
  $('#mapBtn .pin').innerHTML = A.icon('pin');
  $$('.dlg-x').forEach(function (b) { b.innerHTML = A.icon('x'); });
  $('#lbPrev').innerHTML = A.icon('left');
  $('#lbNext').innerHTML = A.icon('right');
  $('#carPrev').innerHTML = A.icon('left');
  $('#carNext').innerHTML = A.icon('right');

  /* ---------- Nội dung từ config.js ---------- */
  function fadeIn(img) {
    img.classList.add('lz');
    function ok() { img.classList.add('ok'); }
    if (img.complete && img.naturalWidth) ok();
    else { img.addEventListener('load', ok); img.addEventListener('error', ok); }
  }
  $$('[data-text]').forEach(function (el) { el.textContent = get(el.getAttribute('data-text')) || ''; });
  document.title = 'Thiệp cưới ' + couple;

  if (guest) {
    var gg = $('#gateGuest');
    gg.innerHTML = esc(W.cover.guestPrefix) + '<b>' + esc(guest) + '</b>';
    gg.hidden = false;
  }
  $('#gateOpen').setAttribute('aria-label', (W.cover.hint || 'Mở thiệp') + ' ' + couple);

  // Mở đầu
  $('#n1').textContent = W.groom.name;
  $('#n2').textContent = W.bride.name;
  $('#heroDate').textContent = pad(D.d) + ' . ' + pad(D.m) + ' . ' + D.y;
  $('#heroDate').setAttribute('aria-label', 'Ngày ' + D.d + ' tháng ' + D.m + ' năm ' + D.y);

  // Lời mời
  $('#famTraiLabel').textContent = W.families.trai.label;
  $('#famTrai').innerHTML = W.families.trai.parents.map(esc).join('<br>');
  $('#famGaiLabel').textContent = W.families.gai.label;
  $('#famGai').innerHTML = W.families.gai.parents.map(esc).join('<br>');
  $('#guestName').textContent = guest || W.invitation.defaultGuest;
  if (guest.length > 16) $('#guestName').style.fontSize = '34px';
  $('#bn1').textContent = W.groom.name;
  $('#bn2').textContent = W.bride.name;
  $('#dMonth').textContent = 'Tháng ' + D.m;
  $('#dDay').textContent = pad(D.d);
  $('#dYear').textContent = D.y;
  $('#dateBlock').setAttribute('aria-label', 'Ngày ' + D.d + ' tháng ' + D.m + ' năm ' + D.y);
  $('#whenTime').textContent = weekday + ' · ' + hhmm;
  var lu = L.solarToLunar(D.d, D.m, D.y);
  var lunarText = 'ngày ' + pad(lu.day) + ' tháng ' + pad(lu.month) + (lu.leap ? ' nhuận' : '') + ' năm ' + L.yearName(lu.year);
  $('#lunar').textContent = '(Tức ' + lunarText + ')';
  var mapBtn = $('#mapBtn');
  if (W.venue.map) {
    mapBtn.href = W.venue.map;
    mapBtn.setAttribute('aria-label', W.venue.mapButton + ' tới ' + W.venue.name + ' (mở Google Maps)');
  } else mapBtn.hidden = true;

  // Ảnh lớn
  function setPhoto(img, src, focus) {
    if (!src) { img.closest('figure').hidden = true; return; }
    img.decoding = 'async'; img.loading = 'lazy'; img.src = src;
    if (focus) img.style.setProperty('--focus', focus);
    fadeIn(img);
  }
  setPhoto($('#heroImg'), W.photos.hero, W.photos.heroFocus);
  setPhoto($('#endImg'), W.photos.ending, W.photos.endingFocus);

  // Chuyện tình, chữ ký, ngày
  $('#storyText').innerHTML = (W.loveStory.paragraphs || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
  $('#storySign').textContent = couple;
  $('#endSign').textContent = couple;
  $('#endDate').textContent = pad(D.d) + ' . ' + pad(D.m) + ' . ' + D.y;

  /* Tiêu đề chữ T uốn lượn (Timeline, The Album, Thank you!) */
  $$('[data-swash]').forEach(function (el) {
    var t = String(get(el.getAttribute('data-swash')) || '');
    if (!/^T/.test(t)) { el.className = 'script sec-title lt'; el.textContent = t; return; }
    var rest = t.slice(1), m = /^(he)\s+(.*)$/.exec(rest);
    el.setAttribute('aria-label', t);
    el.innerHTML = A.swashT() + '<span class="rest lt" aria-hidden="true">' +
      (m ? '<span class="small">' + esc(m[1]) + '</span>' + esc(m[2]) : esc(rest)) + '</span>';
    $$('.swash-t path, .swash-t circle', el).forEach(function (p) {
      var len = 0; try { len = p.getTotalLength(); } catch (e) { len = 300; }
      p.style.setProperty('--len', Math.ceil(len + 2));
    });
  });

  /* Tiêu đề viết tay hiện từng ký tự (giữ nguyên dấu tiếng Việt: tách theo ký tự dựng sẵn NFC) */
  function splitChars(el) {
    if (el.getAttribute('data-split')) return;
    el.setAttribute('data-split', '1');
    var i = 0;
    if (!el.getAttribute('aria-label') && !el.closest('[aria-label]')) el.setAttribute('aria-label', el.textContent);
    (function walk(list) {
      list.forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = document.createDocumentFragment();
          Array.from(n.textContent.normalize ? n.textContent.normalize('NFC') : n.textContent).forEach(function (ch) {
            var s = document.createElement('span');
            s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; s.style.setProperty('--i', i++);
            frag.appendChild(s);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(Array.prototype.slice.call(n.childNodes));
      });
    })(Array.prototype.slice.call(el.childNodes));
  }
  $$('.lt').forEach(splitChars);

  /* ---------- Đếm ngược tới đúng giờ Việt Nam ---------- */
  var cdEls = $$('[data-cd]'), cdTimer = null;
  function tick() {
    var t = target - Date.now();
    if (t <= 0) {
      $('#cdRow').hidden = true;
      $('.cd-sub').hidden = true;
      var done = $('#cdDone');
      done.textContent = W.countdown.done;
      done.hidden = false;
      clearInterval(cdTimer);
      return;
    }
    var v = { d: Math.floor(t / 864e5), h: Math.floor(t / 36e5) % 24, m: Math.floor(t / 6e4) % 60, s: Math.floor(t / 1e3) % 60 };
    cdEls.forEach(function (el) {
      var k = el.getAttribute('data-cd'), txt = String(k === 'd' ? v.d : pad(v[k]));
      if (el.textContent === txt) return;
      var first = !el.getAttribute('data-ok');
      el.textContent = txt; el.setAttribute('data-ok', '1');
      if (!first && !reduce && el.animate && !document.hidden && el.closest('section.vis')) {
        el.animate([{ transform: 'translateY(-30%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  }
  tick();
  if (target > Date.now()) cdTimer = setInterval(tick, 1000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });

  /* ---------- Lịch tháng (Chủ nhật đầu tuần) ---------- */
  (function () {
    var sun = (W.calendar.weekStart || 'sun') === 'sun';
    $('#calMonth').textContent = 'Tháng ' + D.m;
    $('#calYear').textContent = D.y;
    var heads = sun ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    var full = { CN: 'Chủ nhật', T2: 'Thứ hai', T3: 'Thứ ba', T4: 'Thứ tư', T5: 'Thứ năm', T6: 'Thứ sáu', T7: 'Thứ bảy' };
    var html = heads.map(function (d) { return '<abbr class="dow' + (d === 'CN' ? ' sun' : '') + '" title="' + full[d] + '">' + d + '</abbr>'; }).join('');
    var first = dow(D.y, D.m, 1), off = sun ? first : (first + 6) % 7;
    var days = new Date(Date.UTC(D.y, D.m, 0)).getUTCDate();
    for (var i = 0; i < off; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) {
      var isSun = dow(D.y, D.m, d) === 0;
      html += d === D.d
        ? '<span class="d wed" role="img" aria-label="Ngày ' + d + ', ngày cưới"><span class="wed-heart">' + A.heartSvg() + '</span><b aria-hidden="true">' + d + '</b></span>'
        : '<span class="d' + (isSun ? ' sun' : '') + '">' + d + '</span>';
    }
    $('#calGrid').innerHTML = html;
    $('#calNote').innerHTML = A.ringsIcon() + '<span><b>' + weekday + ', ' + pad(D.d) + '.' + pad(D.m) + '.' + D.y + ' · ' + hhmm +
      '</b><small>Âm lịch: ' + lunarText + '</small></span>';
  })();
  $$('.cal-grid abbr').forEach(function (a) { a.style.textDecoration = 'none'; });

  /* ---------- Lịch trình: đường mảnh nối các chấm ---------- */
  var tlItems = (W.timeline.items || []);
  if (!tlItems.length) $('#lich-trinh').hidden = true;
  $('#tlList').innerHTML = tlItems.map(function (it, i) {
    var text = '<span class="tl-text"><time>' + esc(it.time) + '</time><span class="lbl">' + esc(it.label) + '</span></span>';
    var ico = A.tlIcon(it.icon);
    var left = i % 2 === 0;
    return '<li class="' + (left ? 'left' : 'right') + '"><span class="dot"></span><div class="item">' + (left ? ico + text : text + ico) + '</div></li>';
  }).join('');

  /* ---------- Album: vuốt ngang, ảnh kế tiếp ló ra, chạm để xem ảnh lớn ---------- */
  var photos = (W.album.photos || []).map(function (p) { return typeof p === 'string' ? { src: p, alt: '' } : p; });
  var car = $('#carousel');
  car.innerHTML = photos.map(function (p, i) {
    var alt = p.alt || 'Ảnh cưới ' + (i + 1);
    return '<button class="ph" type="button" data-i="' + i + '" aria-label="Xem ảnh lớn: ' + esc(alt) + '">' +
      '<img src="' + esc(p.src) + '" alt="' + esc(alt) + '" loading="lazy" decoding="async"' +
      (p.focus ? ' style="object-position:' + esc(p.focus) + '"' : '') + '></button>';
  }).join('');
  if (!photos.length) $('#album').hidden = true;
  $$('img', car).forEach(fadeIn);
  var cards = $$('.ph', car), carIdx = 0;
  function carCurrent() {
    var c = car.scrollLeft + car.clientWidth / 2, best = 0, bd = Infinity;
    cards.forEach(function (f, i) { var dd = Math.abs(f.offsetLeft + f.offsetWidth / 2 - c); if (dd < bd) { bd = dd; best = i; } });
    return best;
  }
  function carUpdate() {
    carIdx = carCurrent();
    $('#carCount').textContent = (carIdx + 1) + ' / ' + cards.length;
    $('#carPrev').disabled = carIdx === 0;
    $('#carNext').disabled = carIdx === cards.length - 1;
  }
  function carGo(i) {
    i = Math.max(0, Math.min(cards.length - 1, i));
    var f = cards[i];
    car.scrollTo({ left: f.offsetLeft - (car.clientWidth - f.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  }
  var carTick = false;
  car.addEventListener('scroll', function () {
    if (carTick) return;
    carTick = true;
    requestAnimationFrame(function () { carTick = false; carUpdate(); });
  }, { passive: true });
  $('#carPrev').addEventListener('click', function () { carGo(carIdx - 1); });
  $('#carNext').addEventListener('click', function () { carGo(carIdx + 1); });
  car.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowLeft') { e.preventDefault(); carGo(carIdx - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); carGo(carIdx + 1); }
  });
  if (cards.length) carUpdate();

  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbIdx = 0;
  function lbShow(i, dir) {
    lbIdx = (i + photos.length) % photos.length;
    lbImg.src = photos[lbIdx].src;
    lbImg.alt = photos[lbIdx].alt || '';
    $('#lbCount').textContent = (lbIdx + 1) + ' / ' + photos.length;
    if (dir && lbImg.animate && !reduce) {
      lbImg.animate([{ opacity: 0, transform: 'translateX(' + dir * 40 + 'px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 360, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }
  cards.forEach(function (f) { f.addEventListener('click', function () { lbShow(+f.getAttribute('data-i')); openDialog(lb); }); });
  $('#lbPrev').addEventListener('click', function () { lbShow(lbIdx - 1, -1); });
  $('#lbNext').addEventListener('click', function () { lbShow(lbIdx + 1, 1); });
  var touchX = null;
  lb.addEventListener('touchstart', function (e) { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (touchX == null) return;
    var dx = e.changedTouches[0].clientX - touchX; touchX = null;
    if (Math.abs(dx) > 40) lbShow(lbIdx + (dx < 0 ? 1 : -1), dx < 0 ? 1 : -1);
  });
  lb.addEventListener('closed', function () { carGo(lbIdx); });
  document.addEventListener('keydown', function (e) {
    if (!lb.open) return;
    if (e.key === 'ArrowLeft') lbShow(lbIdx - 1, -1);
    if (e.key === 'ArrowRight') lbShow(lbIdx + 1, 1);
  });

  /* ---------- Hộp thoại ---------- */
  function openDialog(d) {
    d.classList.toggle('closing', false);
    if (d.open) return;
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeDialog(d) {
    if (!d.open || d.classList.contains('closing')) return;
    function done() {
      d.classList.toggle('closing', false);
      if (d.close) d.close(); else d.removeAttribute('open');
      d.dispatchEvent(new Event('closed'));
    }
    if (reduce) return done();
    d.classList.add('closing');
    setTimeout(done, 220);
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('cancel', function (e) { e.preventDefault(); closeDialog(d); });
    d.addEventListener('click', function (e) { if (e.target === d) closeDialog(d); });
    $$('[data-close]', d).forEach(function (b) { b.addEventListener('click', function () { closeDialog(d); }); });
  });

  /* ---------- Xác nhận tham dự ----------
     Chỉ báo "đã gửi" khi nơi nhận (Google Apps Script, xem README) trả về {"ok": true}.
     Chưa cấu hình endpoint, mất mạng hay máy chủ báo lỗi thì báo rõ là CHƯA lưu được. */
  var form = $('#rsvpForm'), msg = $('#rsvpMsg'), btn = $('#rsvpSubmit');
  var maxGuests = Math.max(1, +W.rsvp.maxGuests || 10), guests = 1;
  if (guest) $('#rsvpName').value = guest;
  function attending() { var r = form.querySelector('input[name="attending"]:checked'); return r ? r.value : ''; }
  function renderGuests() {
    $('#guestCount').textContent = guests;
    $('[data-step="-1"]', form).disabled = guests <= 1;
    $('[data-step="1"]', form).disabled = guests >= maxGuests;
  }
  renderGuests();
  $$('[data-step]', form).forEach(function (b) {
    b.addEventListener('click', function () { guests = Math.max(1, Math.min(maxGuests, guests + +b.getAttribute('data-step'))); renderGuests(); });
  });
  $$('input[name="attending"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      $$('.choice', form).forEach(function (c) { c.classList.toggle('on', $('input', c).checked); });
      $('#guestsField').hidden = attending() !== 'yes';
      if (msg.classList.contains('need')) setMsg('', '');
    });
  });
  function setMsg(cls, html) { msg.className = 'form-msg ' + cls; msg.innerHTML = html; }
  function sending(on) {
    btn.disabled = on;
    btn.innerHTML = on ? '<span class="spin" aria-hidden="true"></span>Đang gửi…' : esc(W.rsvp.button);
  }
  // Gửi lên Google Apps Script; chỉ coi là đã lưu khi máy chủ trả về JSON {"ok": true}
  function saveRsvp(data) {
    if (!W.endpoint) return Promise.reject(new Error('no-endpoint'));
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 20000) : null;
    function clear(x) { if (timer) clearTimeout(timer); return x; }
    return fetch(W.endpoint, { method: 'POST', body: new URLSearchParams(data), redirect: 'follow', signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('http-' + r.status); return r.json(); })
      .then(function (j) { if (!j || j.ok !== true) throw new Error('not-saved'); return clear(j); },
        function (e) { clear(); throw e; });
  }
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#rsvpName').value.trim(), att = attending();
    if (!name) { setMsg('need', 'Bạn cho chúng mình biết tên nhé.'); $('#rsvpName').focus(); return; }
    if (!att) { setMsg('need', 'Bạn chọn giúp chúng mình có tham dự hay không nhé.'); $('#attYes').focus(); return; }
    var yes = att === 'yes';
    var data = { type: 'rsvp', name: name, attending: att, guests: yes ? guests : 0, invitedAs: guest, side: side };
    sending(true);
    setMsg('', '');
    saveRsvp(data).then(function () {
      setMsg('ok', '<b>' + esc(yes ? 'Hẹn gặp bạn nhé!' : 'Cảm ơn bạn đã báo!') + '</b>' +
        esc(yes ? 'Chúng mình đã lưu phản hồi của ' + name + ' (' + guests + ' người).' : 'Chúng mình đã lưu phản hồi của ' + name + '.'));
    }).catch(function (err) {
      if (err && err.message === 'no-endpoint') {
        setMsg('warn', 'Phản hồi CHƯA được gửi: thiệp chưa kết nối nơi nhận phản hồi. Bạn nhắn trực tiếp cho cô dâu chú rể giúp chúng mình nhé.');
      } else {
        setMsg('', 'Phản hồi chưa được lưu (lỗi mạng hoặc máy chủ). Bạn kiểm tra kết nối rồi bấm “' + esc(W.rsvp.button) + '” lại giúp chúng mình nhé.');
      }
    }).then(function () { sending(false); });
  });

  /* ---------- Quà mừng: chạm phong bì → nắp mở → hộp mã QR ---------- */
  var env = $('#giftEnv'), envArt = A.giftEnvelope();
  $('.g-back', env).innerHTML = envArt.back;
  $('.g-front', env).innerHTML = envArt.front;
  $('.g-flap', env).innerHTML = envArt.flap;
  $('.g-seal', env).innerHTML = SEAL;
  var accounts = (W.gift.accounts || []).filter(function (a) { return a.qr || a.number; });
  if (!accounts.length) $('#qua-mung').hidden = true;
  $('#giftCards').innerHTML = accounts.map(function (a) {
    return '<div class="gcard"><p class="side">' + esc(a.side) + '</p>' +
      '<div class="qr-wrap">' + (a.qr ? '<img src="' + esc(a.qr) + '" alt="Mã QR chuyển khoản ' + esc(a.bankName + ' ' + a.number) + '" data-qr>' : '<div class="noqr">Mã QR đang được cập nhật</div>') + '</div>' +
      '<p class="bank">' + esc(a.bankName || '') + '</p>' +
      (a.number ? '<p class="acc">' + esc(a.number) + '</p>' : '') +
      (a.holder ? '<p class="holder">' + esc(a.holder) + '</p>' : '') +
      (a.number ? '<button class="btn-copy" type="button" data-copy="' + esc(a.number) + '">' + A.icon('copy') + '<span>Sao chép số tài khoản</span></button>' : '') +
      '</div>';
  }).join('');
  $$('#giftCards img[data-qr]').forEach(function (img) {
    img.addEventListener('error', function () { img.outerHTML = '<div class="noqr">Mã QR đang được cập nhật</div>'; });
  });
  function copyText(v) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(v);
    return new Promise(function (ok, fail) {
      var t = document.createElement('textarea');
      t.value = v; t.setAttribute('readonly', ''); t.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
      document.body.appendChild(t); t.select();
      var done = false; try { done = document.execCommand('copy'); } catch (e) { done = false; }
      t.remove();
      if (done) ok(); else fail();
    });
  }
  $$('#giftCards [data-copy]').forEach(function (b) {
    var label = $('span', b);
    b.addEventListener('click', function () {
      var v = b.getAttribute('data-copy');
      copyText(v).then(function () {
        b.classList.add('done'); b.querySelector('.icon').outerHTML = A.icon('check'); label.textContent = 'Đã sao chép ' + v;
        setTimeout(function () { b.classList.toggle('done', false); b.querySelector('.icon').outerHTML = A.icon('copy'); label.textContent = 'Sao chép số tài khoản'; }, 2000);
      }).catch(function () { window.prompt('Số tài khoản', v); });
    });
  });
  var giftDlg = $('#giftDlg');
  env.addEventListener('click', function () {
    if (env.classList.contains('open')) { openDialog(giftDlg); return; }
    env.classList.add('open');
    setTimeout(function () { openDialog(giftDlg); }, reduce ? 0 : 800);
  });
  giftDlg.addEventListener('closed', function () { setTimeout(function () { env.classList.toggle('open', false); env.focus({ preventScroll: true }); }, 200); });

  /* ---------- Nhạc nền ----------
     Lấy từ link mời (?nhac=…, do trang tao-link.html tạo) hoặc từ config.js (music).
     Nhận link YouTube hoặc file nhạc; phát khi khách chạm mở thiệp, nút góc trên để bật/tắt. */
  var musicBtn = $('#musicBtn'), music = null, musicWanted = false;
  function setPlaying(on) { musicBtn.classList.toggle('playing', on); musicBtn.classList.toggle('muted', !on); }
  var musicSpec = window.NHAC ? NHAC.parse(qs.has('nhac') ? qs.get('nhac') : W.music) : null;
  if (musicSpec && musicSpec.type !== 'off') {
    music = NHAC.player(musicSpec, {
      onReady: function () { musicBtn.hidden = false; },
      onState: setPlaying,
      onError: function () { musicBtn.hidden = true; music = null; },
    });
    musicBtn.addEventListener('click', function () {
      if (!music) return;
      musicWanted = !music.playing();
      if (musicWanted) music.play(); else music.pause();
    });
    // tạm dừng khi khách chuyển sang ứng dụng khác, mở lại thì phát tiếp
    document.addEventListener('visibilitychange', function () {
      if (!music) return;
      if (document.hidden) { if (music.playing()) music.pause(); }
      else if (musicWanted && body.classList.contains('open')) music.play();
    });
  }

  /* ---------- Hiện dần khi cuộn tới ---------- */
  function startReveal() {
    var els = $$('.rv, .lt, .swash');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; })
        .forEach(function (e, i) {
          e.target.style.setProperty('--rd', Math.min(i * .08, .4).toFixed(2) + 's');
          e.target.classList.add('in');
          $$('.lt', e.target).forEach(function (c) { c.style.setProperty('--rd', '.5s'); c.classList.add('in'); });
          io.unobserve(e.target);
        });
    }, { threshold: .1, rootMargin: '0px 0px -5% 0px' });
    els.forEach(function (el) { if (!el.closest('.swash') || el.classList.contains('swash')) io.observe(el); });
  }
  // Hoạ tiết chuyển động chỉ chạy ở phần đang trên màn hình (.vis)
  function watchVisible() {
    var secs = $$('.shell > section');
    if (!('IntersectionObserver' in window)) { secs.forEach(function (s) { s.classList.add('vis'); }); return; }
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('vis', e.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    secs.forEach(function (s) { vo.observe(s); });
  }
  // Ảnh màu nước chạy liền mạch qua các phần
  function alignBg() {
    $$('.shell > section.sky, .shell > section.mist').forEach(function (s) { s.style.setProperty('--by', -s.offsetTop + 'px'); });
  }
  alignBg();
  window.addEventListener('load', alignBg);
  if ('ResizeObserver' in window) new ResizeObserver(function () { requestAnimationFrame(alignBg); }).observe($('.shell'));

  /* ---------- Mở bìa ----------
     Chạm dấu sáp hoặc dòng chữ: dấu sáp nhấc nhẹ, hai cánh giấy mở sang hai bên (~0,8 giây),
     rồi tên, trái tim, ngày cưới lần lượt hiện ra. Cuộn được ngay khi hai cánh mở xong.
     Mọi animation dựng sẵn ở trạng thái tạm dừng, chỉ đổi transform/opacity (chạy trên GPU). */
  var gate = $('#gate'), opened = false, openAnims = null;
  var T = { open: 800, items: 320 };
  function wait(ms) { return root.animate ? root.animate([], { duration: ms }).finished : new Promise(function (r) { setTimeout(r, ms); }); }
  function showContent() {
    gate.hidden = true;
    body.classList.add('open');
    body.classList.toggle('locked', false);
    startReveal();
    watchVisible();
  }
  function buildOpening() {
    if (openAnims || reduce || !root.animate) return;
    openAnims = [];
    function add(el, frames, timing) { var a = el.animate(frames, timing); a.pause(); openAnims.push(a); return a; }
    // dấu sáp nhấc nhẹ lên rồi mờ đi
    add($('#gateSeal'), [
      { transform: 'none', opacity: 1 },
      { transform: 'translateY(-8px) scale(1.04)', opacity: 1, offset: .4 },
      { transform: 'translateY(-18px) scale(1.07)', opacity: 0 },
    ], { duration: 620, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
    $$('.gate-hint, .gate-guest').forEach(function (el) { add(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 260, easing: 'ease-out', fill: 'forwards' }); });
    // hai cánh giấy mở ra hai bên, hướng về phía người xem
    var leaf = { duration: T.open, delay: 60, easing: 'cubic-bezier(.55,0,.25,1)', fill: 'forwards' };
    add($('.door.l'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-100deg)' }], leaf);
    add($('.door.r'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(100deg)' }], leaf);
    $$('.door .shade').forEach(function (sh) { add(sh, [{ opacity: 0 }, { opacity: 1 }], leaf); });
    // phần mở đầu phía sau lùi nhẹ về đúng cỡ
    var zoom = add($('#dau-trang'), [{ transform: 'scale(1.05)' }, { transform: 'none' }], { duration: 1100, easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'both' });
    zoom.finished.then(function () { zoom.cancel(); }).catch(function () {});
    // tên, trái tim, ngày cưới hiện lần lượt
    $$('.hi').forEach(function (el, i) {
      var a = add(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], {
        duration: 700, delay: T.items + i * 110, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both',
      });
      a.finished.then(function () { el.classList.add('shown'); a.cancel(); }).catch(function () {});
    });
  }
  function open(e) {
    if (opened) return;
    opened = true;
    if (music) { musicWanted = true; music.play(); }
    var byKeyboard = e && e.detail === 0;
    function focusHero() { if (byKeyboard) { var h = $('#dau-trang'); h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); } }
    if (reduce || !root.animate) {
      $$('.hi').forEach(function (el) { el.classList.add('shown'); });
      showContent(); focusHero();
      return;
    }
    buildOpening();
    openAnims.forEach(function (a) { a.play(); });
    wait(60 + T.open).then(function () { showContent(); focusHero(); });
  }
  gate.addEventListener('click', open);

  // Người dùng bật "giảm chuyển động": vào thẳng nội dung, không có bìa
  if (reduce) open();

  /* ---------- Bìa hiện ra khi phông chữ đã sẵn sàng ---------- */
  var readyDone = false;
  function ready() { if (!readyDone) { readyDone = true; body.classList.add('ready'); setTimeout(buildOpening, 60); } }
  // chờ phông chữ và ảnh bìa (tối đa ~2,5 giây) rồi mới cho dấu sáp hiện ra
  Promise.all([document.fonts && document.fonts.ready ? document.fonts.ready : null, coverReady]).then(ready);
  setTimeout(ready, 2500);
})();
