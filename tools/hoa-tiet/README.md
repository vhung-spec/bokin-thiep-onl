# Hoạ tiết mẫu xanh pastel (tông xanh xô thơm & vàng)

Ảnh giấy dập nổi lá cây, dấu sáp vàng, cành lá vàng và dải lá vàng trong `xanh-pastel/assets/` đều được **vẽ bằng code** (numpy + Pillow), không lấy từ ảnh có sẵn.

```bash
pip install numpy pillow
python3 tools/hoa-tiet/giay_dap_noi.py /tmp/hoa-tiet paper   # sage.png (giấy xô thơm), cream.png (giấy kem)
python3 tools/hoa-tiet/dau_sap_vang.py /tmp/hoa-tiet          # seal.png, sprig.png, garland.png
```

Rồi chuyển sang WebP và chép vào `xanh-pastel/assets/`:

| File PNG | File trong assets | Dùng cho |
|---|---|---|
| `sage.png` | `giay-xo-tham.webp` | bìa, mở đầu, lời mời, câu chuyện |
| `cream.png` | `giay-kem.webp` | nền phần nội dung |
| `seal.png` | `dau-sap-vang.webp` | dấu sáp trên bìa, mở đầu, phong bì quà |
| `sprig.png` | `canh-la-vang.webp` | góc lịch, góc album |
| `garland.png` | `day-la-vang.webp` | kết phần lịch, kết thiệp |

Đổi màu: sửa các bộ màu trong `shade(...)` (giấy) và `GOLD` (vàng) rồi chạy lại.
