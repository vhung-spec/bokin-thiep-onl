# Thiệp cưới online

Repo có **2 mẫu thiệp**, dùng chung file Google Sheets. Mẫu đỏ rượu dùng ảnh trong `assets/anh/` (đang là ảnh mẫu); mẫu xanh pastel dùng ảnh cưới thật trong `xanh-pastel/assets/anh/`:

| Mẫu | Link | Sửa nội dung ở |
|---|---|---|
| **Đỏ rượu** — phong bì sáp, polaroid, tim rơi | `/` (trang chính) | `js/config.js` |
| **Xanh pastel** — cửa đôi ren hoa, dấu sáp xanh, lời chúc chạy như livestream, thả tim | `/xanh-pastel/` | `xanh-pastel/js/config.js` |

Gửi khách link của mẫu bạn chọn (ví dụ `https://ten-ban.github.io/bokin-thiep-onl/xanh-pastel/?to=Ngọc%20Anh`).

---

## Mẫu đỏ rượu — phong bì sáp, polaroid

Thiệp cưới một trang cho điện thoại: phong bì “Nhấp để mở” với con dấu sáp, ảnh polaroid bay ra, tim rơi, lịch tháng cưới, đếm ngược, lễ cưới của **nhà trai / nhà gái** kèm **ngày âm lịch**, lịch trình, album ảnh, xác nhận tham dự, **sổ lưu bút có ký tên bằng tay**, mã QR mừng cưới và lời cảm ơn.

Chỉ là HTML + CSS + JavaScript thuần: **không cần cài đặt, không cần build**, đăng miễn phí lên GitHub Pages / Vercel / Netlify.

![Xem trước thiệp](docs/preview.jpg)

## Các phần của thiệp

1. **Phong bì** — “Nhấp để mở”, ảnh polaroid trượt vào phong bì, nắp mở ra, 2 ảnh bay lên, tim bắt đầu rơi, nhạc nền phát.
2. **Lịch tháng** — trên nền ảnh, ngày cưới đánh dấu bằng trái tim.
3. **Chữ lồng + đếm ngược** — ngày / giờ / phút / giây.
4. **Ảnh chính**, **lời mời** (“Quý vị & Gia đình” hoặc tên khách), ảnh **chú rể / cô dâu**, tên **bố mẹ hai bên**.
5. **Tab Nhà gái / Nhà trai** — mỗi nhà một danh sách lễ (Lễ Vu Quy, Lễ Thành Hôn, Tiệc Cưới…) với giờ, thứ, ngày dương, **ngày âm lịch tự tính**, địa điểm, nút *Xem bản đồ*.
6. **Lịch trình** trong ngày và **dress code**.
7. **Album hình cưới** — chạm để xem ảnh lớn, vuốt qua lại.
8. **Xác nhận tham dự** — tên, khách nhà trai/nhà gái, có đến không, số người.
9. **Sổ lưu bút** — khách **ký tên bằng ngón tay** và gửi lời chúc; lời chúc hiện ngay trên thiệp.
10. **Gửi quà mừng cưới** — mã QR của hai nhà, nút sao chép số tài khoản.
11. **Đếm ngược trong trái tim** và **lời cảm ơn**.

## Sửa thông tin

Mọi nội dung nằm trong **`js/config.js`**: tên, ngày giờ từng lễ, địa chỉ, link bản đồ, bố mẹ hai bên, lịch trình, bảng màu dress code, tài khoản mừng cưới…
Thứ trong tuần và ngày âm lịch được tính tự động (thuật toán âm lịch Việt Nam của Hồ Ngọc Đức, múi giờ +7).

Nhớ sửa thêm `<title>` và các thẻ `og:` trong `index.html` — đó là chữ hiện ra khi gửi link qua Zalo/Messenger.

### Thay ảnh

Thư mục `assets/anh/` đang chứa **ảnh mẫu** (khung có ghi “ẢNH MẪU · thay file …”). Chép ảnh cưới của bạn đè lên **đúng tên file**:

| File | Dùng cho | Tỉ lệ nên dùng |
|---|---|---|
| `bia.jpg`, `bia-2.jpg` | ảnh trên phong bì và 2 ảnh bay ra | dọc 4:5 |
| `lich.jpg` | nền phía sau lịch tháng | ngang |
| `chinh.jpg` | ảnh lớn sau phần đếm ngược | dọc 3:4 |
| `chu-re.jpg`, `co-dau.jpg` | ảnh chú rể, cô dâu | dọc 4:5 |
| `album-01.jpg` … `album-08.jpg` | album (thêm/bớt trong `config.js`) | dọc 3:4 |
| `luu-but.jpg` | ảnh trong phần sổ lưu bút | dọc 3:4 |
| `cam-on.jpg` | ảnh lớn cuối thiệp | dọc 3:4 |

Mẹo: nén ảnh còn khoảng 200–400 KB mỗi tấm (rộng ~1200px) để thiệp mở nhanh trên 4G.

### Mời riêng từng khách

Thêm `?to=Tên` vào cuối link; thêm `&nha=trai` (hoặc `&nha=gai`) để mở sẵn đúng tab lễ của nhà mời:

```
https://ten-ban.github.io/bokin-thiep-onl/?to=Anh%20Thắng%20và%20người%20thương&nha=trai
```

Phần lời mời sẽ hiện tên khách thay cho “Quý vị & Gia đình”, ô tên trong form được điền sẵn, và cột “Link mời” trong Google Sheets cho biết ai đã trả lời.

### Mã QR mừng cưới

Trong `config.js` → `gift.accounts`, với mỗi nhà:
- điền `number` (số tài khoản) và `bankId` (mã ngân hàng, ví dụ `VCB`, `MB`, `TCB`, `ACB`, `BIDV`, `ICB`) → thiệp tự tạo mã **VietQR** (qua dịch vụ img.vietqr.io); **hoặc**
- tải ảnh QR từ app ngân hàng, đặt vào `assets/` và ghi đường dẫn vào `qr`.

Chưa điền gì thì ô QR hiện “Mã QR đang được cập nhật”. **Hãy quét thử mã QR bằng app ngân hàng trước khi gửi thiệp.**

### Nhạc nền

Đặt file mp3 vào `assets/nhac-nen.mp3` (hoặc đổi `music` trong `config.js`). Nhạc phát khi khách mở phong bì; nút tròn góc dưới bên trái để bật/tắt. Không có file thì nút tự ẩn. Nên dùng nhạc có giấy phép miễn phí.

## Mẫu xanh pastel — cửa đôi ren hoa

![Xem trước mẫu xanh pastel](docs/preview-xanh-pastel.jpg)

Thư mục `xanh-pastel/`. Các phần:

1. **Cửa đôi** nền ren thêu hoa, con dấu sáp xanh nhạt trên bông hoa trắng giấy, “Chạm để mở thiệp” (có tên khách nếu link có `?to=`). Chạm vào thì dấu sáp tan, hai cánh cửa mở vào trong.
2. **Mở đầu** — dấu sáp, tên cô dâu chú rể, trái tim xuyên mũi tên, ngày cưới, hoạ tiết hoa xanh.
3. **Lời mời** — bố mẹ hai bên, “Trân trọng kính mời *Quý khách*” (hoặc tên khách), tên viết tay, giờ, thứ, ngày, **ngày âm lịch tự tính**, địa điểm (bấm để mở bản đồ). Chữ viết tay hiện dần từng ký tự.
4. **Ảnh lớn mép giấy xé + Countdown**, cụm hoa xanh màu nước.
5. **Save The Date** — lịch tháng (Chủ nhật đầu tuần, đổi được trong `config.js`), ngày cưới khoanh trái tim + nhẫn, sóng giấy màu nước.
6. **Love Story** trên nền ren, chữ viết tay.
7. **Timeline** — tiêu đề chữ T uốn lượn tự vẽ ra, trục dọc, các mốc xen kẽ trái/phải kèm biểu tượng màu nước.
8. **The Album** — ảnh lướt ngang, chạm để xem lớn (“1 / 6”, vuốt qua lại).
9. **Xác Nhận Tham Dự** — tên, có tham dự không, số khách, một câu hỏi thêm tuỳ chỉnh (mặc định: có trẻ em đi cùng không).
10. **Gửi Quà Mừng** — phong bì xanh nắp viền ren, chạm để mở rồi hiện mã QR của cô dâu và chú rể; ảnh mép giấy xé bên dưới.
11. **Thank you!** — lời cảm ơn.
12. **Thanh dưới cùng**: nút ☰ mục lục; nút 💬 xem tất cả lời chúc; nút ♥ thả tim có bộ đếm; ô **“Gửi lời chúc…”** (lần đầu sẽ hỏi tên). Thanh tự thu gọn khi cuộn xuống, hiện lại khi cuộn lên. Lời chúc của khách **chạy ở góc dưới như livestream**, có nút ✕ để ẩn.

Sửa nội dung trong **`xanh-pastel/js/config.js`** (tên, giờ, địa điểm, bố mẹ, love story, timeline, tài khoản mừng cưới…). Ảnh cưới nằm trong `xanh-pastel/assets/anh/` (`anh-01.jpg` … ); chọn ảnh nào cho phần Countdown, phần quà mừng và album trong mục `photos` và `album.photos` của `config.js`. Ảnh mới nên thu nhỏ còn cạnh dài khoảng 1600px để thiệp mở nhanh. Nhạc nền dùng chung `assets/nhac-nen.mp3`. Biểu tượng timeline có sẵn: `cheers`, `rings`, `music`, `camera`, `heart`, `cake`.

Hai mẫu dùng **chung một file Apps Script** (bên dưới): dán cùng URL vào `endpoint` của mẫu nào cũng được. Mẫu xanh pastel ghi thêm cột **Câu hỏi thêm** và lưu **lượt thả tim**.

## Lưu dữ liệu vào Google Sheets

Chưa cài thì thiệp chạy ở **chế độ xem thử**: xác nhận tham dự không gửi đi đâu, lời chúc mẫu được hiển thị và lời chúc bạn thử gửi chỉ lưu trên máy bạn.

1. Tạo một Google Sheet mới.
2. Vào **Tiện ích mở rộng → Apps Script**, xoá code mẫu, dán nội dung file [`google-apps-script/Code.gs`](google-apps-script/Code.gs), bấm Lưu.
3. Bấm **Triển khai → Tùy chọn triển khai mới**, chọn loại **Ứng dụng web**:
   - *Thực thi với tư cách*: **Tôi**
   - *Người có quyền truy cập*: **Bất kỳ ai**
4. Bấm **Triển khai**, cấp quyền, sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
5. Dán URL vào `endpoint` trong `js/config.js` (mẫu đỏ rượu) và/hoặc `xanh-pastel/js/config.js` (mẫu xanh pastel).

Kết quả: trang tính **“Xác nhận tham dự”** và **“Lời chúc”** tự được tạo. Lời chúc mới hiện trên thiệp cho mọi khách. Muốn ẩn một lời chúc, gõ `x` vào cột **Ẩn** của dòng đó.
Sửa code Apps Script sau này thì phải **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới** thì thay đổi mới có hiệu lực.

## Xem thử trên máy

```bash
python3 -m http.server 8000
```

rồi mở <http://localhost:8000> (mẫu đỏ rượu) hoặc <http://localhost:8000/xanh-pastel/> (mẫu xanh pastel). Mở thẳng file `index.html` cũng xem được, trừ phần tải lời chúc từ Google Sheets.

## Đăng lên mạng miễn phí (GitHub Pages)

1. Đẩy code lên GitHub.
2. Vào **Settings → Pages**, *Build and deployment* chọn **Deploy from a branch**, chọn nhánh và thư mục `/ (root)`, bấm **Save**.
3. Sau khoảng 1 phút, thiệp có ở `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

Mẫu xanh pastel ở `https://<tên-tài-khoản>.github.io/<tên-repo>/xanh-pastel/`.

Sau khi có link thật, sửa `og:image` trong `index.html` thành đường dẫn đầy đủ (ví dụ `https://ten-ban.github.io/bokin-thiep-onl/assets/og-image.jpg`, hoặc `.../xanh-pastel/assets/og-image.jpg` cho mẫu xanh) để Zalo/Facebook hiện ảnh xem trước.

## Cấu trúc thư mục

```
index.html                 khung trang
css/style.css              màu sắc, bố cục, hiệu ứng
js/config.js               ← nội dung thiệp (sửa ở đây)
js/lunar.js                đổi ngày dương sang âm lịch
js/art.js                  hình vẽ SVG: hoa rum, phong bì, dấu sáp, chữ lồng
js/main.js                 mở phong bì, lịch, đếm ngược, form, sổ lưu bút, QR
google-apps-script/Code.gs lưu xác nhận, lời chúc, lượt thả tim vào Google Sheets (dùng chung)
assets/anh/                ảnh mẫu của mẫu đỏ rượu
assets/og-image.jpg        ảnh xem trước khi chia sẻ link

xanh-pastel/               mẫu xanh pastel
  index.html               khung trang
  css/style.css            màu sắc, bố cục, hiệu ứng
  js/config.js             ← nội dung mẫu xanh (sửa ở đây)
  js/art.js                hình vẽ SVG: ren thêu, giấy thủ công, hoa, dấu sáp, giấy xé, sóng, chữ T uốn lượn
  js/main.js               cửa đôi, đếm ngược, lịch, form, lời chúc chạy, thả tim, QR
  assets/anh/              ảnh cưới của mẫu xanh pastel
  assets/og-image.jpg      ảnh xem trước khi chia sẻ link
```

## Ghi chú

- Bố cục và tính năng của hai mẫu lấy cảm hứng từ các mẫu thiệp online thương mại. **Toàn bộ code và hình vẽ (hoa rum, mẫu đơn, phong bì, con dấu sáp, nền ren, giấy xé, chữ lồng) đều tự vẽ bằng SVG** cho dự án này; không dùng ảnh, logo hay hình của mẫu gốc.
- Font Google Fonts (giấy phép SIL OFL, hỗ trợ tiếng Việt): Corinthia, Oswald, Noto Serif, Cormorant Garamond (mẫu đỏ rượu); Pinyon Script, Monsieur La Doulaise, Ms Madi, Playfair Display, Cormorant Garamond (mẫu xanh pastel). Monsieur La Doulaise chỉ dùng cho chữ tiếng Anh (Countdown, Save The Date, Love Story) vì không có dấu tiếng Việt.
- Hỗ trợ chế độ *giảm chuyển động* của điện thoại: tắt hiệu ứng và tim rơi.
- Thiết kế cũ (tông xanh xô thơm, nét vẽ tay) vẫn còn trong lịch sử git, commit `63f5f7b`.
