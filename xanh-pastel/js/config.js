/*
 * ============================================================
 *  MẪU XANH PASTEL — THÔNG TIN THIỆP CƯỚI (chỉ cần sửa file này)
 * ============================================================
 *  • Giữ nguyên dấu nháy '...' và dấu phẩy cuối mỗi dòng.
 *  • Ngày giờ viết dạng 'năm-tháng-ngàyTgiờ:phút', ví dụ '2027-03-07T17:30'.
 *  • Thứ trong tuần và ngày âm lịch được tính tự động.
 *  • Ảnh mặc định dùng chung thư mục ../assets/anh với mẫu đỏ rượu:
 *    thay ảnh ở đó là cả hai mẫu cùng đổi. Muốn ảnh riêng thì sửa đường dẫn bên dưới.
 *  • Mời riêng: thêm ?to=Tên vào link, ví dụ  .../xanh-pastel/?to=Anh%20Thắng
 */
window.WEDDING = {
  groom: { name: 'Minh Khang', short: 'Khang' },
  bride: { name: 'Thảo Vy', short: 'Vy' },

  // Giờ lễ/tiệc chính: dùng cho lời mời, đếm ngược và lịch tháng
  date: '2027-03-07T17:30',

  cover: {
    hint: 'Chạm để mở thiệp',
    guestPrefix: 'Thân gửi', // hiện trên cửa thiệp khi link có ?to=
  },

  families: {
    trai: { label: 'Nhà trai', parents: ['Ông Nguyễn Văn An', 'Bà Phạm Thị Bình'] },
    gai: { label: 'Nhà gái', parents: ['Ông Trần Văn Hùng', 'Bà Lê Thị Hoa'] },
  },

  invitation: {
    kicker: 'Trân trọng kính mời',
    defaultGuest: 'Quý khách', // hiện khi link không có ?to=
    line: 'tới dự lễ thành hôn của gia đình chúng tôi',
    timeLabel: 'Được tổ chức vào lúc',
  },

  venue: {
    name: 'Trung tâm tiệc cưới Hoa Sen',
    address: '126 Lê Lợi, TP. Hưng Yên',
    map: 'https://maps.google.com/?q=Hung+Yen',
    mapHint: '(Bấm vào để xem bản đồ)',
  },

  // Ảnh cưới của mẫu này nằm trong xanh-pastel/assets/anh/ (ảnh dài nhất ~1600px, đã nén).
  photos: {
    hero: 'assets/anh/anh-03.jpg',   // ảnh lớn trên phần Countdown (ảnh dọc, khung 4:5)
    thanks: 'assets/anh/anh-05.jpg', // ảnh dưới phong bì quà mừng (ảnh ngang)
  },

  countdown: { title: 'Countdown', subtitle: 'To Our Big Day' },
  calendar: { title: 'Save The Date', weekStart: 'sun' }, // 'sun' = Chủ nhật đầu tuần, 'mon' = Thứ hai

  loveStory: {
    title: 'Love Story',
    paragraphs: [
      'Chúng mình gặp nhau vào một ngày rất đỗi bình thường, chẳng có gì đặc biệt — nhưng kể từ hôm ấy, mọi thứ bỗng trở nên dịu dàng hơn.',
      'Từ những tin nhắn hỏi han vụng về đến những buổi chiều đi dạo chẳng muốn về, chúng mình học cách yêu thương, sẻ chia và cùng nhau lớn lên.',
      'Và hôm nay, chúng mình quyết định nắm tay nhau bước sang một chương mới. Cảm ơn bạn đã là một phần trong câu chuyện ấy.',
    ],
    signature: 'With all our love,',
  },

  timeline: {
    title: 'Timeline',
    // icon: cheers (ly rượu), rings (nhẫn), music (nhạc), camera, heart, cake
    items: [
      { time: '17:30', label: 'Đón khách', icon: 'cheers' },
      { time: '18:00', label: 'Lễ thành hôn', icon: 'rings' },
      { time: '18:30', label: 'Khai tiệc', icon: 'music' },
      { time: '20:30', label: 'Chụp ảnh kỷ niệm', icon: 'camera' },
    ],
  },

  album: {
    title: 'The Album',
    photos: [
      // Thêm/bớt dòng tuỳ ý. Ảnh dọc hiển thị trọn khung; ảnh ngang được cắt phần giữa (xem lớn thì thấy đủ).
      'assets/anh/anh-01.jpg', 'assets/anh/anh-04.jpg', 'assets/anh/anh-02.jpg',
      'assets/anh/anh-03.jpg', 'assets/anh/anh-05.jpg',
    ],
  },

  rsvp: {
    title: 'Xác Nhận Tham Dự',
    text: 'Sự hiện diện của bạn là niềm vui của Cô Dâu và Chú Rể',
    yes: 'Vui mừng chấp nhận',
    no: 'Rất tiếc không thể tham dự',
    guestsLabel: 'Số lượng khách trong bữa tiệc của bạn',
    maxGuests: 10,
    // Câu hỏi thêm (để trống label nếu không cần), ví dụ hỏi món chay: 'Bạn có dùng món chay không?'
    extra: { label: 'Có trẻ em đi cùng bạn không?', options: ['Có', 'Không'] },
    button: 'Gửi phản hồi',
  },

  gift: {
    title: 'Gửi Quà Mừng',
    text: 'Quét mã QR để gửi quà mừng tới chúng mình nhé',
    // qr: ảnh QR từ app ngân hàng; hoặc để trống và điền bankId + number để tự tạo VietQR
    accounts: [
      { side: 'Chú rể', bankName: 'Vietcombank', bankId: 'VCB', number: '', holder: 'NGUYEN MINH KHANG', qr: '' },
      { side: 'Cô dâu', bankName: 'MB Bank', bankId: 'MB', number: '', holder: 'TRAN THAO VY', qr: '' },
    ],
  },

  thanks: {
    title: 'Thank you!',
    text: 'Cảm ơn bạn đã dành thời gian quý báu để chung vui cùng chúng mình. Sự hiện diện của bạn là món quà ý nghĩa nhất!',
  },

  wishes: {
    placeholder: 'Gửi lời chúc...',
    live: true, // lời chúc chạy ở góc dưới như livestream
    // Lời chúc mẫu: chỉ hiện khi CHƯA cài Google Sheets (endpoint để trống)
    samples: [
      { name: 'Anh Thắng và người thương', message: 'Chúc hai vợ chồng trăm năm hạnh phúc nhé!!!', time: '2027-02-08' },
      { name: 'Chị Đinh Hoa', message: 'Chúc hai em luôn hạnh phúc, sớm có tin vui nhaaa ❤️', time: '2027-02-06' },
      { name: 'Em Thanh Thuý', message: 'Đám cưới đẹp quá, chúc anh chị mãi yêu thương như hôm nay!', time: '2027-02-06' },
      { name: 'Bạn Đạt', message: 'Chúc hai bạn trăm năm hạnh phúc', time: '2027-02-06' },
      { name: 'Bạn Nam và người thương', message: 'Chúc mừng hai bạn! Mong sớm được dự đầy tháng 😄', time: '2027-02-05' },
    ],
  },

  // Dán link Google Apps Script (xem README) để lưu xác nhận, lời chúc và lượt thả tim vào Google Sheets.
  endpoint: '',

  // Nhạc nền (mp3). Để trống hoặc không có file thì nút nhạc tự ẩn.
  music: '../assets/nhac-nen.mp3',
};
