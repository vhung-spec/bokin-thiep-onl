/*
 * Dựng video theo kịch bản (kich-ban/*.mjs). dung-kich-ban.mjs gọi setup(cfg) một lần rồi render(t) cho từng khung hình.
 * Mọi vị trí, độ zoom, độ mờ, hiệu ứng đều tính từ t, nên khung hình nào cũng dựng lại được chính xác.
 *
 * Bố cục ảnh: phủ kín (cover) · lia dọc (tilt) · ảnh dọc giữa nền mờ lấy từ chính ảnh (blurBg) · dải 2–4 ảnh (box + enter).
 * Chuyển cảnh (in.type): dissolve (hoà) · leak (hoà kèm vệt sáng ấm) · wipe (quét mềm) · arch (ô cửa vòm mở ra)
 *                        · zoom (phóng nhẹ xuyên cảnh) · bloom (tiến vào vùng sáng, loá sáng sang cảnh sau) · black (hiện từ tối).
 */
(() => {
  const S = { shots: [], W: 1920, H: 1080 };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, d) => (d > 0 ? clamp((t - a) / d) : t >= a ? 1 : 0);
  const sine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
  const cubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const outCubic = (t) => 1 - Math.pow(1 - t, 3);
  const EASE = { linear: (t) => t, inout: sine, out: (t) => Math.sin((t * Math.PI) / 2), in: (t) => 1 - Math.cos((t * Math.PI) / 2), cubic };
  const px = (n) => `${Math.round(n * 100) / 100}px`;
  const ASSET = '../../xanh-pastel/assets/';
  const ARCH_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
      "<svg xmlns='http://www.w3.org/2000/svg' viewBox='-24 -24 148 198'><defs><filter id='b' x='-30%' y='-30%' width='160%' height='160%'><feGaussianBlur stdDeviation='5'/></filter></defs>" +
        "<path filter='url(#b)' d='M0,150 L0,50 A50,50 0 0 1 100,50 L100,150 Z' fill='#000'/></svg>",
    );
  const ARCH_RATIO = 198 / 148;

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
  // Chuyển động chạy đều suốt thời gian ảnh còn trên màn hình (kể cả lúc đang chuyển sang cảnh sau) để không khựng
  function motion(spec, L, l) {
    const t0 = spec.t0 ?? 0;
    const t1 = spec.until ?? spec.t1 ?? L.span;
    return EASE[spec.ease || 'linear'](prog(l, t0, t1 - t0));
  }

  // ---------- Hình học lớp ảnh ----------
  function photoGeom(L, l) {
    const m = S.meta[L.img];
    const [bx, by, bw, bh] = L.boxPx;
    const iw = m.w;
    const ih = m.h;
    const portrait = ih > iw;
    const fit = L.fit || (S.land && portrait ? 'height' : 'cover');
    let k = fit === 'height' ? (bh * (L.size ?? 1)) / ih : fit === 'width' ? bw / iw : Math.max(bw / iw, bh / ih);
    k *= L.scale ?? 1;
    let [fx, fy] = L.focus || [0.5, 0.5];
    let [tx, ty] = L.to || [];
    if (L.tilt) {
      // lia dọc: tâm khung nhìn đi từ độ cao 'from' đến 'to' của ảnh
      fy = lerp(L.tilt.from, L.tilt.to, motion(L.tilt, L, l));
      ty = 0.5;
    }
    if (!L.to) {
      const w0 = iw * k;
      const h0 = ih * k;
      tx = ((fit === 'height' ? 0.5 : fx) * (bw - w0) + fx * w0) / bw;
      if (!L.tilt) ty = ((fit === 'width' || fit === 'height' ? 0.5 : fy) * (bh - h0) + fy * h0) / bh;
    }
    if (L.lock && L.lock.includes('y')) k = Math.max(k, (ty * bh) / (fy * ih), ((1 - ty) * bh) / ((1 - fy) * ih));
    if (L.zoom) {
      const z = Array.isArray(L.zoom) ? { from: L.zoom[0], to: L.zoom[1] } : L.zoom;
      k *= lerp(z.from, z.to, motion(z, L, l));
    }
    const w = iw * k;
    const h = ih * k;
    let x = tx * bw - fx * w;
    let y = ty * bh - fy * h;
    if (L.pan) x -= L.pan.dx * S.W * motion(L.pan, L, l);
    const coverX = fit === 'cover' || fit === 'width';
    const coverY = fit === 'cover' || (fit === 'height' && !L.size);
    if (coverX && w >= bw) x = clamp(x, bw - w, 0);
    if (coverY && h >= bh) y = clamp(y, bh - h, 0);
    return { x, y, w, h, fx: bx + x + fx * w, fy: by + y + fy * h };
  }

  // Hiệu ứng vào của một ô ảnh trong dải ảnh: trượt nhẹ + hiện dần
  function enterStyle(e, enter, l, slide) {
    let ox = 0;
    let oy = 0;
    if (enter) {
      const p = outCubic(prog(l, enter.at || 0, enter.d ?? 0.9));
      const dist = enter.dist ?? 70;
      const [dx, dy] = { up: [0, dist], down: [0, -dist], left: [-dist, 0], right: [dist, 0], fade: [0, 0] }[enter.from || 'up'];
      e.style.opacity = p;
      ox += dx * (1 - p);
      oy += dy * (1 - p);
      e.style.visibility = l >= (enter.at || 0) ? 'visible' : 'hidden';
    }
    if (slide) {
      // ô ảnh trượt từ vị trí khác về đúng chỗ (ví dụ cô dâu đứng giữa rồi nhường chỗ cho ảnh bên cạnh)
      const p = cubic(prog(l, slide.at || 0, slide.d ?? 1.2));
      ox += slide.from * S.W * (1 - p);
    }
    e.style.transform = ox || oy ? `translate(${px(ox)}, ${px(oy)})` : '';
  }

  function buildPhoto(shot, L, parent) {
    const box = L.box || [0, 0, 1, 1];
    L.boxPx = [box[0] * S.W, box[1] * S.H, box[2] * S.W, box[3] * S.H];
    L.span = shot.showUntil - shot.at;
    const d = el('div', 'box', parent);
    Object.assign(d.style, { left: px(L.boxPx[0]), top: px(L.boxPx[1]), width: px(L.boxPx[2]), height: px(L.boxPx[3]) });
    const meta = S.meta[L.img];
    L.fillColor = L.fill || meta.fill;
    const grad = !L.fill && !L.blurBg && meta.fillGrad;
    d.style.background = grad
      ? `linear-gradient(${grad[0].join(', ')}) left / 50% 100% no-repeat, linear-gradient(${grad[1].join(', ')}) right / 50% 100% no-repeat, ${L.fillColor}`
      : L.fillColor;
    if (L.blurBg) {
      // nền mờ lấy từ chính ảnh (đã làm sẵn bằng chinh_mau.py), trôi rất chậm ngược chiều ảnh để có chiều sâu
      const b = el('img', 'blurbg', d);
      b.src = S.photoUrl(meta.blur);
      shot.waits.push(b.decode().catch(() => {}));
      L.blurEl = b;
    }
    const i = el('img', L.blurBg ? 'lift' : '', d);
    i.decoding = 'sync';
    i.src = S.photoUrl(L.img);
    if (L.feather) {
      const f = `${L.feather * 100}%`;
      const m = `linear-gradient(90deg, transparent 0, #000 ${f}, #000 calc(100% - ${f}), transparent 100%)`;
      i.style.webkitMaskImage = m;
      i.style.maskImage = m;
    }
    shot.waits.push(i.decode().catch(() => {}));
    return (l) => {
      enterStyle(d, L.enter, l, L.slide);
      const g = photoGeom(L, l);
      L.seen = [g.fx, g.fy];
      // Kích thước ảnh cố định từ khung đầu; zoom/lia bằng transform để chạy mượt dưới mức 1 px
      if (!L.base) {
        L.base = [Math.round(g.w), Math.round(g.h)];
        Object.assign(i.style, { width: `${L.base[0]}px`, height: `${L.base[1]}px`, transformOrigin: '0 0', willChange: 'transform' });
      }
      i.style.transform = `translate(${g.x.toFixed(3)}px, ${g.y.toFixed(3)}px) scale(${(g.w / L.base[0]).toFixed(6)}, ${(g.h / L.base[1]).toFixed(6)})`;
      if (L.blurEl) {
        const z = 1.08 + 0.04 * (L.span ? clamp(l / L.span) : 0);
        L.blurEl.style.transform = `scale(${z.toFixed(5)})`;
      }
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
      return L.enter ? (l) => enterStyle(d, L.enter, l) : null;
    }
    if (L.kind === 'deco') {
      const i = el('img', 'deco', parent);
      i.src = ASSET + L.src;
      const [x, y, w] = L.box;
      Object.assign(i.style, { left: px(x * S.W), top: px(y * S.H), width: px(w * S.W), mixBlendMode: L.blend || 'normal' });
      shot.waits.push(i.decode().catch(() => {}));
      return (l) => {
        const a = L.appear || 0;
        let o = (L.opacity ?? 1) * sine(prog(l, a, L.fade ?? 0));
        let tr = L.rotate ? `rotate(${L.rotate}deg)` : '';
        if (L.stamp) {
          // dấu sáp đóng xuống: từ to và mờ, nhấn xuống đúng chỗ, nảy rất nhẹ
          const p = prog(l, a, L.stamp);
          const s = p < 0.75 ? lerp(1.45, 0.97, outCubic(p / 0.75)) : lerp(0.97, 1, sine((p - 0.75) / 0.25));
          o = (L.opacity ?? 1) * clamp(p * 2.2);
          tr += ` scale(${s.toFixed(4)})`;
          i.style.filter = `drop-shadow(0 ${px(lerp(18, 4, p))} ${px(lerp(26, 8, p))} rgba(40, 30, 15, ${lerp(0.15, 0.35, p).toFixed(3)}))`;
        }
        if (L.grow) {
          const p = outCubic(prog(l, a, L.grow));
          tr += ` scale(${lerp(0.82, 1, p).toFixed(4)})`;
        }
        i.style.opacity = o;
        i.style.transform = tr;
      };
    }
    if (L.kind === 'shade') {
      const d = el('div', 'shade', parent);
      return null;
    }
    return null;
  }

  function buildText(shot, T, parent) {
    const d = el('div', `txt f-${T.font || 'serif'}`, parent);
    d.textContent = T.text;
    const fill = shot.layers.find((L) => L.img)?.fillColor;
    const contrast = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    const IVORY = '#F3EDE1';
    const color = T.color === 'auto' && fill
      ? (contrast(lum(IVORY), lum(fill)) > contrast(lum(S.ink), lum(fill)) ? IVORY : S.ink)
      : T.color && T.color !== 'auto' ? T.color : S.ink;
    Object.assign(d.style, { fontSize: px(T.size), color, top: px(T.y * S.H), left: px(T.x * S.W), letterSpacing: T.ls ? `${T.ls}em` : 'normal' });
    if (T.shadow) d.style.textShadow = '0 2px 3px rgba(0,0,0,.35), 0 4px 28px rgba(0,0,0,.55)';
    const shift = (T.align || 'center') === 'left' ? '0' : '-50%';
    d.style.transform = `translate(${shift}, -50%)`;
    return (l) => {
      const a = T.appear || 0;
      if (T.write) {
        // chữ hiện như đang được viết: vệt mở mềm chạy từ trái sang phải
        const p = sine(prog(l, a, T.write));
        const edge = lerp(-25, 100, p);
        const m = p >= 1 ? 'none' : `linear-gradient(90deg, #000 ${edge}%, transparent ${edge + 25}%)`;
        d.style.webkitMaskImage = m;
        d.style.maskImage = m;
        d.style.opacity = l >= a ? 1 : 0;
      } else {
        let f = sine(prog(l, a, T.fade ?? 0.8));
        if (T.out != null) f *= 1 - sine(prog(l, T.out, T.outD ?? 1.0));
        d.style.opacity = f;
        if (T.rise) d.style.transform = `translate(${shift}, calc(-50% + ${px((1 - f) * T.rise)}))`;
      }
      d.style.visibility = T.until != null && l >= T.until ? 'hidden' : 'visible';
    };
  }

  function mount(shot) {
    shot.el = el('div', 'shot', S.stage);
    shot.el.style.zIndex = shot.i + 1;
    shot.inner = el('div', 'inner', shot.el);
    if (shot.bg) shot.inner.style.background = shot.bg === 'paper' ? `url(${S.paperUrl}) center / cover` : shot.bg;
    shot.waits = [];
    const ups = [];
    for (const L of shot.layers || []) ups.push(buildLayer(shot, L, shot.inner));
    if (shot.vignette !== false && (shot.layers || []).some((L) => L.img)) el('div', 'vignette', shot.inner);
    for (const T of shot.texts || []) ups.push(buildText(shot, T, shot.inner));
    shot.ups = ups.filter(Boolean);
    shot.ready = Promise.all(shot.waits);
  }
  function unmount(shot) {
    shot.el.remove();
    shot.el = null;
  }
  function resetFx(s) {
    Object.assign(s.el.style, { opacity: 1, webkitMaskImage: 'none', maskImage: 'none' });
    Object.assign(s.inner.style, { transform: '', filter: '' });
  }

  // ---------- Chuyển cảnh ----------
  // Áp lên cảnh vào (inS) và cảnh ra (outS) theo tiến độ p (0..1); trả về vệt sáng cần vẽ (nếu có)
  function transition(inS, outS, p) {
    const tr = inS.in;
    const [cx, cy] = (tr.at || [0.5, 0.5]).map((v, i) => v * (i ? S.H : S.W));
    switch (tr.type) {
      case 'dissolve':
        inS.el.style.opacity = sine(p);
        return null;
      case 'leak':
        inS.el.style.opacity = sine(clamp((p - 0.15) / 0.7));
        return { x: lerp(-0.15, 1.15, p) * S.W, y: lerp(0.25, 0.6, p) * S.H, r: 0.95 * S.W, a: 0.75 * Math.sin(Math.PI * p) };
      case 'wipe': {
        const e = lerp(-45, 100, cubic(p));
        const m = p >= 1 ? 'none' : `linear-gradient(100deg, #000 ${e}%, transparent ${e + 45}%)`;
        inS.el.style.webkitMaskImage = m;
        inS.el.style.maskImage = m;
        if (outS) outS.inner.style.transform = `translateX(${px(-40 * sine(p))})`;
        return null;
      }
      case 'arch': {
        // ô cửa vòm sáng mở rộng ra cảnh mới
        const q = cubic(p);
        const w = lerp(0.04, 4.2, q * q) * S.W;
        const h = w * ARCH_RATIO;
        const m = p >= 1 ? 'none' : `url("${ARCH_SVG}") ${px(cx - w / 2)} ${px(cy - h * 0.56)} / ${px(w)} ${px(h)} no-repeat`;
        inS.el.style.webkitMask = m;
        inS.el.style.mask = m;
        inS.inner.style.transform = `scale(${lerp(1.08, 1, sine(p)).toFixed(4)})`;
        inS.inner.style.transformOrigin = `${px(cx)} ${px(cy)}`;
        if (outS) {
          outS.inner.style.transform = `scale(${lerp(1, 1.06, sine(p)).toFixed(4)})`;
          outS.inner.style.transformOrigin = `${px(cx)} ${px(cy)}`;
        }
        return { x: cx, y: cy, r: Math.max(w * 0.9, 0.25 * S.W), a: 0.55 * Math.sin(Math.PI * Math.min(1, p * 1.25)) };
      }
      case 'zoom': {
        const o = sine(p);
        inS.el.style.opacity = o;
        inS.inner.style.transform = `scale(${lerp(1.07, 1, o).toFixed(4)})`;
        inS.inner.style.filter = `blur(${px(lerp(7, 0, o))})`;
        if (outS) {
          outS.inner.style.transform = `scale(${lerp(1, 1.1, o).toFixed(4)})`;
          outS.inner.style.filter = `blur(${px(lerp(0, 7, o))})`;
        }
        return null;
      }
      case 'bloom': {
        // tiến vào vùng sáng: cảnh ra phóng về tâm sáng và loá dần, cảnh vào hiện ra từ ánh sáng
        if (outS) {
          outS.inner.style.transformOrigin = `${px(cx)} ${px(cy)}`;
          outS.inner.style.transform = `scale(${lerp(1, 1.22, cubic(p)).toFixed(4)})`;
          outS.inner.style.filter = `brightness(${lerp(1, 2.1, cubic(p)).toFixed(3)}) blur(${px(lerp(0, 5, p))})`;
        }
        inS.el.style.opacity = clamp((p - 0.35) / 0.65) ** 1.3;
        return { x: cx, y: cy, r: lerp(0.4, 1.4, p) * S.W, a: 0.9 * Math.sin(Math.PI * clamp(p * 1.1)) };
      }
      default:
        return null;
    }
  }

  // ---------- Bụi sáng vàng (vẽ theo hạt giống cố định → khung nào cũng như nhau khi dựng lại) ----------
  function makeDust(n) {
    let seed = 20261128;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
    return Array.from({ length: n }, () => ({
      x: rnd() * S.W, y: rnd() * S.H, r: 1.2 + rnd() ** 2 * 4.5, vy: 6 + rnd() * 16, vx: -4 + rnd() * 8,
      sway: 6 + rnd() * 18, f: 0.15 + rnd() * 0.35, ph: rnd() * 6.28, a: 0.25 + rnd() * 0.55,
    }));
  }
  function drawDust(t, amount) {
    const c = S.dustCtx;
    c.clearRect(0, 0, S.W, S.H);
    if (amount <= 0.001) return;
    for (const d of S.dust) {
      const y = (((d.y - d.vy * t) % (S.H + 40)) + S.H + 40) % (S.H + 40) - 20;
      const x = (((d.x + d.vx * t + Math.sin(t * d.f + d.ph) * d.sway) % S.W) + S.W) % S.W;
      const tw = 0.55 + 0.45 * Math.sin(t * d.f * 4 + d.ph * 3);
      const a = d.a * tw * amount;
      const g = c.createRadialGradient(x, y, 0, x, y, d.r * 3.2);
      g.addColorStop(0, `rgba(255, 238, 200, ${a.toFixed(3)})`);
      g.addColorStop(0.35, `rgba(255, 214, 150, ${(a * 0.5).toFixed(3)})`);
      g.addColorStop(1, 'rgba(255, 200, 130, 0)');
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, d.r * 3.2, 0, 6.2832);
      c.fill();
    }
  }

  window.setup = async (cfg) => {
    Object.assign(S, { W: cfg.W, H: cfg.H, land: cfg.W > cfg.H, meta: cfg.meta, paperUrl: cfg.paperUrl, ink: cfg.ink || '#2D3826', total: cfg.total });
    S.photoUrl = (name) => `/__anh__/${encodeURIComponent(name)}`;
    S.stage = document.getElementById('stage');
    Object.assign(S.stage.style, { width: px(S.W), height: px(S.H), transform: `scale(${cfg.k})` });
    const dust = el('canvas', 'fx', S.stage);
    dust.width = S.W;
    dust.height = S.H;
    dust.style.zIndex = 9000;
    dust.style.mixBlendMode = 'screen';
    S.dustCtx = dust.getContext('2d');
    S.dust = makeDust(70);
    S.leak = el('div', 'fx', S.stage);
    Object.assign(S.leak.style, { zIndex: 9001, mixBlendMode: 'screen', opacity: 0 });
    S.black = el('div', '', S.stage);
    S.black.id = 'black';
    S.shots = cfg.shots.map((s, i) => ({ ...s, i }));
    S.shots.forEach((s, i) => {
      const next = S.shots[i + 1];
      s.end = next ? next.at : S.total;
      s.showUntil = s.end + (next && next.in && next.in.type !== 'black' ? next.in.d : 0);
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

  // Kiểm tra: điểm nhìn (focus) của lớp ảnh trên cùng, theo từng cảnh đang hiện
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
    let leak = null;
    let dust = 0;
    for (const s of live) {
      s.el.style.visibility = 'visible';
      resetFx(s);
    }
    for (const s of live) {
      const l = t - s.at;
      for (const u of s.ups) u(l);
      if (s.in && s.in.type === 'black') black = Math.max(black, 1 - sine(prog(l, 0, s.in.d)));
      let vis = 1;
      if (s.in && s.in.type !== 'black' && l < s.in.d) {
        const p = l / s.in.d;
        const prev = S.shots[s.i - 1];
        leak = transition(s, prev && prev.el ? prev : null, p) || leak;
        vis = sine(p);
      }
      const next = S.shots[s.i + 1];
      if (next && t >= next.at && next.in && next.in.type !== 'black') vis *= 1 - sine(prog(t, next.at, next.in.d));
      dust = Math.max(dust, (s.dust || 0) * vis);
    }
    if (!leak) {
      // vệt sáng ấm trôi chậm trong cảnh (ví dụ trên thiệp tên) khi không có chuyển cảnh
      for (const s of live) {
        if (!s.glow) continue;
        const g = s.glow;
        const q = sine(prog(t - s.at, 0, s.showUntil - s.at));
        const fadeIn = sine(prog(t - s.at, 0, 1.5));
        leak = { x: lerp(g.from[0], g.to[0], q) * S.W, y: lerp(g.from[1], g.to[1], q) * S.H, r: (g.r ?? 0.7) * S.W, a: (g.a ?? 0.35) * fadeIn };
      }
    }
    if (leak && leak.a > 0.002) {
      S.leak.style.opacity = 1;
      S.leak.style.background = `radial-gradient(circle ${px(leak.r)} at ${px(leak.x)} ${px(leak.y)}, rgba(255, 236, 205, ${leak.a.toFixed(3)}) 0%, rgba(255, 196, 130, ${(leak.a * 0.55).toFixed(3)}) 35%, rgba(255, 170, 100, 0) 100%)`;
    } else S.leak.style.opacity = 0;
    drawDust(t, dust);
    S.black.style.opacity = black;
  };
})();
