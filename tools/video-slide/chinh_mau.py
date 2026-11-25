"""Chỉnh màu ảnh theo bộ (A studio, B phố cổ, C toà nhà cổ, D Hạ Long), tính màu nền phẳng lấy từ mép ảnh,
và vẽ giấy ngà cho thiệp mở đầu / lời cảm ơn.

Đọc JSON từ stdin:
  {"images": [{"src": "...", "out": "...", "set": "A"}], "papers": [{"out": "...", "w": 1920, "h": 1080}], "maxEdge": 3000}
In ra JSON: {"tên file": {"w", "h", "fill"}}.
"""
import json
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def hue_weight(h, center, half, soft=20.0):
    """Trọng số 0..1 cho các màu có sắc độ trong khoảng center ± half (độ), mép mềm."""
    d = np.abs((h - center + 180) % 360 - 180)
    return 1 - smooth(half, half + soft, d)


# Mức chỉnh theo từng bộ: giữ chất ảnh thật, chỉ tiết chế những chỗ lệch.
GRADE = {
    'A': dict(warm=0.025),                                               # studio: trắng dịu, bớt ám xanh của phông
    'B': dict(desat=[(345, 25, 0.03)], highlight=-0.12),                 # phố cổ: giữ hồng phấn áo dài, hạ nhẹ vùng nắng gắt
    'C': dict(desat=[(38, 22, 0.06)], desat_bright=True),                # toà nhà cổ: giữ nắng vàng, gỗ sâu; váy/hoa bớt ố chút ít
    'D': dict(desat=[(150, 45, 0.03)]),                                  # Hạ Long: giữ biển xanh lục và các lớp núi
}


def grade(im, preset):
    x = np.asarray(im, dtype=np.float32) / 255
    r, g, b = x[..., 0], x[..., 1], x[..., 2]
    L = 0.2126 * r + 0.7152 * g + 0.0722 * b
    if preset.get('warm'):
        w = preset['warm']
        x[..., 0] *= 1 + w * 0.6
        x[..., 2] *= 1 - w
    if preset.get('desat'):
        a = r - (g + b) / 2
        bb = 0.8660254 * (g - b)
        h = (np.degrees(np.arctan2(bb, a)) + 360) % 360
        k = np.zeros_like(L)
        for center, half, amount in preset['desat']:
            k = np.maximum(k, amount * hue_weight(h, center, half))
        if preset.get('desat_bright'):
            k *= 0.35 + 0.65 * smooth(0.45, 0.85, L)  # tác động chủ yếu lên vùng sáng (váy, hoa), giữ màu gỗ tối
        x = L[..., None] + (x - L[..., None]) * (1 - k[..., None])
    if preset.get('highlight'):
        f = 2 ** (preset['highlight'] * smooth(0.62, 0.97, L))
        x *= f[..., None]
    # vai sáng mềm: vùng gần trắng (váy, voan) hạ rất nhẹ để còn thấy nếp vải
    x *= (1 - 0.035 * smooth(0.82, 1.0, L))[..., None]
    # bóng tối hơi ấm rất nhẹ, dùng chung cả phim để các bộ ảnh liền một tông (không phủ vàng cả ảnh)
    sh = (1 - smooth(0.05, 0.35, L))[..., None]
    x += sh * np.array([0.006, 0.002, -0.005], dtype=np.float32)
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def fill_color(im, studio):
    """Màu phẳng cho phần trống hai bên ảnh dọc: trung vị mép trái + phải."""
    sm = im.copy()
    sm.thumbnail((300, 300))
    a = np.asarray(sm, dtype=np.float32)
    k = max(2, a.shape[1] // 25)
    edge = np.concatenate([a[:, :k].reshape(-1, 3), a[:, -k:].reshape(-1, 3)])
    if studio:
        c = edge.mean(axis=0)
    else:
        # nửa màu mép ảnh, nửa tông giữa của cả ảnh (bỏ vùng quá tối/quá sáng): ra màu nền trung tính, đúng tông,
        # không tối hơn ảnh quá nhiều để độ sáng giữa các cảnh không nhảy gắt
        Y = np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
        def band(px, lo, hi):
            l = px @ Y
            a, b = np.percentile(l, [lo, hi])
            return px[(l >= a) & (l <= b)].mean(axis=0)
        c = 0.5 * band(edge, 30, 70) + 0.5 * band(a.reshape(-1, 3), 30, 70)
        l = c.mean()
        c = (l + (c - l) * 0.9) * 0.88
    return '#%02x%02x%02x' % tuple(int(v) for v in np.clip(c, 0, 255))


def fill_gradient(im, stops=14):
    """Studio: màu phông theo từng độ cao ở mép trái và mép phải, để phần trống nối liền với ảnh."""
    sm = im.copy()
    sm.thumbnail((400, 400))
    a = np.asarray(sm, dtype=np.float32)
    k = max(2, a.shape[1] // 40)
    res = []
    for strip in (a[:, :k], a[:, -k:]):
        rows = strip.mean(axis=1)
        n = len(rows)
        win = max(3, n // 12)
        ker = np.ones(win) / win
        sm_rows = np.stack([np.convolve(np.pad(rows[:, c], win, mode='edge'), ker, 'same')[win:-win] for c in range(3)], 1)
        cols = []
        for i in range(stops):
            y = int(round(i / (stops - 1) * (n - 1)))
            c = sm_rows[y]
            cols.append('#%02x%02x%02x %.1f%%' % (int(c[0]), int(c[1]), int(c[2]), i / (stops - 1) * 100))
        res.append(cols)
    return res


def blur_bg(im, w=1920, h=1080):
    """Nền mờ lấy từ chính ảnh: phủ kín khung 16:9, nhoè rất mạnh, tối và trầm màu để ảnh chính nổi lên."""
    r = max(w / im.width, h / im.height)
    sm = im.resize((max(1, round(im.width * r / 20)), max(1, round(im.height * r / 20))), Image.BOX)
    sm = sm.filter(ImageFilter.GaussianBlur(2.2))
    cw, ch = round(w / 20), round(h / 20)
    left, top = (sm.width - cw) // 2, (sm.height - ch) // 2
    sm = sm.crop((left, top, left + cw, top + ch)).resize((w, h), Image.BICUBIC).filter(ImageFilter.GaussianBlur(8))
    x = np.asarray(sm, dtype=np.float32) / 255
    L = (x @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32))[..., None]
    x = (L + (x - L) * 0.78) * 0.58
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def paper(w, h, seed=7):
    """Giấy ngà: nền ấm, loang rất nhẹ, hạt mịn và vài sợi giấy."""
    rng = np.random.default_rng(seed)
    base = np.array([238, 231, 217], dtype=np.float32)
    def noise(cw, ch, amp):
        n = Image.fromarray(((rng.random((ch, cw)) * 255)).astype(np.uint8)).resize((w, h), Image.BICUBIC)
        return (np.asarray(n, dtype=np.float32) / 255 - 0.5) * amp
    mott = noise(18, 12, 0.05) + noise(70, 45, 0.025)
    grain = Image.fromarray((rng.normal(128, 40, (h, w))).clip(0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    grain = (np.asarray(grain, dtype=np.float32) / 255 - 0.5) * 0.035
    x = base[None, None, :] * (1 + mott + grain)[..., None]
    im = Image.fromarray(np.clip(x, 0, 255).astype(np.uint8))
    d = ImageDraw.Draw(im, 'RGBA')
    for _ in range(int(w * h / 9000)):  # sợi giấy mảnh
        x0, y0 = rng.random() * w, rng.random() * h
        ang, ln = rng.random() * np.pi, 6 + rng.random() * 26
        pts = [(x0 + np.cos(ang + 0.15 * np.sin(i)) * i, y0 + np.sin(ang + 0.15 * np.sin(i)) * i) for i in np.linspace(0, ln, 6)]
        tone = int(rng.choice([150, 205, 250]))
        d.line(pts, fill=(tone, tone - 8, tone - 22, int(14 + rng.random() * 18)), width=1)
    return im


def main():
    job = json.load(sys.stdin)
    out = {}
    edge = job.get('maxEdge', 3000)
    for it in job.get('images', []):
        im = ImageOps.exif_transpose(Image.open(it['src'])).convert('RGB')
        im.thumbnail((edge, edge), Image.LANCZOS)
        im = grade(im, GRADE.get(it.get('set'), {}))
        im.save(it['out'], quality=93)
        out[it['name']] = {'w': im.width, 'h': im.height, 'fill': fill_color(im, it.get('set') == 'A')}
        if it.get('set') == 'A':
            out[it['name']]['fillGrad'] = fill_gradient(im)
        if it.get('blur'):
            stem = it['name'].rsplit('.', 1)[0]
            blur_bg(im).save(it['out'].rsplit('/', 1)[0] + f'/{stem}__mo.jpg', quality=90)
            out[it['name']]['blur'] = f'{stem}__mo.jpg'
    for p in job.get('papers', []):
        paper(p['w'], p['h']).save(p['out'], quality=92)
    print(json.dumps(out))


if __name__ == '__main__':
    main()
