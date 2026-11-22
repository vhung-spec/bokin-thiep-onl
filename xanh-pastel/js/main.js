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
  function store(key, val) {
    try {
      if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null');
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) { return null; }
  }
  function parseLocal(s) {
    var m = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T ](\d{1,2}):(\d{2}))?/.exec(String(s || ''));
    return m ? new Date(+m[1], m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : new Date(s);
  }
  var WD = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];

  var qs = new URLSearchParams(location.search);
  var guest = (qs.get('to') || '').trim().slice(0, 80);
  var main = parseLocal(W.date);
  var couple = W.groom.name + ' & ' + W.bride.name;
  var key = 'thiep-xanh:' + couple + ':' + W.date;

  /* ---------- Nền & hình vẽ ---------- */
  A.installDefs();
  root.style.setProperty('--lace-img', A.svgUrl(A.laceTile()));
  root.style.setProperty('--mottle-img', A.svgUrl(A.mottleTile()));
  root.style.setProperty('--paper-img', A.svgUrl(A.paperTile()));
  var arts = {
    side: function () { return A.cluster('side'); }, sideF: function () { return A.cluster('side', true); },
    small: function () { return A.cluster('small'); }, smallF: function () { return A.cluster('small', true); },
    big: function () { return A.cluster('big'); }, mandala: A.mandala, waves: A.waves,
    pflower: function () { return A.paperFlowerSvg(); }, rings: A.ringsIcon,
  };
  $$('[data-art]').forEach(function (el) { var f = arts[el.getAttribute('data-art')]; el.innerHTML = f ? f() : ''; });
  $$('[data-tear]').forEach(function (el) {
    el.innerHTML = A.tear(+el.getAttribute('data-tear'), el.classList.contains('down') ? 'down' : 'up');
  });
  if (!(W.timeline.items || []).length) {
    var tlSec = $('#lich-trinh'), tlTear = $('.tear', tlSec);
    if (tlTear) $('#album').insertBefore(tlTear, $('#album').firstChild);
    tlSec.hidden = true;
  }
  $('#gateSeal').innerHTML = '<div class="seal-float">' + A.sealFlower({ seed: 7 }) + '</div>';
  $('#heroSeal').innerHTML = A.sealFlower({ seed: 11 });
  $('#ornHeart').innerHTML = A.heartArrow();
  $('#fline').innerHTML = A.flourishLine();

  /* ---------- Nội dung ---------- */
  function fadeIn(img) {
    img.classList.add('lz');
    function ok() { img.classList.add('ok'); }
    if (img.complete && img.naturalWidth) ok();
    else { img.addEventListener('load', ok); img.addEventListener('error', ok); }
  }
  $$('[data-text]').forEach(function (el) { el.textContent = get(el.getAttribute('data-text')) || ''; });
  $$('img[data-src]').forEach(function (img) {
    var src = get(img.getAttribute('data-src'));
    if (!src) { img.closest('figure').hidden = true; return; }
    img.loading = 'lazy'; img.decoding = 'async'; img.src = src; fadeIn(img);
  });

  document.title = 'Thiệp cưới ' + couple;
  if (guest) {
    var gg = $('#gateGuest');
    gg.innerHTML = esc(W.cover.guestPrefix) + '<b>' + esc(guest) + '</b>';
    gg.hidden = false;
  }
  $('#n1').textContent = W.groom.name;
  $('#n2').textContent = W.bride.name;
  $('#heroDate').textContent = pad(main.getDate()) + ' . ' + pad(main.getMonth() + 1) + ' . ' + main.getFullYear();
  [['#heroSeal', .5], ['#n1', .85], ['#ornHeart', 1.05], ['#n2', 1.2], ['#fline', 1.35], ['#heroDate', 1.5], ['#heroMandala', 1.65], ['#scrollHint', 2.1]]
    .forEach(function (p) { var el = $(p[0]); el.classList.add('hi'); el.style.setProperty('--d', p[1] + 's'); });
  $('#scrollHint').innerHTML = A.icon('down');

  $('#famTraiLabel').textContent = W.families.trai.label;
  $('#famTrai').innerHTML = W.families.trai.parents.map(esc).join('<br>');
  $('#famGaiLabel').textContent = W.families.gai.label;
  $('#famGai').innerHTML = W.families.gai.parents.map(esc).join('<br>');
  $('#guestName').textContent = guest || W.invitation.defaultGuest;
  if ((guest || '').length > 18) $('#guestName').style.fontSize = '30px';
  $('#bn1').textContent = W.groom.short;
  $('#bn2').textContent = W.bride.short;
  if ((W.groom.short + W.bride.short).length > 9) $('.big-names').classList.add('stack');
  $('#whenTime').textContent = pad(main.getHours()) + ':' + pad(main.getMinutes()) + ' ' + WD[main.getDay()];
  $('#dMonth').textContent = 'Tháng ' + pad(main.getMonth() + 1);
  $('#dDay').textContent = pad(main.getDate());
  $('#dYear').textContent = main.getFullYear();
  var lu = L.solarToLunar(main.getDate(), main.getMonth() + 1, main.getFullYear());
  $('#lunar').textContent = '(Tức ngày ' + pad(lu.day) + ' tháng ' + pad(lu.month) + (lu.leap ? ' nhuận' : '') + ' năm ' + L.yearName(lu.year) + ')';
  $('#venue').href = W.venue.map || '#';
  $('#storyText').innerHTML = (W.loveStory.paragraphs || []).map(function (p) { return '<p class="rv">' + esc(p) + '</p>'; }).join('');
  $('#storySign').textContent = W.groom.short + ' & ' + W.bride.short;
  $('#footNames').innerHTML = esc(W.groom.short + ' & ' + W.bride.short) + '<br>' + pad(main.getDate()) + '.' + pad(main.getMonth() + 1) + '.' + main.getFullYear();

  /* Tiêu đề chữ T uốn lượn (Timeline, The Album, Thank you); chữ khác thì dùng chữ viết tay */
  $$('[data-swash]').forEach(function (el) {
    var t = String(get(el.getAttribute('data-swash')) || '');
    if (!/^T/.test(t)) { el.className = 'fancy sec-title lt'; el.textContent = t; return; }
    var rest = t.slice(1), m = /^(he)\s+(.*)$/.exec(rest);
    el.setAttribute('aria-label', t);
    el.innerHTML = A.swashT() + '<span class="rest lt" aria-hidden="true">' +
      (m ? '<span class="small">' + esc(m[1]) + '</span>' + esc(m[2]) : esc(rest)) + '</span>';
    $$('.swash-t path, .swash-t circle', el).forEach(function (p) {
      var len = 0; try { len = p.getTotalLength(); } catch (e) { len = 300; }
      p.style.setProperty('--len', Math.ceil(len + 2));
    });
  });

  /* Chữ viết tay hiện từng ký tự */
  function splitChars(el) {
    if (el.getAttribute('data-split')) return;
    el.setAttribute('data-split', '1');
    var nodes = Array.prototype.slice.call(el.childNodes), i = 0;
    if (!el.getAttribute('aria-label') && !el.closest('[aria-label]')) el.setAttribute('aria-label', el.textContent);
    function wrapText(node) {
      var frag = document.createDocumentFragment();
      Array.from(node.textContent).forEach(function (ch) {
        var s = document.createElement('span');
        s.className = 'ch'; s.setAttribute('aria-hidden', 'true'); s.textContent = ch; s.style.setProperty('--i', i++);
        frag.appendChild(s);
      });
      node.parentNode.replaceChild(frag, node);
    }
    (function walk(list) {
      list.forEach(function (n) {
        if (n.nodeType === 3) wrapText(n);
        else if (n.nodeType === 1) walk(Array.prototype.slice.call(n.childNodes));
      });
    })(nodes);
  }
  $$('.lt').forEach(splitChars);

  // biểu tượng giao diện
  $('#musicBtn').innerHTML = A.icon('music');
  $('#menuBtn').innerHTML = A.icon('menu');
  $('#chatBtn').innerHTML = A.icon('chat');
  $('.d-send').innerHTML = A.icon('send');
  $('#heartBtn').insertAdjacentHTML('afterbegin', A.icon('heart'));
  $('#liveX').innerHTML = A.icon('x');
  $$('.dlg-x').forEach(function (b) { b.innerHTML = A.icon('x'); });
  $('#lbPrev').innerHTML = A.icon('left');
  $('#lbNext').innerHTML = A.icon('right');
  $('#wishInput').placeholder = W.wishes.placeholder;

  /* ---------- Đếm ngược ---------- */
  var cdEls = $$('[data-cd]');
  function tick() {
    var t = Math.max(0, main.getTime() - Date.now());
    var v = { d: Math.floor(t / 864e5), h: Math.floor(t / 36e5) % 24, m: Math.floor(t / 6e4) % 60, s: Math.floor(t / 1e3) % 60 };
    cdEls.forEach(function (el) {
      var k = el.getAttribute('data-cd'), txt = String(k === 'd' ? v.d : pad(v[k]));
      if (el.textContent === txt) return;
      var first = !el.getAttribute('data-ok');
      el.textContent = txt; el.setAttribute('data-ok', '1');
      if (!first && !reduce && el.animate && !document.hidden && el.closest('section.vis')) {
        el.animate([{ transform: 'translateY(-35%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
      }
    });
  }
  tick(); setInterval(tick, 1000);

  /* ---------- Lịch tháng ---------- */
  (function () {
    var y = main.getFullYear(), m = main.getMonth(), sun = (W.calendar.weekStart || 'sun') === 'sun';
    $('#calMonth').textContent = 'Tháng ' + pad(m + 1) + ' / ' + y;
    var heads = sun ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'] : ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    var html = heads.map(function (d) { return '<span class="dow">' + d + '</span>'; }).join('');
    var first = new Date(y, m, 1).getDay(), off = sun ? first : (first + 6) % 7, days = new Date(y, m + 1, 0).getDate();
    for (var i = 0; i < off; i++) html += '<span></span>';
    for (var d = 1; d <= days; d++) {
      html += d === main.getDate() ? '<span class="d wed" role="img" aria-label="Ngày ' + d + ' — ngày cưới">' + A.heartRings() + '</span>' : '<span class="d">' + d + '</span>';
    }
    $('#calGrid').innerHTML = html;
  })();

  /* ---------- Lịch trình (xen kẽ trái/phải) ---------- */
  $('#tlList').innerHTML = W.timeline.items.map(function (it, i) {
    var text = '<span>' + (i % 2 ? esc(it.label) + ' – ' + esc(it.time) : esc(it.time) + ' – ' + esc(it.label)) + '</span>';
    var ico = A.tlIcon(it.icon);
    return '<li class="rv ' + (i % 2 ? 'right' : 'left') + '"><span class="dot"></span><div class="item">' + (i % 2 ? text + ico : ico + text) + '</div></li>';
  }).join('');
  $('#tlList').classList.add('rv');

  /* ---------- Album lướt ngang + xem ảnh ---------- */
  var photos = W.album.photos || [];
  var car = $('#carousel');
  car.innerHTML = photos.map(function (src, i) {
    return '<figure data-i="' + i + '"><img src="' + esc(src) + '" alt="Ảnh cưới ' + (i + 1) + '" loading="lazy" decoding="async"></figure>';
  }).join('');
  $$('img', car).forEach(fadeIn);
  var lb = $('#lightbox'), lbImg = $('#lbImg'), lbIdx = 0;
  function lbShow(i, dir) {
    lbIdx = (i + photos.length) % photos.length;
    lbImg.src = photos[lbIdx];
    $('#lbCount').textContent = (lbIdx + 1) + ' / ' + photos.length;
    if (dir && lbImg.animate && !reduce) {
      lbImg.animate([{ opacity: 0, transform: 'translateX(' + dir * 40 + 'px) scale(.98)' }, { opacity: 1, transform: 'none' }], { duration: 380, easing: 'cubic-bezier(.16,1,.3,1)' });
    }
  }
  $$('figure', car).forEach(function (f) { f.addEventListener('click', function () { lbShow(+f.getAttribute('data-i')); openDialog(lb); }); });
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
  var dialogsOpen = 0;
  function openDialog(d) {
    d.classList.toggle('closing', false);
    if (!d.open) dialogsOpen++;
    if (d.showModal) d.showModal(); else d.setAttribute('open', '');
  }
  function closeDialog(d, cb) {
    if (!d.open || d.classList.contains('closing')) return;
    function done() {
      d.classList.toggle('closing', false);
      if (d.close) d.close(); else d.removeAttribute('open');
      dialogsOpen = Math.max(0, dialogsOpen - 1);
      d.dispatchEvent(new Event('closed'));
      if (cb) cb();
    }
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
    return fetch(W.endpoint, { method: 'POST', mode: 'no-cors', body: new URLSearchParams(data) }).then(function () { return { preview: false }; });
  }

  /* ---------- Xác nhận tham dự ---------- */
  var form = $('#rsvpForm'), ex = W.rsvp.extra || {};
  $('#rsvpGuests').max = W.rsvp.maxGuests || 10;
  if (guest) $('#rsvpName').value = guest;
  if (ex.label) {
    $('#extraLabel').textContent = ex.label;
    $('#extraOpts').innerHTML = (ex.options || []).map(function (o) {
      return '<label class="radio"><input type="radio" name="extra" value="' + esc(o) + '"><i></i><span>' + esc(o) + '</span></label>';
    }).join('');
  } else { $('#extraField').hidden = true; }
  function attending() { return (form.querySelector('input[name="attending"]:checked') || {}).value; }
  $$('input[name="attending"]', form).forEach(function (r) {
    r.addEventListener('change', function () {
      var no = attending() === 'no';
      $('#guestsField').classList.toggle('off', no);
      $('#extraField').classList.toggle('off', no);
    });
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = $('#rsvpMsg'), name = form.name.value.trim(), att = attending();
    msg.className = 'form-msg';
    if (!name) { msg.textContent = 'Bạn cho chúng mình biết tên nhé.'; form.name.focus(); return; }
    if (!att) { msg.textContent = 'Bạn chọn giúp chúng mình có tham dự không nhé.'; return; }
    var yes = att === 'yes';
    var n = Math.min(W.rsvp.maxGuests || 10, Math.max(1, parseInt(form.guests.value, 10) || 1));
    var data = {
      type: 'rsvp', name: name, attending: att, guests: yes ? n : 0,
      extra: yes && ex.label ? ((form.querySelector('input[name="extra"]:checked') || {}).value || '') : '', invitedAs: guest,
    };
    var btn = $('#rsvpSubmit'); btn.disabled = true;
    post(data).then(function (r) {
      store(key + ':rsvp', data);
      msg.className = 'form-msg ok';
      msg.innerHTML = esc(yes ? 'Hẹn gặp ' + name + ' nhé!' : 'Cảm ơn ' + name + ' đã báo nhé!') +
        '<small>' + (r.preview ? 'Đây là phản hồi xem thử, chưa gửi đi' : 'Chúng mình đã nhận được phản hồi của bạn') + '</small>';
    }).catch(function () {
      msg.textContent = 'Gửi chưa được, bạn kiểm tra mạng rồi thử lại giúp chúng mình nhé.';
    }).then(function () { btn.disabled = false; });
  });

  /* ---------- Quà mừng: phong bì mở ra rồi hiện mã QR ---------- */
  var env = $('#giftEnv'), envArt = A.giftEnvelope();
  $('.g-back', env).innerHTML = envArt.back;
  $('.g-front', env).innerHTML = envArt.front;
  $('.g-flap', env).innerHTML = envArt.flap;
  $('.g-seal', env).innerHTML = envArt.seal;
  function qrSrc(a) {
    if (a.qr) return a.qr;
    if (!a.bankId || !a.number) return '';
    return 'https://img.vietqr.io/image/' + encodeURIComponent(a.bankId) + '-' + encodeURIComponent(a.number) +
      '-compact2.png?accountName=' + encodeURIComponent(a.holder || '') + '&addInfo=' + encodeURIComponent('Mung cuoi ' + W.groom.short + ' ' + W.bride.short);
  }
  var giftAccounts = (W.gift.accounts || []).filter(function (a) { return a.qr || (a.bankId && a.number); });
  if (!giftAccounts.length) {
    $$('#qua-mung > .sec-title, #qua-mung > .sec-text, #giftEnv').forEach(function (el) { el.hidden = true; });
    $('#qua-mung').setAttribute('data-nolink', '1');
  }
  $('#giftCards').innerHTML = giftAccounts.map(function (a) {
    var src = qrSrc(a);
    return '<div class="gcard"><p class="side">' + esc(a.side) + '</p>' +
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
  var giftDlg = $('#giftDlg');
  env.addEventListener('click', function () {
    if (env.classList.contains('open')) { openDialog(giftDlg); return; }
    env.classList.add('open');
    setTimeout(function () { openDialog(giftDlg); }, reduce ? 0 : 1050);
  });
  giftDlg.addEventListener('closed', function () { setTimeout(function () { env.classList.toggle('open', false); }, 250); });

  /* ---------- Lời chúc ---------- */
  var wishes = [], serverHearts = 0;
  function fmtDate(t) { var d = parseLocal(t); return isNaN(d) ? '' : pad(d.getDate()) + '/' + pad(d.getMonth() + 1) + '/' + d.getFullYear(); }
  function renderWishList() {
    $('#wishList').innerHTML = wishes.length ? wishes.map(function (w) {
      return '<article class="wish"><div class="wish-top"><b>' + esc(w.name) + '</b><time>' + esc(fmtDate(w.time)) + '</time></div><p>' + esc(w.message) + '</p></article>';
    }).join('') : '<p class="wish-empty">Hãy là người đầu tiên gửi lời chúc nhé!</p>';
    $('#openWishes').textContent = 'Xem tất cả lời chúc (' + wishes.length + ')';
  }
  function localWishes() { return store(key + ':wishes') || []; }
  function loadWishes() {
    if (!W.endpoint) {
      wishes = localWishes().concat(W.wishes.samples || []);
      renderWishList();
      return Promise.resolve();
    }
    return fetch(W.endpoint + (W.endpoint.indexOf('?') < 0 ? '?' : '&') + 'action=wishes')
      .then(function (r) { return r.json(); })
      .then(function (j) { wishes = (j && j.wishes) || []; serverHearts = +(j && j.hearts) || 0; })
      .catch(function () { wishes = []; })
      .then(function () { renderWishList(); renderHearts(); });
  }

  /* Lời chúc chạy như livestream */
  var live = $('#live'), liveX = $('#liveX'), liveIdx = 0, liveTimer = null, liveOn = store(key + ':live');
  liveOn = liveOn === null ? W.wishes.live !== false : !!liveOn;
  $('#liveToggle').checked = liveOn;
  function setLive(on) {
    liveOn = on; store(key + ':live', on);
    live.classList.toggle('off', !on); liveX.hidden = !on;
    $('#liveToggle').checked = on;
  }
  function bubble(w, mine) {
    var el = document.createElement('div');
    el.className = 'bubble' + (mine ? ' mine' : '');
    el.innerHTML = '<span class="bt"><b>' + esc(w.name) + ':</b> ' + esc(w.message) + '</span>';
    live.appendChild(el);
    var all = $$('.bubble:not(.out)', live);
    if (all.length > 3) retire(all[0]);
    setTimeout(function () { retire(el); }, 7200);
  }
  function retire(el) {
    if (!el.parentNode || el.classList.contains('out')) return;
    el.classList.add('out');
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 520);
  }
  function liveStep() {
    if (!liveOn || !wishes.length || document.hidden || dialogsOpen || !$('#sheet').hidden) return;
    bubble(wishes[liveIdx % wishes.length]);
    liveIdx++;
  }
  function startLive() {
    setLive(liveOn);
    if (liveTimer) return;
    liveStep();
    liveTimer = setInterval(liveStep, 3600);
  }
  live.addEventListener('click', function () { renderWishList(); openDialog($('#wishesDlg')); });
  liveX.addEventListener('click', function () { setLive(false); });
  $('#liveToggle').addEventListener('change', function () { setLive(this.checked); });
  $('#chatBtn').addEventListener('click', function () { renderWishList(); openDialog($('#wishesDlg')); });

  /* Thanh dưới: gửi lời chúc, thu gọn khi cuộn xuống */
  var bar = $('#bar'), input = $('#wishInput'), nameDlg = $('#nameDlg');
  function expandDock() { body.classList.toggle('compact', false); }
  input.addEventListener('input', function () { bar.classList.toggle('has', !!input.value.trim()); });
  input.addEventListener('focus', expandDock);
  $('#writeWish').addEventListener('click', function () {
    closeDialog($('#wishesDlg'), function () { expandDock(); setTimeout(function () { input.focus(); }, 300); });
  });
  var lastY = 0, ticking = false;
  window.addEventListener('scroll', function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var y = window.scrollY;
      if (document.activeElement !== input) {
        if (y > lastY + 8 && y > 240) body.classList.add('compact');
        else if (y < lastY - 8 || y < 120) body.classList.toggle('compact', false);
      }
      lastY = y; ticking = false;
    });
  }, { passive: true });

  function sendWish(name, message) {
    var w = { type: 'wish', name: name, message: message, invitedAs: guest };
    return post(w).then(function (r) {
      w.time = new Date().toISOString().slice(0, 10); delete w.type;
      if (r.preview) store(key + ':wishes', [w].concat(localWishes()).slice(0, 50));
      wishes.unshift(w); renderWishList();
      if (liveOn) bubble(w, true);
      burst(6);
    });
  }
  bar.addEventListener('submit', function (e) {
    e.preventDefault();
    var msg = input.value.trim(), name = store(key + ':name');
    if (!msg || !name) {
      $('#wishName').value = name || guest || '';
      $('#wishText').value = msg;
      $('#nameMsg').textContent = '';
      openDialog(nameDlg);
      setTimeout(function () { ($('#wishName').value ? $('#wishText') : $('#wishName')).focus(); }, 60);
      return;
    }
    input.value = ''; bar.classList.toggle('has', false); input.blur();
    sendWish(name, msg).catch(function () { input.value = msg; });
  });
  $('#nameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var name = $('#wishName').value.trim(), msg = $('#wishText').value.trim(), m = $('#nameMsg');
    if (!name || !msg) { m.textContent = 'Bạn điền tên và lời chúc giúp chúng mình nhé.'; return; }
    var btn = $('#nameSubmit'); btn.disabled = true;
    store(key + ':name', name);
    sendWish(name, msg).then(function () {
      input.value = ''; bar.classList.toggle('has', false);
      closeDialog(nameDlg);
    }).catch(function () { m.textContent = 'Gửi chưa được, bạn kiểm tra mạng rồi thử lại nhé.'; })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Thả tim ---------- */
  var fly = $('#fly'), heartBtn = $('#heartBtn'), myHearts = +store(key + ':hearts') || 0, pending = 0, pendingSent = 0, flushT = null;
  var COLORS = ['#e0505f', '#f07a8c', '#ff9db0', '#e0505f', '#c8374b'];
  function renderHearts() {
    var n = W.endpoint ? serverHearts + pendingSent : myHearts;
    $('#heartCount').textContent = n > 999 ? Math.floor(n / 100) / 10 + 'k' : n;
  }
  function spawnHeart(soft) {
    if (reduce) return;
    var fr = fly.getBoundingClientRect(), br = heartBtn.getBoundingClientRect();
    var x = br.left - fr.left + 14, y = br.top - fr.top - 4;
    var el = document.createElement('div');
    el.className = 'fh';
    el.style.color = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.innerHTML = A.heartSvg();
    fly.appendChild(el);
    var rise = 280 + Math.random() * 240, sway = 16 + Math.random() * 22, dir = Math.random() < .5 ? -1 : 1;
    var s = soft ? .55 + Math.random() * .3 : .85 + Math.random() * .45, rot = (Math.random() - .5) * 40;
    var anim = el.animate([
      { transform: 'translate(' + x + 'px,' + y + 'px) scale(.3)', opacity: 0 },
      { transform: 'translate(' + (x + dir * sway * .5) + 'px,' + (y - rise * .2) + 'px) scale(' + s + ') rotate(' + rot * .3 + 'deg)', opacity: soft ? .75 : 1, offset: .15 },
      { transform: 'translate(' + (x - dir * sway) + 'px,' + (y - rise * .55) + 'px) scale(' + s + ') rotate(' + -rot * .5 + 'deg)', opacity: soft ? .6 : .95, offset: .55 },
      { transform: 'translate(' + (x + dir * sway * .6) + 'px,' + (y - rise) + 'px) scale(' + s * .9 + ') rotate(' + rot + 'deg)', opacity: 0 },
    ], { duration: 2300 + Math.random() * 1100, easing: 'cubic-bezier(.33,0,.4,1)' });
    anim.onfinish = function () { el.remove(); };
  }
  function burst(n) { for (var i = 0; i < n; i++) setTimeout(spawnHeart, i * 90); }
  heartBtn.addEventListener('click', function () {
    spawnHeart();
    heartBtn.classList.remove('pop'); void heartBtn.offsetWidth; heartBtn.classList.add('pop');
    if (W.endpoint) {
      pending++; pendingSent++;
      clearTimeout(flushT);
      flushT = setTimeout(function () { var n = pending; pending = 0; post({ type: 'heart', n: n }).catch(function () {}); }, 1200);
    } else {
      myHearts++; store(key + ':hearts', myHearts);
    }
    renderHearts();
  });
  function ambient() {
    if (body.classList.contains('open') && !document.hidden && !dialogsOpen) spawnHeart(true);
    setTimeout(ambient, 2600 + Math.random() * 3200);
  }

  /* ---------- Mục lục ---------- */
  var sheet = $('#sheet');
  var links = [['#loi-moi', 'Lời mời'], ['#dem-nguoc', 'Đếm ngược'], ['#lich', 'Lịch cưới'], ['#chuyen-tinh', 'Chuyện tình'],
    ['#lich-trinh', 'Lịch trình'], ['#album', 'Album ảnh'], ['#xac-nhan', 'Xác nhận'], ['#qua-mung', 'Quà mừng']];
  links = links.filter(function (l) { var t = $(l[0]); return t && !t.hidden && !t.hasAttribute('data-nolink'); });
  $('#sheetLinks').innerHTML = links.map(function (l) { return '<a href="' + l[0] + '">' + l[1] + '</a>'; }).join('');
  function openSheet() { sheet.hidden = false; requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add('show'); }); }); }
  function closeSheet(cb) {
    sheet.classList.toggle('show', false);
    setTimeout(function () { sheet.hidden = true; if (cb) cb(); }, reduce ? 0 : 380);
  }
  $('#menuBtn').addEventListener('click', openSheet);
  $$('[data-close]', sheet).forEach(function (el) { el.addEventListener('click', function () { closeSheet(); }); });
  $$('#sheetLinks a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var t = $(a.getAttribute('href'));
      closeSheet(function () { t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); });
    });
  });
  $('#openWishes').addEventListener('click', function () { closeSheet(function () { renderWishList(); openDialog($('#wishesDlg')); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !sheet.hidden) closeSheet(); });

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

  /* ---------- Hiện dần khi cuộn tới ---------- */
  function startReveal() {
    var els = $$('.rv, .lt, .swash');
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(function (el) { el.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.filter(function (e) { return e.isIntersecting; })
        .sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left; })
        .forEach(function (e, i) {
          e.target.style.setProperty('--rd', Math.min(i * .09, .45).toFixed(2) + 's');
          e.target.classList.add('in');
          $$('.lt', e.target).forEach(function (c) { c.style.setProperty('--rd', '.55s'); c.classList.add('in'); });
          io.unobserve(e.target);
        });
    }, { threshold: .12, rootMargin: '0px 0px -6% 0px' });
    els.forEach(function (el) { if (!el.closest('.swash') || el.classList.contains('swash')) io.observe(el); });
  }

  /* ---------- Mở cửa thiệp ----------
     Toàn bộ chuỗi chạy bằng Web Animations, chỉ đổi transform và opacity trên các lớp đã
     được chuẩn bị sẵn (will-change), nên trình duyệt dựng hình trên GPU ở 60 khung/giây.
     Mọi animation được tạo ngay lúc chạm (kèm độ trễ), không đổi class hay bố cục giữa chừng;
     việc nặng (mở khoá cuộn, lời chúc, tim bay) chỉ làm sau khi cửa đã mở xong.
       0.0s  dấu sáp nhấn xuống rồi nhấc lên, mờ dần          (1.1s)
       0.6s  hai cánh cửa mở chậm vào trong                  (2.8s)
       0.4s  phần mở đầu phía sau lùi nhẹ từ 108% về 100%      (3.6s)
       1.5s  dấu sáp, tên, ngày... lần lượt hiện ra
       3.4s  ẩn cửa, mở khoá cuộn, hiện thanh dưới
       4.0s  lời chúc chạy, tim bay */
  var gate = $('#gate'), opened = false;
  var T = { seal: 1100, doorDelay: 600, door: 2800, zoomDelay: 400, zoom: 3600, itemsDelay: 1000 };
  // Đồng hồ theo dòng thời gian animation (đồng bộ với các animation khác, kể cả khi quay chậm)
  function wait(ms) { return root.animate([], { duration: ms }).finished; }
  function finishItem(el, anim) {
    anim.finished.then(function () { el.classList.add('shown'); anim.cancel(); }).catch(function () {});
  }
  function afterOpen() {
    gate.hidden = true;
    body.classList.add('open');
    body.classList.toggle('locked', false);
    startReveal();
    watchVisible();
  }
  // Gắn class .vis cho phần đang trên màn hình: hoạ tiết lặp chỉ chạy ở đó, phần khuất thì tạm dừng
  function watchVisible() {
    if (!('IntersectionObserver' in window)) { $$('.shell > section').forEach(function (s) { s.classList.add('vis'); }); return; }
    var vo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle('vis', e.isIntersecting); });
    }, { rootMargin: '80px 0px' });
    $$('.shell > section').forEach(function (s) { vo.observe(s); });
  }
  // Dựng sẵn mọi animation ở trạng thái tạm dừng ngay khi trang sẵn sàng, để lúc chạm chỉ việc
  // bấm "chạy" (không phải tính lại kiểu dáng hay vẽ lại gì vào đúng khoảnh khắc đó).
  var openAnims = null;
  function buildOpening() {
    if (openAnims || reduce || !root.animate) return;
    openAnims = [];
    function add(el, frames, timing) { var a = el.animate(frames, timing); a.pause(); openAnims.push(a); return a; }
    // 1. Dấu sáp: nhấn xuống, nhấc lên, mờ dần
    add($('#gateSeal'), [
      { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 },
      { transform: 'translate(-50%,-50%) scale(.93)', opacity: 1, offset: .2 },
      { transform: 'translate(-50%,-51.5%) scale(1.03)', opacity: 1, offset: .42 },
      { transform: 'translate(-50%,-56%) scale(1.1)', opacity: 0 },
    ], { duration: T.seal, easing: 'cubic-bezier(.33,0,.25,1)', fill: 'forwards' });
    add($('.gate-foot'), [{ opacity: 1 }, { opacity: 0 }], { duration: 500, easing: 'ease-out', fill: 'forwards' });
    // 2. Hai cánh cửa mở chậm: khởi động nhẹ, lướt đều, dừng êm
    var doorTiming = { duration: T.door, delay: T.doorDelay, easing: 'cubic-bezier(.6,0,.2,1)', fill: 'forwards' };
    add($('.door.l'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(100deg)' }], doorTiming);
    add($('.door.r'), [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-100deg)' }], doorTiming);
    $$('.door .shade').forEach(function (sh) { add(sh, [{ opacity: 0 }, { opacity: 1 }], doorTiming); });
    // 3. Phần mở đầu phía sau lùi nhẹ về đúng cỡ, tạo chiều sâu khi bước qua cửa
    var zoom = add($('#dau-trang'), [{ transform: 'scale(1.08)' }, { transform: 'scale(1)' }],
      { duration: T.zoom, delay: T.zoomDelay, easing: 'cubic-bezier(.2,.65,.25,1)', fill: 'both' });
    zoom.finished.then(function () { zoom.cancel(); }).catch(function () {});
    // 4. Dấu sáp, tên, ngày... lần lượt hiện ra khi cửa đã hé
    $$('.hi').forEach(function (el) {
      var d = parseFloat(el.style.getPropertyValue('--d')) || 0;
      var seal = el.classList.contains('hero-seal');
      var a = add(el, [{ opacity: 0, transform: seal ? 'scale(.7)' : 'translateY(14px)' }, { opacity: 1, transform: 'none' }], {
        duration: 1400, delay: T.itemsDelay + d * 900, fill: 'both',
        easing: seal ? 'cubic-bezier(.34,1.3,.64,1)' : 'cubic-bezier(.16,1,.3,1)',
      });
      finishItem(el, a);
    });
  }
  function open() {
    if (opened) return;
    opened = true;
    if (audio) audio.play().then(function () { setPlaying(true); }).catch(function () { setPlaying(false); });
    if (reduce || !root.animate) {
      $$('.hi').forEach(function (el) { el.classList.add('shown'); });
      afterOpen();
      loadWishes().then(startLive);
      return;
    }
    buildOpening();
    openAnims.forEach(function (a) { a.play(); });
    // 5. Cửa mở xong thì ẩn; khi mọi chuyển động đã dừng mới mở khoá cuộn và làm các việc nặng
    wait(T.doorDelay + T.door).then(function () {
      gate.hidden = true;
      return wait(T.zoomDelay + T.zoom - T.doorDelay - T.door);
    }).then(function () {
      afterOpen();
      return wait(500);
    }).then(function () {
      loadWishes().then(startLive);
      ambient();
    });
  }
  gate.addEventListener('click', open);
  gate.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } });
  renderHearts();
  liveX.hidden = true;
  if (!W.endpoint) loadWishes();

  /* ---------- Cửa thiệp hiện ra khi font đã tải ---------- */
  var readyDone = false;
  function ready() { if (!readyDone) { readyDone = true; body.classList.add('ready'); setTimeout(buildOpening, 60); } }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(ready);
  setTimeout(ready, 1500);
})();
