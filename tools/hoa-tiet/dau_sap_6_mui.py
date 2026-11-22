# Dấu sáp vàng bản 2: sáp dày 6 múi, viền phồng, mặt dấu lõm có vòng nổi, cành lá nổi khối đầy mặt dấu
import math, os, sys
import numpy as np
from PIL import Image
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import giay_xo_tham as relief2
from giay_dap_noi import Layer, gblur, bez
from dau_sap_vang import metal, rgba

GOLD2 = dict(lo=(94, 60, 34), base=(180, 140, 100), hi=(242, 218, 184), spec=(255, 250, 236))


def emblem(LV, VN, TD, BR, MD, cx, cy, s):
    """Cành lá trên mặt dấu: thân cong lên, 3 cặp lá bầu, lá ngọn, hai chùm nụ hai bên."""
    relief2.MID = MD
    stem = bez((cx + s * .04, cy + s * .46), (cx - s * .02, cy + s * .18), (cx + s * .03, cy - s * .12), (cx - s * .01, cy - s * .4), 60)
    TD.line(stem, s * .034)

    def at(f):
        i = int(f * 60)
        x, y = stem[i]
        tg = math.atan2(stem[min(60, i + 1)][1] - stem[max(0, i - 1)][1], stem[min(60, i + 1)][0] - stem[max(0, i - 1)][0])
        return x, y, tg
    for f, sd, ln in ((.16, -1, .4), (.3, 1, .4), (.42, -1, .34), (.54, 1, .33), (.66, -1, .26), (.76, 1, .24)):
        x, y, tg = at(f)
        a = tg + sd * .92
        L = s * ln * 1.1
        relief2.leaf2(LV, VN, x, y, a, L, L * .33, bend=-sd * .06, asym=0, nveins=5, vw=max(1, s * .009))
    x, y, tg = at(.98)
    relief2.leaf2(LV, VN, x, y, tg, s * .24, s * .045, bend=.05, asym=0, nveins=3, vw=max(1, s * .007))
    # hai chùm nụ ở phía trên
    for f, sd in ((.84, 1), (.86, -1)):
        x, y, tg = at(f)
        a = tg + sd * .75
        l = s * .26
        p = bez((x, y), (x + math.cos(a) * l * .4, y + math.sin(a) * l * .4), (x + math.cos(a + sd * .25) * l * .75, y + math.sin(a + sd * .25) * l * .75),
                (x + math.cos(a + sd * .2) * l, y + math.sin(a + sd * .2) * l), 30)
        TD.line(p, s * .014)
        for k, (g, bl) in enumerate(((.45, -1), (.7, 1), (1.0, 0))):
            px, py = p[int(g * 30)]
            if bl:
                ba = a + bl * 1.0
                ex, ey = px + math.cos(ba) * s * .07, py + math.sin(ba) * s * .07
                TD.line([(px, py), (ex, ey)], s * .011)
            else:
                ex, ey = px, py
            BR.dot(ex, ey, s * .036)


def seal2(size=720):
    c = size / 2
    cy = c - size * .01
    R = size * .37
    M, D, RG, IN, AN = (Layer(size, size, wrap=False) for _ in range(5))
    LV, VN, TD, BR, MD = (Layer(size, size, wrap=False) for _ in range(5))
    pts = []
    for i in range(360):
        th = i / 360 * math.tau
        r = R * (1 - .085 * (1 - abs(math.cos(3 * th + .35))) ** 1.7 + .008 * math.sin(11 * th + 2) + .004 * math.sin(23 * th))
        pts.append((c + math.cos(th) * r, cy + math.sin(th) * r))
    M.poly(pts)
    ri = R * .7
    D.dot(c, cy, ri)
    RG.dot(c, cy, ri * .985)
    IN.dot(c, cy, ri * .945)
    AN.dot(c, cy, ri * 1.16)
    emblem(LV, VN, TD, BR, MD, c + R * .01, cy + R * .03, ri * 1.62)
    m, d, rg, inn, an = M.arr(), D.arr(), RG.arr(), IN.arr(), AN.arr()
    lv, vn, td, br, md = LV.arr(), VN.arr(), TD.arr(), BR.arr(), MD.arr()
    body = gblur(m, size * .034)
    body = np.clip(body, 0, 1) ** .7
    bead = gblur(np.clip(an - d, 0, 1), size * .012)
    ring = np.clip(rg - inn, 0, 1)
    emb = (0.3 * gblur(lv, 1.0) + 1.6 * gblur(lv, 5) * gblur(lv, .8) - .55 * gblur(md, 2) * lv - .35 * gblur(vn, .9) * lv
           + .7 * gblur(td, 1.2) + 1.0 * gblur(br, 2.2)) * inn
    Hh = body * 1.0 + .22 * bead - .5 * gblur(d, 3) + .14 * gblur(ring, 1.3) + .46 * emb
    Hh *= size * .09
    col = metal(Hh, m, k=1.0, spec_pow=26, spec_amt=.75, col=GOLD2)
    sh = gblur(np.roll(m, int(size * .02), 0), size * .022) * .5
    return rgba(col, m, sh)


if __name__ == '__main__':
    out = sys.argv[1]
    seal2().save(os.path.join(out, 'seal2.png'))
    print('ok')
