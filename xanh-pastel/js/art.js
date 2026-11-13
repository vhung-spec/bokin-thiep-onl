/*
 * Hình vẽ SVG tự vẽ cho mẫu thiệp "Xanh pastel":
 * nền ren hoa, hoa mẫu đơn màu nước, con dấu sáp xanh, mép giấy xé,
 * sóng giấy màu nước, hoạ tiết trang trí và biểu tượng.
 */
(function () {
  /* ---------- Số ngẫu nhiên có hạt giống (để hình luôn giống nhau mỗi lần tải) ---------- */
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

  /* ---------- Gradient & bộ lọc dùng chung ---------- */
  function installDefs() {
    if (document.getElementById('art-defs')) return;
    var g = '';
    function lin(id, a, b, x2, y2) {
      g += '<linearGradient id="' + id + '" x1="0" y1="1" x2="' + (x2 || 0) + '" y2="' + (y2 == null ? 0 : y2) + '">' +
        '<stop offset="0" stop-color="' + a + '"/><stop offset="1" stop-color="' + b + '"/></linearGradient>';
    }
    lin('pBlue1', '#f4f7fd', '#7f9edb');
    lin('pBlue2', '#ffffff', '#a6bce8');
    lin('pBlue3', '#ffffff', '#c9d7f2');
    lin('pWhite1', '#f1f5fc', '#ffffff');
    lin('pWhite2', '#e9eff9', '#ffffff');
    lin('leafG', '#c9d4e4', '#8d9fbc', 1, 0);
    g += '<radialGradient id="waxG" cx=".36" cy=".32" r=".8"><stop offset="0" stop-color="#c9d8f5"/><stop offset=".45" stop-color="#8eaae3"/><stop offset="1" stop-color="#5b79c4"/></radialGradient>';
    g += '<radialGradient id="ctrG" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#eef3fc"/><stop offset="1" stop-color="#9fb6e4"/></radialGradient>';
    g += '<linearGradient id="envG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#b8cbee"/><stop offset="1" stop-color="#8faae0"/></linearGradient>';
    g += '<linearGradient id="envG2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a9c0eb"/><stop offset="1" stop-color="#93afe2"/></linearGradient>';
    g += '<radialGradient id="halo"><stop offset=".55" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>';
    g += '<filter id="soft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".35"/></filter>';
    g += '<filter id="shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="2.5" stdDeviation="3" flood-color="#2d4479" flood-opacity=".22"/></filter>';
    var wrap = document.createElement('div');
    wrap.innerHTML = '<svg id="art-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + g + '</defs></svg>';
    document.body.insertBefore(wrap.firstChild, document.body.firstChild);
  }

  /* ---------- Nền ren hoa (một ô lặp lại) ---------- */
  function petalPath(len, w) {
    return 'M0 0 C' + f1(-w) + ' ' + f1(-len * .25) + ' ' + f1(-w * 1.05) + ' ' + f1(-len * .85) + ' ' + f1(-w * .35) + ' ' + f1(-len) +
      ' C' + f1(-w * .1) + ' ' + f1(-len * 1.04) + ' ' + f1(w * .1) + ' ' + f1(-len * 1.04) + ' ' + f1(w * .35) + ' ' + f1(-len) +
      ' C' + f1(w * 1.05) + ' ' + f1(-len * .85) + ' ' + f1(w) + ' ' + f1(-len * .25) + ' 0 0Z';
  }
  function laceRose(cx, cy, r, op) {
    var s = '<g transform="translate(' + cx + ' ' + cy + ')">';
    for (var i = 0; i < 6; i++) s += '<path transform="rotate(' + (i * 60 + 15) + ')" d="' + petalPath(r, r * .52) + '" fill="#fff" fill-opacity="' + op * .2 + '" stroke="#fff" stroke-opacity="' + op * .72 + '" stroke-width=".9"/>';
    for (var j = 0; j < 5; j++) s += '<path transform="rotate(' + (j * 72) + ')" d="' + petalPath(r * .6, r * .32) + '" fill="#fff" fill-opacity="' + op * .26 + '" stroke="#fff" stroke-opacity="' + op * .8 + '" stroke-width=".8"/>';
    var d = '';
    for (var k = 0; k <= 30; k++) {
      var t = k / 30, a = t * Math.PI * 4.2, rr = r * .32 * (.15 + .85 * t);
      d += (k ? ' L' : 'M') + f1(Math.cos(a) * rr) + ' ' + f1(Math.sin(a) * rr);
    }
    s += '<path d="' + d + '" fill="none" stroke="#fff" stroke-opacity="' + op + '" stroke-width=".9"/>';
    return s + '</g>';
  }
  function laceLeaf(x, y, rot, len, op) {
    var w = len * .3;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<path d="M0 0 C' + f1(len * .3) + ' ' + f1(-w) + ' ' + f1(len * .75) + ' ' + f1(-w) + ' ' + len + ' 0 C' + f1(len * .75) + ' ' + f1(w) + ' ' + f1(len * .3) + ' ' + f1(w) + ' 0 0Z" fill="#fff" fill-opacity="' + op * .28 + '" stroke="#fff" stroke-opacity="' + op * .8 + '" stroke-width=".8"/>' +
      '<path d="M2 0 L' + f1(len * .9) + ' 0" stroke="#fff" stroke-opacity="' + op * .7 + '" stroke-width=".6"/></g>';
  }
  function laceBlossom(cx, cy, r, op) {
    var s = '<g transform="translate(' + cx + ' ' + cy + ')">';
    for (var i = 0; i < 5; i++) s += '<ellipse transform="rotate(' + i * 72 + ') translate(0 ' + f1(-r * .55) + ')" rx="' + f1(r * .36) + '" ry="' + f1(r * .55) + '" fill="#fff" fill-opacity="' + op * .3 + '" stroke="#fff" stroke-opacity="' + op * .8 + '" stroke-width=".7"/>';
    return s + '<circle r="' + f1(r * .2) + '" fill="#fff" fill-opacity="' + op * .7 + '"/></g>';
  }
  function laceTile() {
    var T = 180, s = '';
    // lưới ren
    s += '<defs><pattern id="m" width="7" height="12" patternUnits="userSpaceOnUse">' +
      '<path d="M0 0 L3.5 6 L0 12 M7 0 L3.5 6 L7 12" fill="none" stroke="#fff" stroke-opacity=".16" stroke-width=".6"/>' +
      '<circle cx="3.5" cy="6" r=".7" fill="#fff" fill-opacity=".22"/></pattern></defs>';
    s += '<rect width="' + T + '" height="' + T + '" fill="url(#m)"/>';
    // dây leo nối các bông hoa (vẽ ở cả 4 góc để ghép liền mạch)
    var vine = 'M90 90 C120 70 140 40 180 0 M90 90 C60 110 40 140 0 180 M90 90 C110 120 140 140 180 180 M90 90 C70 60 40 40 0 0';
    s += '<path d="' + vine + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.1"/>';
    s += laceRose(90, 90, 34, 1);
    [[0, 0], [T, 0], [0, T], [T, T]].forEach(function (p) { s += laceRose(p[0], p[1], 24, .85); });
    [[90, 0], [90, T], [0, 90], [T, 90]].forEach(function (p) { s += laceBlossom(p[0], p[1], 11, .9); });
    [[122, 60, -40], [58, 120, 140], [124, 122, 40], [56, 58, 220], [150, 26, -50], [30, 154, 130], [154, 152, 50], [26, 28, 230]]
      .forEach(function (l, i) { s += laceLeaf(l[0], l[1], l[2], i < 4 ? 22 : 15, .9); });
    [[45, 90], [135, 90], [90, 45], [90, 135]].forEach(function (p) { s += laceBlossom(p[0], p[1], 6, .7); });
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + T + '" height="' + T + '" viewBox="0 0 ' + T + ' ' + T + '">' + s + '</svg>';
  }
  // Vân giấy rất nhẹ
  function paperTile() {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" stitchTiles="stitch"/>' +
      '<feColorMatrix values="0 0 0 0 .55  0 0 0 0 .6  0 0 0 0 .72  0 0 0 .06 0"/></filter><rect width="160" height="160" filter="url(#n)"/></svg>';
  }

  /* ---------- Hoa mẫu đơn màu nước ---------- */
  function peony(cx, cy, r, rot, white) {
    var g1 = white ? 'url(#pWhite1)' : 'url(#pBlue1)', g2 = white ? 'url(#pWhite2)' : 'url(#pBlue2)', g3 = white ? 'url(#pWhite2)' : 'url(#pBlue3)';
    var edge = white ? '#8fa4cf' : '#6d8bd0';
    var s = '<g transform="translate(' + cx + ' ' + cy + ') rotate(' + (rot || 0) + ')" filter="url(#soft)">';
    function ring(n, len, w, fill, off, op) {
      var o = '';
      for (var i = 0; i < n; i++) {
        var a = off + i * 360 / n + (i % 2 ? 6 : -4);
        o += '<path transform="rotate(' + f1(a) + ')" d="' + petalPath(len * (i % 3 ? 1 : .93), w) + '" fill="' + fill + '" stroke="' + edge + '" stroke-opacity="' + op + '" stroke-width=".7"/>';
      }
      return o;
    }
    var k = white ? 1.6 : 1;
    s += ring(9, r, r * .5, g1, 0, .35 * k);
    s += ring(7, r * .76, r * .42, g2, 20, .28 * k);
    s += ring(6, r * .52, r * .32, g3, 8, .22 * k);
    s += ring(5, r * .3, r * .22, g3, 30, .2 * k);
    s += '<circle r="' + f1(r * .14) + '" fill="url(#ctrG)"/>';
    for (var k = 0; k < 7; k++) {
      var a = k / 7 * Math.PI * 2;
      s += '<circle cx="' + f1(Math.cos(a) * r * .1) + '" cy="' + f1(Math.sin(a) * r * .1) + '" r="' + f1(r * .025) + '" fill="' + (white ? '#b8c6e2' : '#5d7cc6') + '"/>';
    }
    return s + '</g>';
  }
  function bud(x, y, r, rot, white) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')" filter="url(#soft)">' +
      '<path d="M0 0 C' + f1(-r) + ' ' + f1(-r * .6) + ' ' + f1(-r * .7) + ' ' + f1(-r * 1.7) + ' 0 ' + f1(-r * 2) + ' C' + f1(r * .7) + ' ' + f1(-r * 1.7) + ' ' + f1(r) + ' ' + f1(-r * .6) + ' 0 0Z" fill="' + (white ? 'url(#pWhite1)' : 'url(#pBlue1)') + '" stroke="#7b97d6" stroke-opacity=".3" stroke-width=".6"/>' +
      '<path d="M0 0 C' + f1(-r * .5) + ' ' + f1(-r * .5) + ' ' + f1(-r * .3) + ' ' + f1(-r * 1.3) + ' ' + f1(r * .1) + ' ' + f1(-r * 1.6) + '" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width=".6"/></g>';
  }
  function leaf(x, y, rot, len) {
    var w = len * .26;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<path d="M0 0 C' + f1(len * .25) + ' ' + f1(-w) + ' ' + f1(len * .7) + ' ' + f1(-w * .9) + ' ' + len + ' 0 C' + f1(len * .7) + ' ' + f1(w * .9) + ' ' + f1(len * .25) + ' ' + f1(w) + ' 0 0Z" fill="url(#leafG)" opacity=".9"/>' +
      '<path d="M2 0 L' + f1(len * .92) + ' 0" stroke="#eef2f8" stroke-opacity=".7" stroke-width=".7"/></g>';
  }
  function floret(x, y, r) {
    var s = '<g transform="translate(' + x + ' ' + y + ')">';
    for (var i = 0; i < 4; i++) s += '<ellipse transform="rotate(' + (i * 90 + 45) + ') translate(0 ' + f1(-r * .5) + ')" rx="' + f1(r * .38) + '" ry="' + f1(r * .55) + '" fill="#a8bde9" stroke="#7d98d8" stroke-opacity=".4" stroke-width=".4"/>';
    return s + '<circle r="' + f1(r * .16) + '" fill="#eef3fc"/></g>';
  }
  // Cụm hoa trang trí. variant: 'corner' (góc), 'side' (cạnh), 'small'
  function spray(variant, flip) {
    var s = '', vb;
    if (variant === 'corner') {
      vb = '0 0 220 200';
      s += leaf(70, 120, 200, 70) + leaf(110, 140, 120, 64) + leaf(120, 80, -20, 60) + leaf(60, 70, 240, 50) + leaf(150, 120, 30, 46);
      s += peony(92, 100, 46, 10, false) + peony(160, 66, 28, -20, true) + bud(40, 150, 13, -60, false) + bud(170, 140, 11, 50, true);
      s += floret(140, 160, 11) + floret(156, 176, 9) + floret(30, 110, 9) + floret(46, 96, 7) + floret(186, 100, 8);
    } else if (variant === 'side') {
      vb = '0 0 120 220';
      s += leaf(60, 120, 250, 62) + leaf(60, 120, 110, 58) + leaf(64, 60, -70, 50) + leaf(60, 170, 80, 46);
      s += peony(60, 110, 38, 0, false) + peony(66, 46, 22, 20, true) + bud(54, 190, 11, 170, false);
      s += floret(28, 150, 9) + floret(94, 160, 9) + floret(90, 82, 7);
    } else {
      vb = '0 0 140 110';
      s += leaf(70, 60, 200, 50) + leaf(70, 60, -20, 50) + leaf(70, 60, 90, 36);
      s += peony(70, 56, 30, 0, false) + bud(28, 70, 9, -70, true) + bud(112, 70, 9, 70, false) + floret(20, 46, 7) + floret(120, 44, 7);
    }
    var w = vb.split(' ')[2];
    return '<svg class="art" viewBox="' + vb + '" aria-hidden="true"><g' + (flip ? ' transform="translate(' + w + ' 0) scale(-1 1)"' : '') + '>' + s + '</g></svg>';
  }

  /* ---------- Con dấu sáp xanh (kèm hoa trắng phía sau) ---------- */
  function sprig(color, dx, dy) {
    var t = 'translate(' + dx + ' ' + dy + ')';
    var s = '<g transform="' + t + '" fill="none" stroke="' + color + '" stroke-width="1.5" stroke-linecap="round">' +
      '<path d="M0 17 C0 6 0 -6 0 -18"/>';
    [[-12, 1], [-5, 1], [2, 1], [-9, -1], [-2, -1], [5, -1]].forEach(function (p) {
      var y = p[0], side = p[1];
      s += '<path d="M0 ' + y + ' C' + 4 * side + ' ' + (y - 2) + ' ' + 8 * side + ' ' + (y - 5) + ' ' + 9 * side + ' ' + (y - 9) + ' C' + 5 * side + ' ' + (y - 8) + ' ' + 1 * side + ' ' + (y - 5) + ' 0 ' + y + '"/>';
    });
    return s + '<path d="M0 -18 C2 -21 2 -24 0 -26 C-2 -24 -2 -21 0 -18"/></g>';
  }
  function waxSeal(seed) {
    var R = rng(seed || 7), pts = [], n = 72;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, r = 30 + Math.sin(i * .7 + R() * .5) * .9 + (R() - .5) * 1.4;
      pts.push(f1(Math.cos(a) * r) + ' ' + f1(Math.sin(a) * r));
    }
    return '<g filter="url(#shadow)"><path d="M' + pts.join(' L') + 'Z" fill="url(#waxG)"/></g>' +
      '<circle r="21" fill="none" stroke="#5170bd" stroke-opacity=".55" stroke-width="2.2"/>' +
      '<circle r="19.6" fill="none" stroke="#e3ebfa" stroke-opacity=".55" stroke-width=".9"/>' +
      '<circle r="18" fill="#8fabe3" fill-opacity=".35"/>' +
      sprig('#4e6cb8', .7, .9) + sprig('#e6eefb', -.6, -.6) + sprig('#97b1e6', 0, 0);
  }
  function sealFlower(opts) {
    opts = opts || {};
    var s = '';
    if (opts.leaves !== false) s += leaf(-20, 8, 200, 62) + leaf(18, -6, -25, 58) + leaf(10, 22, 40, 44) + leaf(-12, -14, 230, 40);
    s += '<circle r="70" fill="url(#halo)"/>';
    s += '<g filter="url(#shadow)">' + peony(0, 2, 62, 8, true) + '</g>';
    s += '<g transform="translate(0 2) scale(1.08)">' + waxSeal(opts.seed) + '</g>';
    return '<svg class="art seal-flower" viewBox="-80 -78 160 160" aria-hidden="true">' + s + '</svg>';
  }

  /* ---------- Mép giấy xé ---------- */
  // dir: 'up' (mép răng cưa ở trên, phần giấy ở dưới) hoặc 'down'
  function tear(seed, dir, color) {
    var R = rng(seed), W = 400, H = 28, d = 'M0 ' + H, x = 0, pts = [];
    while (x <= W) {
      var y = H * .45 + Math.sin(x / 37 + seed) * 4 + Math.sin(x / 11 + seed * 2) * 2 + (R() - .5) * 4.5;
      pts.push([f1(x), f1(Math.max(2, Math.min(H - 4, y)))]);
      x += 2 + R() * 4;
    }
    pts.forEach(function (p) { d += ' L' + p[0] + ' ' + p[1]; });
    d += ' L' + W + ' ' + H + 'Z';
    var fiber = 'M' + pts.map(function (p) { return p[0] + ' ' + f1(+p[1] + 1.6); }).join(' L');
    var tr = dir === 'down' ? ' transform="translate(0 ' + H + ') scale(1 -1)"' : '';
    return '<svg class="tear-svg" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><g' + tr + '>' +
      '<path d="' + d + '" fill="' + (color || '#f7f8fc') + '"/>' +
      '<path d="' + fiber + '" fill="none" stroke="#fff" stroke-width="2.2" stroke-opacity=".9"/></g></svg>';
  }

  /* ---------- Sóng giấy màu nước (chân phần lịch) ---------- */
  function waves() {
    var W = 400, H = 150, s = '', layers = [
      ['#dbe5f7', '#eef3fb', 20, 9, 3.1], ['#b9cdf0', '#dde7f8', 46, 10, 1.7], ['#9db8e8', '#c8d8f3', 70, 8, 4.4],
      ['#7f9fdc', '#b2c7ee', 92, 9, 2.3], ['#a9c0ec', '#d6e2f6', 116, 7, 5.6], ['#d0dcf3', '#f3f6fc', 134, 6, .9],
    ];
    var defs = '';
    layers.forEach(function (L, i) {
      defs += '<linearGradient id="wv' + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + L[0] + '"/><stop offset="1" stop-color="' + L[1] + '"/></linearGradient>';
      var R = rng(i * 31 + 5), y0 = L[2], amp = L[3], ph = L[4], d = 'M0 ' + H, top = [];
      for (var x = 0; x <= W; x += 2 + R() * 3) {
        var y = y0 + Math.sin(x / 48 + ph) * amp + Math.sin(x / 17 + ph * 2) * amp * .3 + (R() - .5) * 2.2;
        top.push(f1(x) + ' ' + f1(y));
      }
      d += ' L' + top.join(' L') + ' L' + W + ' ' + H + 'Z';
      s += '<path d="' + d + '" fill="url(#wv' + i + ')"/>';
      s += '<path d="M' + top.join(' L') + '" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.6"/>';
    });
    return '<svg class="art waves" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><defs>' + defs + '</defs>' + s + '</svg>';
  }

  /* ---------- Hoạ tiết nhỏ ---------- */
  function knot() {
    var s = '';
    for (var i = 0; i < 4; i++) s += '<path transform="rotate(' + i * 90 + ')" d="M0 -2 C-3 -5 -3 -9 0 -11 C3 -9 3 -5 0 -2Z"/>';
    for (var j = 0; j < 4; j++) s += '<circle transform="rotate(' + (j * 90 + 45) + ')" cx="0" cy="-7" r="1.1"/>';
    return '<svg class="art knot" viewBox="-13 -13 26 26" aria-hidden="true"><g fill="#7c98d8">' + s + '<circle r="1.6"/></g></svg>';
  }
  function heartArrow() {
    return '<svg class="art heart-arrow" viewBox="-36 -20 72 40" aria-hidden="true"><g fill="none" stroke="#3a4462" stroke-width="1.1" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M0 12 C-13 3 -15 -6 -9 -10 C-5 -13 -1 -10 0 -6 C1 -10 6 -13 10 -10 C16 -6 13 3 0 12Z"/>' +
      '<path d="M-30 10 C-18 6 -4 -1 22 -12"/><path d="M22 -12 L15 -12 M22 -12 L19 -6"/>' +
      '<path d="M-30 10 L-34 7 M-30 10 L-33 13 M-27 9 L-31 6 M-27 9 L-30 12"/></g></svg>';
  }
  function heartOutline() {
    return '<svg class="hl" viewBox="0 0 40 36" aria-hidden="true"><path d="M20 33 C6 23 2 15 4 9 C6 3 14 1 20 8 C26 1 34 3 36 9 C38 15 34 23 20 33Z" fill="none" stroke="#6f8ed6" stroke-width="1.6"/></svg>';
  }

  /* ---------- Biểu tượng lịch trình ---------- */
  var TL = {
    cheers: '<path d="M7 4h7l-1 7a3 3 0 0 1-5 0z M10.5 13v7 M7.5 20h6 M18 6h7l-1 7a3 3 0 0 1-5 0z M21.5 15v6 M18.5 21h6 M12 2l1-1.5 M16 3l2-2"/>',
    rings: '<circle cx="11" cy="16" r="6.5"/><circle cx="19" cy="16" r="6.5"/><path d="M8.5 8.5l2.5-3 2.5 3-2.5 1.5z"/>',
    music: '<path d="M11 21V6l12-3v14"/><ellipse cx="8" cy="21" rx="3.2" ry="2.5"/><ellipse cx="20" cy="18" rx="3.2" ry="2.5"/><path d="M11 10l12-3"/>',
    camera: '<rect x="4" y="9" width="22" height="14" rx="2.5"/><circle cx="15" cy="16" r="4.2"/><path d="M10 9l2-3h6l2 3"/>',
    heart: '<path d="M15 25C6 19 3 13 5 9c2-4 7-4 10 0 3-4 8-4 10 0 2 4-1 10-10 16z"/>',
    cake: '<rect x="6" y="15" width="18" height="9" rx="1.5"/><rect x="9" y="9" width="12" height="6" rx="1"/><path d="M15 9V5 M15 3.5v.5"/>',
  };
  function tlIcon(name) {
    return '<svg class="tl-ico" viewBox="0 0 30 26" aria-hidden="true"><g fill="none" stroke="#6f8ed6" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + (TL[name] || TL.heart) + '</g></svg>';
  }

  /* ---------- Phong bì quà mừng ---------- */
  function scallop(x1, y1, x2, y2, n) {
    var d = 'M' + x1 + ' ' + y1, dx = (x2 - x1) / n, dy = (y2 - y1) / n;
    for (var i = 0; i < n; i++) {
      var mx = x1 + dx * (i + .5) - dy * .55, my = y1 + dy * (i + .5) + dx * .55;
      d += ' Q' + f1(mx) + ' ' + f1(my) + ' ' + f1(x1 + dx * (i + 1)) + ' ' + f1(y1 + dy * (i + 1));
    }
    return d;
  }
  function giftEnvelope() {
    return {
      back: '<svg class="art" viewBox="0 0 240 160" preserveAspectRatio="none"><rect x="1" y="1" width="238" height="158" rx="6" fill="url(#envG2)"/></svg>',
      front: '<svg class="art" viewBox="0 0 240 160" preserveAspectRatio="none" filter="url(#shadow)"><path d="M1 30 L120 104 L239 30 L239 153 Q239 159 233 159 L7 159 Q1 159 1 153Z" fill="url(#envG)"/>' +
        '<path d="M1 159 L102 92 M239 159 L138 92" stroke="#7f9bd8" stroke-opacity=".5" fill="none"/></svg>',
      flap: '<svg class="art" viewBox="0 0 240 110" preserveAspectRatio="none"><path d="M1 1 L120 104 L239 1Z" fill="#c4d4f1"/>' +
        '<path d="' + scallop(1, 1, 120, 104, 13) + ' ' + scallop(120, 104, 239, 1, 13).replace('M120 104', 'L120 104') + '" fill="none" stroke="#fff" stroke-width="2.4" stroke-opacity=".95"/></svg>',
      seal: '<svg class="art" viewBox="-34 -34 68 68">' + waxSeal(23) + '</svg>',
    };
  }

  /* ---------- Biểu tượng giao diện ---------- */
  var HEART = 'M12 21.2s-7.6-4.7-10.1-9.4C.3 8.4 2.1 4.4 5.9 3.9c2.2-.3 4.3.9 5.3 2.7 1-1.8 3.1-3 5.3-2.7 3.8.5 5.6 4.5 3.8 7.9C19.6 16.5 12 21.2 12 21.2z';
  var ICONS = {
    menu: '<path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    heart: '<path d="' + HEART + '" fill="currentColor"/>',
    music: '<path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    down: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    right: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    chat: '<path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
  };
  function icon(name) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }
  function heartSvg() { return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART + '"/></svg>'; }

  window.ART = {
    rng: rng, svgUrl: svgUrl, installDefs: installDefs, laceTile: laceTile, paperTile: paperTile,
    spray: spray, sealFlower: sealFlower, tear: tear, waves: waves, knot: knot, heartArrow: heartArrow,
    heartOutline: heartOutline, tlIcon: tlIcon, giftEnvelope: giftEnvelope, icon: icon, heartSvg: heartSvg,
  };
})();
