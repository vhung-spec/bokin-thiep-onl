/*
 * Dựng video theo kịch bản (kich-ban/*.mjs). dung-kich-ban.mjs gọi setup(cfg) một lần rồi render(t) cho từng khung hình.
 * Mọi vị trí, độ zoom, độ mờ đều tính từ t, nên khung hình nào cũng dựng lại được chính xác.
 */
(() => {
  const S = { shots: [], W: 1920, H: 1080 };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, d) => (d > 0 ? clamp((t - a) / d) : t >= a ? 1 : 0);
  const sine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const EASE = { linear: (t) => t, inout: sine, out: (t) => Math.sin((t * Math.PI) / 2), in: (t) => 1 - Math.cos((t * Math.PI) / 2) };
  // Chuyển động mặc định chạy đều suốt thời gian ảnh còn trên màn hình (kể cả lúc đang hoà sang cảnh sau) để không khựng
  function motion(spec, L, l) {
    const t0 = spec.t0 ?? 0;
    const t1 = spec.until ?? spec.t1 ?? L.span;
    return EASE[spec.ease || 'linear'](prog(l, t0, t1 - t0));
  }
  const px = (n) => `${Math.round(n * 100) / 100}px`;
  const ASSET = '../../xanh-pastel/assets/';

  function el(tag, cls, parent) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    parent.appendChild(e);
    return e;
  }
  function lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  }

  // ---------- Lớp ảnh: tính khung ảnh trong ô (box) theo focus / to / zoom / pan ----------
  function photoGeom(L, l) {
    const m = S.meta[L.img];
    const [bx, by, bw, bh] = L.boxPx;
    const iw = m.w;
    const ih = m.h;
    const portrait = ih > iw;
    const fit = L.fit || (S.land && portrait ? 'height' : 'cover');
    const coverK = Math.max(bw / iw, bh / ih);
    let k = fit === 'height' ? bh / ih : fit === 'width' ? bw / iw : coverK;
    k *= L.scale ?? 1;
    const [fx, fy] = L.focus || [0.5, 0.5];
    // Không ghi 'to': ảnh đặt như object-position theo focus (ảnh dọc cao bằng khung thì nằm giữa),
    // rồi điểm focus giữ nguyên chỗ đó khi zoom.
    let [tx, ty] = L.to || [];
    if (!L.to) {
      const w0 = iw * k;
      const h0 = ih * k;
      tx = ((fit === 'height' ? 0.5 : fx) * (bw - w0) + fx * w0) / bw;
      ty = ((fit === 'width' ? 0.5 : fy) * (bh - h0) + fy * h0) / bh;
    }
    // lock: phóng vừa đủ để điểm focus nằm đúng vị trí 'to' mà ảnh vẫn phủ kín theo chiều đó
    if (L.lock && L.lock.includes('y')) k = Math.max(k, (ty * bh) / (fy * ih), ((1 - ty) * bh) / ((1 - fy) * ih));
    if (L.lock && L.lock.includes('x')) k = Math.max(k, (tx * bw) / (fx * iw), ((1 - tx) * bw) / ((1 - fx) * iw));
    if (L.zoom) {
      const z = Array.isArray(L.zoom) ? { from: L.zoom[0], to: L.zoom[1] } : L.zoom;
      k *= lerp(z.from, z.to, motion(z, L, l));
    }
    const w = iw * k;
    const h = ih * k;
    let x = tx * bw - fx * w;
    let y = ty * bh - fy * h;
    if (L.pan) x -= L.pan.dx * S.W * motion(L.pan, L, l);
    // không để lộ mép ảnh theo chiều phải phủ kín
    const coverX = fit === 'cover' || fit === 'width';
    const coverY = fit === 'cover' || fit === 'height';
    if (coverX && w >= bw) x = clamp(x, bw - w, 0);
    if (coverY && h >= bh) y = clamp(y, bh - h, 0);
    return { x, y, w, h, fx: bx + x + fx * w, fy: by + y + fy * h };
  }

  function buildPhoto(shot, L, parent) {
    const box = L.box || [0, 0, 1, 1];
    L.boxPx = [box[0] * S.W, box[1] * S.H, box[2] * S.W, box[3] * S.H];
    const d = el('div', 'box', parent);
    Object.assign(d.style, { left: px(L.boxPx[0]), top: px(L.boxPx[1]), width: px(L.boxPx[2]), height: px(L.boxPx[3]) });
    L.fillColor = L.fill || S.meta[L.img].fill;
    const grad = !L.fill && S.meta[L.img].fillGrad;
    d.style.background = grad
      ? `linear-gradient(${grad[0].join(', ')}) left / 50% 100% no-repeat, linear-gradient(${grad[1].join(', ')}) right / 50% 100% no-repeat, ${L.fillColor}`
      : L.fillColor;
    const i = el('img', '', d);
    i.decoding = 'sync';
    i.src = S.photoUrl(L.img);
    if (L.feather) {
      const f = `${L.feather * 100}%`;
      const m = `linear-gradient(90deg, transparent 0, #000 ${f}, #000 calc(100% - ${f}), transparent 100%)`;
      i.style.webkitMaskImage = m;
      i.style.maskImage = m;
    }
    shot.waits.push(i.decode().catch(() => {}));
    L.span = shot.showUntil - shot.at;
    return (l) => {
      const a = L.appear || 0;
      d.style.visibility = l >= a ? 'visible' : 'hidden';
      if (L.appearFade) d.style.opacity = sine(prog(l, a, L.appearFade));
      const g = photoGeom(L, l);
      L.seen = [g.fx, g.fy];
      // Kích thước ảnh cố định từ khung đầu (số nguyên px); zoom/lia bằng transform để chạy mượt dưới mức 1 px,
      // không bị trình duyệt làm tròn kích thước từng nấc gây giật nhẹ.
      if (!L.base) {
        L.base = [Math.round(g.w), Math.round(g.h)];
        Object.assign(i.style, { width: `${L.base[0]}px`, height: `${L.base[1]}px`, transformOrigin: '0 0', willChange: 'transform' });
      }
      i.style.transform = `translate(${g.x.toFixed(3)}px, ${g.y.toFixed(3)}px) scale(${(g.w / L.base[0]).toFixed(6)}, ${(g.h / L.base[1]).toFixed(6)})`;
    };
  }

  function buildLayer(shot, L, parent) {
    if (L.img) return buildPhoto(shot, L, parent);
    if (L.kind === 'paper') {
      const d = el('div', 'paper', parent);
      d.style.backgroundImage = `url(${S.paperUrl})`;
      return null;
    }
    if (L.kind === 'sage') {
      const d = el('div', 'sage', parent);
      const [x, y, w, h] = L.box;
      Object.assign(d.style, { left: px(x * S.W), top: px(y * S.H), width: px(w * S.W), height: px(h * S.H) });
      return null;
    }
    if (L.kind === 'deco') {
      const i = el('img', 'deco', parent);
      i.src = ASSET + L.src;
      const [x, y, w] = L.box;
      Object.assign(i.style, { left: px(x * S.W), top: px(y * S.H), width: px(w * S.W), mixBlendMode: L.blend || 'normal' });
      if (L.rotate) i.style.transform = `rotate(${L.rotate}deg)`;
      shot.waits.push(i.decode().catch(() => {}));
      return (l) => {
        i.style.opacity = (L.opacity ?? 1) * sine(prog(l, L.appear || 0, L.fade ?? 0));
      };
    }
    return null;
  }

  function buildText(shot, T, parent) {
    const d = el('div', `txt f-${T.font || 'serif'}`, parent);
    d.textContent = T.text;
    const fill = shot.layers.find((L) => L.img)?.fillColor;
    // 'auto': chọn màu ngà hoặc màu rêu, màu nào tương phản với nền mạnh hơn (đọc rõ khi nhìn xa)
    const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const IVORY = '#F3EDE1';
    const color = T.color === 'auto' && fill
      ? (contrast(lum(IVORY), lum(fill)) > contrast(lum(S.ink), lum(fill)) ? IVORY : S.ink)
      : T.color && T.color !== 'auto' ? T.color : S.ink;
    Object.assign(d.style, {
      fontSize: px(T.size),
      color,
      top: px(T.y * S.H),
      letterSpacing: T.ls ? `${T.ls}em` : 'normal',
    });
    const align = T.align || 'center';
    if (align === 'left') d.style.left = px(T.x * S.W);
    else d.style.left = px(T.x * S.W);
    const shift = align === 'left' ? '0' : '-50%';
    return (l) => {
      const f = sine(prog(l, T.appear || 0, T.fade ?? 0.8));
      d.style.opacity = f;
      d.style.transform = `translate(${shift}, -50%)`;
      d.style.visibility = T.until != null && l >= T.until ? 'hidden' : 'visible';
    };
  }

  function mount(shot) {
    shot.el = el('div', 'shot', S.stage);
    shot.el.style.zIndex = shot.i + 1;
    if (shot.bg) shot.el.style.background = shot.bg;
    shot.waits = [];
    const ups = [];
    for (const L of shot.layers || []) ups.push(buildLayer(shot, L, shot.el));
    for (const T of shot.texts || []) ups.push(buildText(shot, T, shot.el));
    shot.ups = ups.filter(Boolean);
    shot.ready = Promise.all(shot.waits);
  }
  function unmount(shot) {
    shot.el.remove();
    shot.el = null;
  }

  window.setup = async (cfg) => {
    Object.assign(S, { W: cfg.W, H: cfg.H, land: cfg.W > cfg.H, meta: cfg.meta, paperUrl: cfg.paperUrl, ink: cfg.ink || '#2D3826', total: cfg.total });
    S.photoUrl = (name) => `/__anh__/${encodeURIComponent(name)}`;
    S.stage = document.getElementById('stage');
    Object.assign(S.stage.style, { width: px(S.W), height: px(S.H), transform: `scale(${cfg.k})` });
    S.black = el('div', '', S.stage);
    S.black.id = 'black';
    S.shots = cfg.shots.map((s, i) => ({ ...s, i }));
    S.shots.forEach((s, i) => {
      const next = S.shots[i + 1];
      s.end = next ? next.at : S.total;
      s.showUntil = s.end + (next && next.in && next.in.type === 'dissolve' ? next.in.d : 0);
    });
    const sample = 'Văn Hùng & Tuyết Anh — Hải Phòng ắềỗữ 0123456789';
    await Promise.all([
      document.fonts.load('40px Ephesis', sample),
      document.fonts.load('40px Lora', sample),
      document.fonts.load('italic 40px Lora', sample),
      document.fonts.load('500 40px "Be Vietnam Pro"', sample),
    ]);
    await document.fonts.ready;
    const ok = ['40px Ephesis', '40px Lora', 'italic 40px Lora', '500 40px "Be Vietnam Pro"'].every((f) => document.fonts.check(f, sample));
    return { shots: S.shots.length, fontsOk: ok };
  };

  // Kiểm tra: điểm nhìn (focus) của lớp ảnh đầu tiên trên màn hình, theo từng cảnh đang hiện
  window.debugFocus = () =>
    S.shots.filter((s) => s.el && s.el.style.visibility === 'visible').map((s) => {
      const L = (s.layers || []).filter((x) => x.img && x.seen).pop();
      return { i: s.i, img: L ? L.img : null, at: L ? L.seen.map(Math.round) : null };
    });

  window.render = async (t) => {
    const live = [];
    for (const s of S.shots) {
      if (t >= s.at - 2.5 && t < s.showUntil) {
        if (!s.el) mount(s);
        if (t >= s.at) live.push(s);
        else s.el.style.visibility = 'hidden';
      } else if (s.el) unmount(s);
    }
    await Promise.all(live.map((s) => s.ready));
    let black = 0;
    for (const s of live) {
      const l = t - s.at;
      s.el.style.visibility = 'visible';
      s.el.style.opacity = s.in && s.in.type === 'dissolve' ? sine(prog(l, 0, s.in.d)) : 1;
      if (s.in && s.in.type === 'black') black = Math.max(black, 1 - sine(prog(l, 0, s.in.d)));
      for (const u of s.ups) u(l);
    }
    S.black.style.opacity = black;
  };
})();
