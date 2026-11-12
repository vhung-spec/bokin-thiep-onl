/*
 * ============================================================
 *  THÔNG TIN THIỆP CƯỚI — chỉ cần sửa file này
 * ============================================================
 *  Mẹo: giữ nguyên dấu nháy '...' và dấu phẩy cuối mỗi dòng.
 *  Mời riêng từng khách: thêm ?to=Tên vào cuối link,
 *  ví dụ  https://.../?to=Ngọc%20Anh
 */
window.WEDDING = {
  groom: 'Minh Khang',
  bride: 'Thảo Vy',

  // Ngày giờ cưới (năm-tháng-ngàyTgiờ:phút)
  date: '2027-08-15T17:00',

  // Lời trên bìa thiệp
  cover: {
    kicker: 'Trân trọng kính mời',
    defaultGuest: 'bạn và người thương', // hiện khi link không có ?to=
    hint: 'Chạm để mở thiệp',
  },

  invitation: {
    message:
      'Với tất cả niềm vui và chút hồi hộp, chúng mình muốn mời bạn cùng chia sẻ một trong những ngày ý nghĩa và diệu kỳ nhất của đời mình: ngày cưới của chúng mình!',
    headline: 'Chúng mình cưới nhau!',
  },

  venue: {
    name: 'White Palace',
    address: '194 Hoàng Văn Thụ, Phú Nhuận, TP. Hồ Chí Minh',
    mapUrl: 'https://maps.google.com/?q=White+Palace+194+Hoang+Van+Thu+Phu+Nhuan',
    mapButton: 'Mở bản đồ',
  },

  schedule: {
    title: 'Chương trình',
    items: [
      { time: '17:00', label: 'đón khách' },
      { time: '18:00', label: 'làm lễ' },
      { time: '18:30', label: 'khai tiệc' },
      { time: '21:30', label: 'tiễn khách' },
    ],
  },

  dressCode: {
    title: 'Dress code',
    text: 'Chúng mình sẽ rất vui nếu trang phục của bạn hợp với bảng màu của ngày cưới:',
    colors: ['#EADFCC', '#8A4B33', '#9DAA78', '#69792C'],
  },

  gift: {
    title: 'Quà mừng',
    text: 'Bạn đến chung vui là món quà quý nhất. Nếu muốn gửi thêm, một phong bì nhỏ cho tổ ấm mới của chúng mình là đủ đầy.',
    // Tuỳ chọn: hiện nút xem mã QR mừng cưới. Để trống '' nếu không dùng.
    qrImage: '',          // ví dụ 'assets/qr-mung-cuoi.png'
    qrButton: 'Xem mã QR mừng cưới',
  },

  flowers: {
    title: 'Hoa',
    text: 'Bạn đừng mang hoa nhé, vì chúng mình sẽ không kịp ngắm hết vẻ đẹp của chúng.',
  },

  contact: {
    title: 'Liên hệ',
    name: 'Mai',
    text: 'Mai, người điều phối tiệc cưới của chúng mình, sẽ rất vui được trả lời mọi điều bạn cần.',
    button: 'Nhắn cho Mai',
    // Link khi bấm nút: Zalo (https://zalo.me/0901234567), Messenger hoặc tel:0901234567
    url: 'https://zalo.me/0901234567',
  },

  rsvp: {
    title: 'Hồi âm',
    deadline: '01.08',
    maxGuests: 5,
    // Dán link Google Apps Script (xem README) để hồi âm được lưu vào Google Sheets.
    // Để trống thì form chạy ở chế độ xem thử, không gửi đi đâu cả.
    endpoint: '',
  },

  // Nhạc nền: đặt file mp3 vào thư mục assets rồi ghi đường dẫn ở đây.
  // Để trống '' hoặc file không tồn tại thì nút nhạc tự ẩn.
  music: 'assets/nhac-nen.mp3',

  footer: {
    note: 'Cảm ơn bạn đã dành thời gian cho chúng mình.',
  },
};
