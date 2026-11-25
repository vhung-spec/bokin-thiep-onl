/*
 * BẢN ĐẦU TIÊN — video slide Văn Hùng & Tuyết Anh trên nền giấy xô thơm (mẫu tự chia cảnh, lam-video.mjs):
 * ảnh in viền giấy ngà, ghép đôi ảnh dọc cùng bối cảnh, chữ viết tay cạnh ảnh lẻ; studio → phố cổ → toà nhà cổ → Hạ Long.
 * Ảnh cưới không có trong repo: chép 56 ảnh vào tools/video-slide/anh/ (hoặc thêm --anh <thư mục>) rồi chạy
 *   node tools/video-slide/lam-video.mjs --cau-hinh tools/video-slide/cau-hinh-ban-dau-tien.mjs
 * Bản đã xuất lần đầu dùng ảnh thu nhỏ cạnh dài 3000 px.
 */
import base from './cau-hinh.mjs';

export default {
  ...base,
  anh: 'tools/video-slide/anh',
  anhThu: '',
  thuTu: ['IMG_2006.jpg', 'IMG_2007.jpg', '|', 'IMG_2008.jpg', 'L1007339.jpg', '|', 'NAM07943.jpg', 'NAM08137.jpg', '|', 'NAM07834.jpg', 'NAM07870.jpg', '|', 'NAM08138.jpg', '|', 'NAM08260.jpg', 'NAM08284.jpg', '|', 'NAM07765.jpg', 'NAM08332.jpg', '|', 'NAM00116.jpg', 'NAM00160.jpg', '|', 'NAM00137.jpg', 'NAM00170.jpg', '|', 'NAM00198.jpg', '|', 'NAM08579.jpg', 'NAM08818.jpg', '|', 'NAM08841.jpg', 'NAM08869.jpg', '|', 'NAM08879.jpg', '|', 'NAM09644.jpg', '|', 'NAM09385.jpg', 'NAM09152.jpg', '|', 'NAM08892.jpg', '|', 'NAM09416.jpg', '|', 'NAM09441.jpg', '|', 'NAM09196.jpg', 'NAM09843.jpg', '|', 'NAM09628.jpg', '|', 'NAM09621.jpg', 'NAM09709.jpg', '|', 'NAM09729.jpg', '|', 'NAM09672.jpg', '|', 'IMG_1998.jpg', '|', 'IMG_2001.jpg', '|', 'IMG_2043.jpg', 'IMG_2044.jpg', '|', 'IMG_2045.jpg', 'IMG_2046.jpg', '|', 'IMG_2047.jpg', '|', 'L1007522.jpg', '|', 'IMG_2048.jpg', 'L1007649.jpg', '|', 'L1007501.jpg', 'L1007503.jpg', '|', 'L1007537.jpg', '|', 'L1007506.jpg', 'L1007520.jpg', '|', 'L1007573.jpg', 'IMG_2049.jpg', '|', 'L1007701.jpg', '|', 'IMG_2050.jpg', '|', 'L1007796.jpg'],
  loiCanhAnh: ['Forever & Always', 'Our Love Story', 'You & Me', 'Together', 'Just Married', 'Happily Ever After', 'Love You Always', 'Two Hearts, One Love'],
  chuThich: { 'L1007796.jpg': 'Hand in Hand' },
  ra: 'tools/video-slide/ra/Van_Hung_Tuyet_Anh_Ban_Dau_Tien_16x9.mp4',
};
