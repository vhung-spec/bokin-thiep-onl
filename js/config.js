/*
 * ============================================================
 *  THÔNG TIN THIỆP CƯỚI — chỉ cần sửa file này
 * ============================================================
 *  • Giữ nguyên dấu nháy '...' và dấu phẩy cuối mỗi dòng.
 *  • Ngày giờ viết dạng 'năm-tháng-ngàyTgiờ:phút', ví dụ '2027-03-07T07:00'.
 *  • Ngày âm lịch và thứ trong tuần được tính tự động.
 *  • Ảnh: thay các file trong thư mục assets/anh bằng ảnh của bạn (giữ nguyên tên file),
 *    hoặc sửa đường dẫn bên dưới.
 *  • Mời riêng: thêm ?to=Tên vào link. Thêm &nha=trai để mở sẵn tab nhà trai.
 *      ví dụ  .../?to=Anh%20Thắng%20và%20người%20thương&nha=trai
 */
window.WEDDING = {
  groom: {
    name: 'Minh Khang',      // tên đầy đủ hiển thị
    short: 'Khang',          // tên gọi ngắn (chú thích ảnh, chữ lồng)
    photo: 'assets/anh/chu-re.jpg',
  },
  bride: {
    name: 'Thảo Vy',
    short: 'Vy',
    photo: 'assets/anh/co-dau.jpg',
  },

  // Ngày chính: dùng cho lịch tháng, đếm ngược và bìa thiệp
  date: '2027-03-07T10:00',

  intro: {
    tap: 'Nhấp để mở',
    label: 'Thiệp Mời',
    photo: 'assets/anh/bia.jpg',
    saveTheDate: 'Save our date!',
    tagline: 'We can’t wait to celebrate with you',
    photos: ['assets/anh/bia.jpg', 'assets/anh/bia-2.jpg'], // 2 ảnh bay ra từ phong bì
  },

  calendar: {
    photo: 'assets/anh/lich.jpg',
    countdownLabel: 'Happily ever after starts in...',
  },

  mainPhoto: 'assets/anh/chinh.jpg',

  invitation: {
    kicker: 'Trân trọng thân mời',
    defaultGuest: 'Quý vị & Gia đình', // hiện khi link không có ?to=
    line: 'Đến chung vui trong lễ cưới của chúng tôi',
  },

  // Hai bên gia đình và các lễ. Có thể thêm/bớt lễ trong mảng events.
  families: {
    gai: {
      label: 'Nhà gái',
      parents: ['Ông Trần Văn Hùng', 'Bà Lê Thị Hoa'],
      events: [
        {
          title: 'Lễ Vu Quy',
          time: '2027-03-07T07:00',
          place: 'Tư gia nhà gái',
          address: 'Số 22, đường Hoa Sữa, TP. Hưng Yên',
          map: 'https://maps.google.com/?q=Hung+Yen',
        },
        {
          title: 'Tiệc Cưới',
          time: '2027-03-06T17:00',
          place: 'Tư gia nhà gái',
          address: 'Số 22, đường Hoa Sữa, TP. Hưng Yên',
          map: 'https://maps.google.com/?q=Hung+Yen',
        },
      ],
    },
    trai: {
      label: 'Nhà trai',
      parents: ['Ông Nguyễn Văn An', 'Bà Phạm Thị Bình'],
      events: [
        {
          title: 'Lễ Thành Hôn',
          time: '2027-03-07T10:00',
          place: 'Tư gia nhà trai',
          address: 'Ngõ 56, phố Hoa Mai, Hà Nội',
          map: 'https://maps.google.com/?q=Ha+Noi',
        },
        {
          title: 'Tiệc Cưới',
          time: '2027-03-06T18:00',
          place: 'Tư gia nhà trai',
          address: 'Ngõ 56, phố Hoa Mai, Hà Nội',
          map: 'https://maps.google.com/?q=Ha+Noi',
        },
      ],
    },
  },
  firstTab: 'gai', // tab mở sẵn: 'gai' hoặc 'trai'

  schedule: {
    title: 'Lịch Trình',
    items: [
      { time: '05:00', label: 'Xuất phát từ nhà trai' },
      { time: '07:00', label: 'Đến nhà cô dâu' },
      { time: '07:50', label: 'Bắt đầu về nhà trai' },
      { time: '10:00', label: 'Lễ thành hôn' },
      { time: '11:00', label: 'Chụp ảnh kỷ niệm' },
      { time: '11:30', label: 'Dự tiệc' },
    ],
  },

  dressCode: {
    title: 'Dress code',
    colors: ['#FFFFFF', '#E6D3CF', '#7D1630'],
  },

  album: {
    title: 'Album Hình Cưới',
    text: 'Những khung hình nhỏ giữ lại hành trình của chúng tôi — từ ánh mắt đầu tiên đến ngày cùng nhau về chung một nhà. Mời bạn lật từng trang và cùng chúng tôi cất giữ những khoảnh khắc thật bình yên này.',
    photos: [
      'assets/anh/album-01.jpg', 'assets/anh/album-02.jpg',
      'assets/anh/album-03.jpg', 'assets/anh/album-04.jpg',
      'assets/anh/album-05.jpg', 'assets/anh/album-06.jpg',
      'assets/anh/album-07.jpg', 'assets/anh/album-08.jpg',
    ],
  },

  rsvp: {
    title: 'Xác Nhận Tham Dự',
    text: 'Sự có mặt của quý khách là niềm vui lớn của gia đình chúng tôi. Xin dành chút thời gian xác nhận để chúng tôi chuẩn bị đón tiếp thật chu đáo. Trân trọng!',
    maxGuests: 10,
  },

  guestbook: {
    title: 'Sổ Lưu Bút',
    text: 'Một chữ ký, vài dòng thương mến — trang sổ này sẽ theo chúng tôi suốt chặng đường phía trước. Cảm ơn bạn đã ghé qua và để lại dấu yêu.',
    photo: 'assets/anh/luu-but.jpg',
    pageSize: 5,
    // Lời chúc mẫu: chỉ hiện khi CHƯA cài Google Sheets (endpoint để trống)
    samples: [
      { name: 'Anh Thắng và người thương', message: 'Chúc hai vợ chồng trăm năm hạnh phúc nhé!!!', time: '2027-02-08' },
      { name: 'Chị Đinh Hoa', message: 'Chúc hai em luôn hạnh phúc nhaaaa, là một người chứng kiến chuyện tình của hai đứa từ những ngày đầu — rất mong khi hai đứa bước vào hôn nhân sẽ cùng đồng hành, sẻ chia và có những phút giây trọn vẹn nhé ❤️', time: '2027-02-06' },
      { name: 'Em Thanh Thuý', message: 'Chúc anh chị luôn hạnh phúc và bình yên trên hành trình hôn nhân mới. Mong rằng mỗi ngày bên nhau sẽ đều ngập tràn yêu thương, thấu hiểu và thật nhiều kỷ niệm đẹp.', time: '2027-02-06' },
      { name: 'Bạn Đạt', message: 'Chúc hai bạn trăm năm hạnh phúc', time: '2027-02-06' },
      { name: 'Bạn Nam và người thương', message: 'Chúc 2 bạn trăm năm hạnh phúc ❤️', time: '2027-02-05' },
      { name: 'Cô Lan', message: 'Chúc hai cháu sớm có tin vui, gia đình luôn đầm ấm.', time: '2027-02-04' },
    ],
  },

  gift: {
    text: 'Nếu muốn gửi chút quà mừng, mã QR của hai nhà đã được chuẩn bị sẵn cho bạn.',
    button: 'Gửi quà mừng cưới',
    // qr: đường dẫn ảnh QR (tải từ app ngân hàng). Để trống thì tự tạo mã VietQR
    //     từ bankId + number (bankId: mã ngân hàng, vd 'VCB', 'MB', 'TCB', 'ACB', 'BIDV', 'ICB').
    accounts: [
      { side: 'Nhà trai', bankName: 'Vietcombank', bankId: 'VCB', number: '', holder: 'NGUYEN MINH KHANG', qr: '' },
      { side: 'Nhà gái', bankName: 'MB Bank', bankId: 'MB', number: '', holder: 'TRAN THAO VY', qr: '' },
    ],
  },

  bigDay: {
    title: 'See you on our big day!',
  },

  thanks: {
    photo: 'assets/anh/cam-on.jpg',
    title: 'Lời cảm ơn!',
    text: 'Cảm ơn bạn đã dành tình cảm cho chúng mình! Sự hiện diện của bạn là món quà quý giá nhất, khiến ngày trọng đại của chúng mình thêm trọn vẹn và đáng nhớ.',
  },

  // Dán link Google Apps Script (xem README) để lưu xác nhận tham dự & lời chúc vào Google Sheets.
  // Để trống: thiệp chạy ở chế độ xem thử, không gửi dữ liệu đi đâu.
  endpoint: '',

  // Nhạc nền (mp3). Để trống hoặc không có file thì nút nhạc tự ẩn.
  music: 'assets/nhac-nen.mp3',
};
