/*
 * Mẫu video slide ảnh cưới — tông xanh xô thơm & vàng của thiệp xanh pastel.
 * lam-video.mjs gọi setup(cfg) một lần rồi render(t) cho từng khung hình (t tính bằng giây).
 * Mọi chuyển động tính từ t, không dùng CSS animation, nên khung hình nào cũng dựng lại được chính xác.
 */
(() => {
  const ASSET = '../../xanh-pastel/assets/';
  const IMG = {
    card: ASSET + 'bia/trang-dau.jpg',
    seal: ASSET + 'bia/dau-sap.webp',
    sprig: ASSET + 'canh-la-vang.webp',
    garland: ASSET + 'day-la-vang.webp',
  };
  const CARD_RATIO = 941 / 1672;

  const S = { scenes: [], W: 1920, H: 1080, X: 1.2, total: 0 };
  const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
  const lerp = (a, b, p) => a + (b - a) * p;
  const prog = (t, a, d) => clamp((t - a) / d);
  const ease = {
    out: (t) => 1 - Math.pow(1 - t, 3),
    soft: (t) => 1 - Math.pow(1 - t, 4),
    io: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    sine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  };

  function el(tag, cls, parent, props = {}) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    Object.assign(e, props);
    parent.appendChild(e);
    return e;
  }
  const px = (n) => `${Math.round(n * 100) / 100}px`;
  function place(e, x, y, w, h) {
    Object.assign(e.style, { left: px(x), top: px(y), width: px(w) });
    if (h != null) e.style.height = px(h);
  }
  function img(cls, parent, src, s) {
    const i = el('img', cls, parent, { src, decoding: 'sync' });
    s.waits.push(i.decode().catch(() => {}));
    return i;
  }

  // Nền giấy xô thơm: ảnh giấy dọc 1080×1920, khung ngang thì xoay 90° cho nét.
  function paper(s) {
    const d = el('div', 'paper', s.el);
    if (S.land) {
      place(d, (S.W - S.H) / 2, (S.H - S.W) / 2, S.H, S.W);
      d.style.transform = 'rotate(90deg)';
    } else place(d, 0, 0, S.W, S.H);
    el('div', 'vignette', s.el);
  }

  // Ảnh in có viền giấy ngà và bóng đổ.
  function print(s, photo, cx, cy, w, h, rot) {
    const pad = Math.round(Math.min(w, h) * 0.03) + 6;
    const d = el('div', 'print', s.el);
    place(d, cx - w / 2 - pad, cy - h / 2 - pad, w + pad * 2, h + pad * 2);
    d.style.padding = px(pad);
    img('', d, photo.src, s);
    return { e: d, rot };
  }

  function text(parent, cls, str, cy, size, extra = {}) {
    const d = el('div', 'line ' + cls, parent, { textContent: str });
    Object.assign(d.style, { top: px(cy), fontSize: px(size), transform: 'translateY(-50%)' }, extra);
    return d;
  }

  // ---------- Các loại cảnh ----------

  // Tấm thiệp có khung hoa giữa nền giấy — dùng cho mở đầu và kết thúc.
  function cardScene(s, lines) {
    paper(s);
    const ch = S.land ? S.H * 0.925 : S.H * 0.8;
    const cw = ch * CARD_RATIO;
    const u = cw / 560;
    const sprigs = [];
    const sz = 300 * u;
    const sprigPos = [
      [S.W / 2 - cw / 2 - sz * 0.62, S.H / 2 + ch * 0.12, -28],
      [S.W / 2 + cw / 2 - sz * 0.38, S.H / 2 - ch * 0.47, 152],
    ];
    for (const [x, y, r] of sprigPos) {
      const i = img('deco', s.el, IMG.sprig, s);
      place(i, x, y, sz, sz);
      sprigs.push({ e: i, r });
    }
    const card = el('div', 'card', s.el);
    place(card, (S.W - cw) / 2, (S.H - ch) / 2, cw, ch);
    img('bg', card, IMG.card, s);
    const items = lines(card, ch, u);
    const seal = img('deco', card, IMG.seal, s);
    const ss = 118 * u;
    place(seal, (cw - ss) / 2, ch * 0.815 - ss / 2, ss, ss * 455 / 452);
    return (l) => {
      const e = ease.soft(prog(l, 0.15, 1.8));
      card.style.opacity = e;
      card.style.transform = `translateY(${px((1 - e) * 70 * u)}) scale(${lerp(1, 1.025, l / s.dur)})`;
      sprigs.forEach((sp, i) => {
        const f = ease.soft(prog(l, 0.9 + i * 0.25, 1.6));
        sp.e.style.opacity = f;
        sp.e.style.transform = `rotate(${sp.r + (1 - f) * (i ? 14 : -14) + Math.sin(l * 0.9 + i) * 1.6}deg)`;
      });
      items.forEach((it, i) => {
        const f = ease.soft(prog(l, it.at ?? 1.0 + i * 0.32, 1.3));
        it.e.style.opacity = f;
        it.e.style.transform = `translateY(calc(-50% + ${px((1 - f) * 18 * u)}))`;
      });
      const f = prog(l, items.length * 0.32 + 1.2, 0.8);
      seal.style.opacity = clamp(f * 2);
      seal.style.transform = `scale(${lerp(1.45, 1, ease.out(f))}) rotate(${(1 - ease.out(f)) * -12}deg)`;
    };
  }

  function introScene(s) {
    const m = S.cfg.moDau;
    return cardScene(s, (card, ch, u) => {
      const items = [];
      if (m.tren) items.push({ e: text(card, 'kicker', m.tren, ch * 0.25, 19 * u, { letterSpacing: '.32em', paddingLeft: '.32em' }) });
      items.push({ e: text(card, 'name', m.ten1, ch * 0.355, 92 * u) });
      items.push({ e: text(card, 'amp', '&', ch * 0.445, 64 * u) });
      items.push({ e: text(card, 'name', m.ten2, ch * 0.53, 92 * u) });
      const g = img('deco', card, IMG.garland, s);
      const gw = 250 * u;
      Object.assign(g.style, { left: '50%', marginLeft: px(-gw / 2), top: px(ch * 0.63 - gw * 0.115), width: px(gw) });
      items.push({ e: g });
      if (m.ngay) items.push({ e: text(card, 'date', m.ngay, ch * 0.695, 27 * u, { letterSpacing: '.22em', paddingLeft: '.22em' }) });
      return items;
    });
  }

  function outroScene(s) {
    const m = S.cfg.ketThuc;
    const d = S.cfg.moDau;
    return cardScene(s, (card, ch, u) => {
      const items = [];
      items.push({ e: text(card, 'name', m.tieuDe, ch * 0.33, 100 * u) });
      if (m.loi) items.push({ e: text(card, 'msg', m.loi, ch * 0.47, 24 * u, { left: '17%', width: '66%' }) });
      const g = img('deco', card, IMG.garland, s);
      const gw = 230 * u;
      Object.assign(g.style, { left: '50%', marginLeft: px(-gw / 2), top: px(ch * 0.585 - gw * 0.115), width: px(gw) });
      items.push({ e: g });
      items.push({ e: text(card, 'name', `${d.ten1} & ${d.ten2}`, ch * 0.665, 54 * u) });
      return items;
    });
  }

  // Ảnh đúng chiều khung: phủ kín màn hình, lia và zoom chậm.
  function fullScene(s) {
    const i = img('full', s.el, s.photos[0].src, s);
    const k = s.n % 3;
    const from = [[-1.6, 0, 1.05], [0, 1.1, 1.15], [1.6, -0.6, 1.06]][k];
    const to = [[1.6, 0, 1.14], [0, -1.1, 1.06], [-1.6, 0.6, 1.15]][k];
    let cap = null;
    if (s.caption) {
      el('div', 'shade', s.el);
      cap = el('div', 'cap on-photo', s.el, { textContent: s.caption });
      const size = S.land ? 96 : 104;
      place(cap, S.W * 0.1, S.H * (S.land ? 0.78 : 0.82), S.W * 0.8);
      cap.style.fontSize = px(size);
    }
    return (l) => {
      const p = ease.sine(clamp(l / s.dur));
      i.style.transform = `translate(${lerp(from[0], to[0], p)}%, ${lerp(from[1], to[1], p)}%) scale(${lerp(from[2], to[2], p)})`;
      if (cap) {
        const f = ease.soft(prog(l, 0.9, 1.4));
        cap.style.opacity = f;
        cap.style.transform = `translateY(${px((1 - f) * 24)})`;
      }
    };
  }

  // Kích thước ảnh in sao cho vừa ô (bw × bh), giữ tỉ lệ ảnh.
  function fit(photo, bw, bh) {
    const a = photo.w / photo.h;
    return a > bw / bh ? [bw, bw / a] : [bh * a, bh];
  }

  // Hai ảnh lệch chiều khung (ảnh dọc trong khung ngang): đặt cạnh nhau như hai tấm ảnh in.
  function pairScene(s) {
    paper(s);
    const [p, q] = s.photos;
    const flip = s.n % 2 ? -1 : 1;
    const prints = [];
    if (S.land) {
      const [w1, h1] = fit(p, 640, 800);
      const [w2, h2] = fit(q, 640, 800);
      const gap = 110;
      const tot = w1 + w2 + gap;
      prints.push(print(s, p, (S.W - tot) / 2 + w1 / 2, S.H / 2 - 14 * flip, w1, h1, -2.2 * flip));
      prints.push(print(s, q, (S.W + tot) / 2 - w2 / 2, S.H / 2 + 16 * flip, w2, h2, 1.8 * flip));
    } else {
      const [w1, h1] = fit(p, 880, 690);
      const [w2, h2] = fit(q, 880, 690);
      const gap = 110;
      const tot = h1 + h2 + gap;
      prints.push(print(s, p, S.W / 2 - 16 * flip, (S.H - tot) / 2 + h1 / 2, w1, h1, -1.8 * flip));
      prints.push(print(s, q, S.W / 2 + 16 * flip, (S.H + tot) / 2 - h2 / 2, w2, h2, 2.0 * flip));
    }
    return (l) => {
      const z = lerp(1, 1.035, ease.sine(clamp(l / s.dur)));
      prints.forEach((pr, i) => {
        const f = ease.soft(prog(l, 0.2 + i * 0.4, 1.3));
        pr.e.style.opacity = clamp(f * 1.6);
        const dy = (1 - f) * 46;
        const r = pr.rot + (1 - f) * (i ? 3 : -3);
        pr.e.style.transform = `translateY(${px(dy)}) rotate(${r}deg) scale(${z})`;
      });
    };
  }

  // Một ảnh lệch chiều khung: ảnh in một bên, chữ viết tay bên kia.
  function singleScene(s) {
    paper(s);
    const p = s.photos[0];
    const flip = s.n % 2 ? -1 : 1;
    let pr, capBox;
    if (S.land) {
      const [w, h] = fit(p, 760, 840);
      const hasCap = !!s.caption;
      const cx = hasCap ? (flip > 0 ? S.W * 0.34 : S.W * 0.66) : S.W / 2;
      pr = print(s, p, cx, S.H / 2, w, h, -1.6 * flip);
      if (hasCap) capBox = { cx: flip > 0 ? S.W * 0.705 : S.W * 0.295, cy: S.H / 2 + 30, w: 860, size: 124 };
    } else {
      const [w, h] = fit(p, 940, 1000);
      const hasCap = !!s.caption;
      pr = print(s, p, S.W / 2, hasCap ? S.H * 0.4 : S.H / 2, w, h, -1.5 * flip);
      if (hasCap) capBox = { cx: S.W / 2, cy: S.H * 0.4 + h / 2 + 260, w: 960, size: 128 };
    }
    let cap = null, g = null;
    if (capBox) {
      cap = el('div', 'cap', s.el, { textContent: s.caption });
      place(cap, capBox.cx - capBox.w / 2, capBox.cy, capBox.w);
      Object.assign(cap.style, { fontSize: px(capBox.size), transform: 'translateY(-50%)' });
      g = img('deco', s.el, IMG.garland, s);
      const gw = 380;
      const th = cap.offsetHeight; // chiều cao chữ thật (1 hay 2 dòng) để đặt dải lá ngay phía trên
      place(g, capBox.cx - gw / 2, capBox.cy - th / 2 - 18 - gw * 0.23, gw);
    }
    return (l) => {
      const z = lerp(1, 1.04, ease.sine(clamp(l / s.dur)));
      const f = ease.soft(prog(l, 0.2, 1.3));
      pr.e.style.opacity = clamp(f * 1.6);
      pr.e.style.transform = `translateY(${px((1 - f) * 46)}) rotate(${pr.rot + (1 - f) * -3 * flip}deg) scale(${z})`;
      if (cap) {
        const c = ease.soft(prog(l, 0.9, 1.5));
        cap.style.opacity = c;
        cap.style.transform = `translateY(calc(-50% + ${px((1 - c) * 22)}))`;
        const gg = ease.soft(prog(l, 1.3, 1.3));
        g.style.opacity = gg;
        g.style.transform = `scaleX(${lerp(0.6, 1, gg)})`;
      }
    };
  }

  const BUILD = { intro: introScene, outro: outroScene, full: fullScene, pair: pairScene, single: singleScene };

  // ---------- Chuyển cảnh: cảnh sau hiện dần lên trên cảnh trước ----------
  const TRANS = {
    fade: (e, p) => { e.style.opacity = p; },
    zoom: (e, p) => { e.style.opacity = p; e.style.transform = `scale(${lerp(1.07, 1, p)})`; },
    rise: (e, p) => { e.style.opacity = p; e.style.transform = `translateY(${px((1 - p) * 80)})`; },
    wipe: (e, p) => {
      // vệt sáng mềm quét chéo từ trái sang phải
      const a = lerp(-30, 100, p);
      const m = p >= 1 ? 'none' : `linear-gradient(100deg, #000 ${a}%, transparent ${a + 30}%)`;
      e.style.webkitMaskImage = m;
      e.style.maskImage = m;
    },
  };
  const TRANS_ORDER = ['fade', 'wipe', 'zoom', 'fade', 'rise', 'wipe'];

  function mount(s) {
    s.el = el('div', 'scene', S.stage);
    s.el.style.zIndex = s.i + 1;
    s.waits = [];
    s.update = BUILD[s.kind](s);
    s.ready = Promise.all(s.waits);
  }
  function unmount(s) {
    s.el.remove();
    s.el = null;
    s.update = null;
  }

  window.setup = async (cfg) => {
    S.cfg = cfg;
    S.W = cfg.W; S.H = cfg.H; S.X = cfg.X; S.land = cfg.W > cfg.H;
    S.stage = document.getElementById('stage');
    Object.assign(S.stage.style, { width: px(S.W), height: px(S.H), transform: `scale(${cfg.k})` });
    S.fade = el('div', '', S.stage, { id: 'fade' });
    S.fade.style.zIndex = 9999;
    let n = 0;
    S.scenes = cfg.scenes.map((sc, i) => ({ ...sc, i, n: sc.kind === 'intro' || sc.kind === 'outro' ? 0 : n++, el: null, trans: TRANS_ORDER[i % TRANS_ORDER.length] }));
    S.total = cfg.total;
    const sample = 'Văn Hùng & Tuyết Anh — Lễ Thành Hôn ắềỗữ 0123456789';
    await Promise.all([
      document.fonts.load(`40px Ephesis`, sample),
      document.fonts.load(`40px Lora`, sample),
      document.fonts.load(`italic 40px Lora`, sample),
      document.fonts.load(`500 40px "Playfair Display"`, sample),
      document.fonts.load(`600 40px "Be Vietnam Pro"`, sample),
    ]);
    await document.fonts.ready;
    return { total: S.total, scenes: S.scenes.length };
  };

  window.render = async (t) => {
    const live = [];
    for (const s of S.scenes) {
      const end = s.start + s.dur;
      if (t >= s.start - 2.5 && t <= end) {
        if (!s.el) mount(s);
        if (t >= s.start) live.push(s);
        else s.el.style.visibility = 'hidden';
      } else if (s.el) unmount(s);
    }
    await Promise.all(live.map((s) => s.ready));
    for (const s of live) {
      const l = t - s.start;
      s.el.style.visibility = 'visible';
      const p = s.i === 0 ? 1 : ease.io(clamp(l / S.X));
      TRANS[s.trans](s.el, p);
      if (p >= 1) { s.el.style.opacity = 1; s.el.style.transform = 'none'; }
      s.update(l);
    }
    const fadeIn = 1 - clamp(t / 0.8);
    const fadeOut = prog(t, S.total - 2.2, 2.2);
    S.fade.style.opacity = Math.max(fadeIn, ease.sine(fadeOut));
  };
})();
