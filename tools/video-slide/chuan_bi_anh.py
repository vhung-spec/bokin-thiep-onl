"""Chuẩn bị ảnh cho video: xoay đúng chiều theo EXIF, thu nhỏ, lưu JPEG vào thư mục tạm.

Dùng:  python3 chuan_bi_anh.py <thư mục ảnh> <thư mục tạm> <cạnh dài tối đa> <ten|ngay-chup>
In ra JSON: danh sách ảnh theo thứ tự [{"ten", "file", "w", "h"}].
"""
import json
import os
import re
import sys

from PIL import Image, ImageOps

try:  # ảnh iPhone .heic (cần: pip install pillow-heif)
    from pillow_heif import register_heif_opener
    register_heif_opener()
except ImportError:
    pass

DUOI = ('.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif', '.bmp', '.tif', '.tiff')


def khoa_ten(ten):
    """Xếp tự nhiên: anh-2 đứng trước anh-10."""
    return [int(p) if p.isdigit() else p.lower() for p in re.split(r'(\d+)', ten)]


def ngay_chup(im):
    exif = im.getexif()
    sub = exif.get_ifd(0x8769) if exif else {}
    return sub.get(36867) or exif.get(306) or ''  # DateTimeOriginal, DateTime


def main():
    vao, ra, canh, sap_xep = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]
    os.makedirs(ra, exist_ok=True)
    ds = []
    if not os.path.isdir(vao):
        print('[]')
        return
    for ten in sorted(os.listdir(vao), key=khoa_ten):
        if not ten.lower().endswith(DUOI) or ten.startswith('.'):
            continue
        duong = os.path.join(vao, ten)
        try:
            im = Image.open(duong)
            ngay = ngay_chup(im)
            im = ImageOps.exif_transpose(im).convert('RGB')
        except Exception as loi:  # file hỏng / định dạng chưa đọc được
            print(f'Bỏ qua {ten}: {loi}', file=sys.stderr)
            continue
        im.thumbnail((canh, canh), Image.LANCZOS)
        file = os.path.join(ra, f'{len(ds):04d}.jpg')
        im.save(file, quality=92)
        ds.append({'ten': ten, 'file': file, 'w': im.width, 'h': im.height, 'ngay': ngay})
    if sap_xep == 'ngay-chup':
        ds.sort(key=lambda a: (a['ngay'] or '9999', khoa_ten(a['ten'])))
    print(json.dumps(ds, ensure_ascii=False))


if __name__ == '__main__':
    main()
