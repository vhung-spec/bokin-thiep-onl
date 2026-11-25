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
node tools/video-slide/lam-video.mjs --danh-sach --xem 0   # in danh sách cảnh: giây bắt đầu, loại cảnh, ảnh nào, chữ gì
```

**Tự chọn thứ tự và cách ghép ảnh:** ghi tên file vào `thuTu` trong `cau-hinh.mjs`, dùng dấu `'|'` để chia nhóm. Hai ảnh dọc cùng nhóm thành một cảnh đôi. Ảnh đứng một mình trong nhóm thành cảnh 1 ảnh kèm chữ viết tay. Ảnh ngang luôn phủ kín màn hình.

```js
thuTu: ['studio-1.jpg', 'studio-2.jpg', '|', 'pho-co-1.jpg', '|', 'pho-co-2.jpg', 'pho-co-3.jpg'],
```

Thêm `--anh <thư mục>`, `--ra <file.mp4>` hoặc `--cau-hinh <file.mjs>` để dùng thư mục ảnh, file ra hay cấu hình khác.

Mỗi phút video mất khoảng **2–3 phút** để dựng. Thư mục `ra/` không đưa lên GitHub vì file video nặng.

## Hai bản video đã chốt của Văn Hùng & Tuyết Anh

Ảnh cưới không có trong repo. Chép ảnh vào `tools/video-slide/anh/` (hoặc dùng `--anh <thư mục>`), rồi chạy lệnh tương ứng để dựng lại đúng bản đó:

| Bản | Kiểu | Lệnh dựng lại | File ra |
|---|---|---|---|
| **Bản đầu tiên** | 56 ảnh in viền giấy trên nền giấy xô thơm, ghép đôi theo bối cảnh, chữ viết tay | `node tools/video-slide/lam-video.mjs --cau-hinh tools/video-slide/cau-hinh-ban-dau-tien.mjs` | `ra/Van_Hung_Tuyet_Anh_Ban_Dau_Tien_16x9.mp4` |
| **Qua những ô cửa** | 34 ảnh, dải ảnh, lia và zoom, chuyển cảnh ô cửa vòm, vệt sáng, cắt theo phách nhạc | `node tools/video-slide/dung-kich-ban.mjs` | `ra/Van_Hung_Tuyet_Anh_Le_Cuoi_16x9.mp4` |

## Dựng theo kịch bản (video "Qua những ô cửa")

Ngoài kiểu tự chia cảnh ở trên, có thể viết hẳn **kịch bản từng cảnh** trong `kich-ban/*.mjs`: giờ cắt theo phách nhạc, ảnh nào, khung, điểm căn, chuyển động, chữ. Bản hiện có là `kich-ban/qua-nhung-o-cua.mjs`, video chiếu tiệc 16:9:

- Nhạc "Lễ Đường" đo được 68 BPM. Phách thứ n rơi vào giây `T(n) = 0,815 + n × 60/68`, mọi điểm cắt đặt đúng phách. Nhạc nền vào ở 0:31,7, chỗ lấy hơi ở 1:14,4, điệp khúc cuối mở ở 2:30,8.
- Ảnh dọc cao bằng khung, hai bên là màu phẳng lấy từ mép ảnh. Ảnh studio thì lấy màu phông theo từng độ cao để nối liền. Không xoay nghiêng, không bóng đổ, gần như toàn bộ là cắt thẳng.
- Có các cú cắt khớp vị trí: dùng `focus` (điểm trong ảnh) và `to` (vị trí trên khung), ví dụ mắt cô dâu ở cùng một chỗ qua ba ảnh cầu thang.
- Mỗi ảnh chỉ một chuyển động (tiến tối đa 103%), chạy đều suốt thời gian ảnh còn trên màn hình, kể cả lúc hoà sang ảnh sau. Zoom làm bằng `transform` trên ảnh có kích thước cố định, nên chạy mượt dưới mức 1 px, không giật từng nấc.
- `--kiem-tra` in điểm nhìn trước và sau từng điểm chuyển, kèm khoảng lệch (px), để căn ảnh sau cho mắt khách có chỗ bám.
- Màu chỉnh theo từng bộ ảnh trong `chinh_mau.py`:
  - A (studio): ấm nhẹ.
  - B (phố cổ): bớt hồng rực, hạ vùng nắng.
  - C (toà nhà cổ): bớt ố vàng ở váy và hoa, giữ màu gỗ.
  - D (Hạ Long): bớt xanh lục và lam.
  - Cả phim: bóng tối hơi ấm.

```bash
node tools/video-slide/dung-kich-ban.mjs --anh <thư mục ảnh>                  # bản chiếu tiệc → ra/Van_Hung_Tuyet_Anh_Le_Cuoi_16x9.mp4
node tools/video-slide/dung-kich-ban.mjs --anh <thư mục ảnh> --kiem-tra       # in điểm nhìn trước/sau mỗi điểm chuyển
node tools/video-slide/dung-kich-ban.mjs --anh <thư mục ảnh> --xem 80.5,150.9 # chụp khung hình để kiểm tra
```

Ảnh đã chỉnh màu được lưu đệm trong `ra/.anh-da-chinh/`, chỉ làm lại khi ảnh gốc hoặc `chinh_mau.py` thay đổi. Nếu font chưa tải đủ, lệnh sẽ dừng chứ không xuất video sai chữ.

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
| `kich-ban/*.mjs`, `dung-kich-ban.mjs`, `kich-ban.html`, `kich-ban.js` | dựng theo kịch bản viết sẵn (giờ cắt, ảnh, khung, chữ từng cảnh) |
| `chinh_mau.py` | chỉnh màu theo bộ ảnh, màu nền phẳng từ mép ảnh, vẽ giấy ngà |
| `font/` | font của thiệp (Ephesis, Lora, Playfair Display, Be Vietnam Pro — giấy phép SIL OFL), tải sẵn để dựng không cần mạng |

Nền giấy, khung thiệp, dấu sáp, cành lá vàng lấy từ `xanh-pastel/assets/`. Đổi các ảnh đó là video đổi theo.
Nên dùng nhạc mà bạn có quyền sử dụng nếu đăng video lên mạng.
