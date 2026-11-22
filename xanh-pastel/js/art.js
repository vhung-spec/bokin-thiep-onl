/*
 * Hình vẽ SVG tự vẽ cho mẫu thiệp "Xanh pastel" (tông xanh xô thơm & vàng):
 * mép giấy xé, biểu tượng lịch trình, chữ T uốn lượn, phong bì ren, trái tim.
 * Giấy dập nổi lá cây, dấu sáp vàng, cành lá vàng là ảnh trong assets/ (tạo bằng tools/hoa-tiet/*.py).
 */
(function () {
  /* ---------- Số ngẫu nhiên có hạt giống (hình giống nhau mỗi lần tải) ---------- */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function f1(n) { return Math.round(n * 10) / 10; }
  function svgUrl(svg) { return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")'; }
  var uid = 0;

  /* ---------- Gradient & bộ lọc dùng chung ---------- */
  function installDefs() {
    if (document.getElementById('art-defs')) return;
    var g = '';
    function lin(id, a, b, x2, y2) {
      g += '<linearGradient id="' + id + '" x1="0" y1="1" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 0 : y2) + '">' +
        '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
    }
    // cánh hoa xanh: gốc nhạt -> mép xanh
    lin('bp1', '#eef3fd', '#7896db');
    lin('bp2', '#f6f8fe', '#9db4e8');
    lin('bp3', '#ffffff', '#c3d2f2');
    // cánh hoa trắng giấy: gốc hơi xám -> mép trắng
    lin('wp1', '#cfd6e6', '#ffffff');
    lin('wp2', '#dde3ef', '#ffffff');
    lin('wp3', '#e8ecf5', '#ffffff');
    lin('sage', '#b9c3b4', '#8b9a88', 1, 0);
    lin('sageB', '#c8d0dc', '#93a1b8', 1, 0);
    g += '<radialGradient id="waxG" cx=".38" cy=".3" r=".85"><stop offset="0" stop-color="#f6e6c8"/><stop offset=".5" stop-color="#d3ac74"/><stop offset="1" stop-color="#9c6d3a"/></radialGradient>';
    g += '<radialGradient id="ctrB" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fbf6e6"/><stop offset="1" stop-color="#d9e2f5"/></radialGradient>';
    g += '<linearGradient id="icoB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#dcb983"/><stop offset="1" stop-color="#8f6332"/></linearGradient>';
    g += '<linearGradient id="envB" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c3c8a6"/><stop offset="1" stop-color="#8f9872"/></linearGradient>';
    g += '<filter id="wc" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".3"/></filter>';
    g += '<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#3a3a1e" flood-opacity=".22"/></filter>';
    g += '<filter id="shadowS" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.4" flood-color="#3a3a1e" flood-opacity=".22"/></filter>';
    var wrap = document.createElement('div');
    wrap.innerHTML = '<svg id="art-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + g + '</defs></svg>';
    document.body.insertBefore(wrap.firstChild, document.body.firstChild);
  }

  // Cánh hoa có mép gợn sóng, gốc ở (0,0) hướng lên (dùng cho hoa trắng sau dấu sáp)
  function ruffle(len, w, waves) {
    waves = waves || 3;
    var d = 'M0 0 C' + f1(-w * .9) + ' ' + f1(-len * .2) + ' ' + f1(-w * 1.05) + ' ' + f1(-len * .7) + ' ' + f1(-w * .8) + ' ' + f1(-len * .88);
    for (var i = 0; i < waves; i++) {
      var x0 = -w * .8 + (w * 1.6) * i / waves, x1 = -w * .8 + (w * 1.6) * (i + 1) / waves;
      var top = -len * (i % 2 ? 1.02 : .97);
      d += ' Q' + f1((x0 + x1) / 2) + ' ' + f1(top - len * .1) + ' ' + f1(x1) + ' ' + f1(-len * (i === waves - 1 ? .88 : .93));
    }
    return d + ' C' + f1(w * 1.05) + ' ' + f1(-len * .7) + ' ' + f1(w * .9) + ' ' + f1(-len * .2) + ' 0 0Z';
  }

  /* =========================================================
     Hoa
     ========================================================= */
  // Hoa trắng nhiều lớp (như hoa giấy)
  function paperFlower(cx, cy, r, rot) {
    var s = '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + (rot || 0) + ')">';
    var rings = [[9, r, r * .5, 'url(#wp1)', 0], [8, r * .78, r * .44, 'url(#wp2)', 18], [7, r * .56, r * .36, 'url(#wp2)', 6], [6, r * .36, r * .26, 'url(#wp3)', 30]];
    rings.forEach(function (g) {
      var o = '';
      for (var i = 0; i < g[0]; i++) {
        var a = g[4] + i * 360 / g[0] + (i % 2 ? 5 : -3);
        o += '<path transform="rotate(' + f1(a) + ')" d="' + ruffle(g[1] * (i % 3 ? 1 : .92), g[2], 4) + '" fill="' + g[3] + '" stroke="#aab6cf" stroke-opacity=".45" stroke-width=".55"/>';
      }
      s += '<g filter="url(#shadowS)">' + o + '</g>';
    });
    s += '<circle r="' + f1(r * .12) + '" fill="#eef1f8"/>';
    for (var k = 0; k < 8; k++) {
      var b = k / 8 * Math.PI * 2;
      s += '<circle cx="' + f1(Math.cos(b) * r * .09) + '" cy="' + f1(Math.sin(b) * r * .09) + '" r="' + f1(r * .022 + .3) + '" fill="#b9c3d8"/>';
    }
    return s + '</g>';
  }
  function leaf(x, y, rot, len, blue) {
    var w = len * .27;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<path d="M0 0 C' + f1(len * .25) + ' ' + f1(-w) + ' ' + f1(len * .7) + ' ' + f1(-w * .9) + ' ' + len + ' 0 C' + f1(len * .7) + ' ' + f1(w * .9) + ' ' + f1(len * .25) + ' ' + f1(w) + ' 0 0Z" fill="url(#' + (blue ? 'sageB' : 'sage') + ')" opacity=".92"/>' +
      '<path d="M2 0 L' + f1(len * .92) + ' 0" stroke="#eef2ea" stroke-opacity=".6" stroke-width=".7"/></g>';
  }
  function paperFlowerSvg(r) {
    return '<svg class="art" viewBox="-30 -30 60 60" aria-hidden="true">' + paperFlower(0, 0, r || 26, 0) + '</svg>';
  }

  /* =========================================================
     Con dấu sáp xanh nhạt + hoa trắng
     ========================================================= */
  function sprig(color, dx, dy) {
    var s = '<g transform="translate(' + dx + ' ' + dy + ')" fill="none" stroke="' + color + '" stroke-width="1.35" stroke-linecap="round">' +
      '<path d="M0 17 C0 6 0 -6 0 -18 M0 4 C-5 0 -9 -6 -10 -13 M0 -1 C5 -5 8 -11 9 -17"/>';
    [[0, -14, 0], [0, -6, 1], [0, 2, -1], [0, 9, 1], [-6, -4, -1], [-9, -10, -1], [5, -9, 1], [8, -14, 1]].forEach(function (p) {
      var x = p[0], y = p[1], sd = p[2] || 1;
      s += '<path d="M' + x + ' ' + y + ' c' + 3 * sd + ' -1 ' + 6 * sd + ' -3 ' + 7 * sd + ' -6 c' + -3 * sd + ' 0 ' + -6 * sd + ' 2 ' + -7 * sd + ' 6"/>';
    });
    return s + '</g>';
  }
  function waxSeal(seed) {
    var R = rng(seed || 7), pts = [], n = 80;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, r = 30 + Math.sin(i * .55 + R()) * .8 + (R() - .5) * 1.2;
      pts.push(f1(Math.cos(a) * r) + ' ' + f1(Math.sin(a) * r));
    }
    return '<g filter="url(#shadow)"><path d="M' + pts.join(' L') + 'Z" fill="url(#waxG)"/></g>' +
      '<circle r="21.5" fill="none" stroke="#8a6130" stroke-opacity=".55" stroke-width="2"/>' +
      '<circle r="20" fill="none" stroke="#f0f8ff" stroke-opacity=".7" stroke-width=".8"/>' +
      '<circle r="18.6" fill="#ead3a8" fill-opacity=".35"/>' +
      sprig('#8a6130', .6, .8) + sprig('#f1f5fd', -.5, -.5) + sprig('#e3c999', 0, 0);
  }
  function sealFlower(opts) {
    opts = opts || {};
    var s = leaf(-34, 10, 200, 56) + leaf(30, 4, -25, 54) + leaf(-12, -18, 245, 42, true) + leaf(16, -20, -65, 40, true);
    s += paperFlower(0, 24, 56, 6);
    s += '<g transform="translate(0 -8)">' + waxSeal(opts.seed) + '</g>';
    return '<svg class="art seal-flower" viewBox="-80 -64 160 152" aria-hidden="true">' + s + '</svg>';
  }

  /* =========================================================
     Mép giấy xé
     ========================================================= */
  function tear(seed, dir, color) {
    var R = rng(seed), W = 400, H = 30, d = 'M0 ' + H, x = 0, pts = [];
    while (x <= W) {
      var y = H * .42 + Math.sin(x / 41 + seed) * 5 + Math.sin(x / 13 + seed * 2) * 2.2 + (R() - .5) * 4.5;
      pts.push([f1(x), f1(Math.max(2, Math.min(H - 5, y)))]);
      x += 1.5 + R() * 3.5;
    }
    pts.forEach(function (p) { d += ' L' + p[0] + ' ' + p[1]; });
    d += ' L' + W + ' ' + H + 'Z';
    var fiber = 'M' + pts.map(function (p) { return p[0] + ' ' + f1(+p[1] + 1.4 + R() * .8); }).join(' L');
    var tr = dir === 'down' ? ' transform="translate(0 ' + H + ') scale(1 -1)"' : '';
    return '<svg class="tear-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><g' + tr + '>' +
      '<path d="' + d + '" fill="' + (color || '#EFF0E8') + '"/>' +
      '<path d="' + fiber + '" fill="none" stroke="#fff" stroke-width="2.6" stroke-opacity=".95"/></g></svg>';
  }
  /* =========================================================
     Hoạ tiết & biểu tượng
     ========================================================= */
  function mandala() {
    var s = '';
    for (var i = 0; i < 4; i++) s += '<path transform="rotate(' + i * 90 + ')" d="M0 -3 C-4.5 -6 -4.5 -12 0 -15 C4.5 -12 4.5 -6 0 -3Z" fill="url(#icoB)"/>';
    for (var j = 0; j < 4; j++) s += '<path transform="rotate(' + (j * 90 + 45) + ')" d="M0 -3 C-2.5 -5 -2.5 -8 0 -9.5 C2.5 -8 2.5 -5 0 -3Z" fill="#d8bd8e"/>';
    for (var k = 0; k < 8; k++) s += '<circle transform="rotate(' + k * 45 + ')" cy="' + (k % 2 ? -12 : -18) + '" r="' + (k % 2 ? 1 : 1.3) + '" fill="#a87c45"/>';
    return '<svg class="art mandala" viewBox="-20 -20 40 40" aria-hidden="true">' + s + '<circle r="2.4" fill="#a87c45"/><circle r="1" fill="#fff"/></svg>';
  }
  function heartArrow() {
    return '<svg class="art heart-arrow" viewBox="-36 -24 72 48" aria-hidden="true"><g fill="none" stroke="#2D3826" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M2 14 C-12 4 -15 -6 -9 -10 C-5 -13 -1 -10 0 -6 C1 -11 7 -14 11 -10 C17 -5 12 5 2 14Z"/>' +
      '<path d="M-6 -2 C-2 -6 3 -3 0 1 C-3 5 4 7 8 2"/>' +
      '<path d="M-30 14 C-18 9 -4 1 24 -14"/><path d="M24 -14 L17 -13.5 M24 -14 L20.5 -8"/>' +
      '<path d="M-30 14 L-34 11 M-30 14 L-33 17 M-27 12.5 L-31 9.5 M-27 12.5 L-30 15.5"/></g></svg>';
  }
  function flourishLine() {
    return '<svg class="art flourish" viewBox="0 0 200 16" aria-hidden="true"><g fill="none" stroke="#2d3452" stroke-width=".9" stroke-linecap="round">' +
      '<path d="M8 9 C50 6 140 12 186 7"/><path d="M186 7 L179 4 M186 7 L180 11"/><path d="M8 9 L3 6 M8 9 L3 12 M12 8.6 L7 5.6 M12 8.6 L7 11.6"/></g></svg>';
  }
  // Trái tim + nhẫn (đánh dấu ngày cưới trên lịch)
  function heartRings() {
    return '<svg class="hr" viewBox="0 0 44 40" aria-hidden="true"><g fill="none" stroke="#5f7fca" stroke-width="1.3" stroke-linecap="round">' +
      '<path d="M22 37 C7 27 2 18 4 11 C6 4 15 2 22 10 C29 2 38 4 40 11 C42 18 37 27 22 37Z"/>' +
      '<circle cx="18.5" cy="19.5" r="5.2"/><circle cx="25.5" cy="19.5" r="5.2"/><path d="M16.5 13.2 L18.5 11 L20.5 13.2"/></g></svg>';
  }
  // Biểu tượng màu nước cho lịch trình
  var WC_ICONS = {
    cheers: '<g transform="rotate(-14 13 18)"><path d="M8 4h9l-1.4 9.5a3.2 3.2 0 0 1-6.2 0z" fill="url(#icoB)"/><path d="M12.5 16v8 M9 24h7" stroke="#8a6130" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>' +
      '<g transform="rotate(14 27 18)"><path d="M22 4h9l-1.4 9.5a3.2 3.2 0 0 1-6.2 0z" fill="url(#icoB)"/><path d="M26.5 16v8 M23 24h7" stroke="#8a6130" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>' +
      '<path d="M20 2.5c-1-1.6-3.2-.6-2.4 1 .4.8 2.4 2 2.4 2s2-1.2 2.4-2c.8-1.6-1.4-2.6-2.4-1z" fill="#c19a63"/>',
    rings: '<circle cx="14" cy="18" r="7.5" fill="none" stroke="url(#icoB)" stroke-width="2.6"/><circle cx="23" cy="18" r="7.5" fill="none" stroke="url(#icoB)" stroke-width="2.6"/>' +
      '<path d="M11 8.5l3-3.5 3 3.5-3 2.2z" fill="#e2cba2" stroke="#8a6130" stroke-width=".8"/>',
    music: '<path d="M12 22V7l13-3.5v15" fill="none" stroke="url(#icoB)" stroke-width="2.2" stroke-linejoin="round"/><ellipse cx="8.8" cy="22.4" rx="4" ry="3" fill="url(#icoB)"/><ellipse cx="21.8" cy="19" rx="4" ry="3" fill="url(#icoB)"/>',
    camera: '<rect x="5" y="9" width="26" height="16" rx="3" fill="url(#icoB)"/><circle cx="18" cy="17" r="4.6" fill="#f6eedd"/><circle cx="18" cy="17" r="2.6" fill="#c19a63"/><path d="M12 9l2-3.5h8L24 9z" fill="#c19a63"/>',
    heart: '<path d="M18 27C8 20 4 14 6 9.5c2-4.5 8-5 12 0 4-5 10-4.5 12 0 2 4.5-2 10.5-12 17.5z" fill="url(#icoB)"/>',
    cake: '<rect x="7" y="16" width="22" height="10" rx="2" fill="url(#icoB)"/><rect x="11" y="9" width="14" height="7" rx="1.5" fill="#e2cba2"/><path d="M18 9V5" stroke="#8a6130" stroke-width="1.4"/><circle cx="18" cy="4" r="1.3" fill="#e9b45a"/>',
  };
  function tlIcon(name) {
    return '<svg class="tl-ico" viewBox="0 0 36 30" aria-hidden="true"><g filter="url(#wc)">' + (WC_ICONS[name] || WC_ICONS.heart) + '</g></svg>';
  }
  function ringsIcon() { return '<svg class="art rings-ico" viewBox="0 0 36 30" aria-hidden="true"><g filter="url(#wc)">' + WC_ICONS.rings + '</g></svg>'; }

  /* Chữ T uốn lượn + hoa vẽ nét (tiêu đề Timeline / The Album / Thank you) */
  function swashT() {
    return '<svg class="swash-t" viewBox="0 0 220 150" aria-hidden="true"><g fill="none" stroke="#2D3826" stroke-width="1.15" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M30 44 C14 40 12 28 26 26 C60 20 120 10 214 6"/>' +
      '<path d="M112 13 C110 48 104 92 92 124 C86 138 76 144 70 138"/>' +
      '<g transform="translate(42 70)"><path d="M0 0 C-7 -4 -7 -13 0 -14 C7 -13 7 -4 0 0Z M0 0 C4 -7 13 -7 14 0 C13 7 4 7 0 0Z M0 0 C7 4 7 13 0 14 C-7 13 -7 4 0 0Z M0 0 C-4 7 -13 7 -14 0 C-13 -7 -4 -7 0 0Z"/>' +
      '<circle r="2.2"/><path d="M8 10 C14 20 22 28 34 34"/></g></g></svg>';
  }

  /* Phong bì quà mừng: thân xanh phẳng, nắp viền ren */
  function giftEnvelope() {
    var scal = 'M0 0 L200 0 L200 18', n = 14;
    for (var i = 0; i <= n; i++) {
      var t = i / n, x = 200 - t * 200, y = 18 + Math.sin(t * Math.PI) * 62;
      scal += (i === 0 ? '' : ' Q' + f1(x + 200 / n / 2) + ' ' + f1(y + 9) + ' ') + (i === 0 ? '' : f1(x) + ' ' + f1(y));
    }
    scal += ' L0 0Z';
    var holes = '';
    for (var k = 1; k < n; k++) {
      var tt = k / n, hx = 200 - tt * 200, hy = 18 + Math.sin(tt * Math.PI) * 62 - 7;
      holes += '<circle cx="' + f1(hx) + '" cy="' + f1(hy) + '" r="2.1" fill="#cfd2b6"/>';
      if (k % 2) holes += '<circle cx="' + f1(hx) + '" cy="' + f1(hy - 9) + '" r="1.2" fill="#dcdec8"/>';
    }
    return {
      back: '<svg class="art" viewBox="0 0 200 140" preserveAspectRatio="none"><rect width="200" height="140" fill="url(#envB)"/></svg>',
      front: '<svg class="art" viewBox="0 0 200 140" preserveAspectRatio="none"><path d="M0 40 L100 96 L200 40 L200 140 L0 140Z" fill="url(#envB)"/><path d="M0 140 L84 88 M200 140 L116 88" stroke="#6d7652" stroke-opacity=".4" fill="none"/></svg>',
      flap: '<svg class="art" viewBox="0 0 200 92" preserveAspectRatio="none"><path d="' + scal + '" fill="#fbfcff" filter="url(#shadowS)"/>' + holes +
        '<path d="M20 18 Q100 30 180 18" stroke="#dcdcc6" fill="none" stroke-width="1"/></svg>',
      seal: '<svg class="art" viewBox="-34 -34 68 68">' + waxSeal(23) + '</svg>',
    };
  }

  /* Biểu tượng giao diện */
  var HEART = 'M12 21.2s-7.6-4.7-10.1-9.4C.3 8.4 2.1 4.4 5.9 3.9c2.2-.3 4.3.9 5.3 2.7 1-1.8 3.1-3 5.3-2.7 3.8.5 5.6 4.5 3.8 7.9C19.6 16.5 12 21.2 12 21.2z';
  var ICONS = {
    menu: '<path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    heart: '<path d="' + HEART + '" fill="currentColor"/>',
    music: '<path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    down: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    right: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    pin: '<path d="M12 21.5s-6.5-6.1-6.5-11.2a6.5 6.5 0 0 1 13 0c0 5.1-6.5 11.2-6.5 11.2z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle cx="12" cy="10.2" r="2.4" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    chat: '<path d="M4 5.5h16v10.5H10l-4.5 3.8V16H4z" fill="currentColor"/><circle cx="8.5" cy="10.8" r="1.1" fill="#fff"/><circle cx="12" cy="10.8" r="1.1" fill="#fff"/><circle cx="15.5" cy="10.8" r="1.1" fill="#fff"/>',
  };
  function icon(name) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }
  function heartSvg() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART + '"/></svg>'; }

  window.ART = {
    rng: rng, svgUrl: svgUrl, installDefs: installDefs,
    paperFlowerSvg: paperFlowerSvg, sealFlower: sealFlower, tear: tear,
    mandala: mandala, heartArrow: heartArrow, flourishLine: flourishLine, heartRings: heartRings,
    tlIcon: tlIcon, ringsIcon: ringsIcon, swashT: swashT, giftEnvelope: giftEnvelope, icon: icon, heartSvg: heartSvg,
  };
})();
