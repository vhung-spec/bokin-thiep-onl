/*
 * KỊCH BẢN "QUA NHỮNG Ô CỬA" — video chiếu tiệc 16:9 của Văn Hùng & Tuyết Anh
 *
 * Nhạc: Lễ Đường (Dreamland version) – Kai Đinh, 68 BPM. Phách thứ n rơi vào giây T(n) = 0,815 + n × 60/68
 * (đo từ file mp3: nhạc nền vào 0:31,7; lấy hơi 1:14,4; đoạn lắng 1:48,5; dồn lên 2:06,1; điệp khúc cuối 2:30,8).
 *
 * Mỗi cảnh: at (giây bắt đầu), in (chuyển cảnh vào: dissolve · leak · wipe · arch · zoom · bloom · black, d giây),
 * layers (ảnh, giấy, dải giấy xô thơm, dấu sáp…), texts (chữ), dust (bụi sáng vàng 0..1), bg (nền cảnh).
 * Lớp ảnh: fit 'cover' (phủ kín) / 'height' (cao bằng khung; size < 1 để chừa viền) · blurBg (nền mờ từ chính ảnh)
 *   focus/to (điểm nhìn trong ảnh / vị trí trên khung) · tilt {from, to} (lia dọc) · zoom [từ, đến] · pan {dx}
 *   box [x, y, w, h] + enter {at, from} cho dải nhiều ảnh xuất hiện lần lượt.
 */
const BPM = 68;
const PHASE = 0.815;
export const T = (n) => Math.round((PHASE + (n * 60) / BPM) * 1000) / 1000;

const INK = '#2D3826';
const WARM_DARK = '#1A1611';

const SET = (f) =>
  /^(IMG_200[678]|L1007339)/.test(f) ? 'A' : /^NAM0(7|8[0-3])/.test(f) ? 'B' : /^NAM/.test(f) ? 'C' : 'D';
const P = (img, o = {}) => ({ img: `${img}.jpg`, set: SET(img), ...o });
const PUSH = [1, 1.035];
const tr = (type, d, at) => ({ type, d, ...(at ? { at } : {}) });

// Dải nhiều ảnh dọc lấp kín khung, khe 10 px; từng ảnh vào lần lượt theo phách
const GUT = 10 / 1920;
function strip(items, times, from = 'up') {
  const n = items.length;
  const w = (1 - GUT * (n - 1)) / n;
  return items.map(([img, focus], i) => P(img, { box: [i * (w + GUT), 0, w, 1], fit: 'cover', focus, enter: { at: times[i] ?? 0, d: 1.1, from } }));
}
const B4 = T(4) - T(0); // 4 phách ≈ 3,53 giây

export default function kichBan() {
  const shots = [];
  const at = (t, s) => shots.push({ at: t, ...s });

  // 0:00 · Mở đầu: hiện từ tối vào vòm kính toàn màn hình, máy lia chậm từ đèn chùm xuống hai người, bụi sáng lơ lửng
  at(0, {
    in: tr('black', 1.4),
    dust: 0.9,
    layers: [P('NAM09385', { fit: 'cover', focus: [0.45, 0.2], tilt: { from: 0.17, to: 0.8, ease: 'inout', until: 10.2 } })],
  });

  // 0:09,4 · Tiến vào ô cửa sáng sau lưng hai người → loá sáng → thiệp tên trên giấy ngà
  at(9.4, {
    in: tr('bloom', 1.4, [0.45, 0.32]),
    dust: 0.8,
    layers: [
      { kind: 'paper' },
      { kind: 'sage', box: [0, 0, 0.12, 1], enter: { at: 1.0, d: 1.2, from: 'left', dist: 230 } },
      { kind: 'deco', src: 'canh-la-vang.webp', box: [0.8, 0.58, 0.22], rotate: -28, opacity: 0.35, blend: 'multiply', appear: 2.2, fade: 1.6, grow: 2.0 },
      { kind: 'deco', src: 'bia/dau-sap.webp', box: [0.226, 0.635, 0.046], appear: 4.1, stamp: 0.7 },
    ],
    texts: [
      { text: 'Văn Hùng & Tuyết Anh', font: 'script', size: 112, x: 0.222, y: 0.42, align: 'left', appear: 1.5, write: 2.2 },
      { text: 'Hà Nội · 28.11.2026     /     Hải Phòng · 29.11.2026', font: 'ui', size: 34, x: 0.227, y: 0.555, align: 'left', appear: 3.3, fade: 1.0, rise: 14, ls: 0.04 },
    ],
  });

  // 0:16,2 · A · Studio — ô cửa vòm mở ra từ tấm thiệp (chương 1)
  at(16.18, { in: tr('arch', 1.5, [0.5, 0.56]), layers: [P('IMG_2006', { feather: 0.06, focus: [0.45, 0.3], zoom: PUSH })] });
  at(T(24), { in: tr('dissolve', 1.0), bg: 'paper', layers: strip([['IMG_2007', [0.5, 0.5]], ['IMG_2008', [0.5, 0.4]], ['L1007339', [0.52, 0.3]]], [0, 1.76, 3.53]) });

  // 0:31,7 · B · Hà Nội — ô cửa mở đúng lúc nhạc nền vào; lia từ biển "Hiệu thuốc Hoà Hưng" xuống hai người
  at(T(35), {
    in: tr('arch', 1.5, [0.5, 0.5]),
    layers: [P('NAM08332', { fit: 'cover', focus: [0.5, 0.2], tilt: { from: 0.12, to: 0.6, ease: 'inout' } })],
    texts: [{ text: 'Một ngày ở Hà Nội', font: 'serif-italic', size: 56, x: 0.175, y: 0.5, color: '#F6F0E4', shadow: true, appear: 1.4, fade: 1.2, rise: 10, out: 5.2 }],
  });
  // sân đình đầy nắng, khung vào hai người
  at(T(43), { in: tr('dissolve', 1.1), layers: [P('NAM07943', { fit: 'cover', focus: [0.5, 0.56], zoom: PUSH })] });
  // chiếc ô giấy: cô dâu đứng một mình giữa khung → trượt sang trái, ô bên cạnh trượt vào: chú rể che ô cho cô
  const half = (1 - GUT) / 2;
  at(T(51), {
    in: tr('wipe', 1.1),
    bg: 'paper',
    layers: [
      P('NAM08137', { box: [0, 0, half, 1], fit: 'cover', focus: [0.48, 0.3], slide: { at: B4, d: 1.5, from: (1 - half) / 2 } }),
      P('NAM08138', { box: [1 - half, 0, half, 1], fit: 'cover', focus: [0.5, 0.3], enter: { at: B4 + 0.3, d: 1.5, from: 'right', dist: 160 } }),
    ],
  });
  at(T(67), {
    in: tr('wipe', 1.1),
    bg: 'paper',
    layers: strip([['NAM07765', [0.55, 0.5]], ['NAM07834', [0.46, 0.3]], ['NAM08260', [0.5, 0.4]]], [0, B4 / 2, B4]),
  });

  // 1:14,35 · C · Lấy hơi: cô dâu ngoái lại trong toà nhà cổ (hoà kèm vệt sáng ấm)
  at(74.35, { in: tr('leak', 1.5), layers: [P('NAM00198', { fit: 'cover', focus: [0.4, 0.05], zoom: PUSH })] }); // cắt ngang: gương mặt, vai váy, khoảng trống theo hướng nhìn

  // 1:20,2 · C · Cầu thang: chú rể cúi xuống → cô dâu cười → hôn nhau, ba ảnh vào lần lượt, cách nhau 2 phách
  at(T(90), { in: tr('dissolve', 1.0), bg: WARM_DARK, layers: strip([['NAM08841', [0.5, 0.5]], ['NAM08869', [0.55, 0.4]], ['NAM08892', [0.45, 0.5]]], [0, B4 / 2, B4]) });

  // 1:30,8 · C · Ra vùng sáng: nắm tay ngược sáng → vòm kính lần hai, lia ngược từ hai người lên vòm
  at(T(102), { in: tr('leak', 1.3), layers: [P('NAM09416', { fit: 'cover', focus: [0.45, 0.45], zoom: PUSH })] });
  at(T(108), { in: tr('dissolve', 1.3), dust: 0.6, layers: [P('NAM09385', { fit: 'cover', focus: [0.45, 0.5], tilt: { from: 0.8, to: 0.22, ease: 'inout' } })] });

  // 1:48,5 · C · Đoạn lắng: hai chân dung nhìn về nhau (cô dâu trượt vào sau 4 phách) → mặt đối mặt bên cửa kính
  at(T(122), {
    in: tr('dissolve', 1.3),
    bg: WARM_DARK,
    layers: [
      P('NAM00116', { box: [0, 0, half, 1], fit: 'cover', focus: [0.48, 0.3] }),
      P('NAM00160', { box: [1 - half, 0, half, 1], fit: 'cover', focus: [0.4, 0.3], enter: { at: B4, d: 1.3, from: 'right', dist: 90 } }),
    ],
  });
  at(T(134), { in: tr('wipe', 1.2), layers: [P('NAM09644', { fit: 'cover', focus: [0.5, 0.3], zoom: PUSH })] });

  // 2:06,1 · C · Nhạc dồn lên: điệu nhảy (phóng nhẹ xuyên cảnh) → bế xoay, voan bay
  at(T(142), { in: tr('zoom', 0.9), layers: [P('NAM09621', { fit: 'cover', focus: [0.55, 0.38], zoom: PUSH })] });
  at(T(150), { in: tr('dissolve', 0.8), layers: [P('NAM09729', { fit: 'cover', focus: [0.55, 0.42] })] }); // cắt ngang: bế xoay, voan bay

  // 2:16,7 · C → D · Từ tấm voan trong nhà sang tấm voan trên vách đá Hạ Long, nối bằng vệt sáng
  at(T(154), { in: tr('leak', 1.1), layers: [P('L1007649', { fit: 'cover', focus: [0.62, 0.55], zoom: PUSH })] });

  // 2:23,8 · D · Khe đá như khung cửa tự nhiên — lia xuống hai người đứng trong khe
  at(T(162), { in: tr('dissolve', 1.0), layers: [P('L1007701', { fit: 'cover', focus: [0.62, 0.5], tilt: { from: 0.33, to: 0.69, ease: 'inout', until: T(170) - T(162) } })] });

  // 2:30,8 · D · Điệp khúc cuối: ô cửa mở từ khe đá ra toàn vịnh, giữ ~10,6 giây, tiến rất chậm về phía hai người
  at(T(170), { in: tr('arch', 1.6, [0.58, 0.48]), layers: [P('IMG_2047', { fit: 'cover', focus: [0.57, 0.33], to: [0.57, 0.42], zoom: PUSH })] });

  // 2:41,4 · D · Góc rộng bên vịnh → cặp ảnh nâng voan | hôn dưới voan → nụ hôn bên vịnh → bãi cát
  at(T(182), { in: tr('dissolve', 1.3), layers: [P('IMG_2001', { fit: 'cover', focus: [0.52, 0.48], zoom: PUSH })] });
  at(T(190), {
    in: tr('wipe', 1.1),
    bg: '#151A14',
    layers: [
      P('L1007506', { box: [0, 0, half, 1], fit: 'cover', focus: [0.5, 0.42] }),
      P('L1007501', { box: [1 - half, 0, half, 1], fit: 'cover', focus: [0.45, 0.36], enter: { at: 1.0, d: 1.4, from: 'right', dist: 110 } }),
    ],
  });
  at(T(202), { in: tr('dissolve', 1.3), layers: [P('IMG_1998', { fit: 'cover', focus: [0.3, 0.6], zoom: PUSH })] });
  at(T(206), { in: tr('dissolve', 1.3), layers: [P('IMG_2050', { fit: 'cover', focus: [0.62, 0.55], to: [0.634, 0.55], scale: 1.03, pan: { dx: 0.02 } })] });

  // 3:09,6 · Hồi tưởng: bốn khoảnh khắc A → B → C → D xếp thành dải, mỗi ảnh vào sau 2 phách
  at(T(214), {
    in: tr('leak', 1.5),
    bg: 'paper',
    dust: 0.45,
    layers: strip([['L1007339', [0.52, 0.3]], ['NAM07870', [0.5, 0.35]], ['NAM09196', [0.5, 0.4]], ['IMG_2046', [0.42, 0.5]]], [0, B4 / 2, B4, 1.5 * B4]),
  });

  // 3:23,8 · D · Trao nhẫn toàn màn hình, tiến chậm rồi dừng êm
  at(T(230), { in: tr('wipe', 1.3), layers: [P('L1007796', { fit: 'cover', focus: [0.5, 0.41], zoom: { from: 1, to: 1.04, until: 8, ease: 'out' } })] });

  // 3:34,4 · Lời cảm ơn trên giấy ngà, bụi sáng, dấu sáp đóng xuống; giữ đến hết nhạc
  at(T(242), {
    in: tr('bloom', 1.4, [0.5, 0.42]),
    dust: 0.9,
    layers: [
      { kind: 'paper' },
      { kind: 'deco', src: 'canh-la-vang.webp', box: [0.83, 0.6, 0.21], rotate: -28, opacity: 0.3, blend: 'multiply', appear: 0.8, fade: 1.5, grow: 2.0 },
      { kind: 'deco', src: 'bia/dau-sap.webp', box: [0.475, 0.62, 0.05], appear: 2.6, stamp: 0.7 },
    ],
    texts: [
      { text: 'Cảm ơn mọi người đã ở đây,', font: 'serif', size: 54, x: 0.5, y: 0.4, appear: 1.0, fade: 1.2, rise: 12 },
      { text: 'cùng hai đứa trong ngày hôm nay.', font: 'serif', size: 54, x: 0.5, y: 0.4 + 68 / 1080, appear: 1.5, fade: 1.2, rise: 12 },
    ],
  });

  return {
    ten: 'Van_Hung_Tuyet_Anh_Le_Cuoi',
    nhac: 'xanh-pastel/assets/nhac/le-duong-dreamland-version-kai-dinh-official-mv.mp3',
    total: 222.35,
    ink: INK,
    shots,
  };
}
