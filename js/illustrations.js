/*
 * Hình minh hoạ nét vẽ tay — tự vẽ bằng SVG cho dự án này.
 * Mỗi nét được "vẽ dần" khi cuộn tới (xem main.js -> drawOn).
 *   data-o : thứ tự xuất hiện (số nhỏ vẽ trước)
 *   .fk    : tô màu mực      .fp : tô màu giấy
 *   .wl    : nét màu giấy (trên nền mực)   .ns : không viền
 *   .thin  : nét mảnh
 */
(function () {
  // Lật ngang một path (chỉ dùng lệnh tuyệt đối M L C S Q Z) quanh trục x = c
  function mx(d, c) {
    return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, function (_, x, y) {
      return +(2 * c - x).toFixed(2) + ' ' + y;
    });
  }
  // Dịch chuyển một path tuyệt đối
  function tr(d, dx, dy) {
    return d.replace(/(-?\d*\.?\d+)\s+(-?\d*\.?\d+)/g, function (_, x, y) {
      return +(+x + dx).toFixed(2) + ' ' + +(+y + dy).toFixed(2);
    });
  }
  // Viền ren gợn sóng
  function scallops(x0, x1, y, w, h) {
    var d = 'M' + x0 + ' ' + y;
    for (var x = x0; x + w <= x1 + 0.1; x += w) d += ' q' + w / 2 + ' ' + -h + ' ' + w + ' 0';
    return d;
  }
  // Bông hồng xoắn ốc
  function rose(cx, cy, r) {
    var d = '', turns = 2.6, steps = 46;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, a = t * turns * Math.PI * 2, rr = r * (0.12 + 0.88 * t);
      var x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr * 0.86;
      d += (i ? ' L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1);
    }
    return '<path d="' + d + '"/>';
  }
  // Chiếc lá hình hạt hạnh nhân, có gân
  function leaf(x, y, len, deg) {
    var w = len * 0.32;
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + deg + ')">' +
      '<path d="M0 0 C' + len * 0.3 + ' ' + -w + ' ' + len * 0.75 + ' ' + -w + ' ' + len + ' 0 C' + len * 0.75 + ' ' + w + ' ' + len * 0.3 + ' ' + w + ' 0 0 Z"/>' +
      '<path class="thin" d="M' + len * 0.1 + ' 0 L' + len * 0.85 + ' 0"/></g>';
  }
  function circle(cx, cy, r, cls) {
    return '<circle' + (cls ? ' class="' + cls + '"' : '') + ' cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
  }
  function wineGlass(x, y) {
    return '<path class="thin" d="M' + (x - 5) + ' ' + (y - 9) + ' C' + (x - 5) + ' ' + (y - 2) + ' ' + (x + 5) + ' ' + (y - 2) + ' ' + (x + 5) + ' ' + (y - 9) + ' Z"/>' +
      '<path class="thin" d="M' + x + ' ' + (y - 3.6) + ' L' + x + ' ' + (y + 5) + ' M' + (x - 4) + ' ' + (y + 5) + ' L' + (x + 4) + ' ' + (y + 5) + '"/>';
  }
  function candle(x, y) {
    return '<rect class="thin" x="' + (x - 3) + '" y="' + y + '" width="6" height="20" rx="1"/>' +
      '<path class="thin" d="M' + x + ' ' + (y - 11) + ' C' + (x + 4) + ' ' + (y - 6) + ' ' + (x + 3) + ' ' + (y - 2) + ' ' + x + ' ' + (y - 2) + ' C' + (x - 3) + ' ' + (y - 2) + ' ' + (x - 4) + ' ' + (y - 6) + ' ' + x + ' ' + (y - 11) + ' Z"/>';
  }
  function svg(viewBox, body, label) {
    return '<svg class="ill" viewBox="' + viewBox + '" role="img" aria-label="' + label + '">' +
      '<g filter="url(#rough)">' + body + '</g></svg>';
  }

  /* ---------- 1. Cô dâu chú rể cầm bảng ngày / tháng ---------- */
  function couple(day, month) {
    var handL = 'M30 72 C29 62 36 57 45 58 C51 58 54 61 53 64 C56 65 56 69 53 70 C56 71 56 75 53 76 C55 78 54 82 50 83 C44 89 31 86 30 72 Z';
    var handR = mx(handL, 102);
    var wHandL = tr(handL, 140, 6);
    var wHandR = mx(wHandL, 240);
    var wArmL = 'M178 90 C166 104 164 118 174 128 C182 136 196 140 208 138 L208 130 C198 130 188 126 184 118 C180 110 182 100 188 92 Z';
    var wArmR = mx(wArmL, 240);
    var b = '';
    // --- Chú rể ---
    b += '<path data-o="3" class="fk" d="M32 86 L46 88 L42 112 L60 132 L48 146 L24 116 Z"/>';
    b += '<path data-o="3" class="fk" d="' + mx('M32 86 L46 88 L42 112 L60 132 L48 146 L24 116 Z', 102) + '"/>';
    b += '<path data-o="4" class="fk" d="M50 124 C70 120 132 120 152 124 L157 224 C130 228 74 228 47 224 Z"/>';
    b += '<path data-o="5" class="fp" d="M88 122 L114 122 L101 162 Z"/>';
    b += '<path data-o="5" class="fk" d="M99 127 L103 127 L105 147 L101 154 L97 147 Z"/>';
    b += '<path data-o="6" class="wl" d="M86 122 L95 172 M116 122 L107 172 M101 196 L101 224 M62 182 L80 182"/>';
    b += circle(101, 180, 1.8, 'fp ns') + circle(101, 192, 1.8, 'fp ns');
    b += '<path data-o="7" class="fk" d="M58 222 L98 222 L95 289 L74 289 Z"/>';
    b += '<path data-o="7" class="fk" d="M104 222 L146 222 L133 289 L110 289 Z"/>';
    b += '<path data-o="8" class="fp" d="M73 288 C64 290 58 296 59 302 L99 302 C100 295 97 290 94 288 Z"/>';
    b += '<path data-o="8" class="fp" d="M110 288 C106 291 104 296 105 302 L144 302 C146 296 141 290 133 288 Z"/>';
    b += '<path data-o="8" class="thin" d="M60 298 L99 298 M106 298 L144 298 M78 292 L86 296 M116 292 L124 296"/>';
    b += '<g transform="rotate(-3 102 78)"><rect data-o="0" class="fp" x="38" y="28" width="128" height="100" rx="2"/>' +
      '<text data-o="1" class="sign" x="102" y="103">' + day + '</text></g>';
    b += '<path data-o="2" class="fp" d="' + handL + '"/><path data-o="2" class="fp" d="' + handR + '"/>';
    // --- Cô dâu ---
    b += '<path data-o="12" class="fp" d="' + wArmL + '"/><path data-o="12" class="fp" d="' + wArmR + '"/>';
    b += '<path data-o="13" class="fp" d="M206 130 C218 136 262 136 274 130 L266 178 L214 178 Z"/>';
    b += '<path data-o="13" class="thin" d="' + scallops(212, 268, 142, 7, 3) + '"/>';
    b += '<path data-o="14" class="fp" d="M213 178 L267 178 L269 186 L211 186 Z"/>';
    b += '<path data-o="15" class="fp" d="M211 186 C192 222 176 262 160 298 C200 306 282 306 322 298 C306 262 288 222 269 186 Z"/>';
    b += '<path data-o="16" class="thin" d="M226 192 C218 232 206 268 194 300 M240 190 L239 303 M254 192 C262 232 274 268 286 300 M218 222 C210 250 198 276 178 298 M262 222 C272 250 284 276 304 298"/>';
    b += '<path data-o="16" class="thin" d="' + scallops(162, 318, 298, 8, 4) + '"/>';
    b += '<path data-o="17" class="fp" d="M228 302 C223 305 222 309 226 311 L240 311 C241 307 238 303 234 302 Z"/>';
    b += '<path data-o="17" class="fp" d="M247 302 C245 305 245 309 249 311 L263 311 C265 308 262 303 257 302 Z"/>';
    b += '<g transform="rotate(3 240 84)"><rect data-o="10" class="fp" x="178" y="34" width="124" height="98" rx="2"/>' +
      '<text data-o="11" class="sign" x="240" y="108">' + month + '</text></g>';
    b += '<path data-o="11" class="fp" d="' + wHandL + '"/><path data-o="11" class="fp" d="' + wHandR + '"/>';
    b += '<path data-o="18" class="thin" d="M22 312 C80 307 130 315 190 311 S292 307 322 313"/>';
    return svg('0 0 340 320', b, 'Cô dâu chú rể cầm bảng ngày cưới');
  }

  /* ---------- 2. Bàn tiệc làm khung cho lịch trình ---------- */
  function banquet() {
    var b = '<rect x="50" y="22" width="220" height="396" rx="22"/>' +
      '<rect class="thin" x="58" y="30" width="204" height="380" rx="16"/>';
    [62, 152, 242, 332].forEach(function (y) {
      var cy = y + 24;
      b += '<rect x="16" y="' + y + '" width="26" height="48" rx="10"/><path class="thin" d="M23 ' + (y + 9) + ' L23 ' + (y + 39) + '"/>';
      b += '<rect x="278" y="' + y + '" width="26" height="48" rx="10"/><path class="thin" d="M297 ' + (y + 9) + ' L297 ' + (y + 39) + '"/>';
      [82, 238].forEach(function (cx, side) {
        b += circle(cx, cy, 14) + circle(cx, cy, 8.5, 'thin');
        b += '<path class="thin" d="M' + (cx - 9) + ' ' + (cy - 21) + ' L' + (cx + 9) + ' ' + (cy - 21) + '"/>';
        b += '<path class="thin" d="M' + (cx - 9) + ' ' + (cy + 21) + ' L' + (cx + 5) + ' ' + (cy + 21) +
          ' M' + (cx + 5) + ' ' + (cy + 19) + ' L' + (cx + 10) + ' ' + (cy + 19) +
          ' M' + (cx + 5) + ' ' + (cy + 23) + ' L' + (cx + 10) + ' ' + (cy + 23) + '"/>';
        b += wineGlass(side ? cx + 18 : cx - 18, cy - 24);
      });
    });
    [[52, 1], [390, -1]].forEach(function (e) {
      var y = e[0];
      b += candle(122, y - 10) + candle(198, y - 10);
      b += rose(146, y, 6) + rose(160, y - 4 * e[1], 7.5) + rose(174, y + 1, 6);
      b += leaf(136, y + 4, 12, 160) + leaf(184, y + 4, 12, 20) + leaf(152, y + 9 * e[1], 10, 100 * e[1]);
    });
    return svg('0 0 320 440', b, 'Bàn tiệc cưới');
  }

  /* ---------- 3. Giá treo áo vest và váy ---------- */
  function wardrobe() {
    var b = '<path d="M18 20 L202 20 M28 20 L20 166 M192 20 L200 166 M12 166 L32 166 M190 166 L210 166"/>';
    b += '<path class="thin" d="M80 30 C74 30 73 22 79 20 C84 18 87 24 83 27"/><path d="M80 30 L50 46 L110 46 Z"/>';
    b += '<path d="M52 46 L108 46 L114 128 L86 132 L80 74 L74 132 L46 128 Z"/>';
    b += '<path class="thin" d="M66 46 L80 82 L94 46 M52 46 C42 72 40 102 42 128 M108 46 C118 72 120 102 118 128 M54 104 L68 104"/>';
    b += circle(80, 100, 1.6) + circle(80, 112, 1.6);
    b += '<path class="thin" d="M150 30 C144 30 143 22 149 20 C154 18 157 24 153 27"/><path d="M150 30 L126 44 L174 44 Z"/>';
    b += '<path d="M136 44 L139 62 M164 44 L161 62"/>';
    b += '<path d="M139 62 C145 67 155 67 161 62 L157 94 L143 94 Z"/>';
    b += '<path d="M143 94 C134 120 124 146 116 160 C138 165 162 165 184 160 C176 146 166 120 157 94"/>';
    b += '<path class="thin" d="M147 98 C142 122 136 144 130 161 M153 98 C158 122 164 144 170 161 M150 98 L150 163"/>';
    return svg('0 0 220 172', b, 'Giá treo áo vest và váy cưới');
  }

  /* ---------- 4. Chồng hộp quà và phong bì ---------- */
  function gifts() {
    var b = '<rect x="36" y="112" width="118" height="58" rx="2"/><rect x="30" y="100" width="130" height="14" rx="2"/>';
    b += '<path class="thin" d="M92 100 L92 170 M100 100 L100 170"/>';
    b += '<g transform="rotate(-6 96 76)"><rect x="54" y="60" width="84" height="40" rx="2"/><rect x="49" y="51" width="94" height="11" rx="2"/>' +
      '<path class="thin" d="M92 51 L92 100 M99 51 L99 100"/></g>';
    b += '<g transform="rotate(5 98 36)"><rect x="72" y="26" width="52" height="26" rx="2"/><rect x="68" y="20" width="60" height="8" rx="2"/>' +
      '<path class="thin" d="M95 20 L95 52 M101 20 L101 52"/>' +
      '<path d="M98 20 C88 4 76 10 84 20 Z M98 20 C108 4 120 10 112 20 Z M98 20 L90 30 M98 20 L106 30"/></g>';
    b += '<g transform="rotate(10 172 140)"><rect x="152" y="124" width="42" height="30" rx="2"/>' +
      '<path class="thin" d="M152 124 L173 142 L194 124"/>' +
      '<path class="thin" d="M173 146 C168 141 172 136 173 140 C174 136 178 141 173 146 Z"/></g>';
    b += '<path class="thin" d="M14 172 C60 168 120 175 196 171"/>';
    return svg('0 0 210 180', b, 'Hộp quà và phong bì mừng cưới');
  }

  /* ---------- 5. Bó hoa ---------- */
  function bouquet() {
    var b = '';
    b += leaf(48, 70, 26, 200) + leaf(132, 66, 26, -20) + leaf(92, 22, 22, -95) + leaf(60, 40, 20, 235) + leaf(124, 38, 20, -55);
    b += rose(70, 52, 13) + rose(98, 40, 14) + rose(124, 56, 13) + rose(84, 76, 12) + rose(112, 80, 12) + rose(58, 84, 10) + rose(136, 86, 10);
    b += '<path d="M44 92 L92 196 L60 102 Z"/><path d="M152 94 L102 196 L134 104 Z"/>';
    b += '<path d="M54 98 C78 110 118 110 142 98 L102 196 L92 196 Z"/>';
    b += '<path class="thin" d="M80 108 L94 190 M116 108 L100 190 M98 110 L97 192"/>';
    b += '<path d="M97 172 C82 160 72 168 82 176 C88 180 94 176 97 172 Z M97 172 C112 160 122 168 112 176 C106 180 100 176 97 172 Z"/>';
    b += '<path class="thin" d="M95 175 C90 186 86 194 80 202 M99 175 C104 186 110 194 116 202"/>';
    b += '<path class="thin" d="M93 196 L91 214 M97 196 L97 216 M101 196 L103 214"/>';
    return svg('0 0 194 222', b, 'Bó hoa cưới');
  }

  /* ---------- 6. Điện thoại quay số trên bàn nhỏ ---------- */
  function telephone() {
    var b = '<rect x="26" y="116" width="148" height="10" rx="3"/>';
    b += '<path d="M44 126 L40 186 M156 126 L160 186"/><path class="thin" d="M42 160 L158 160"/>';
    b += '<path d="M62 116 L74 70 C77 63 123 63 126 70 L138 116 Z"/>';
    b += circle(100, 92, 16) + circle(100, 92, 6, 'thin');
    for (var i = 0; i < 9; i++) {
      var a = (-60 + i * 30) * Math.PI / 180;
      b += circle((100 + Math.cos(a) * 11.4).toFixed(1), (92 + Math.sin(a) * 11.4).toFixed(1), 2.3, 'thin');
    }
    b += '<path d="M56 58 C56 46 70 44 74 52 L126 52 C130 44 144 46 144 58 C144 66 132 68 128 61 L72 61 C68 68 56 66 56 58 Z"/>';
    var d = 'M64 106', x = 64, y = 106;
    for (var k = 0; k < 7; k++) {
      d += ' C' + (x - 10) + ' ' + (y + 2) + ' ' + (x - 12) + ' ' + (y + 10) + ' ' + (x - 4) + ' ' + (y + 9);
      d += ' C' + (x + 2) + ' ' + (y + 8) + ' ' + (x - 2) + ' ' + (y + 2) + ' ' + (x - 6) + ' ' + (y + 5);
      x -= 4; y += 7;
    }
    b += '<path class="thin" d="' + d + '"/>';
    return svg('0 0 200 192', b, 'Điện thoại bàn cổ điển');
  }

  /* ---------- Mũi tên xoắn vẽ tay ---------- */
  function arrow(flip) {
    return '<svg class="ill arrow' + (flip ? ' flip' : '') + '" viewBox="0 0 70 50" aria-hidden="true"><g filter="url(#rough)">' +
      '<path d="M8 6 C2 26 26 32 26 18 C26 6 8 16 16 32 C22 42 40 44 58 38"/>' +
      '<path d="M49 32 L59 38 L50 45"/></g></svg>';
  }

  window.ILLUSTRATIONS = {
    couple: couple, banquet: banquet, wardrobe: wardrobe, gifts: gifts,
    bouquet: bouquet, telephone: telephone, arrow: arrow,
  };
})();
