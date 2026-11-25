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


# Mức chỉnh ban đầu theo kịch bản: tiết chế, giữ chất ảnh thật.
GRADE = {
    'A': dict(warm=0.03),                                                    # studio: ấm nhẹ để phông bớt xanh
    'B': dict(desat=[(345, 25, 0.09)], highlight=-0.2),                      # phố cổ: bớt hồng rực, hạ vùng nắng gắt
    'C': dict(desat=[(38, 22, 0.13)], desat_bright=True, lift=0.035),       # toà nhà cổ: bớt ố vàng ở váy/hoa, giữ gỗ
    'D': dict(desat=[(150, 45, 0.10)]),                                      # Hạ Long: bớt lục/lam cho người nổi hơn
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
    if preset.get('lift'):
        x += preset['lift'] * (1 - smooth(0.0, 0.32, L))[..., None] * (1 - x)
    # bóng tối hơi ấm, dùng chung cho cả phim để các bộ ảnh liền một tông
    sh = (1 - smooth(0.05, 0.38, L))[..., None]
    x += sh * np.array([0.010, 0.004, -0.008], dtype=np.float32)
    return Image.fromarray((np.clip(x, 0, 1) * 255 + 0.5).astype(np.uint8))


def fill_color(im, studio):
    """Màu phẳng cho phần trống hai bên ảnh dọc: trung vị mép trái + phải."""
    sm = im.copy()
    sm.thumbnail((300, 300))
    a = np.asarray(sm, dtype=np.float32)
    k = max(2, a.shape[1] // 25)
    edge = np.concatenate([a[:, :k].reshape(-1, 3), a[:, -k:].reshape(-1, 3)])
    c = np.median(edge, axis=0) if not studio else edge.mean(axis=0)
    if not studio:
        l = c.mean()
        c = (l + (c - l) * 0.85) * 0.86  # lùi xuống một chút để ảnh nổi lên
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
    for p in job.get('papers', []):
        paper(p['w'], p['h']).save(p['out'], quality=92)
    print(json.dumps(out))


if __name__ == '__main__':
    main()
