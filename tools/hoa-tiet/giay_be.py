# Giấy kem (be) lặp liền hai chiều, lấy từ lòng khung của ảnh trang trong
# Dùng: python3 tools/hoa-tiet/giay_be.py trang-dau.png giay-kem.jpg   (in ra màu trung bình để ghi vào cover.creamColor)
import sys, math
import numpy as np
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
A = np.asarray(Image.open(src).convert('RGB')).astype(float)
crop = A[560:1240, 140:800]           # lòng khung: giấy trơn, sợi giấy mịn
h, w, _ = crop.shape
# bỏ chênh sáng lớn (vignette), chỉ giữ sợi giấy
mean = crop.mean((0, 1))
def lowpass(a, s):
    hh, ww = a.shape
    fy = np.fft.fftfreq(hh)[:, None]; fx = np.fft.rfftfreq(ww)[None, :]
    g = np.exp(-2 * (math.pi ** 2) * (s ** 2) * (fx ** 2 + fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * g, s=a.shape)
flat = np.stack([crop[..., c] - lowpass(crop[..., c], 60) + mean[c] for c in range(3)], -1)
# nối liền: trộn với bản lệch nửa ô theo cả hai chiều (trọng số sin²)
ty = (np.sin(math.pi * np.arange(h) / h) ** 2)[:, None, None]
tx = (np.sin(math.pi * np.arange(w) / w) ** 2)[None, :, None]
f1 = flat * ty + np.roll(flat, h // 2, 0) * (1 - ty)
f2 = f1 * tx + np.roll(f1, w // 2, 1) * (1 - tx)
Image.fromarray(np.clip(f2, 0, 255).astype(np.uint8)).save(dst, quality=84)
avg = f2.reshape(-1, 3).mean(0)
print('tile', f2.shape, 'avg', avg.round(1), '#%02X%02X%02X' % tuple(int(round(x)) for x in avg))
