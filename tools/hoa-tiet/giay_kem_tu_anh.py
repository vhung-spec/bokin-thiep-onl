# Giấy kem dập nổi nhẹ làm từ trang trong của ảnh bìa (giữ hoạ tiết lá, ô lặp liền theo chiều dọc)
# Dùng: python3 tools/hoa-tiet/giay_kem_tu_anh.py trang-trong.jpg giay-kem.jpg 0.34
import sys, math
import numpy as np
from PIL import Image

def gblur(a, s):
    hh, ww = a.shape
    fy = np.fft.fftfreq(hh)[:, None]; fx = np.fft.rfftfreq(ww)[None, :]
    g = np.exp(-2 * (math.pi ** 2) * (s ** 2) * (fx ** 2 + fy ** 2))
    return np.fft.irfft2(np.fft.rfft2(a) * g, s=a.shape)

src, dst = sys.argv[1], sys.argv[2]
A = np.asarray(Image.open(src).convert('RGB')).astype(float)
L = A @ np.array([.299, .587, .114])
detail = L - gblur(L, 40)                      # chỉ giữ phần nổi khối, bỏ sáng tối lớn
h = L.shape[0]
# nối liền đầu/cuối: trộn với bản lệch nửa ảnh theo trọng số sin²
t = np.arange(h) / h
wgt = (np.sin(math.pi * t) ** 2)[:, None]
d2 = np.roll(detail, h // 2, 0)
seam_free = detail * wgt + d2 * (1 - wgt)
base = np.array([241, 242, 234], float)
amt = float(sys.argv[3]) if len(sys.argv) > 3 else .42
cream = base[None, None, :] + seam_free[..., None] * amt * np.array([1.0, 1.0, .92])
Image.fromarray(np.clip(cream, 0, 255).astype(np.uint8)).save(dst, quality=86)
print('avg', cream.reshape(-1, 3).mean(0).round(1), cream.shape)
