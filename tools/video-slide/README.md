# Video slide ảnh cưới

Tự dựng video trình chiếu ảnh cưới theo **tông xanh xô thơm & vàng của thiệp xanh pastel**: chép ảnh vào một thư mục, chạy một lệnh, ra file MP4 có nhạc nền.

Video gồm:

1. **Mở đầu**: tấm thiệp khung hoa trượt lên trên nền giấy xô thơm, chữ *Lễ Thành Hôn*, tên hai bạn, ngày cưới, rồi dấu sáp đóng xuống.
2. **Ảnh**, tự chia cảnh theo chiều ảnh:
   - Ảnh **đúng chiều khung** (ảnh ngang trong video 16:9): phủ kín màn hình, lia và zoom chậm.
   - Hai ảnh **lệch chiều** liền nhau (ảnh dọc trong video 16:9): đặt cạnh nhau như hai tấm ảnh in có viền giấy.
   - Ảnh lệch chiều **đứng riêng**: ảnh in một bên, chữ viết tay (*Forever & Always*…) bên kia.
   - Giữa các cảnh là các kiểu chuyển cảnh nhẹ (mờ dần, quét sáng, zoom, trượt lên), thay phiên nhau.
3. **Kết thúc**: thiệp *Thank you!* với lời cảm ơn, rồi tối dần cùng nhạc.

Nhạc nền tự cắt cho vừa video. Khi bật `vuaBaiNhac`, mỗi cảnh tự giãn 3,5–8 giây để video dài vừa bài nhạc.

## Cách dùng

1. Chép ảnh vào **`tools/video-slide/anh/`**. Ảnh xếp theo tên file, nên đặt tên `01.jpg`, `02.jpg`… theo thứ tự muốn chiếu. Ảnh chụp từ điện thoại tự xoay đúng chiều. Chưa có ảnh thì lệnh dựng thử bằng 8 ảnh của thiệp.
2. Sửa **`tools/video-slide/cau-hinh.mjs`**: tên, ngày, lời cảm ơn, bài nhạc, giây bắt đầu nhạc, khung 16:9 hay 9:16, chữ viết tay cạnh ảnh.
3. Chạy ở thư mục gốc repo:

```bash
node tools/video-slide/lam-video.mjs                 # video Full HD 30 hình/giây → tools/video-slide/ra/video-cuoi.mp4
node tools/video-slide/lam-video.mjs --nhap          # bản nháp nhanh (nửa kích thước, 15 hình/giây) để xem thứ tự ảnh
node tools/video-slide/lam-video.mjs --khung 9:16    # bản dọc cho điện thoại → video-cuoi-doc.mp4
node tools/video-slide/lam-video.mjs --xem 3,12,20   # chỉ chụp ảnh tĩnh ở giây 3, 12, 20 để kiểm tra bố cục
```

Thêm `--anh <thư mục>`, `--ra <file.mp4>` hoặc `--cau-hinh <file.mjs>` để dùng thư mục ảnh, file ra hay cấu hình khác.

Mỗi phút video mất khoảng **2–3 phút** để dựng. Thư mục `ra/` không đưa lên GitHub vì file video nặng.

## Cài đặt (khi chạy trên máy riêng)

- Node 18 trở lên, **ffmpeg**, **python3** kèm Pillow (`pip install pillow`; ảnh iPhone `.heic` cần thêm `pip install pillow-heif`).
- Playwright và Chromium, chạy ở thư mục gốc repo: `npm i --no-save playwright && npx playwright install chromium`.

## Các file

| File | Việc |
|---|---|
| `cau-hinh.mjs` | mọi nội dung có thể sửa |
| `lam-video.mjs` | chia cảnh, tính thời lượng theo nhạc, dựng từng khung hình bằng Chromium rồi ghép thành MP4 bằng ffmpeg |
| `mau.html`, `mau.js` | mẫu video: bố cục và chuyển động của từng loại cảnh (mọi chuyển động tính theo thời gian `t`, nên dựng lại ra đúng từng khung hình) |
| `chuan_bi_anh.py` | xoay ảnh theo EXIF, thu nhỏ, xếp thứ tự |
| `font/` | font của thiệp (Ephesis, Lora, Playfair Display, Be Vietnam Pro — giấy phép SIL OFL), tải sẵn để dựng không cần mạng |

Nền giấy, khung thiệp, dấu sáp, cành lá vàng lấy từ `xanh-pastel/assets/`. Đổi các ảnh đó là video đổi theo.
Nên dùng nhạc mà bạn có quyền sử dụng nếu đăng video lên mạng.
