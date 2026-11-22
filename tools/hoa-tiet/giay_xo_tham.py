# Giấy xô thơm dập nổi bản 2: lá to dày, gân nổi, cành nụ, dây mảnh, mặt vữa sần (ô lặp liền mạch)
import math, os, random, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from giay_dap_noi import Layer, gblur, bez

W, H = 1080, 1920


MID = None


def leaf2(L, V, x0, y0, ang, length, width, bend=0.0, asym=0.08, nveins=6, vw=1.3):
    """Lá hình trứng, đầu nhọn dài, gốc tròn; gân giữa + gân phụ cong về phía ngọn."""
    n = 44
    a, b = 0.6, 1.05
    tm = a / (a + b)
    fmax = tm ** a * (1 - tm) ** b
    ca, sa = math.cos(ang), math.sin(ang)
    mid, left, right, ws = [], [], [], []
    for i in range(n + 1):
        t = i / n
        off = bend * length * math.sin(math.pi * t)
        mx = x0 + ca * t * length - sa * off
        my = y0 + sa * t * length + ca * off
        mid.append((mx, my))
        w = width * (t ** a * (1 - t) ** b) / fmax
        ws.append(w)
        left.append((mx + sa * w * (1 + asym), my - ca * w * (1 + asym)))
        right.append((mx - sa * w * (1 - asym), my + ca * w * (1 - asym)))
    L.poly(left + right[::-1])
    V.line(mid[0:int(n * .93)], vw * 1.25)
    MID.line(mid[0:int(n * .9)], max(2.0, width * .16))
    for k in range(nveins):
        t = .1 + .72 * k / max(1, nveins - 1)
        i = int(t * n)
        mx, my = mid[i]
        for side, sw in ((-1, 1 + asym), (1, 1 - asym)):
            w = ws[i] * sw * .9
            # gân phụ: đi ra mép rồi uốn về phía ngọn
            ex = mx + ca * w * .9 - sa * side * -w
            ey = my + sa * w * .9 + ca * side * -w
            cx = mx + ca * w * .15 - sa * side * -w * .6
            cy = my + sa * w * .15 + ca * side * -w * .6
            V.line(bez((mx, my), (cx, cy), (cx, cy), (ex, ey), 10), vw * .8)
    return mid


def vine(R, LV, VN, ST, occ, p0, p1, p2, p3, leaf_len=(190, 270), every=112, ratio=(.44, .52), stem=5.5, start_side=1):
    pts = bez(p0, p1, p2, p3, 140)
    ST.line(pts, stem)
    # độ dài cung để rải lá đều
    acc, last, side = 0.0, -every * .6, start_side
    for i in range(1, len(pts) - 2):
        acc += math.dist(pts[i], pts[i - 1])
        if acc - last < every:
            continue
        last = acc
        x, y = pts[i]
        tang = math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0])
        frac = i / len(pts)
        ln = R.uniform(*leaf_len) * (1 - .35 * frac)
        la = tang + side * R.uniform(.55, .9)
        cx, cy = x + math.cos(la) * ln * .5, y + math.sin(la) * ln * .5
        if occ.free(cx, cy, ln * .3):
            sx, sy = x + math.cos(la) * 16, y + math.sin(la) * 16
            ST.line([(x, y), (sx, sy)], stem * .7)
            leaf2(LV, VN, sx, sy, la, ln, ln * R.uniform(*ratio) * .5, bend=side * R.uniform(.02, .1), asym=R.uniform(-.1, .1))
            occ.mark(cx, cy, ln * .38)
        side = -side
    return pts


def berry_sprig(R, LV, VN, TD, BR, occ, x0, y0, ang, length):
    """Cành nụ: thân mảnh, nhiều nụ bầu dục trên cuống ngắn, vài lá nhỏ ở gốc, có nhánh phụ."""
    ca, sa = math.cos(ang), math.sin(ang)
    p3 = (x0 + ca * length, y0 + sa * length)
    bendv = R.uniform(-.18, .18) * length
    p1 = (x0 + ca * length * .33 - sa * bendv, y0 + sa * length * .33 + ca * bendv)
    p2 = (x0 + ca * length * .66 + sa * bendv * .5, y0 + sa * length * .66 - ca * bendv * .5)
    pts = bez((x0, y0), p1, p2, p3, 80)
    TD.line(pts, 2.4)
    side = 1
    for i in range(14, 80, 5):
        x, y = pts[i]
        tg = math.atan2(pts[min(80, i + 1)][1] - pts[i - 1][1], pts[min(80, i + 1)][0] - pts[i - 1][0])
        a = tg + side * R.uniform(.5, .8)
        l2 = R.uniform(20, 36) * (1 - .35 * i / 80)
        ex, ey = x + math.cos(a) * l2, y + math.sin(a) * l2
        TD.line([(x, y), (ex, ey)], 1.5)
        if i < 30 and R.random() < .6:
            leaf2(LV, VN, x, y, a, R.uniform(34, 52), R.uniform(7, 10), bend=side * .1, nveins=3, vw=.8)
        else:
            # nụ bầu dục theo hướng cuống
            for k in range(3):
                BR.dot(ex + math.cos(a) * k * 3, ey + math.sin(a) * k * 3, 6.4 - k * .9)
        side = -side
        if i in (34, 54) and R.random() < .8:
            sub = R.uniform(70, 110)
            berry_tip(R, TD, BR, x, y, tg + side * .45, sub)
    for k in range(3):
        BR.dot(p3[0] + ca * k * 2.4, p3[1] + sa * k * 2.4, 5 - k * .7)
    occ.mark((x0 + p3[0]) / 2, (y0 + p3[1]) / 2, length * .22)


def berry_tip(R, TD, BR, x0, y0, ang, length):
    pts = bez((x0, y0), (x0 + math.cos(ang) * length * .4, y0 + math.sin(ang) * length * .4),
              (x0 + math.cos(ang + .2) * length * .75, y0 + math.sin(ang + .2) * length * .75),
              (x0 + math.cos(ang + .1) * length, y0 + math.sin(ang + .1) * length), 30)
    TD.line(pts, 1.6)
    side = 1
    for i in range(8, 30, 5):
        x, y = pts[i]
        a = ang + side * .8
        ex, ey = x + math.cos(a) * 12, y + math.sin(a) * 12
        TD.line([(x, y), (ex, ey)], 1.2)
        for k in range(3):
            BR.dot(ex + math.cos(a) * k * 2, ey + math.sin(a) * k * 2, 4 - k * .6)
        side = -side
    BR.dot(pts[-1][0], pts[-1][1], 4.4)


class Occ:
    def __init__(self):
        self.a = np.zeros((H, W))

    def free(self, x, y, r):
        r = int(r)
        ys = np.arange(int(y) - r, int(y) + r) % H
        xs = np.arange(int(x) - r, int(x) + r) % W
        return self.a[np.ix_(ys, xs)].mean() < .1

    def mark(self, x, y, r):
        r = int(r)
        ys = np.arange(int(y) - r, int(y) + r) % H
        xs = np.arange(int(x) - r, int(x) + r) % W
        self.a[np.ix_(ys, xs)] = 1


def build(seed=21):
    R = random.Random(seed)
    global MID
    LV, VN, ST, TD, BR, MID = (Layer(W, H) for _ in range(6))
    occ = Occ()
    # Cành chính lượn chữ S, mọc chéo lên (lặp liền theo chiều dọc: điểm đầu & cuối lệch đúng 1 ô)
    vines = [
        ((-120, 1990), (140, 1720), (90, 1400), (360, 1060)),
        ((360, 1060), (640, 720), (540, 420), (800, 60)),
        ((480, 2000), (740, 1720), (690, 1420), (950, 1090)),
        ((950, 1090), (1220, 760), (1130, 460), (1390, 100)),
        ((150, 700), (330, 500), (250, 300), (470, -40)),
        ((700, 1500), (820, 1380), (760, 1260), (880, 1120)),
    ]
    for k, v in enumerate(vines):
        vine(R, LV, VN, ST, occ, *v, start_side=1 if k % 2 else -1)
    # cành nụ
    for (x, y, a, l) in [(180, 1480, -1.2, 360), (520, 700, -1.0, 330), (930, 1820, -1.35, 360), (380, 300, -1.5, 300),
                         (840, 520, -1.15, 340), (60, 640, -1.3, 300), (650, 1560, -1.6, 300), (1010, 300, -1.25, 280),
                         (300, 1880, -1.05, 260), (700, 1200, -1.4, 280), (120, 1100, -1.1, 280), (980, 1300, -1.3, 300),
                         (560, 260, -1.2, 260), (420, 1700, -1.45, 240)]:
        berry_sprig(R, LV, VN, TD, BR, occ, x, y, a, l)
    # dây mảnh dài, lượn mềm, có chấm nhỏ
    for _ in range(34):
        x, y = R.uniform(0, W), R.uniform(0, H)
        a = R.uniform(-2.2, -0.9)
        l = R.uniform(220, 420)
        pts = bez((x, y), (x + math.cos(a + .5) * l * .35, y + math.sin(a + .5) * l * .35),
                  (x + math.cos(a - .5) * l * .7, y + math.sin(a - .5) * l * .7), (x + math.cos(a) * l, y + math.sin(a) * l), 50)
        TD.line(pts, 1.25)
        for i in range(6, 50, R.randint(7, 11)):
            if R.random() < .5:
                BR.dot(pts[i][0], pts[i][1], 2.2)
    # lá lẻ lấp chỗ trống
    for _ in range(320):
        x, y = R.uniform(0, W), R.uniform(0, H)
        ln = R.uniform(105, 165)
        a = R.uniform(-2.6, -0.5)
        cx, cy = x + math.cos(a) * ln * .5, y + math.sin(a) * ln * .5
        if occ.free(cx, cy, ln * .4):
            ST.line([(x - math.cos(a) * 26, y - math.sin(a) * 26), (x, y)], 2.6)
            leaf2(LV, VN, x, y, a, ln, ln * R.uniform(.22, .27), bend=R.uniform(-.1, .1), nveins=5)
            occ.mark(cx, cy, ln * .4)
    return [l.arr() for l in (LV, VN, ST, TD, BR, MID)]


def height(layers, seed=5):
    lv, vn, st, td, br, md = layers
    m1 = gblur(lv, .9)
    rim = np.clip(m1 - gblur(lv, 3.2), 0, None) * lv
    Hh = (0.35 * m1 + 7.0 * gblur(lv, 10) * m1 + 0.5 * rim
          - 2.6 * gblur(md, 3.5) * lv + 0.6 * gblur(vn, .5) * lv - 2.0 * gblur(vn, 1.3) * lv
          + 2.6 * gblur(st, 1.7) * (1 - .5 * lv)
          + 1.1 * gblur(td, .9) * (1 - .5 * lv)
          + 3.2 * gblur(br, 1.8))
    rs = np.random.RandomState(seed)
    stucco = gblur(rs.randn(H, W), .8) * .35 + gblur(rs.randn(H, W), 2.2) * .55 + gblur(rs.randn(H, W), 9) * 1.4
    pits = gblur((rs.rand(H, W) > .9975).astype(float), .9) * -2.2
    return Hh + stucco * .22 + pits * .4, Hh


if __name__ == '__main__':
    from giay_dap_noi import shade, grain_field
    out = sys.argv[1]
    os.makedirs(out, exist_ok=True)
    Hs, Hraw = height(build())
    g = grain_field(H, W, 3, .03)
    sage = shade(Hs, (171, 170, 128), (240, 238, 208), (106, 104, 68), k=1.6, shadow=0.14, ao=0.22, grain=g, lift=.3)
    Image.fromarray(sage.astype(np.uint8)).save(os.path.join(out, 'sage2.png'))
    print('avg', sage.reshape(-1, 3).mean(0).round(1))
