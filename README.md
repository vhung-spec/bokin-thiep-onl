# Thiệp cưới online — tông xanh xô thơm, nét vẽ tay

Thiệp cưới một trang cho điện thoại: bìa thiệp chạm để mở, hình minh hoạ tự vẽ dần ra, chữ viết tay hiện từ trái sang phải, lịch trình tiệc, dress code, quà mừng, liên hệ và form hồi âm.

Chỉ là HTML + CSS + JavaScript thuần: **không cần cài đặt, không cần build**, đăng miễn phí lên GitHub Pages / Vercel / Netlify.

![Xem trước thiệp](docs/preview.jpg)

## Các phần của thiệp

1. **Bìa thiệp** — khung viền lượn sóng, tên cô dâu chú rể, ngày cưới. Chạm để mở (bìa trượt lên).
2. **Lời mời** — hình đôi uyên ương cầm bảng ngày/tháng, lời mời, địa điểm, nút *Mở bản đồ*.
3. **Chương trình** — các mốc giờ đặt trong khung hình bàn tiệc.
4. **Dress code** (kèm bảng màu), **Quà mừng**, **Hoa**, **Liên hệ** (nút nhắn Zalo).
5. **Hồi âm** — tên, có đến không, số người, lời nhắn. Lưu vào Google Sheets nếu bạn cài (xem bên dưới).
6. Thanh nổi phía dưới: nút nhạc nền + nút *Hồi âm*.

## Sửa thông tin

Mọi nội dung nằm trong **`js/config.js`**: tên, ngày giờ, địa điểm, link bản đồ, lịch trình, bảng màu, người liên hệ, hạn hồi âm…
Thứ trong tuần (Chủ nhật, Thứ hai…) và các con số trên bảng ngày/tháng được tính tự động từ `date`.

Nhớ sửa thêm phần `<title>` và các thẻ `og:` trong `index.html` — đó là chữ hiện ra khi gửi link qua Zalo/Messenger.

### Mời riêng từng khách

Thêm `?to=Tên` vào cuối link, ví dụ:

```
https://ten-ban.github.io/bokin-thiep-onl/?to=Ngọc%20Anh
```

Bìa thiệp sẽ hiện *“Trân trọng kính mời — Ngọc Anh”*, ô tên trong form hồi âm được điền sẵn, và cột “Link mời” trong Google Sheets cho biết khách nào đã trả lời. Không có `?to=` thì bìa hiện *“bạn và người thương”*.

### Nhạc nền

Đặt một file mp3 vào `assets/nhac-nen.mp3` (hoặc đổi đường dẫn `music` trong `config.js`). Nhạc bắt đầu khi khách chạm mở thiệp. Không có file thì nút nhạc tự ẩn.
Nên dùng nhạc có giấy phép miễn phí (ví dụ Pixabay Music) và ghi nguồn ở chân trang.

### Mã QR mừng cưới (tuỳ chọn)

Đặt ảnh QR vào `assets/` rồi ghi đường dẫn vào `gift.qrImage` trong `config.js`. Phần *Quà mừng* sẽ có thêm nút *Xem mã QR mừng cưới*.

## Lưu hồi âm vào Google Sheets

Chưa cài thì form chạy ở chế độ xem thử: khách bấm gửi sẽ thấy *“Đây là lời hồi âm xem thử; chưa gửi đi.”*

1. Tạo một Google Sheet mới.
2. Vào **Tiện ích mở rộng → Apps Script**, xoá code mẫu, dán nội dung file [`google-apps-script/Code.gs`](google-apps-script/Code.gs), bấm Lưu.
3. Bấm **Triển khai → Tùy chọn triển khai mới**, chọn loại **Ứng dụng web**:
   - *Thực thi với tư cách*: **Tôi**
   - *Người có quyền truy cập*: **Bất kỳ ai**
4. Bấm **Triển khai**, cấp quyền, rồi sao chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/.../exec`).
5. Dán URL đó vào `rsvp.endpoint` trong `js/config.js`.

Mỗi lần khách gửi, một dòng mới xuất hiện trong trang tính **“Hồi âm”**.

## Xem thử trên máy

Mở thẳng file `index.html` bằng trình duyệt là xem được. Nếu muốn giống khi đăng lên mạng, chạy một máy chủ tĩnh trong thư mục dự án:

```bash
python3 -m http.server 8000
```

rồi mở <http://localhost:8000>.

## Đăng lên mạng miễn phí (GitHub Pages)

1. Đẩy code lên GitHub.
2. Vào **Settings → Pages**, phần *Build and deployment* chọn **Deploy from a branch**, chọn nhánh và thư mục `/ (root)`, bấm **Save**.
3. Sau khoảng 1 phút, thiệp có ở `https://<tên-tài-khoản>.github.io/<tên-repo>/`.

Vercel hoặc Netlify cũng được: kéo thả cả thư mục, không cần cấu hình build.

## Cấu trúc thư mục

```
index.html                 khung trang
css/style.css              màu sắc, bố cục, hiệu ứng
js/config.js               ← nội dung thiệp (sửa ở đây)
js/illustrations.js        hình minh hoạ SVG nét vẽ tay
js/main.js                 mở bìa, hiệu ứng, nhạc, form hồi âm
google-apps-script/Code.gs nhận hồi âm vào Google Sheets
assets/                    nhạc, ảnh QR, ảnh xem trước khi chia sẻ
```

## Ghi chú

- Phong cách thiệp (bố cục, tông màu xanh xô thơm, hiệu ứng) lấy cảm hứng từ một mẫu thiệp online. **Toàn bộ hình minh hoạ trong dự án là hình tự vẽ bằng SVG**, không dùng lại hình của mẫu gốc. Muốn dùng tranh của hoạ sĩ, hãy mua hoặc xin phép rồi thay vào `js/illustrations.js`.
- Font: [Ephesis](https://fonts.google.com/specimen/Ephesis), [Manrope](https://fonts.google.com/specimen/Manrope), [Cormorant Garamond](https://fonts.google.com/specimen/Cormorant+Garamond) — Google Fonts, giấy phép SIL OFL, hỗ trợ tiếng Việt.
- Hỗ trợ chế độ *giảm chuyển động* của điện thoại: tắt hiệu ứng, hiện nội dung ngay.
