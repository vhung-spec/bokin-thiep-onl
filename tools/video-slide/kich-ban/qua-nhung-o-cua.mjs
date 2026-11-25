/*
 * KỊCH BẢN "QUA NHỮNG Ô CỬA" — video chiếu tiệc 16:9 của Văn Hùng & Tuyết Anh
 *
 * Nhạc: Lễ Đường (Dreamland version) – Kai Đinh, 68 BPM. Phách thứ n rơi vào giây T(n) = 0,815 + n × 60/68
 * (đo từ file mp3: phách mạnh ở 35, 142, 154, 170 — nhạc nền vào 0:31,7; lấy hơi 1:14,4–1:16,2;
 *  đoạn lắng 1:48,5; dồn lên 2:06,1; điệp khúc cuối 2:30,8; nhạc dứt ~3:41,5).
 *
 * Mỗi cảnh: at (giây bắt đầu, hết khi cảnh sau bắt đầu), in (cách vào: cắt thẳng / từ đen / hoà ảnh d giây),
 * layers (ảnh, giấy, dải giấy xô thơm, dấu sáp…), texts (chữ).
 * Lớp ảnh:
 *   fit   'height' (ảnh dọc giữ nguyên dáng, cao bằng khung, hai bên là màu phẳng lấy từ ảnh) · 'cover' (phủ kín khung)
 *   focus điểm trong ảnh (0..1) khách đang nhìn — mắt cô dâu, bàn tay…; to = vị trí của điểm đó trên khung.
 *         Cảnh sau đặt điểm nhìn gần chỗ cảnh trước để mắt khách có điểm bám khi chuyển.
 *   lock  'y': phóng vừa đủ để điểm focus nằm đúng độ cao 'to' (cắt khớp vị trí)
 *   zoom  [từ, đến] — mỗi ảnh chỉ một chuyển động, tiến tối đa ~103%, đều theo thời gian và chạy liên tục
 *         cả trong lúc hoà sang cảnh sau (không khựng); {until, ease:'out'} để dừng êm giữa cảnh.
 *   pan   dx (tỉ lệ bề ngang khung), cũng chạy đều suốt cảnh.
 */
const BPM = 68;
const PHASE = 0.815;
export const T = (n) => Math.round((PHASE + (n * 60) / BPM) * 1000) / 1000;

const INK = '#2D3826';

// Bộ ảnh để chỉnh màu: A studio · B phố cổ · C toà nhà cổ · D Hạ Long
const SET = (f) =>
  /^(IMG_200[678]|L1007339)/.test(f) ? 'A' : /^NAM0(7|8[0-3])/.test(f) ? 'B' : /^NAM/.test(f) ? 'C' : 'D';
const P = (img, o = {}) => ({ img: `${img}.jpg`, set: SET(img), ...o });
const PUSH = [1, 1.03];
const cut = undefined;
const fade = (d) => ({ type: 'dissolve', d });

export default function kichBan() {
  const shots = [];
  const at = (t, s) => shots.push({ at: t, ...s });

  // 0:00 · C · Toàn cảnh vòm kính: hiện từ tối, khách tự tìm thấy hai người dưới vòm, tiến rất chậm
  at(0, { in: { type: 'black', d: 0.8 }, layers: [P('NAM09385', { focus: [0.42, 0.88], to: [0.47, 0.88], zoom: { from: 1, to: 1.03, t0: 1.2, ease: 'in' } })] }); // tiến về phía hai người dưới vòm

  // 0:08,8 · Tên hai người trên giấy ngà (hoà mềm từ vòm kính, đoạn dạo đầu còn lắng)
  at(8.8, {
    in: fade(0.7),
    layers: [{ kind: 'paper' }, { kind: 'sage', box: [0, 0, 0.12, 1] }],
    texts: [
      { text: 'Văn Hùng & Tuyết Anh', font: 'script', size: 108, x: 0.222, y: 0.45, align: 'left', appear: 0.9 },
      { text: 'Hà Nội · 28.11.2026     /     Hải Phòng · 29.11.2026', font: 'ui', size: 34, x: 0.227, y: 0.58, align: 'left', appear: 0.9, ls: 0.04 },
    ],
  });

  // 0:16,2 · A · Làm quen: toàn thân → ngồi cười → má kề má. Phông studio nối liền ra hai bên.
  const studio = { feather: 0.06 };
  at(16.18, { in: fade(0.6), layers: [P('IMG_2006', { ...studio, focus: [0.45, 0.3] })] });
  at(T(24), { layers: [P('IMG_2007', { ...studio, focus: [0.5, 0.45] })] });
  at(T(30), { layers: [P('L1007339', { ...studio, focus: [0.52, 0.22], zoom: PUSH })] });

  // 0:31,7 · B · Một ngày ở Hà Nội — vào đúng lúc nhạc nền vào
  at(T(35), {
    layers: [P('NAM08332', { focus: [0.43, 0.38], to: [0.434, 0.38] })],
    texts: [{ text: 'Một ngày ở Hà Nội', font: 'serif-italic', size: 46, x: 0.82, y: 0.5, color: 'auto', appear: 0.5 }],
  });
  at(T(43), { layers: [P('NAM07943', { focus: [0.5, 0.44], to: [0.46, 0.44], zoom: PUSH })] });

  // 0:45,8 · B · Chiếc ô giấy: cô dâu đứng nguyên chỗ, chú rể "bước vào" che ô cho cô
  at(T(51), { layers: [P('NAM08137', { focus: [0.48, 0.24] })] });
  at(T(59), { layers: [P('NAM08138', { focus: [0.66, 0.3], to: [0.4927, 0.24], lock: 'y', zoom: PUSH })] });

  // 0:59,9 · B · Đến gần: gương mặt cô dâu giữ cùng một chỗ qua ba ảnh
  at(T(67), { layers: [P('NAM07765', { focus: [0.7, 0.47], to: [0.552, 0.4], lock: 'y' })] });
  at(T(71), { layers: [P('NAM07834', { focus: [0.62, 0.25], to: [0.552, 0.25] })] });
  at(T(75), { layers: [P('NAM08260', { focus: [0.6, 0.33], to: [0.552, 0.33], zoom: PUSH })] });

  // 1:14,35 · C · Đúng lúc ca sĩ lấy hơi: cô dâu ngoái lại, chừa khoảng trống theo hướng nhìn
  at(74.35, { layers: [P('NAM00198', { focus: [0.33, 0.12], to: [0.537, 0.12] })] });

  // 1:20,2 · C · Cầu thang: chú rể cúi xuống → cô dâu cười → hôn nhau. Mắt cô dâu cùng toạ độ, cắt thẳng.
  const stair = (img, eye) => P(img, { focus: eye, to: [0.521, 0.36], lock: 'y' });
  at(T(90), { layers: [stair('NAM08841', [0.585, 0.385])] });
  at(T(94), { layers: [stair('NAM08869', [0.62, 0.35])] });
  at(T(98), { layers: [stair('NAM08892', [0.39, 0.45])] });

  // 1:30,8 · C · Ra vùng sáng: nắm tay ngược sáng (hoà mềm từ cầu thang tối) → vòm kính lần hai, tĩnh và rộng nhất
  at(T(102), { in: fade(0.5), layers: [P('NAM09416', { fit: 'cover', focus: [0.45, 0.45], zoom: PUSH })] });
  at(T(108), { in: fade(0.6), layers: [P('NAM09385')] });

  // 1:48,5 · C · Đoạn lắng: hai chân dung nhìn về nhau (chú rể trước, cô dâu hiện dần sau 4 phách)
  const half = 0.5 - 4 / 1920;
  at(T(122), {
    in: fade(0.6),
    bg: '#1B2016',
    layers: [
      P('NAM00116', { box: [0, 0, half, 1], fit: 'cover', focus: [0.48, 0.24], to: [0.5, 0.3] }),
      P('NAM00160', { box: [1 - half, 0, half, 1], fit: 'cover', focus: [0.4, 0.19], to: [0.5, 0.28], appear: T(126) - T(122), appearFade: 0.5 }),
    ],
  });
  // → hai người mặt đối mặt bên cửa kính (chú rể vẫn bên trái, cô dâu bên phải)
  at(T(134), { layers: [P('NAM09644', { fit: 'cover', focus: [0.5, 0.3], zoom: PUSH })] });

  // 2:06,1 · C · Nhạc dồn lên: điệu nhảy → bế xoay, voan bay
  at(T(142), { layers: [P('NAM09621', { focus: [0.55, 0.3], zoom: PUSH })] });
  at(T(150), { layers: [P('NAM09729', { fill: '#3B3126', focus: [0.55, 0.35] })] });

  // 2:16,7 · C → D · Nối bằng tấm voan: gương mặt cô dâu đặt đúng chỗ, hai khối voan sáng cùng phía, hoà 0,3 giây
  at(T(154), { in: fade(0.3), layers: [P('L1007649', { focus: [0.62, 0.45], to: [0.519, 0.35], lock: 'y' })] });

  // 2:23,8 · D · Khe đá như một khung cửa tự nhiên — đứng yên đến hết câu
  at(T(162), { layers: [P('L1007701', { focus: [0.64, 0.56] })] });

  // 2:30,8 · D · Điệp khúc cuối mở thẳng ra toàn vịnh, giữ 12 phách (~10,6 giây), tiến rất chậm về phía hai người
  at(T(170), { layers: [P('IMG_2047', { fit: 'cover', focus: [0.57, 0.33], to: [0.57, 0.42], zoom: PUSH })] });

  // 2:41,4 · D · Đi giữa gió: bãi cát (lia theo bước chân) → trên đỉnh núi, hai người ở giữa khung → nâng voan
  at(T(182), { layers: [P('IMG_2050', { fit: 'cover', focus: [0.6, 0.55], scale: 1.03, pan: { dx: 0.02 } })] });
  at(T(190), { layers: [P('IMG_2001', { fit: 'cover', focus: [0.52, 0.48] })] });
  at(T(194), { layers: [P('L1007506', { focus: [0.47, 0.38] })] });

  // 2:55,5 · D · Dưới tấm voan → hoà mềm sang nụ hôn bên vịnh (góc rộng thấy biển quanh hai người)
  at(T(198), { layers: [P('L1007501', { focus: [0.45, 0.3], zoom: PUSH })] });
  at(T(206), { in: fade(0.6), layers: [P('IMG_1998', { fit: 'cover', focus: [0.3, 0.6] })] });

  // 3:09,6 · Hồi tưởng A → B → C → D: gương mặt cô dâu giữ cùng một chỗ, 4 phách mỗi ảnh
  const flash = (img, face, o = {}) => P(img, { focus: face, to: [0.45, face[1]], ...o });
  at(T(214), { layers: [flash('IMG_2008', [0.47, 0.32], { to: [0.45, 0.33], scale: 1.45, lock: 'y' })] });
  at(T(218), { layers: [flash('NAM07870', [0.63, 0.25])] });
  at(T(222), { layers: [flash('NAM09196', [0.55, 0.33])] });
  at(T(226), { layers: [flash('IMG_2046', [0.57, 0.42])] });

  // 3:23,8 · D · Trao nhẫn: nhẫn gần giữa khung, tiến chậm rồi dừng êm, giữ hết câu hát
  at(T(230), { layers: [P('L1007796', { fit: 'cover', focus: [0.5, 0.41], zoom: { from: 1, to: 1.03, until: 7, ease: 'out' } })] });

  // 3:34,4 · Lời cảm ơn trên giấy ngà, dấu sáp đồng nhỏ, nhánh lá vàng in chìm ở góc; giữ đến hết nhạc
  at(T(242), {
    in: fade(0.6),
    layers: [
      { kind: 'paper' },
      { kind: 'deco', src: 'canh-la-vang.webp', box: [0.83, 0.62, 0.21], rotate: -28, opacity: 0.28, blend: 'multiply' },
      { kind: 'deco', src: 'bia/dau-sap.webp', box: [0.475, 0.62, 0.05], appear: 0.6, fade: 0.8 },
    ],
    texts: [
      { text: 'Cảm ơn mọi người đã ở đây,', font: 'serif', size: 52, x: 0.5, y: 0.405, appear: 0.6 },
      { text: 'cùng hai đứa trong ngày hôm nay.', font: 'serif', size: 52, x: 0.5, y: 0.405 + 65 / 1080, appear: 0.6 },
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
