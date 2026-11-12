/*
 * Hình vẽ SVG tự vẽ cho thiệp: hoa rum (calla), phong bì, con dấu sáp,
 * chữ lồng với vòng nguyệt quế, trái tim và các biểu tượng nhỏ.
 */
(function () {
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- Gradient dùng chung (chèn 1 lần vào trang) ---------- */
  function installDefs() {
    if (document.getElementById('art-defs')) return;
    var wrap = document.createElement('div');
    wrap.innerHTML =
      '<svg id="art-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<linearGradient id="gBur" x1="0" y1="1" x2=".4" y2="0"><stop offset="0" stop-color="#3a0610"/><stop offset=".55" stop-color="#6f1227"/><stop offset="1" stop-color="#9b2440"/></linearGradient>' +
      '<linearGradient id="gBurIn" x1="0" y1="1" x2=".5" y2="0"><stop offset="0" stop-color="#5b0d1d"/><stop offset="1" stop-color="#b8435c"/></linearGradient>' +
      '<linearGradient id="gWhite" x1="0" y1="1" x2=".4" y2="0"><stop offset="0" stop-color="#e2dac9"/><stop offset=".6" stop-color="#f7f3ea"/><stop offset="1" stop-color="#ffffff"/></linearGradient>' +
      '<linearGradient id="gWhiteIn" x1="0" y1="1" x2=".5" y2="0"><stop offset="0" stop-color="#d9cfb9"/><stop offset="1" stop-color="#f3ede0"/></linearGradient>' +
      '<linearGradient id="gLeaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2c4421"/><stop offset="1" stop-color="#557a3c"/></linearGradient>' +
      '<linearGradient id="gEnv" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4eee5"/><stop offset="1" stop-color="#e7dfd2"/></linearGradient>' +
      '<linearGradient id="gEnvBack" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ddd3c3"/><stop offset="1" stop-color="#e9e1d4"/></linearGradient>' +
      '<radialGradient id="gWax" cx=".38" cy=".34" r=".75"><stop offset="0" stop-color="#a42a40"/><stop offset=".6" stop-color="#76132a"/><stop offset="1" stop-color="#4a0817"/></radialGradient>' +
      '<filter id="fSoft" x="-20%" y="-20%" width="140%" height="140%"><feDropShadow dx="0" dy="2" stdDeviation="2.2" flood-color="#3a2a1a" flood-opacity=".18"/></filter>' +
      '</defs></svg>';
    document.body.insertBefore(wrap.firstChild, document.body.firstChild);
  }

  /* ---------- Hoa rum ---------- */
  // Một bông hoa: gốc ở (0,0), miệng hoa hướng lên
  function calla(x, y, rot, scale, white) {
    var o = white ? 'url(#gWhite)' : 'url(#gBur)', i = white ? 'url(#gWhiteIn)' : 'url(#gBurIn)';
    var edge = white ? ' stroke="#d3c8b3" stroke-width=".8"' : '';
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ') scale(' + scale + ')">' +
      '<path fill="' + o + '"' + edge + ' d="M0 0 C-10 -14 -13 -38 -3 -58 C3 -70 16 -79 31 -77 C39 -76 44 -71 41 -66 C31 -66 23 -60 18 -50 C12 -34 10 -14 0 0 Z"/>' +
      '<path fill="' + i + '" opacity=".9" d="M-2 -9 C-7 -25 -5 -44 3 -56 C9 -64 18 -69 27 -69 C21 -63 16 -55 13 -45 C9 -31 6 -18 -2 -9 Z"/>' +
      '<path fill="none" stroke="#e4bd52" stroke-width="3.2" stroke-linecap="round" d="M1 -14 C3 -26 7 -36 11 -44"/>' +
      '</g>';
  }
  function stem(d, w) {
    return '<path fill="none" stroke="#3f5f2c" stroke-width="' + (w || 2.6) + '" stroke-linecap="round" d="' + d + '"/>';
  }
  function leaf(x, y, rot, len) {
    var w = len * 0.22;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')">' +
      '<path fill="url(#gLeaf)" d="M0 0 C' + len * 0.25 + ' ' + -w + ' ' + len * 0.7 + ' ' + -w * 0.9 + ' ' + len + ' 0 C' + len * 0.7 + ' ' + w * 0.9 + ' ' + len * 0.25 + ' ' + w + ' 0 0 Z"/>' +
      '<path fill="none" stroke="#7ea25f" stroke-width=".8" opacity=".7" d="M' + len * 0.06 + ' 0 L' + len * 0.92 + ' 0"/></g>';
  }
  // Bó hoa rum: variant 0 hướng lên phải, 1 lật ngang
  function bouquet(variant) {
    var b = '';
    b += leaf(58, 150, -118, 62) + leaf(62, 150, -60, 58);
    b += stem('M60 152 C52 120 40 92 30 62') + stem('M60 152 C58 118 56 86 54 50') + stem('M60 152 C66 120 74 96 84 70') +
      stem('M60 152 C50 126 30 108 16 96') + stem('M60 152 C70 128 92 112 104 104');
    b += calla(30, 64, -24, 0.72, false) + calla(54, 52, -6, 0.8, true) + calla(84, 72, 18, 0.72, false) +
      calla(16, 98, -52, 0.62, true) + calla(104, 106, 40, 0.6, false);
    b += stem('M60 150 L58 205 M60 150 L63 205 M60 150 L66 202', 2.2);
    b += '<path fill="#f1e9dc" stroke="#d6cbb7" stroke-width=".8" d="M52 150 C56 146 64 146 68 150 L66 162 C62 165 58 165 54 162 Z"/>';
    var flip = variant ? ' transform="translate(120 0) scale(-1 1)"' : '';
    return '<svg class="art bouquet" viewBox="-34 -14 188 224" aria-hidden="true"><g filter="url(#fSoft)"' + flip + '>' + b + '</g></svg>';
  }
  // Một cành hoa rum nằm chéo
  function stemSprig(white) {
    return '<svg class="art sprig" viewBox="0 -44 256 138" aria-hidden="true"><g filter="url(#fSoft)">' +
      stem('M8 84 C60 70 120 48 160 30', 2.4) + leaf(70, 64, -30, 46) +
      calla(158, 32, 70, 0.95, !!white) + '</g></svg>';
  }

  /* ---------- Con dấu sáp ---------- */
  function waxSeal(initials) {
    var pts = [], n = 64;
    for (var i = 0; i < n; i++) {
      var a = i / n * Math.PI * 2, r = 24.5 + Math.sin(i * 0.9) * 0.9 + Math.cos(i * 2.3) * 0.6;
      pts.push((30 + Math.cos(a) * r).toFixed(1) + ' ' + (30 + Math.sin(a) * r).toFixed(1));
    }
    return '<svg class="art seal" viewBox="0 0 60 60" aria-hidden="true">' +
      '<path fill="url(#gWax)" filter="url(#fSoft)" d="M' + pts.join(' L') + ' Z"/>' +
      '<circle cx="30" cy="30" r="16.5" fill="none" stroke="#3e0611" stroke-opacity=".45" stroke-width="1.6"/>' +
      '<circle cx="30" cy="30" r="15" fill="none" stroke="#c2566c" stroke-opacity=".35" stroke-width=".8"/>' +
      '<text x="30" y="37" text-anchor="middle" font-family="Corinthia, cursive" font-size="19" fill="#3e0611" fill-opacity=".85">' + initials + '</text>' +
      '</svg>';
  }

  /* ---------- Phong bì ---------- */
  // Hình rum dập nổi trên nắp phong bì
  function emboss(cx, cy, s) {
    return '<g transform="translate(' + cx + ' ' + cy + ') scale(' + s + ')" fill="none" stroke="#d8cdbb" stroke-width="1.4" stroke-linecap="round">' +
      '<path d="M0 30 C-8 18 -9 0 -2 -14 C3 -22 12 -27 21 -25 C17 -21 13 -15 11 -8 C7 6 6 18 0 30 Z"/><path d="M0 30 C0 44 -2 56 0 70"/>' +
      '<path d="M0 54 C-10 46 -20 44 -28 46 C-20 52 -10 56 0 56"/></g>';
  }
  function envelopeClosed() {
    return '<svg class="art env-closed" viewBox="0 0 300 200" aria-hidden="true">' +
      '<rect x="1" y="1" width="298" height="198" rx="4" fill="url(#gEnv)" stroke="#dcd1c1"/>' +
      '<path d="M1 199 L136 100 M299 199 L164 100" stroke="#d9cebd" stroke-width="1.2" fill="none"/>' +
      '<path d="M1 2 L150 120 L299 2 Z" fill="#efe8dd" stroke="#d8cdbc" filter="url(#fSoft)"/>' +
      emboss(150, 30, 0.75) + '</svg>';
  }
  function envelopeBack() {
    return '<svg class="art env-back" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true">' +
      '<rect x="1" y="120" width="298" height="179" fill="url(#gEnvBack)" stroke="#d8cdbc"/></svg>';
  }
  function envelopeFlap() {
    return '<svg class="art env-flap" viewBox="0 0 300 120" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M1 119 L150 4 L299 119 Z" fill="#f2ebe1" stroke="#d8cdbc"/>' + emboss(150, 40, 0.7) + '</svg>';
  }
  function envelopeFront() {
    return '<svg class="art env-front" viewBox="0 0 300 300" preserveAspectRatio="none" aria-hidden="true">' +
      '<path d="M1 120 L150 222 L299 120 L299 299 L1 299 Z" fill="url(#gEnv)" stroke="#d8cdbc" filter="url(#fSoft)"/>' +
      '<path d="M1 299 L122 204 M299 299 L178 204" stroke="#ddd2c2" stroke-width="1.1" fill="none"/></svg>';
  }

  /* ---------- Chữ lồng + vòng nguyệt quế ---------- */
  function monogram(a, b) {
    var s = '';
    function branch(from, to, side) {
      var cx = 60, cy = 60, r = 44, d = '', leaves = '';
      for (var t = 0; t <= 1.0001; t += 1 / 9) {
        var ang = (from + (to - from) * t) * Math.PI / 180;
        var x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r;
        d += (t ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
        var tangent = (from + (to - from) * t) + (to > from ? 90 : -90);
        leaves += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="4.6" ry="1.6" transform="rotate(' + (tangent + 35 * side).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ') translate(4 0)"/>';
        leaves += '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" rx="4.6" ry="1.6" transform="rotate(' + (tangent - 35 * side).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ') translate(4 0)"/>';
      }
      return '<path d="' + d + '" fill="none" stroke-width=".9"/>' + leaves;
    }
    s += '<g fill="#3a3a3a" stroke="#3a3a3a" stroke-width=".6">' + branch(100, 250, 1) + branch(80, -70, -1) + '</g>';
    s += '<text x="47" y="62" text-anchor="middle" font-family="Corinthia, cursive" font-size="40" fill="#222">' + a + '</text>';
    s += '<text x="72" y="86" text-anchor="middle" font-family="Corinthia, cursive" font-size="40" fill="#222">' + b + '</text>';
    s += '<path d="M46 82 L76 42" stroke="#222" stroke-width=".5" opacity=".6"/>';
    return '<svg class="art monogram" viewBox="0 0 120 120" aria-hidden="true">' + s + '</svg>';
  }

  /* ---------- Trái tim & biểu tượng ---------- */
  var HEART = 'M12 21.2s-7.6-4.7-10.1-9.4C.3 8.4 2.1 4.4 5.9 3.9c2.2-.3 4.3.9 5.3 2.7 1-1.8 3.1-3 5.3-2.7 3.8.5 5.6 4.5 3.8 7.9C19.6 16.5 12 21.2 12 21.2z';
  function heart(cls) { return '<svg class="' + (cls || 'heart') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + HEART + '"/></svg>'; }
  var ICONS = {
    pin: '<path d="M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12z" fill="currentColor"/><circle cx="12" cy="10" r="2.6" fill="#fff"/>',
    music: '<path d="M9 18V6l10-2v12" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6.5" cy="18" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="16.5" cy="16" r="2.5" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4 18-7z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    pen: '<path d="M4 20l4-1 11-11-3-3L5 16l-1 4zM14 6l3 3" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>',
    gift: '<path d="M4 11h16v9H4zM3 7h18v4H3zM12 7v13M12 7C10 3 6 3 6.5 5.5 7 7.5 12 7 12 7zm0 0c2-4 6-4 5.5-1.5C17 7.5 12 7 12 7z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>',
    down: '<path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    copy: '<rect x="8" y="8" width="12" height="12" rx="2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" fill="none" stroke="currentColor" stroke-width="1.7"/>',
    left: '<path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    right: '<path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    minus: '<path d="M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    plus: '<path d="M12 6v12M6 12h12" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  };
  function icon(name) { return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[name] + '</svg>'; }

  window.ART = {
    installDefs: installDefs, bouquet: bouquet, stemSprig: stemSprig, waxSeal: waxSeal,
    envelopeClosed: envelopeClosed, envelopeBack: envelopeBack, envelopeFlap: envelopeFlap, envelopeFront: envelopeFront,
    monogram: monogram, heart: heart, HEART: HEART, icon: icon, NS: NS,
  };
})();
