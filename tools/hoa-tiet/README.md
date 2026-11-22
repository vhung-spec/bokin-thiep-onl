# Hoạ tiết mẫu xanh pastel (tông xanh xô thơm & vàng)

Ảnh giấy dập nổi lá cây, dấu sáp vàng, cành lá vàng và dải lá vàng trong `xanh-pastel/assets/` đều được **vẽ bằng code** (numpy + Pillow), không lấy từ ảnh có sẵn.

```bash
pip install numpy pillow
python3 tools/hoa-tiet/giay_xo_tham.py /tmp/hoa-tiet          # sage2.png: giấy xô thơm lá to dập nổi (bìa, mở đầu)
python3 tools/hoa-tiet/dau_sap_6_mui.py /tmp/hoa-tiet         # seal2.png: dấu sáp vàng 6 múi
python3 tools/hoa-tiet/giay_dap_noi.py /tmp/hoa-tiet paper    # cream.png: giấy kem dập nổi nhẹ (nền nội dung)
python3 tools/hoa-tiet/dau_sap_vang.py /tmp/hoa-tiet          # sprig.png, garland.png: cành lá & dải lá vàng
```

Rồi chuyển sang WebP và chép vào `xanh-pastel/assets/`:

| File PNG | File trong assets | Dùng cho |
|---|---|---|
| `sage2.png` | `giay-xo-tham.webp` | bìa, mở đầu, lời mời, câu chuyện |
| `seal2.png` | `dau-sap-vang.webp` | dấu sáp trên bìa, mở đầu, phong bì quà |
| `cream.png` | `giay-kem.webp` | nền phần nội dung |
| `sprig.png` | `canh-la-vang.webp` | góc lịch, góc album |
| `garland.png` | `day-la-vang.webp` | kết phần lịch, kết thiệp |

Đổi màu: sửa các bộ màu trong `shade(...)` (giấy) và `GOLD` / `GOLD2` (vàng) rồi chạy lại.
