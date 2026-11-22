# Tách ảnh bìa của chủ thiệp: dấu sáp riêng (nền trong suốt) + nền giấy đã xoá dấu sáp + trang trong (không đường gáp)
# Dùng: python3 tools/hoa-tiet/tach_bia.py anh-bia.png thu-muc-ra   (sửa SEAM = cột đường gáp, cy/cx = một điểm trên dấu sáp nếu đổi ảnh khác)
import sys, os, math
import numpy as np
from PIL import Image, ImageFilter


def gblur(a, s):
    """Làm mờ Gauss bằng FFT."""
    if s <= 0:
        return a
    hh, ww = a.shape
    fy = np.fft.fftfreq(hh)[:, None]
    fx = np.fft.rfftfreq(ww)[None, :]
    g = np.exp(-2 * (math.pi ** 2) * (s ** 2) * (fx ** 2 + fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * g, s=a.shape)

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
im = Image.open(src).convert('RGB')
A = np.asarray(im).astype(np.float64)
h, w, _ = A.shape
SEAM = 474


def flood(mask, seeds):
    """Lan từ các điểm hạt giống trong mặt nạ (4 hướng), không cần scipy."""
    reach = np.zeros_like(mask)
    for (y, x) in seeds:
        reach[y, x] = mask[y, x]
    while True:
        n = reach.copy()
        n[1:] |= reach[:-1]; n[:-1] |= reach[1:]; n[:, 1:] |= reach[:, :-1]; n[:, :-1] |= reach[:, 1:]
        n &= mask
        if (n == reach).all():
            return reach
        reach = n


def dilate(m, r):
    return gblur(m.astype(float), r) > .02


def erode(m, r):
    return gblur(m.astype(float), r) > .98


# ---- 1. Mặt nạ dấu sáp: điểm vàng (đỏ − lam lớn), lan từ tâm, lấp lỗ ----
R, G, B = A[..., 0], A[..., 1], A[..., 2]
gold = (R - B > 62) & (R > 95)
cy, cx = 760, 430
gold[:300] = False; gold[1100:] = False
blob = flood(gold, [(cy, cx), (700, 430), (820, 430), (760, 380), (760, 480)])
# lấp lỗ: phần không lan tới được từ mép ảnh
outside = flood(~blob, [(0, 0), (h - 1, w - 1), (0, w - 1), (h - 1, 0)])
blob = ~outside
# làm tròn mép: mở nhẹ để bỏ gai
blob = erode(dilate(blob, 1.2), 1.2)
ys, xs = np.nonzero(blob)
print('seal bbox', xs.min(), xs.max(), ys.min(), ys.max(), 'area', blob.sum())

# ---- 2. Ảnh dấu sáp nền trong suốt (mép co 1px để không dính viền xanh) + bóng mềm ----
core = erode(blob, .9)
alpha = np.clip(gblur(core.astype(float), .7) * 1.15, 0, 1)
pad = 40
x0, x1, y0, y1 = xs.min() - pad, xs.max() + pad, ys.min() - pad, ys.max() + pad
# màu mép: kéo màu từ trong ra để tránh viền xanh
col = A.copy()
inner = erode(blob, 3)
for _ in range(6):
    m = inner.astype(float)
    s = gblur(m, 1.5)
    filled = np.stack([gblur(col[..., c] * m, 1.5) for c in range(3)], -1) / np.maximum(s, 1e-6)[..., None]
    grow = (~inner) & (s > .2)
    col[grow] = filled[grow]
    inner = inner | grow
col = np.where(erode(blob, 3)[..., None], A, col)
shadow = gblur(np.roll(blob.astype(float), 7, 0), 9) * .45
sh_a = shadow * (1 - alpha)
out_a = alpha + sh_a
rgb = (col * alpha[..., None] + np.array([40, 44, 24]) * sh_a[..., None]) / np.maximum(out_a, 1e-6)[..., None]
seal = np.dstack([np.clip(rgb, 0, 255), np.clip(out_a * 255, 0, 255)])[y0:y1, x0:x1].astype(np.uint8)
Image.fromarray(seal, 'RGBA').save(os.path.join(out, 'dau-sap.png'))
print('seal png', seal.shape, 'box', x0, y0)

# ---- 3. Vá nền chỗ dấu sáp (kèm bóng): chép vùng cùng cột ở chỗ khác của cùng cánh, hoà mép ----
hole = dilate(blob, 9)
feather = np.clip(gblur(hole.astype(float), 7) * 1.6, 0, 1)
best = {}
ring = dilate(hole, 6) & ~hole
for side, xr in (('L', (0, SEAM + 3)), ('R', (SEAM - 3, w))):
    sel = np.zeros((h, w), bool); sel[:, xr[0]:xr[1]] = True
    rg = ring & sel
    ry, rx = np.nonzero(rg)
    cand = []
    for dy in list(range(-620, -330, 6)) + list(range(330, 620, 6)):
        sy = ry + dy
        ok = (sy >= 0) & (sy < h)
        if ok.mean() < .99:
            continue
        d = ((A[sy[ok], rx[ok]] - A[ry[ok], rx[ok]]) ** 2).mean()
        cand.append((d, dy))
    cand.sort()
    best[side] = cand[0][1]
print('chosen offsets', best)
P = A.copy()
for side, xr in (('L', (0, SEAM)), ('R', (SEAM, w))):
    dy = best[side]
    src_sh = np.roll(A, -dy, 0)
    sl = slice(xr[0], xr[1])
    P[:, sl] = A[:, sl] * (1 - feather[:, sl, None]) + src_sh[:, sl] * feather[:, sl, None]
# giữ nguyên dải đường gáp (lấy từ nguồn để liền mạch theo chiều dọc)
paper = P.astype(np.uint8)
# căn đường gáp vào giữa ảnh
L = SEAM - (w - SEAM)
cover = paper[:, L:] if L > 0 else paper
Image.fromarray(cover).save(os.path.join(out, 'bia.jpg'), quality=90)
print('cover', cover.shape, 'seam at', SEAM - max(L, 0))
sx = (x0 + x1) / 2 - max(L, 0)
sy = (y0 + y1) / 2
print('sealAt x=%.4f y=%.4f w=%.4f' % (sx / cover.shape[1], sy / cover.shape[0], (x1 - x0) / cover.shape[1]))

# ---- 4. Trang trong: ghép hai cánh bỏ dải đường gáp, hoà chỗ nối ----
lcut, rcut = SEAM - 26, SEAM + 14
left, right = paper[:, :lcut].astype(float), paper[:, rcut:].astype(float)
ov = 36
wgt = np.linspace(0, 1, ov)[None, :, None]
join = left[:, -ov:] * (1 - wgt) + right[:, :ov] * wgt
inner_pg = np.concatenate([left[:, :-ov], join, right[:, ov:]], 1)
Image.fromarray(np.clip(inner_pg, 0, 255).astype(np.uint8)).save(os.path.join(out, 'trang-trong.jpg'), quality=90)
print('inner', inner_pg.shape)
