/*
 * ============================================================
 *  VIDEO SLIDE ẢNH CƯỚI — chỉ cần sửa file này
 * ============================================================
 *  Đường dẫn tính từ thư mục gốc repo. Giữ nguyên dấu nháy '...' và dấu phẩy cuối dòng.
 *  Chạy:  node tools/video-slide/lam-video.mjs          (xem README.md cùng thư mục)
 */
export default {
  // THƯ MỤC ẢNH. Ảnh xếp theo tên file (anh-2 trước anh-10): đặt tên 01.jpg, 02.jpg… để định thứ tự.
  // Nhận jpg, png, webp (heic của iPhone nếu cài thêm: pip install pillow-heif).
  anh: 'tools/video-slide/anh',
  anhThu: 'xanh-pastel/assets/anh', // thư mục trên chưa có ảnh thì dựng thử bằng 8 ảnh của thiệp
  sapXep: 'ten', // 'ten' = theo tên file, 'ngay-chup' = theo ngày chụp trong ảnh
  // Hoặc ghi hẳn thứ tự (ảnh không ghi thì xếp sau). Dấu '|' chia nhóm: hai ảnh dọc cùng nhóm thành một cảnh,
  // ảnh đứng một mình trong nhóm thành cảnh 1 ảnh + chữ. Ví dụ: ['a.jpg', 'b.jpg', '|', 'c.jpg', '|', 'd.jpg', 'e.jpg']
  thuTu: [],

  // KHUNG HÌNH: '16:9' cho TV, máy chiếu, YouTube · '9:16' cho điện thoại, TikTok, Reels
  khung: '16:9',
  fps: 30,

  // NHẠC NỀN: một bài, hoặc nhiều bài nối nhau ['bai-1.mp3', 'bai-2.mp3'] khi có nhiều ảnh.
  nhac: 'xanh-pastel/assets/nhac/le-duong-dreamland-version-kai-dinh-official-mv.mp3',
  nhacBatDau: 0, // bắt đầu bài đầu tiên từ giây thứ…

  // THỜI GIAN
  giayMoiCanh: 5,    // số giây cho một cảnh (cảnh 2 ảnh dài hơn 1,3 lần)
  vuaBaiNhac: true,  // true: tự giãn mỗi cảnh (3,5 – 8 giây) để video dài vừa bài nhạc
  giayChuyenCanh: 1.2,

  // MỞ ĐẦU — tấm thiệp có khung hoa
  moDau: {
    tren: 'Lễ Thành Hôn',
    ten1: 'Văn Hùng',
    ten2: 'Tuyết Anh',
    ngay: '28 · 11 · 2026',
  },

  // KẾT THÚC
  ketThuc: {
    tieuDe: 'Thank you!',
    loi: 'Cảm ơn quý khách đã đến chung vui cùng gia đình chúng tôi',
  },

  // CHỮ VIẾT TAY CẠNH ẢNH. Ảnh dọc đứng riêng (không ghép đôi) lấy lần lượt các câu dưới đây.
  loiCanhAnh: ['Forever & Always', 'Our Love Story', 'Together', 'Just Married', 'Love You Always'],
  // Muốn ghi riêng cho ảnh nào thì thêm 'tên file': 'lời'. Ảnh có lời riêng luôn đứng riêng.
  chuThich: {
    // 'anh-03.jpg': 'Ngày anh nâng khăn voan',
  },
  ghepDoi: true, // ghép 2 ảnh dọc liền nhau thành một cảnh (khung 9:16: ghép 2 ảnh ngang)

  // NƠI LƯU VIDEO (thư mục ra/ không đưa lên GitHub vì file nặng)
  ra: 'tools/video-slide/ra/video-cuoi.mp4',
};
