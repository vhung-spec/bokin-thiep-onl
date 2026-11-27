/*
 * Chương trình lễ cưới (nhà gái, nhà trai) + checklist ban tổ chức.
 * Nội dung nằm trong chuong-trinh.json — gia đình chỉ sửa tệp đó.
 * Tệp này chỉ vẽ giao diện và điều khiển ba thẻ: Lộ trình / Nhà gái / Nhà trai.
 */
(function () {
  'use strict';

  var DATA_URL = 'chuong-trinh.json';
  var KEY_CHECK = 'chuong-trinh:checklist';
  var VIEWS = { 'lo-trinh': '#lo-trinh-di-chuyen', 'nha-gai': '#chuong-trinh-nha-gai', 'nha-trai': '#chuong-trinh-nha-trai' };
  var DATA = null;

  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function str(s) { return typeof s === 'string' ? s.trim() : ''; }
  function list(a) { return (a || []).map(str).filter(Boolean); }
  function two(n) { return (n < 10 ? '0' : '') + n; }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }

  /* ---------- Ba thẻ ---------- */
  function viewFromHash() {
    var h = location.hash;
    if (h === '#chuong-trinh-nha-gai') return 'nha-gai';
    if (h === '#chuong-trinh-nha-trai' || h === '#checklist' || /^#ct-trai-/.test(h)) return 'nha-trai';
    if (/^#ct-gai-/.test(h)) return 'nha-gai';
    return 'lo-trinh';
  }
  function show(view, scroll) {
    document.querySelectorAll('.view').forEach(function (v) { v.hidden = v.getAttribute('data-view') !== view; });
    document.querySelectorAll('#tabs .tab').forEach(function (t) {
      if (t.getAttribute('data-tab') === view) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    });
    document.body.setAttribute('data-view', view);
    closeReader();
    if (scroll) {
      var tabs = $('tabs');
      var top = tabs.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > top) window.scrollTo(0, top);
    }
  }
  $('tabs').addEventListener('click', function (e) {
    var a = e.target.closest('.tab');
    if (!a) return;
    e.preventDefault();
    var view = a.getAttribute('data-tab');
    if (history.pushState) history.pushState(null, '', VIEWS[view]); else location.hash = VIEWS[view];
    show(view, true);
  });
  window.addEventListener('hashchange', function () { show(viewFromHash(), false); });
  window.addEventListener('popstate', function () { show(viewFromHash(), true); });
  show(viewFromHash(), false);

  /* ---------- Sao chép (có dự phòng cho trình duyệt trong Zalo) ---------- */
  function copyText(text, msg) {
    function done() { if (msg) { msg.textContent = 'Đã sao chép. Dán vào Zalo hoặc Ghi chú để dùng.'; msg.hidden = false; } }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.top = '-1000px';
      document.body.appendChild(ta); ta.select();
      var ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) done();
      else if (msg) { msg.textContent = 'Máy chưa cho sao chép tự động. Chạm giữ vào đoạn chữ để sao chép.'; msg.hidden = false; }
    }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback);
    else fallback();
  }

  /* ---------- Văn bản kịch bản (để sao chép) ---------- */
  function stepText(st, part) {
    var dur = st.thoiLuongPhut ? ' (' + st.thoiLuongPhut + ' phút)' : '';
    var t = (part === 'gai' ? 'Bước ' : 'Phân cảnh ') + st.so + '. ' + str(st.ten) + dur + '\n';
    if (str(st.phuTrach)) t += 'Phụ trách: ' + str(st.phuTrach) + '\n';
    list(st.tomTat).forEach(function (x) { t += '- ' + x + '\n'; });
    var ld = list(st.loiDan);
    if (ld.length) t += '\n' + (str(st.nhanLoi) || 'Lời dẫn') + ':\n' + ld.join('\n\n') + '\n';
    var hd = list(st.huongDan);
    if (hd.length) t += '\nHướng dẫn thực hiện:\n' + hd.map(function (x) { return '- ' + x; }).join('\n') + '\n';
    if (str(st.amNhac)) t += 'Âm nhạc: ' + str(st.amNhac) + '\n';
    return t;
  }
  function programText(p, part) {
    var t = str(DATA.tieuDe).toUpperCase() + ' — ' + str(DATA.doiTen) + ' — ' + str(DATA.ngay) + '\n' + str(p.tieuDe) + '\n';
    if (str(p.dieuHanh)) t += 'Điều hành: ' + str(p.dieuHanh) + '\n';
    if (str(p.ghiChu)) t += str(p.ghiChu) + '\n';
    if (str(p.moDau)) t += str(p.moDau) + '\n';
    t += 'Tổng thời lượng: ' + totalText(p) + '\n\n';
    return t + (p.buoc || []).map(function (st) { return stepText(st, part); }).join('\n');
  }
  // Tổng thời lượng tự cộng từ thoiLuongPhut của các bước; ghiChuThoiLuong là lời nhắc kèm theo
  function sumMin(p) { return (p.buoc || []).reduce(function (a, b) { return a + (Number(b.thoiLuongPhut) || 0); }, 0); }
  function totalText(p) {
    if (str(p.tongThoiLuong)) return str(p.tongThoiLuong);
    var n = sumMin(p);
    return n ? 'khoảng ' + n + ' phút' + (str(p.ghiChuThoiLuong) ? ' (' + str(p.ghiChuThoiLuong) + ')' : '') : '';
  }

  /* ---------- Vẽ một chương trình (bố cục theo mẫu: thẻ giới thiệu, thanh công cụ, thẻ từng bước) ---------- */
  function metaText(st) {
    var m = [];
    if (st.thoiLuongPhut) m.push(st.thoiLuongPhut + ' phút');
    if (str(st.phuTrach)) m.push(str(st.phuTrach));
    return m.join(' · ');
  }
  function renderStep(st, part) {
    var id = 'ct-' + part + '-' + st.so;
    var ld = list(st.loiDan), hd = list(st.huongDan), tt = list(st.tomTat);
    var html = '<li class="st' + (st.noiBat ? ' noi-bat' : '') + '" id="' + id + '"><div class="st-head">' +
      '<span class="st-no" aria-hidden="true">' + two(st.so) + '</span><div class="st-title">';
    if (st.noiBat) html += '<p class="st-flag">★ Phân cảnh quan trọng</p>';
    html += '<h3><span class="sr">' + (part === 'gai' ? 'Bước ' : 'Phân cảnh ') + st.so + '. </span>' + esc(st.ten) + '</h3>';
    if (metaText(st)) html += '<p class="st-meta">' + esc(metaText(st)) + '</p>';
    html += '</div></div>';
    if (tt.length === 1) html += '<p class="st-note">' + esc(tt[0]) + '</p>';
    else if (tt.length) html += '<ul class="st-note">' + tt.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
    if (str(st.amNhac)) html += '<p class="st-music"><b>Âm nhạc:</b> ' + esc(st.amNhac) + '</p>';
    if (ld.length || hd.length) {
      html += '<details class="st-more"><summary><span class="when-closed">' + (ld.length ? 'Xem lời dẫn chi tiết' : 'Xem hướng dẫn chi tiết') +
        '</span><span class="when-open">Đang mở chi tiết</span></summary><div class="st-body">';
      if (ld.length) {
        html += '<p class="ld-k">' + esc(str(st.nhanLoi) || 'Lời dẫn') + '</p><div class="loi-dan">' + paras(ld) + '</div>' +
          '<button class="btn ghost small" type="button" data-copy-step="' + st.so + '">Sao chép lời dẫn</button>' +
          '<p class="copy-msg" role="status" aria-live="polite" hidden></p>';
      }
      if (hd.length) html += '<p class="ld-k">Hướng dẫn thực hiện</p><ul class="st-guide">' + hd.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      html += '<button class="btn ghost small collapse" type="button" data-collapse>Thu gọn ▲</button></div></details>';
    }
    return html + '</li>';
  }
  // đoạn trong ngoặc "(Sau khi trao tay)" là ghi chú cho người đọc, in nghiêng
  function paras(ld) {
    return ld.map(function (x) { return /^\(.*\)$/.test(x) ? '<p class="cue">' + esc(x) + '</p>' : '<p>' + esc(x) + '</p>'; }).join('');
  }
  function toolbar() {
    return '<div class="ct-tools">' +
      '<button class="btn ghost" type="button" data-all>Mở tất cả</button>' +
      '<button class="btn ghost" type="button" data-none>Thu gọn</button>' +
      '<button class="btn primary" type="button" data-reader>Đọc kịch bản</button>' +
      '<button class="btn ghost" type="button" data-copy-all>Sao chép tất cả</button>' +
      '<p class="copy-msg" role="status" aria-live="polite" hidden></p></div>';
  }
  function renderProgram(p, part) {
    var steps = p.buoc || [];
    var html = '<div class="ct-intro"><p class="ct-k">' + esc(DATA.tieuDe) + '</p>' +
      '<h2>' + esc(p.tieuNgan || p.tieuDe) + '</h2>' +
      '<p class="ct-who">Điều hành: <b>' + esc(p.dieuHanh) + '</b></p>' +
      '<p class="ct-dur">Thời lượng: <b>' + esc(totalText(p)) + '</b></p>' +
      (str(p.ghiChu) ? '<p class="ct-note">' + esc(p.ghiChu) + '</p>' : '') +
      (str(p.moDau) ? '<p class="ct-note">' + esc(p.moDau) + '</p>' : '') + '</div>';
    html += toolbar();
    if (part === 'trai') {
      html += '<details class="ct-table card"><summary>Bảng tổng quan ' + steps.length + ' phân cảnh</summary><table><thead><tr><th>STT</th><th>Nội dung</th><th>Phút</th></tr></thead><tbody>' +
        steps.map(function (st) {
          return '<tr' + (st.noiBat ? ' class="hl"' : '') + '><td class="num">' + two(st.so) + '</td><td><a href="#ct-trai-' + st.so + '" data-jump>' + esc(st.ten) + '</a></td><td class="num">' + esc(st.thoiLuongPhut || '') + '</td></tr>';
        }).join('') +
        '</tbody><tfoot><tr><td></td><td>Tổng</td><td class="num">' + esc(sumMin(p) + ' phút') + '</td></tr></tfoot></table></details>';
    }
    html += '<ol class="ct-steps">' + steps.map(function (st) { return renderStep(st, part); }).join('') + '</ol>';
    if (part === 'trai') html += renderChecklist();
    return html;
  }

  /* ---------- Chế độ đọc kịch bản: toàn màn hình, chữ lớn, A− / A+ ---------- */
  var KEY_FONT = 'chuong-trinh:co-chu', wake = null, readerPart = 'gai';
  function fontSize() { var n = Number(store(KEY_FONT)); return n >= 18 && n <= 40 ? n : 24; }
  function setFont(n) {
    n = Math.max(18, Math.min(40, n)); store(KEY_FONT, String(n));
    $('reader').style.setProperty('--doc', n + 'px');
    $('readerSize').textContent = n + 'px';
  }
  function openReader(part) {
    var p = part === 'gai' ? DATA.nhaGai : DATA.nhaTrai;
    readerPart = part;
    var r = $('reader');
    r.className = 'reader r-' + part;
    $('readerTitle').textContent = str(p.tenDoc) || str(p.tieuDe);
    $('readerBody').innerHTML = (p.buoc || []).map(function (st) {
      var ld = list(st.loiDan), hd = list(st.huongDan);
      var body = ld.length ? '<div class="r-speech">' + paras(ld) + '</div>' :
        '<ul class="r-sum">' + list(st.tomTat).concat(hd).map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul>';
      return '<article class="r-step' + (st.noiBat ? ' noi-bat' : '') + '"><h3>' + st.so + '. ' + esc(st.ten) + '</h3>' +
        (metaText(st) ? '<p class="r-meta">' + esc(metaText(st)) + '</p>' : '') + body + '</article>';
    }).join('') + '<p class="r-end">— Hết kịch bản —</p>';
    setFont(fontSize());
    r.hidden = false; r.scrollTop = 0;
    document.documentElement.classList.add('reading');
    if (navigator.wakeLock && navigator.wakeLock.request) navigator.wakeLock.request('screen').then(function (w) { wake = w; }, function () {});
    $('readerClose').focus();
  }
  function closeReader() {
    var r = $('reader'); if (!r || r.hidden) return;
    r.hidden = true;
    document.documentElement.classList.remove('reading');
    if (wake) { try { wake.release(); } catch (e) { /* bỏ qua */ } wake = null; }
  }
  function buildReader() {
    var r = document.createElement('section');
    r.id = 'reader'; r.hidden = true; r.setAttribute('role', 'dialog'); r.setAttribute('aria-label', 'Chế độ đọc kịch bản');
    r.innerHTML = '<div class="r-bar"><button type="button" id="readerClose">← Thoát</button>' +
      '<button type="button" data-size="-2" aria-label="Chữ nhỏ hơn">A−</button><span id="readerSize" class="r-size"></span>' +
      '<button type="button" data-size="2" aria-label="Chữ to hơn">A+</button>' +
      '<button type="button" data-r-copy>Sao chép</button></div>' +
      '<p class="copy-msg r-msg" role="status" aria-live="polite" hidden></p>' +
      '<div class="r-inner"><h2 id="readerTitle"></h2><div id="readerBody"></div></div>';
    document.body.appendChild(r);
    r.addEventListener('click', function (e) {
      var b;
      if (e.target.closest('#readerClose')) closeReader();
      else if ((b = e.target.closest('[data-size]'))) setFont(fontSize() + Number(b.getAttribute('data-size')));
      else if (e.target.closest('[data-r-copy]')) {
        var p = readerPart === 'gai' ? DATA.nhaGai : DATA.nhaTrai;
        copyText(programText(p, readerPart), r.querySelector('.r-msg'));
      }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeReader(); });
  }

  /* ---------- Checklist ---------- */
  function checked() { try { return JSON.parse(store(KEY_CHECK) || '{}') || {}; } catch (e) { return {}; } }
  function renderChecklist() {
    var items = list(DATA.checklist), c = checked();
    if (!items.length) return '';
    var n = items.filter(function (x, i) { return c[i]; }).length;
    return '<details class="checklist" id="checklist"><summary>Checklist chuẩn bị cho ban tổ chức <span class="ck-count">' + n + '/' + items.length + '</span></summary>' +
      '<ul>' + items.map(function (x, i) {
        return '<li><label><input type="checkbox" data-ck="' + i + '"' + (c[i] ? ' checked' : '') + '><span>' + esc(x) + '</span></label></li>';
      }).join('') + '</ul><p class="ck-note">Dấu tích chỉ lưu trên điện thoại này.</p></details>';
  }
  function updateCount() {
    var box = $('checklist'); if (!box) return;
    var all = box.querySelectorAll('input[data-ck]'), n = 0;
    all.forEach(function (x) { if (x.checked) n++; });
    box.querySelector('.ck-count').textContent = n + '/' + all.length;
  }

  /* ---------- Sự kiện ---------- */
  function onClick(e) {
    var t = e.target, sec = t.closest('.ct');
    if (!sec || !DATA) return;
    var part = sec.classList.contains('ct-gai') ? 'gai' : 'trai';
    var prog = part === 'gai' ? DATA.nhaGai : DATA.nhaTrai;
    var b;
    if ((b = t.closest('[data-all]'))) sec.querySelectorAll('details.st-more').forEach(function (d) { d.open = true; });
    else if ((b = t.closest('[data-none]'))) sec.querySelectorAll('details.st-more').forEach(function (d) { d.open = false; });
    else if ((b = t.closest('[data-reader]'))) openReader(part);
    else if ((b = t.closest('[data-copy-all]'))) copyText(programText(prog, part), b.parentNode.querySelector('.copy-msg'));
    else if ((b = t.closest('[data-copy-step]'))) {
      var so = Number(b.getAttribute('data-copy-step'));
      var st = (prog.buoc || []).filter(function (x) { return x.so === so; })[0];
      if (st) copyText(list(st.loiDan).join('\n\n'), b.parentNode.querySelector('.copy-msg'));
    } else if ((b = t.closest('[data-collapse]'))) {
      var d = b.closest('details'); d.open = false;
      var li = d.closest('.st'); if (li && li.getBoundingClientRect().top < 0) li.scrollIntoView({ block: 'start' });
    } else if ((b = t.closest('[data-jump]'))) {
      e.preventDefault();
      var el = document.querySelector(b.getAttribute('href')); if (el) el.scrollIntoView({ block: 'start' });
    }
  }
  ['chuong-trinh-nha-gai', 'chuong-trinh-nha-trai'].forEach(function (id) {
    $(id).addEventListener('click', onClick);
    $(id).addEventListener('change', function (e) {
      var x = e.target.closest('input[data-ck]'); if (!x) return;
      var c = checked(); c[x.getAttribute('data-ck')] = x.checked; store(KEY_CHECK, JSON.stringify(c)); updateCount();
    });
  });

  /* ---------- Tải dữ liệu ---------- */
  fetch(DATA_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
    .then(function (d) {
      DATA = d;
      buildReader();
      $('chuong-trinh-nha-gai').innerHTML = renderProgram(d.nhaGai || {}, 'gai');
      $('chuong-trinh-nha-trai').innerHTML = renderProgram(d.nhaTrai || {}, 'trai');
      // link có #ct-trai-7 / #checklist: mở đúng chỗ
      var h = location.hash && document.getElementById(location.hash.slice(1));
      if (h && h.closest('.ct')) { if (h.tagName === 'DETAILS') h.open = true; h.scrollIntoView({ block: 'start' }); }
    })
    .catch(function () {
      ['chuong-trinh-nha-gai', 'chuong-trinh-nha-trai'].forEach(function (id) {
        $(id).innerHTML = '<p class="alert">Chưa tải được chương trình (mạng yếu hoặc tệp chuong-trinh.json đang sai định dạng). Hãy tải lại trang.</p>';
      });
    });
})();
