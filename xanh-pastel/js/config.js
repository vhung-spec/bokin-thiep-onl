/*
 * ============================================================
 *  THIỆP CƯỚI VĂN HÙNG & TUYẾT ANH — chỉ cần sửa file này
 * ============================================================
 *  • Giữ nguyên dấu nháy '...' và dấu phẩy cuối mỗi dòng.
 *  • Ngày giờ viết dạng 'năm-tháng-ngàyTgiờ:phút' theo GIỜ VIỆT NAM.
 *    Đếm ngược luôn tính đến đúng giờ Việt Nam, dù khách mở thiệp ở múi giờ khác.
 *  • Thứ trong tuần và ngày âm lịch được tính tự động.
 *  • Mời riêng từng khách: thêm ?to=Tên vào link, ví dụ  .../xanh-pastel/?to=Anh%20Thắng
 */
window.WEDDING = {
  groom: { name: 'Văn Hùng' },
  bride: { name: 'Tuyết Anh' },

  date: '2026-11-28T10:30',
  timezoneOffset: 7, // giờ Việt Nam (UTC+7)

  cover: {
    hint: 'Chạm để mở thiệp',
    guestPrefix: 'Thân gửi', // hiện trên bìa khi link có ?to=
  },

  families: {
    trai: { label: 'Nhà trai', parents: ['Ông Nguyễn Văn Khiên', 'Bà Trần Thị Lượt'] },
    gai: { label: 'Nhà gái', parents: ['Ông Bạch Đăng Nhung', 'Bà Nguyễn Thị Hà'] },
  },

  invitation: {
    kicker: 'Trân trọng kính mời',
    defaultGuest: 'Quý khách', // hiện khi link không có ?to=
    line: 'tới dự lễ thành hôn của gia đình chúng tôi',
  },

  venue: {
    name: 'Nhà văn hoá Tổ 1 Ngọc Trục',
    address: 'P. Ngọc Trục, làng Ngọc Trục, Đại Mỗ, Hà Nội',
    // Liên kết Google Maps có sẵn của địa điểm (mã vị trí XQRF+254)
    map: 'https://www.google.com/maps?q=XQRF%2B254+Nh%C3%A0+V%C4%83n+Ho%C3%A1+T%E1%BB%95+1+Ng%E1%BB%8Dc+Tr%E1%BB%A5c,+P.+Ng%E1%BB%8Dc+Tr%E1%BB%A5c,+l%C3%A0ng+Ng%E1%BB%8Dc+Tr%E1%BB%A5c,+%C4%90%E1%BA%A1i+M%E1%BB%97,+H%C3%A0+N%E1%BB%99i&ftid=0x3134530024c79431:0x28d0367215a69c81',
    mapButton: 'Xem đường đi',
  },

  // Ảnh cưới nằm trong xanh-pastel/assets/anh/ (cạnh dài ~1600px, đã nén).
  photos: {
    hero: 'assets/anh/anh-07.jpg',   // ảnh cầu thang: ảnh lớn đầu tiên, trên phần đếm ngược
    heroFocus: '50% 88%',            // điểm giữ trong khung khi cắt (ngang, dọc): giữ gương mặt + váy trên bậc thang
    ending: 'assets/anh/anh-05.jpg', // ảnh bên vịnh: mở đầu phần lời cảm ơn
  },

  countdown: {
    title: 'Countdown',
    subtitle: 'To Our Big Day',
    done: 'Đã đến giờ chung vui cùng chúng mình',
  },
  calendar: { title: 'Save The Date', weekStart: 'sun' }, // 'sun' = Chủ nhật đầu tuần như thiệp

  loveStory: {
    title: 'Love Story',
    paragraphs: [
      'Chúng mình gặp nhau vào một ngày rất đỗi bình thường, chẳng có gì đặc biệt — nhưng kể từ hôm ấy, mọi thứ bỗng trở nên dịu dàng hơn.',
      'Từ những tin nhắn hỏi han vụng về đến những buổi chiều đi dạo chẳng muốn về, chúng mình học cách yêu thương, sẻ chia và cùng nhau lớn lên.',
      'Và hôm nay, chúng mình quyết định nắm tay nhau bước sang một chương mới. Cảm ơn bạn đã là một phần trong câu chuyện ấy.',
    ],
    closing: 'With all our love,',
  },

  timeline: {
    title: 'Timeline',
    // icon: heart (trái tim), cheers (đôi ly), rings (nhẫn), music, camera, cake
    items: [
      { time: '10:00', label: 'Đón khách', icon: 'heart' },
      { time: '10:30', label: 'Khai tiệc', icon: 'cheers' },
    ],
  },

  album: {
    title: 'The Album',
    photos: [
      { src: 'assets/anh/anh-01.jpg', alt: 'Hai bạn trước ô kính màu trong sảnh lớn' },
      { src: 'assets/anh/anh-06.jpg', alt: 'Áo dài hồng trước hiệu thuốc phố cổ' },
      { src: 'assets/anh/anh-02.jpg', alt: 'Hai bạn ngồi cười trong studio' },
      { src: 'assets/anh/anh-03.jpg', alt: 'Chú rể nâng khăn voan cho cô dâu' },
      { src: 'assets/anh/anh-04.jpg', alt: 'Hai bạn đứng trong studio' },
      { src: 'assets/anh/anh-08.jpg', alt: 'Hai bạn trên đỉnh núi nhìn ra vịnh' },
    ],
  },

  rsvp: {
    title: 'Xác Nhận Tham Dự',
    text: 'Sự hiện diện của bạn là niềm vui của Cô Dâu và Chú Rể',
    yes: 'Mình sẽ tham dự',
    no: 'Rất tiếc, mình không thể tham dự',
    guestsLabel: 'Số người tham dự (tính cả bạn)',
    maxGuests: 10,
    button: 'Gửi phản hồi',
  },

  gift: {
    title: 'Gửi Quà Mừng',
    text: 'Quét mã QR để gửi quà mừng tới chúng mình nhé',
    accounts: [
      // Ảnh QR VietQR (chuẩn NAPAS) của tài khoản, nội dung chuyển khoản "Mung cuoi Van Hung Tuyet Anh"
      { side: 'Cô dâu & Chú rể', bankName: 'VPBank', number: '3646866', holder: '', qr: 'assets/qr-mung-cuoi.png' },
    ],
  },

  thanks: {
    title: 'Thank you!',
    text: 'Cảm ơn bạn đã dành thời gian quý báu để chung vui cùng chúng mình. Sự hiện diện của bạn là món quà ý nghĩa nhất!',
  },

  // NƠI NHẬN PHẢN HỒI: dán link ứng dụng web Google Apps Script vào đây (xem README, mục "Lưu phản hồi").
  // Để trống thì nút "Gửi phản hồi" sẽ báo chưa lưu được, không bao giờ báo thành công giả.
  endpoint: '',

  // Nhạc nền (mp3), phát sau khi khách chạm mở thiệp. Chép file vào xanh-pastel/assets/ rồi ghi tên,
  // ví dụ  music: 'assets/nhac-nen.mp3',  — để trống thì không có nút nhạc.
  music: '',
};
