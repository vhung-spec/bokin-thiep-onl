/*
 * ============================================================
 *  THIỆP CƯỚI VĂN HÙNG & TUYẾT ANH — chỉ cần sửa file này
 * ============================================================
 *  • Giữ nguyên dấu nháy '...' và dấu phẩy cuối mỗi dòng.
 *  • Ngày giờ viết dạng 'năm-tháng-ngàyTgiờ:phút' theo GIỜ VIỆT NAM.
 *    Đếm ngược luôn tính đến đúng giờ Việt Nam, dù khách mở thiệp ở múi giờ khác.
 *  • Thứ trong tuần và ngày âm lịch được tính tự động.
 *  • Mời riêng từng khách: thêm ?to=Tên vào link, ví dụ  .../xanh-pastel/?to=Anh%20Thắng
 *  • Bản nhà trai (giờ, địa điểm khác): mục sides.trai ở dưới, mở bằng link .../nha-trai/
 *  • Bản người nhà (nhà trai): mục editions['nguoi-nha'] ở dưới, mở bằng link .../nguoi-nha/
 */
window.WEDDING = {
  groom: { name: 'Văn Hùng' },
  bride: { name: 'Tuyết Anh' },

  date: '2026-11-28T10:30',
  timezoneOffset: 7, // giờ Việt Nam (UTC+7)

  cover: {
    hint: 'Chạm để mở thiệp',
    guestPrefix: 'Thân gửi', // hiện trên bìa khi link có ?to=
    // ẢNH BÌA CỦA CHỦ THIỆP (thư mục xanh-pastel/assets/bia/). Để trống cả 4 dòng thì dùng giấy + dấu sáp tự vẽ.
    paper: 'assets/bia/bia.jpg',          // bìa 2 cánh, đã xoá dấu sáp; đường gáp nằm đúng giữa ảnh
    seal: 'assets/bia/dau-sap.webp',      // dấu sáp tách riêng, nền trong suốt; nhấc lên khi mở
    sealAt: { x: 0.4829, y: 0.4746, w: 0.4839 }, // vị trí dấu sáp trên ảnh bìa: tâm (x, y) và bề rộng, theo tỉ lệ ảnh
    page: 'assets/bia/trang-dau.jpg',     // trang trong có khung và hoa: nền đầu thiệp (sau khi mở bìa) và trang cảm ơn cuối thiệp
    cream: 'assets/bia/giay-kem.jpg',     // giấy kem lấy từ lòng khung của trang trong: nền các phần ở giữa
    creamColor: '#E1D3C2',                // màu trung bình của giấy kem (mép giấy xé dùng màu này)
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

  // BẢN CHÍNH (khách nhà gái và khách không ghi bên): ngày giờ ở dòng date phía trên, địa điểm dưới đây
  venue: {
    name: 'Nhà văn hoá Tổ 1 Ngọc Trục',
    address: 'P. Ngọc Trục, làng Ngọc Trục, Đại Mỗ, Hà Nội',
    // Liên kết Google Maps có sẵn của địa điểm (mã vị trí XQRF+254)
    map: 'https://www.google.com/maps?q=XQRF%2B254+Nh%C3%A0+V%C4%83n+Ho%C3%A1+T%E1%BB%95+1+Ng%E1%BB%8Dc+Tr%E1%BB%A5c,+P.+Ng%E1%BB%8Dc+Tr%E1%BB%A5c,+l%C3%A0ng+Ng%E1%BB%8Dc+Tr%E1%BB%A5c,+%C4%90%E1%BA%A1i+M%E1%BB%97,+H%C3%A0+N%E1%BB%99i&ftid=0x3134530024c79431:0x28d0367215a69c81',
    mapButton: 'Xem đường đi',
  },

  // BẢN NHÀ TRAI: khách ghi "Khách nhà trai" ở trang tạo link nhận link .../nha-trai/?to=Tên (thiệp có ?ben=trai).
  // Chỉ ghi những gì khác bản chính; mục nào không ghi (lịch trình, lời mời, ảnh…) thì giống bản chính.
  // Ngày âm lịch, thứ, đếm ngược, lịch tháng tự tính theo date ở đây.
  // Đổi ngày / địa điểm thì sửa thêm lời xem trước trong nha-trai/index.html (ảnh xem trước: assets/og-image-nha-trai.jpg).
  sides: {
    trai: {
      date: '2026-11-29T10:30',
      venue: {
        name: 'Tổ hợp Thể thao Vũ Tuấn Mobile',
        address: 'Lôi Xá, Tuệ Tĩnh, Hải Phòng',
        // Liên kết Google Maps của địa điểm (mã vị trí X75F+7P9)
        map: 'https://www.google.com/maps?q=X75F%2B7P9+T%E1%BB%95+H%E1%BB%A3p+Th%E1%BB%83+Thao+V%C5%A9+Tu%E1%BA%A5n+Mobile,+L%C3%B4i+X%C3%A1,+Tu%E1%BB%87+T%C4%A9nh,+H%E1%BA%A3i+Ph%C3%B2ng&ftid=0x31359b00692b93bf:0xe8a5adadd48780c9',
      },
    },
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

  // CÁC BẢN RIÊNG cho từng nhóm khách. Link có &ban=<tên bản> (trang tạo link tự gắn) lấy bản của bên (side)
  // rồi đổi thêm các mục ghi trong bản. Lịch trình có date thì hiện thứ, ngày trên mỗi mốc và đánh dấu các ngày trên lịch tháng.
  editions: {
    'nguoi-nha': {
      label: 'Người nhà (nhà trai)', // tên hiện ở trang tạo link
      side: 'trai',                  // lấy ngày chính (29/11 10:30), địa điểm, ảnh xem trước của bản nhà trai
      invitation: { line: 'tới ăn cỗ và chung vui cùng gia đình chúng tôi' },
      timeline: {
        items: [
          { date: '2026-11-28', time: '10:00', label: 'Ăn cỗ bác rạp', icon: 'cheers' },
          { date: '2026-11-28', time: '15:00', label: 'Bữa cơm chiều', icon: 'heart' },
          { date: '2026-11-29', time: '10:30', label: 'Cỗ cưới', icon: 'rings' },
        ],
      },
    },
  },

  // ĐỊA CHỈ THIỆP dùng trong link mời riêng (trang tao-link.html).
  // Để trống: tự lấy theo địa chỉ đang mở (github.io bây giờ, tên miền riêng khi gắn sau), trang gốc mở thẳng thiệp.
  shareUrl: '',

  // NƠI LƯU FILE NHẠC tải lên từ trang tao-link.html: repo GitHub và nhánh đang chạy GitHub Pages
  github: { repo: 'vhung-spec/bokin-thiep-onl', branch: 'claude/modest-maxwell-l2dq6l', musicDir: 'xanh-pastel/assets/nhac' },

  // NƠI NHẬN PHẢN HỒI: dán link ứng dụng web Google Apps Script vào đây (xem README, mục "Lưu phản hồi").
  // Để trống thì nút "Gửi phản hồi" sẽ báo chưa lưu được, không bao giờ báo thành công giả.
  endpoint: 'https://script.google.com/macros/s/AKfycbybLT0UEiIFTD7yIhHO_GE2XXiOX1HM-qDn9kD85w42AX1pDy20sx2r2SaamsPGvvCo/exec',

  // NHẠC NỀN MẶC ĐỊNH, phát khi khách chạm mở thiệp. Nhận:
  //   • link YouTube, ví dụ  music: 'https://www.youtube.com/watch?v=xxxxxxxxxxx',  (thêm &t=30 để bắt đầu từ giây 30)
  //   • file nhạc chép vào xanh-pastel/assets/nhac/, ví dụ  music: 'assets/nhac/bai-hat.mp3',
  // Để trống thì không có nhạc. Trang tao-link.html có thể chọn nhạc khác và gắn vào từng link mời.
  music: 'assets/nhac/le-duong-dreamland-version-kai-dinh-official-mv.mp3',
};
