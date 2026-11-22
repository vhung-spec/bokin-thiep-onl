# Dấu sáp vàng, cành lá vàng và dải lá vàng (ảnh nền trong suốt) — tự vẽ
import math, os, sys, random
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(__file__))
from giay_dap_noi import Layer, gblur, bez, leaf, tangent

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
GOLD = dict(lo=(92, 58, 28), base=(184, 141, 92), hi=(240, 212, 166), spec=(255, 246, 228))


def metal(H, mask, k=2.6, spec_pow=28, spec_amt=.55, light=(-0.5, -0.75, 0.55), col=GOLD, flat_lift=0.0):
    gx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * .5
    gy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * .5
    nx, ny, nz = -k * gx, -k * gy, np.ones_like(H)
    nn = np.sqrt(nx * nx + ny * ny + 1)
    nx, ny, nz = nx / nn, ny / nn, nz / nn
    L = np.array([-light[0], -light[1], light[2]])
    L = L / np.linalg.norm(L)
    d = nx * L[0] + ny * L[1] + nz * L[2]
    hv = L + np.array([0, 0, 1.0])
    hv = hv / np.linalg.norm(hv)
    sp = np.clip(nx * hv[0] + ny * hv[1] + nz * hv[2], 0, 1) ** spec_pow
    lo, base, hi, spc = (np.array(col[c], dtype=float) for c in ('lo', 'base', 'hi', 'spec'))
    t = np.clip((d - L[2]) * 1.5 + flat_lift, -1, 1)
    c = np.where(t[..., None] > 0, base + (hi - base) * t[..., None], base + (base - lo) * t[..., None])
    c = c + (spc - c) * (sp * spec_amt)[..., None]
    return np.clip(c, 0, 255)


def rgba(c, mask, shadow=None, sh_col=(45, 48, 30)):
    a = np.clip(mask, 0, 1)
    if shadow is not None:
        s = np.clip(shadow, 0, 1) * (1 - a)
        out_a = a + s
        col = (c * a[..., None] + np.array(sh_col) * s[..., None]) / np.maximum(out_a, 1e-6)[..., None]
    else:
        out_a, col = a, c
    im = np.dstack([np.clip(col, 0, 255), np.clip(out_a * 255, 0, 255)]).astype(np.uint8)
    return Image.fromarray(im, 'RGBA')


def sprig(lv, vn, br, td, cx, cy, size, ang=-math.pi / 2, seed=3, berries=True):
    """Cành lá: thân cong, 5–7 lá thon có gân, nhánh nụ hai bên."""
    R = random.Random(seed)
    ca, sa = math.cos(ang), math.sin(ang)
    p0 = (cx - ca * size * .5, cy - sa * size * .5)
    p3 = (cx + ca * size * .5, cy + sa * size * .5)
    nxp, nyp = -sa, ca
    p1 = (p0[0] + ca * size * .35 + nxp * size * .06, p0[1] + sa * size * .35 + nyp * size * .06)
    p2 = (p0[0] + ca * size * .7 - nxp * size * .05, p0[1] + sa * size * .7 - nyp * size * .05)
    pts = bez(p0, p1, p2, p3, 60)
    td.line(pts, max(2, size * .018))
    side = 1
    for j, f in enumerate((.22, .38, .52, .66, .8)):
        i = int(f * 60)
        x, y = pts[i]
        a = tangent(pts, i) + side * .72
        ln = size * (.38 - .05 * j)
        leaf(lv, x, y, a, ln, ln * .27, bend=side * .08, veins=vn, vw=max(1, size * .007))
        side = -side
    leaf(lv, p3[0], p3[1], tangent(pts, 59), size * .2, size * .045, bend=.05, veins=vn, vw=max(1, size * .006))
    if berries:
        for f, sd in ((.1, -1), (.87, -1), (.9, 1)):
            i = int(f * 60)
            x, y = pts[i]
            a = tangent(pts, i) + sd * 1.05
            l2 = size * .13
            for b, (fa, fl) in enumerate(((.28, .95), (-.3, .7))):
                ex, ey = x + math.cos(a + fa) * l2 * fl, y + math.sin(a + fa) * l2 * fl
                mx, my = x + math.cos(a) * l2 * .45, y + math.sin(a) * l2 * .45
                td.line(bez((x, y), (mx, my), (mx, my), (ex, ey), 8), max(1, size * .009))
                br.dot(ex, ey, size * .027)


def seal(size=640, seed=11):
    W = H = size
    c = size / 2
    R = size * .38
    m, ring, disc, lv, vn, br, td = (Layer(W, H, wrap=False) for _ in range(7))
    pts = []
    for i in range(240):
        th = i / 240 * math.tau
        r = R * (1 + .045 * math.sin(6 * th + .5) + .016 * math.sin(13 * th + 1.1) + .008 * math.sin(23 * th))
        pts.append((c + math.cos(th) * r, c - 6 + math.sin(th) * r))
    m.poly(pts)
    ri = R * .74
    disc.dot(c, c - 6, ri)
    ring.dot(c, c - 6, ri * .985)
    inner = Layer(W, H, wrap=False)
    inner.dot(c, c - 6, ri * .955)
    sprig(lv, vn, br, td, c + R * .0, c - 6 + R * .02, R * 1.3, ang=-math.pi / 2 - .45, seed=seed)
    M, D, RG, IN = m.arr(), disc.arr(), ring.arr(), inner.arr()
    rg = np.clip(RG - IN, 0, 1)
    body = gblur(M, size * .028)
    Hh = (body * 1.0
          - .42 * gblur(D, 2.5)
          + .1 * gblur(rg, 1.2)
          + .34 * gblur(lv.arr(), 1.6) * IN + .28 * gblur(lv.arr(), 4) * IN
          - .1 * gblur(vn.arr(), .7) * IN
          + .2 * gblur(td.arr(), 1.0) * IN + .3 * gblur(br.arr(), 2.4) * IN)
    Hh *= size * .085
    col = metal(Hh, M, k=1.05, spec_pow=30, spec_amt=.7)
    sh = gblur(np.roll(M, int(size * .018), 0), size * .02) * .42
    return rgba(col, M, sh)


def deco_sprig(size=520, seed=5, ang=-math.pi / 2 - .5):
    W = H = size
    lv, vn, br, td = (Layer(W, H, wrap=False) for _ in range(4))
    sprig(lv, vn, br, td, size / 2, size / 2, size * .82, ang=ang, seed=seed)
    L, V, B, T = lv.arr(), vn.arr(), br.arr(), td.arr()
    M = np.clip(L + T + B, 0, 1)
    Hh = (.6 * gblur(L, 1.4) + .9 * gblur(L, 4) * L - .25 * gblur(V, .6) * L + .5 * gblur(T, 1.0) + .8 * gblur(B, 2))
    Hh *= size * .02
    col = metal(Hh, M, k=1.2, spec_pow=24, spec_amt=.45, flat_lift=.08)
    return rgba(col, M)


def garland(w=1000, h=230, seed=9):
    """Dải lá vàng nằm ngang, hai đầu thon — dùng làm hoạ tiết kết phần."""
    lv, vn, br, td = (Layer(w, h, wrap=False) for _ in range(4))
    R = random.Random(seed)
    cy = h / 2
    for dirn in (-1, 1):
        x0 = w / 2
        p3 = (w / 2 + dirn * w * .46, cy + 8)
        pts = bez((x0, cy + 4), (x0 + dirn * w * .15, cy - 18), (x0 + dirn * w * .3, cy + 22), p3, 80)
        td.line(pts, 3.2)
        side = 1
        for i in range(8, 78, 8):
            x, y = pts[i]
            a = tangent(pts, i) + side * .62
            ln = 70 * (1 - .55 * i / 80) + 20
            leaf(lv, x, y, a, ln, ln * .24, bend=side * .1, veins=vn, vw=1)
            if i % 16 == 0:
                bx = x + math.cos(tangent(pts, i) - side * 1.1) * 28
                by = y + math.sin(tangent(pts, i) - side * 1.1) * 28
                td.line([(x, y), (bx, by)], 1.6)
                br.dot(bx, by, 5.5)
            side = -side
        leaf(lv, p3[0], p3[1], tangent(pts, 80), 36, 8, veins=vn, vw=.8)
    br.dot(w / 2, cy + 4, 9)
    L, V, B, T = lv.arr(), vn.arr(), br.arr(), td.arr()
    M = np.clip(L + T + B, 0, 1)
    Hh = (.6 * gblur(L, 1.4) + .9 * gblur(L, 3.5) * L - .25 * gblur(V, .6) * L + .5 * gblur(T, 1.0) + .8 * gblur(B, 2))
    Hh *= 9
    col = metal(Hh, M, k=1.2, spec_pow=24, spec_amt=.45, flat_lift=.08)
    return rgba(col, M)


if __name__ == '__main__':
    seal().save(os.path.join(OUT, 'seal.png'))
    deco_sprig().save(os.path.join(OUT, 'sprig.png'))
    garland().save(os.path.join(OUT, 'garland.png'))
    print('ok')
