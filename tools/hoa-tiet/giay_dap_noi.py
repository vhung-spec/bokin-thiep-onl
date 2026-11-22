# Vẽ giấy dập nổi lá cây (ô lặp liền mạch), dấu sáp vàng và cành lá vàng — hình tự tạo hoàn toàn
import math, random, sys, os
import numpy as np
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else 'relief'
os.makedirs(OUT, exist_ok=True)
SS = 2  # vẽ mặt nạ ở 2x rồi thu nhỏ để mép mịn


def gblur(a, s):
    """Làm mờ Gauss bằng FFT (tự quấn mép: ô lặp liền mạch)."""
    if s <= 0:
        return a
    h, w = a.shape
    fy = np.fft.fftfreq(h)[:, None]
    fx = np.fft.rfftfreq(w)[None, :]
    g = np.exp(-2 * (math.pi ** 2) * (s ** 2) * (fx ** 2 + fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * g, s=a.shape)


class Layer:
    def __init__(self, w, h, wrap=True):
        self.w, self.h, self.wrap = w, h, wrap
        self.im = Image.new('L', (w * SS, h * SS), 0)
        self.d = ImageDraw.Draw(self.im)

    def offs(self):
        if not self.wrap:
            return [(0, 0)]
        return [(dx, dy) for dx in (-self.w, 0, self.w) for dy in (-self.h, 0, self.h)]

    def poly(self, pts, v=255):
        for dx, dy in self.offs():
            self.d.polygon([((x + dx) * SS, (y + dy) * SS) for x, y in pts], fill=v)

    def line(self, pts, width, v=255):
        for dx, dy in self.offs():
            p = [((x + dx) * SS, (y + dy) * SS) for x, y in pts]
            self.d.line(p, fill=v, width=max(1, int(round(width * SS))), joint='curve')
            r = width * SS / 2
            for x, y in (p[0], p[-1]):
                self.d.ellipse((x - r, y - r, x + r, y + r), fill=v)

    def dot(self, x, y, r, v=255):
        for dx, dy in self.offs():
            cx, cy = (x + dx) * SS, (y + dy) * SS
            self.d.ellipse((cx - r * SS, cy - r * SS, cx + r * SS, cy + r * SS), fill=v)

    def arr(self):
        return np.asarray(self.im.resize((self.w, self.h), Image.LANCZOS)).astype(np.float64) / 255.0


def bez(p0, p1, p2, p3, n=60):
    pts = []
    for i in range(n + 1):
        t = i / n
        a, b, c, d = (1 - t) ** 3, 3 * (1 - t) ** 2 * t, 3 * (1 - t) * t ** 2, t ** 3
        pts.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return pts


def tangent(pts, i):
    i0, i1 = max(0, i - 1), min(len(pts) - 1, i + 1)
    return math.atan2(pts[i1][1] - pts[i0][1], pts[i1][0] - pts[i0][0])


def leaf(L, x0, y0, ang, length, width, bend=0.12, veins=None, vw=1.2):
    """Lá có đầu nhọn, gốc tròn, gân giữa hơi cong; vẽ thêm gân vào lớp veins."""
    n = 36
    a, b = 0.62, 1.05
    tm = a / (a + b)
    fmax = tm ** a * (1 - tm) ** b
    ca, sa = math.cos(ang), math.sin(ang)
    mid, left, right = [], [], []
    for i in range(n + 1):
        t = i / n
        off = bend * length * math.sin(math.pi * t)
        mx = x0 + ca * t * length - sa * off
        my = y0 + sa * t * length + ca * off
        mid.append((mx, my))
        w = width * (t ** a * (1 - t) ** b) / fmax
        left.append((mx - sa * w * -1, my + ca * w * -1))
        right.append((mx - sa * w, my + ca * w))
    L.poly(left + right[::-1])
    if veins is not None:
        veins.line(mid[1:int(n * .94)], vw)
        for k, t in enumerate(np.arange(.16, .86, .12)):
            i = int(t * n)
            mx, my = mid[i]
            w = width * (t ** a * (1 - t) ** b) / fmax
            for side in (-1, 1):
                va = ang + side * 0.75
                ex = mx + math.cos(va) * w * 1.05
                ey = my + math.sin(va) * w * 1.05
                qx = mx + math.cos(ang + side * 0.35) * w * .55
                qy = my + math.sin(ang + side * 0.35) * w * .55
                veins.line(bez((mx, my), (qx, qy), (qx, qy), (ex, ey), 8), vw * .7)
    return mid


def shade(H, base, hi, lo, k=2.2, light=(-0.55, -0.7, 0.5), ao=0.0, shadow=0.0, grain=None, lift=0.0):
    gx = (np.roll(H, -1, 1) - np.roll(H, 1, 1)) * 0.5
    gy = (np.roll(H, -1, 0) - np.roll(H, 1, 0)) * 0.5
    nx, ny, nz = -k * gx, -k * gy, np.ones_like(H)
    nn = np.sqrt(nx * nx + ny * ny + nz * nz)
    lx, ly, lz = light
    ll = math.sqrt(lx * lx + ly * ly + lz * lz)
    d = (nx * -lx + ny * -ly + nz * lz) / nn / ll  # ánh sáng chiếu từ góc trên bên trái
    flat = lz / ll
    t = np.clip((d - flat) * 1.6, -1, 1)
    t = np.where(t > 0, np.clip(t * 1.35, 0, 1), t * .8)
    base, hi, lo = (np.array(c, dtype=np.float64) for c in (base, hi, lo))
    col = np.where(t[..., None] > 0, base + (hi - base) * t[..., None], base + (base - lo) * t[..., None])
    if lift:
        hn = np.clip(H / max(1e-6, np.percentile(H, 99.5)), 0, 1)
        col = col + (hi - base) * (lift * hn)[..., None]
    if shadow:
        sh = gblur(np.clip(np.roll(np.roll(H, 4, 0), 3, 1) - H, 0, None), 2.5)
        col = col * (1 - np.clip(sh * shadow, 0, .22))[..., None]
    if ao:
        cav = np.clip(gblur(H, 6) - H, 0, None)
        col = col * (1 - np.clip(cav * ao, 0, .25))[..., None]
    if grain is not None:
        col = col * (1 + grain[..., None])
    return np.clip(col, 0, 255)


def paper_tile(W=1080, H=1440, seed=4):
    R = random.Random(seed)
    lv, vn, st, td, br = (Layer(W, H) for _ in range(5))
    occ = Layer(W, H)  # chỗ đã có lá, để lá không chồng nhau quá nhiều
    occ_img = np.zeros((H, W))

    def free(x, y, r):
        xi, yi = int(x) % W, int(y) % H
        x0, x1, y0, y1 = xi - r, xi + r, yi - r, yi + r
        ys = np.arange(y0, y1) % H
        xs = np.arange(x0, x1) % W
        return occ_img[np.ix_(ys, xs)].mean() < 0.12

    def mark(x, y, r):
        ys = np.arange(int(y) - r, int(y) + r) % H
        xs = np.arange(int(x) - r, int(x) + r) % W
        occ_img[np.ix_(ys, xs)] = 1

    # Cành lá lớn: mọc chéo từ dưới trái lên trên phải
    vines = [
        ((60, 1500), (220, 1150), (80, 820), (300, 520)),
        ((300, 520), (520, 220), (380, 60), (560, -60)),
        ((640, 1460), (820, 1180), (700, 900), (900, 640)),
        ((900, 640), (1080, 400), (960, 220), (1140, 0)),
        ((-80, 760), (60, 600), (40, 420), (180, 260)),
        ((420, 1180), (520, 1060), (560, 960), (520, 820)),
    ]
    for vi, (p0, p1, p2, p3) in enumerate(vines):
        pts = bez(p0, p1, p2, p3, 90)
        st.line(pts, 4.2)
        side = 1 if vi % 2 else -1
        for i in range(8, len(pts) - 4, 14):
            x, y = pts[i]
            ang = tangent(pts, i)
            ln = R.uniform(135, 190) * (1 - .25 * i / len(pts))
            la = ang + side * R.uniform(.7, 1.0)
            cx, cy = x + math.cos(la) * ln * .5, y + math.sin(la) * ln * .5
            if free(cx, cy, int(ln * .42)):
                stem_end = (x + math.cos(la) * 10, y + math.sin(la) * 10)
                st.line([(x, y), stem_end], 3)
                leaf(lv, stem_end[0], stem_end[1], la, ln, ln * R.uniform(.19, .23), bend=R.uniform(-.14, .14), veins=vn)
                mark(cx, cy, int(ln * .36))
            side = -side
        # lá ở ngọn (cành không nối tiếp cành khác)
        x, y = pts[-1]
        if vi in (0, 2):
            continue
        leaf(lv, x, y, tangent(pts, len(pts) - 1), 130, 27, bend=.1, veins=vn)

    # Cành nụ nhỏ (berry sprigs)
    sprigs = [(250, 1380, -1.25), (760, 300, -1.1), (980, 1200, -1.5), (120, 300, -1.35), (560, 760, -1.2), (360, 960, -1.6)]
    for (x0, y0, a0) in sprigs:
        ln = R.uniform(260, 340)
        p3 = (x0 + math.cos(a0) * ln, y0 + math.sin(a0) * ln)
        p1 = (x0 + math.cos(a0 + .25) * ln * .35, y0 + math.sin(a0 + .25) * ln * .35)
        p2 = (x0 + math.cos(a0 - .2) * ln * .7, y0 + math.sin(a0 - .2) * ln * .7)
        pts = bez((x0, y0), p1, p2, p3, 60)
        td.line(pts, 2.6)
        side = 1
        for i in range(10, len(pts) - 1, 6):
            x, y = pts[i]
            a = tangent(pts, i) + side * R.uniform(.55, .85)
            l2 = R.uniform(26, 44) * (1 - .4 * i / len(pts))
            ex, ey = x + math.cos(a) * l2, y + math.sin(a) * l2
            td.line(bez((x, y), (x + math.cos(a - side * .3) * l2 * .5, y + math.sin(a - side * .3) * l2 * .5), (ex, ey), (ex, ey), 8), 1.8)
            if R.random() < .55:
                br.dot(ex, ey, R.uniform(5, 7.5))
            else:
                leaf(lv, ex - math.cos(a) * 4, ey - math.sin(a) * 4, a, R.uniform(26, 38), 8, bend=.1)
            side = -side
        br.dot(p3[0], p3[1], 7)

    # Dây mảnh lượn ngẫu nhiên (như vết nứt sơn trên giấy)
    for _ in range(16):
        x, y = R.uniform(0, W), R.uniform(0, H)
        a = R.uniform(0, math.tau)
        pts = [(x, y)]
        for _ in range(R.randint(14, 30)):
            a += R.uniform(-.18, .18)
            x += math.cos(a) * 10
            y += math.sin(a) * 10
            pts.append((x, y))
        td.line(pts, 1.1)

    leafm, veins, stems, tend, berries = lv.arr(), vn.arr(), st.arr(), td.arr(), br.arr()
    Hh = (0.7 * gblur(leafm, 2.2) + 2.6 * gblur(leafm, 9) * gblur(leafm, 1.4)
          - 0.55 * gblur(veins, .8) * leafm
          + 1.1 * gblur(stems, 1.4) + 0.6 * gblur(tend, .9) + 1.6 * gblur(berries, 2.2))
    return Hh


def grain_field(H, W, seed=1, amp=0.035):
    rs = np.random.RandomState(seed)
    g = (gblur(rs.randn(H, W), .7) * 1.0 + gblur(rs.randn(H, W), 3) * 3 + gblur(rs.randn(H, W), 14) * 10)
    g /= g.std()
    return g * amp


if __name__ == '__main__':
    what = sys.argv[2] if len(sys.argv) > 2 else 'paper'
    if what == 'paper':
        Hh = paper_tile()
        np.save(os.path.join(OUT, 'height.npy'), Hh)
        h, w = Hh.shape
        rs = np.random.RandomState(7)
        plaster = gblur(rs.randn(h, w), 1.2) * .35 + gblur(rs.randn(h, w), 4) * .6
        H2 = Hh + plaster * .08
        g = grain_field(h, w, 3, .028)
        sage = shade(H2, (170, 172, 133), (218, 220, 186), (116, 121, 84), k=2.0, shadow=0.4, ao=0.45, grain=g, lift=.22)
        Image.fromarray(sage.astype(np.uint8)).save(os.path.join(OUT, 'sage.png'))
        cream = shade(Hh * .26 + plaster * .04, (241, 242, 234), (255, 255, 252), (214, 217, 202), k=2.0, shadow=0.25, ao=0.25, grain=g * .3, lift=.1)
        Image.fromarray(cream.astype(np.uint8)).save(os.path.join(OUT, 'cream.png'))
        print('avg sage', sage.reshape(-1, 3).mean(0).round(1), 'avg cream', cream.reshape(-1, 3).mean(0).round(1))
