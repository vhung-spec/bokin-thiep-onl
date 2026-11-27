/*
 * KỊCH BẢN "SLIDE ẢNH KHUNG" — video slide Văn Hùng & Tuyết Anh theo phong cách slide ProShow mà hai bạn gửi:
 * nền sáng trắng – xám nhẹ ở viền, ảnh chính trong khung viền trắng có bóng đổ, trôi chậm và nghiêng nhẹ;
 * hai bên là bản nhỏ mờ của chính ảnh trôi ngược chiều; có cảnh dùng chính ảnh phóng to, mờ nhạt làm nền;
 * chuyển cảnh loá trắng, lật 3D, trượt ngang, hoà.
 *
 * Dài 3:42 theo bài Lễ Đường (68 BPM): mỗi ảnh 6 phách (~5,3 giây), chuyển cảnh 1,5 phách.
 * Mở đầu hiện từ màu trắng, cuối phim tan về màu trắng → chiếu lặp lại liền mạch.
 *
 *   node tools/video-slide/dung-kich-ban.mjs --kich-ban tools/video-slide/kich-ban/slide-anh-khung.mjs --anh <thư mục ảnh>
 */
const BPM = 68;
const PHASE = 0.815;
const BEAT = 60 / BPM;
export const T = (n) => Math.round((PHASE + n * BEAT) * 1000) / 1000;

const SET = (f) =>
  /^(IMG_200[678]|L1007339)/.test(f) ? 'A' : /^NAM0(7|8[0-3])/.test(f) ? 'B' : /^NAM/.test(f) ? 'C' : 'D';
const img = (f) => `${f}.jpg`;
// khung ảnh viền trắng
const F = (f, o = {}) => ({ kind: 'frame', img: img(f), set: SET(f), ...o });
// ảnh phủ kín (dùng làm nền mờ nhạt)
const P = (f, o = {}) => ({ img: img(f), set: SET(f), ...o });

// ---- Các kiểu cảnh (lặp vòng để đổi nhịp mà vẫn cùng một phong cách) ----
// 1. Ảnh chính trôi ngang, hai bản nhỏ mờ hai bên trôi ngược chiều
const carousel = (f, dir = 1) => [
  { kind: 'spot' },
  F(f, { h: 0.44, maxW: 0.36, at: [0.07, 0.47], blur: 2.5, opacity: 0.88, shadow: 'soft', drift: { dx: -0.07 * dir } }),
  F(f, { h: 0.44, maxW: 0.36, at: [0.93, 0.47], blur: 2.5, opacity: 0.88, shadow: 'soft', drift: { dx: -0.07 * dir } }),
  F(f, { h: 0.84, at: [0.5 - 0.02 * dir, 0.5], drift: { dx: 0.04 * dir }, rotate: [-1.6 * dir, 0.8 * dir], zoom: [1, 1.03] }),
];
// 2. Nền là chính ảnh phóng to, mờ nhạt trên nền trắng; ảnh chính trong khung ở giữa
const ghost = (f, focus = [0.5, 0.5]) => [
  { kind: 'white' },
  P(f, { fit: 'cover', focus, opacity: 0.3, filter: 'saturate(0.85) brightness(1.25)', zoom: [1.06, 1.16] }),
  F(f, { h: 0.84, at: [0.5, 0.5], zoom: [1, 1.04] }),
];
// 3. Ảnh nhỏ hơn, có bóng phản chiếu bên dưới
const reflect = (f, dir = 1) => [
  { kind: 'spot' },
  F(f, { h: 0.62, maxW: 0.62, at: [0.5 - 0.02 * dir, 0.4], reflect: true, drift: { dx: 0.04 * dir }, zoom: [1, 1.04] }),
];
// 4. Ảnh xoay nghiêng 3D chậm như đang lật về phía người xem
const tilt = (f, dir = 1) => [
  { kind: 'spot' },
  F(f, { h: 0.44, maxW: 0.36, at: [0.5 - 0.4 * dir, 0.47], blur: 2.5, opacity: 0.85, shadow: 'soft', drift: { dx: 0.05 * dir } }),
  F(f, { h: 0.82, at: [0.5 + 0.03 * dir, 0.5], rotY: [18 * dir, -5 * dir], drift: { dx: -0.05 * dir }, zoom: [0.98, 1.02] }),
];

const KIEU = [
  (f) => carousel(f, 1),
  (f, fo) => ghost(f, fo),
  (f) => tilt(f, 1),
  (f) => reflect(f, -1),
  (f) => carousel(f, -1),
  (f, fo) => ghost(f, fo),
  (f) => tilt(f, -1),
];
const CHUYEN = ['white', 'flip', 'dissolve', 'slide', 'white', 'dissolve', 'zoom'];

// 38 ảnh đẹp nhất, theo bối cảnh: studio → phố cổ → toà nhà cổ → Hạ Long (điểm nhìn cho nền mờ nhạt)
const ANH = [
  ['IMG_2006', [0.45, 0.4]], ['IMG_2007', [0.5, 0.5]], ['IMG_2008', [0.5, 0.4]], ['L1007339', [0.5, 0.3]],
  ['NAM07943', [0.5, 0.55]], ['NAM08332', [0.45, 0.45]], ['NAM08137', [0.48, 0.4]], ['NAM08138', [0.55, 0.4]],
  ['NAM07765', [0.55, 0.5]], ['NAM07834', [0.46, 0.3]], ['NAM08260', [0.5, 0.4]], ['NAM07870', [0.5, 0.35]],
  ['NAM00116', [0.48, 0.35]], ['NAM00160', [0.4, 0.3]], ['NAM00198', [0.4, 0.3]], ['NAM08841', [0.5, 0.5]],
  ['NAM08869', [0.55, 0.4]], ['NAM08892', [0.45, 0.5]], ['NAM09385', [0.45, 0.6]], ['NAM09416', [0.45, 0.45]],
  ['NAM09644', [0.5, 0.35]], ['NAM09621', [0.55, 0.4]], ['NAM09729', [0.55, 0.42]], ['NAM09196', [0.5, 0.35]],
  ['NAM09843', [0.5, 0.35]], ['NAM09628', [0.5, 0.35]],
  ['L1007701', [0.62, 0.6]], ['IMG_2047', [0.57, 0.35]], ['IMG_2001', [0.52, 0.5]], ['L1007506', [0.5, 0.42]],
  ['L1007501', [0.45, 0.36]], ['IMG_1998', [0.3, 0.6]], ['IMG_2045', [0.55, 0.45]], ['IMG_2046', [0.45, 0.45]],
  ['L1007649', [0.62, 0.55]], ['L1007520', [0.55, 0.4]], ['IMG_2050', [0.62, 0.55]], ['L1007796', [0.5, 0.42]],
];

export default function kichBan() {
  const shots = [];
  const at = (t, s) => shots.push({ at: t, ...s });
  const TR = 1.5 * BEAT;

  // Mở đầu: hiện từ trắng — khung ảnh hai người bên cửa kính, tên hai bạn hiện như đang viết
  at(0, {
    in: { type: 'from-white', d: 2.2 },
    dust: 0.35,
    layers: [
      { kind: 'spot' },
      F('NAM09672', { h: 0.62, maxW: 0.52, at: [0.33, 0.46], rotate: [-2.5, -0.5], drift: { dx: 0.02 }, reflect: true, zoom: [1, 1.03] }),
      { kind: 'deco', src: 'bia/dau-sap.webp', box: [0.715, 0.66, 0.045], appear: 5.0, stamp: 0.7 },
    ],
    texts: [
      { text: 'Văn Hùng & Tuyết Anh', font: 'script', size: 96, x: 0.74, y: 0.42, appear: 2.4, write: 2.4 },
      { text: 'Hà Nội · 28.11.2026', font: 'ui', size: 32, x: 0.74, y: 0.53, appear: 4.2, fade: 1.0, rise: 12, ls: 0.04 },
      { text: 'Hải Phòng · 29.11.2026', font: 'ui', size: 32, x: 0.74, y: 0.585, appear: 4.5, fade: 1.0, rise: 12, ls: 0.04 },
    ],
  });

  // 38 ảnh, mỗi ảnh 6 phách
  ANH.forEach(([f, fo], i) => {
    at(T(12 + 6 * i), { in: { type: CHUYEN[i % CHUYEN.length], d: TR }, layers: KIEU[i % KIEU.length](f, fo) });
  });

  // Lời cảm ơn, rồi tan về màu trắng để chiếu lặp lại liền mạch
  at(T(12 + 6 * ANH.length), {
    in: { type: 'white', d: 2 * BEAT },
    dust: 0.4,
    outWhite: 2.2,
    layers: [
      { kind: 'spot' },
      F('IMG_2044', { h: 0.62, maxW: 0.5, at: [0.3, 0.42], rotate: [2, 0.5], drift: { dx: -0.015 }, reflect: true, zoom: [1, 1.03] }),
      { kind: 'deco', src: 'bia/dau-sap.webp', box: [0.69, 0.64, 0.045], appear: 2.6, stamp: 0.7 },
    ],
    texts: [
      { text: 'Cảm ơn mọi người đã ở đây,', font: 'serif', size: 50, x: 0.715, y: 0.42, appear: 0.9, fade: 1.2, rise: 12 },
      { text: 'cùng hai đứa trong ngày hôm nay.', font: 'serif', size: 50, x: 0.715, y: 0.42 + 64 / 1080, appear: 1.3, fade: 1.2, rise: 12 },
      { text: 'Văn Hùng & Tuyết Anh', font: 'script', size: 64, x: 0.715, y: 0.585, appear: 1.9, fade: 1.2 },
    ],
  });

  return {
    ten: 'Van_Hung_Tuyet_Anh_Slide',
    nhac: 'xanh-pastel/assets/nhac/le-duong-dreamland-version-kai-dinh-official-mv.mp3',
    total: 222.35,
    ink: '#2D3826',
    shots,
  };
}
