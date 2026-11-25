/*
 * KỊCH BẢN "QUA NHỮNG Ô CỬA" — video slide Văn Hùng & Tuyết Anh
 *
 * Nhạc: Lễ Đường (Dreamland version) – Kai Đinh, 68 BPM. Phách thứ n rơi vào giây T(n) = 0,815 + n × 60/68
 * (đo từ file mp3: phách mạnh ở 35, 142, 154, 170 — nhạc nền vào 0:31,7; lấy hơi 1:14,4–1:16,2;
 *  đoạn lắng 1:48,5; dồn lên 2:06,1; điệp khúc cuối 2:30,8; nhạc dứt ~3:41,5).
 *
 * Mỗi cảnh: at (giây bắt đầu, hết khi cảnh sau bắt đầu), in (cách vào: cắt thẳng / từ đen / hoà ảnh),
 * layers (ảnh, giấy, dải giấy xô thơm, dấu sáp…), texts (chữ).
 * Lớp ảnh: focus = điểm trong ảnh (0..1) dùng để căn; to = vị trí của điểm đó trên khung (0..1);
 *   fit 'height' (ảnh dọc cao bằng khung, hai bên là màu phẳng lấy từ ảnh) · 'cover' (phủ kín) · 'width';
 *   lock 'y' = được phóng to vừa đủ để điểm focus nằm đúng độ cao 'to' (dùng cho các cú cắt khớp vị trí);
 *   zoom {from, to, t0, t1} tiến/lùi quanh điểm focus; pan {dx, t0, t1} lia (tỉ lệ bề ngang khung).
 * Ảnh dọc trong khung ngang mặc định 'height', còn lại 'cover'.
 */
const BPM = 68;
const PHASE = 0.815;
export const T = (n) => Math.round((PHASE + (n * 60) / BPM) * 1000) / 1000;

const MOSS = '#1D2319'; // rêu tối: nền giữ nguyên bố cục ảnh toàn cảnh ở bản dọc
const INK = '#2D3826';

// Bộ ảnh để chỉnh màu: A studio · B phố cổ · C toà nhà cổ · D Hạ Long
const SET = (f) =>
  /^(IMG_200[678]|L1007339)/.test(f) ? 'A' : /^NAM0(7|8[0-3])/.test(f) ? 'B' : /^NAM/.test(f) ? 'C' : 'D';
const P = (img, o = {}) => ({ img: `${img}.jpg`, set: SET(img), ...o });

export default function kichBan({ khung }) {
  const V = khung === '9:16';
  const H = !V;
  const pick = (h, v) => (V ? v : h);
  const shots = [];
  const at = (t, s) => shots.push({ at: t, ...s });

  // 0:00 · C · Toàn cảnh vòm kính — hiện từ tối, đứng yên 2 giây rồi tiến rất nhẹ
  at(0, {
    in: { type: 'black', d: 0.6 },
    layers: [pick(P('NAM09385', { zoom: { from: 1, to: 1.02, t0: 2.6, t1: 8.8 } }),
                  P('NAM09385', { fit: 'width', fill: MOSS, zoom: { from: 1, to: 1.02, t0: 2.6, t1: 8.8 } }))],
  });

  // 0:08,8 · Tên hai người trên giấy ngà, dải giấy xô thơm sát mép trái
  at(8.8, {
    layers: [{ kind: 'paper' }, { kind: 'sage', box: [0, 0, 0.12, 1] }],
    texts: H
      ? [
          { text: 'Văn Hùng & Tuyết Anh', font: 'script', size: 96, x: 0.225, y: 0.455, align: 'left', appear: 0.4 },
          { text: 'Hà Nội · 28.11.2026     /     Hải Phòng · 29.11.2026', font: 'ui', size: 30, x: 0.229, y: 0.575, align: 'left', appear: 0.4, ls: 0.04 },
        ]
      : [
          { text: 'Văn Hùng', font: 'script', size: 104, x: 0.2, y: 0.4, align: 'left', appear: 0.4 },
          { text: '& Tuyết Anh', font: 'script', size: 104, x: 0.2, y: 0.465, align: 'left', appear: 0.4 },
          { text: 'Hà Nội · 28.11.2026', font: 'ui', size: 32, x: 0.205, y: 0.565, align: 'left', appear: 0.4, ls: 0.04 },
          { text: 'Hải Phòng · 29.11.2026', font: 'ui', size: 32, x: 0.205, y: 0.6, align: 'left', appear: 0.4, ls: 0.04 },
        ],
  });

  // 0:16,2 · A · Làm quen: toàn thân → ngồi cười → má kề má (ảnh cuối tiến 2%)
  const studio = { feather: 0.06 };
  at(16.18, { layers: [P('IMG_2006', pick(studio, { focus: [0.45, 0.5] }))] });
  at(T(24), { layers: [P('IMG_2007', pick(studio, { focus: [0.5, 0.5] }))] });
  at(T(30), { layers: [P('L1007339', { ...pick(studio, {}), focus: [0.52, 0.22], zoom: { from: 1, to: 1.02, t0: 0, t1: T(35) - T(30) } })] });

  // 0:31,7 · B · Một ngày ở Hà Nội — vào cùng lúc nhạc nền vào
  at(T(35), {
    layers: [pick(P('NAM08332', { focus: [0.5, 0.5], to: [0.36, 0.5] }),
                  P('NAM08332', { fit: 'width', focus: [0.5, 0], to: [0.5, 0] }))],
    texts: [pick(
      { text: 'Một ngày ở Hà Nội', font: 'serif-italic', size: 43, x: 0.775, y: 0.5, color: 'auto', appear: 0.5 },
      { text: 'Một ngày ở Hà Nội', font: 'serif-italic', size: 46, x: 0.5, y: 0.915, color: 'auto', appear: 0.5 })],
  });
  at(T(43), { layers: [P('NAM07943', pick({}, { focus: [0.55, 0.6] }))] });

  // 0:45,8 · B · Chiếc ô giấy: cô dâu đứng nguyên chỗ, chú rể "xuất hiện" bên cạnh
  at(T(51), { layers: [P('NAM08137', pick({}, { focus: [0.48, 0.24], to: [0.5, 0.24] }))] });
  at(T(59), {
    layers: [P('NAM08138', {
      focus: [0.66, 0.3], to: pick([0.4927, 0.24], [0.79, 0.24]), lock: 'y', // bản dọc: dời khung để thấy chú rể
      zoom: { from: 1, to: 1.025, t0: 0, t1: T(67) - T(59) },
    })],
  });

  // 0:59,9 · B · Đến gần: gương mặt cô dâu giữ cùng một chỗ qua ba ảnh
  at(T(67), { layers: [P('NAM07765', pick({ focus: [0.7, 0.47], to: [0.552, 0.47] }, { focus: [0.56, 0.5] }))] });
  at(T(71), { layers: [P('NAM07834', pick({ focus: [0.62, 0.25], to: [0.552, 0.25] }, { focus: [0.5, 0.3] }))] });
  at(T(75), { layers: [P('NAM08260', pick({ focus: [0.6, 0.33], to: [0.552, 0.33] }, { focus: [0.5, 0.4] }))] });

  // 1:14,0 · C · Khoảng lặng: cô dâu ngoái lại, chừa khoảng trống theo hướng nhìn
  at(T(83), { layers: [P('NAM00198', pick({ focus: [0.5, 0.5], to: [0.6, 0.5] }, { focus: [0.45, 0.5] }))] });

  // 1:20,2 · C · Cầu thang: mắt cô dâu ở cùng toạ độ, ba ảnh đứng yên
  const stair = (img, eye) => P(img, { fit: pick('height', 'cover'), focus: eye, to: pick([0.521, 0.4], [0.5, 0.4]), lock: 'y' });
  at(T(90), { layers: [stair('NAM08841', [0.585, 0.385])] });
  at(T(94), { layers: [stair('NAM08869', [0.62, 0.35])] });
  at(T(98), { layers: [stair('NAM08892', [0.39, 0.45])] });

  // 1:30,8 · C · Nắm tay ngược sáng → trở lại vòm kính, tĩnh và rộng nhất
  at(T(102), { layers: [pick(P('NAM09416', { focus: [0.45, 0.45] }), P('NAM09416', { fit: 'width', scale: 1.3 }))] });
  at(T(108), { layers: [pick(P('NAM09385'), P('NAM09385', { fit: 'width', fill: MOSS }))] });

  // 1:48,5 · C · Hai chân dung: chú rể trước, 4 phách sau cô dâu; ánh mắt hướng vào nhau
  if (H) {
    const half = 0.5 - 4 / 1920;
    at(T(122), {
      bg: '#1B2016',
      layers: [
        P('NAM00116', { box: [0, 0, half, 1], fit: 'cover', focus: [0.48, 0.24], to: [0.5, 0.3] }),
        P('NAM00160', { box: [1 - half, 0, half, 1], fit: 'cover', focus: [0.4, 0.19], to: [0.5, 0.28], appear: T(126) - T(122) }),
      ],
    });
  } else {
    at(T(122), { layers: [P('NAM00116', { focus: [0.48, 0.4] })] });
    at(T(126), { layers: [P('NAM00160', { focus: [0.42, 0.4] })] });
  }
  at(T(134), { layers: [P('NAM09628', { focus: pick([0.5, 0.35], [0.55, 0.4]) })] });

  // 2:06,1 · C · Điệu nhảy → bế xoay, voan bay
  at(T(142), { layers: [P('NAM09621', { focus: pick([0.52, 0.3], [0.5, 0.35]), zoom: { from: 1, to: 1.02, t0: 0, t1: T(150) - T(142) } })] });
  at(T(150), { layers: [P('NAM09729', pick({ fill: '#3B3126' }, { focus: [0.6, 0.45] }))] }); // mép ảnh là cửa kính sáng → nền nâu ấm tối

  // 2:16,7 · C sang D · Nối bằng tấm voan (khối voan sáng đặt cùng chỗ, hoà 0,3 giây)
  at(T(154), {
    in: { type: 'dissolve', d: 0.3 },
    layers: [P('L1007649', pick({ focus: [0.66, 0.58], to: [0.582, 0.42], scale: 1.25 }, { focus: [0.62, 0.55] }))],
  });

  // 2:23,8 · D · Khe đá như một khung cửa tự nhiên
  at(T(162), { layers: [P('L1007701', pick({}, { focus: [0.62, 0.6] }))] });

  // 2:30,8 · D · Điệp khúc cuối mở ra toàn vịnh: khung ngang cắt từ phần trên bức dọc, đứng yên 8 phách,
  //          rồi đưa cả bức dọc nguyên bố cục (hai người tí hon trên đỉnh núi)
  at(T(170), { layers: [P('IMG_2047', pick({ fit: 'cover', focus: [0.5, 0.3] }, { fit: 'cover', focus: [0.5, 0.5] }))] });
  at(T(178), { layers: [pick(P('IMG_2047'), P('IMG_2047', { fit: 'width', fill: MOSS }))] });

  // 2:41,4 · D · Đi giữa gió: bãi cát (lia nhẹ theo bước chân) → hôn trên đỉnh núi → góc gần có gió
  at(T(182), { layers: [P('IMG_2050', { fit: 'cover', focus: pick([0.6, 0.55], [0.64, 0.5]), scale: pick(1.03, 1), pan: { dx: 0.02, t0: 0, t1: T(190) - T(182) } })] });
  at(T(190), { layers: [P('IMG_1998', { focus: pick([0.3, 0.62], [0.3, 0.6]) })] });
  at(T(194), { layers: [P('IMG_2045', pick({}, { focus: [0.55, 0.5] }))] });

  // 2:55,5 · D · Dưới tấm voan (tiến tối đa 2%) → góc rộng thấy biển quanh hai người
  at(T(198), { layers: [P('L1007501', { focus: pick([0.45, 0.3], [0.45, 0.4]), zoom: { from: 1, to: 1.02, t0: 0, t1: T(206) - T(198) } })] });
  at(T(206), { layers: [P('IMG_2001', { focus: pick([0.5, 0.6], [0.5, 0.5]) })] });

  // 3:09,6 · Hồi tưởng A → B → C → D: gương mặt cô dâu giữ cùng một chỗ, 4 phách mỗi ảnh
  const flash = (img, face, { v = {}, ...h } = {}) => P(img, pick({ focus: face, to: [0.521, face[1]], ...h }, { focus: face, to: [0.5, 0.36], lock: 'y', ...v }));
  at(T(214), { layers: [flash('IMG_2008', [0.47, 0.32], { to: [0.521, 0.33], scale: 1.45, lock: 'y', v: { scale: 1.3 } })] });
  at(T(218), { layers: [flash('NAM07870', [0.63, 0.25])] });
  at(T(222), { layers: [flash('NAM09196', [0.55, 0.33])] });
  at(T(226), { layers: [flash('IMG_2046', [0.57, 0.42])] });

  // 3:23,8 · D · Trao nhẫn: nhẫn gần giữa khung, tiến 100% → 104% trong 7 giây rồi dừng hẳn
  at(T(230), { layers: [P('L1007796', { focus: [0.47, 0.42], to: pick([0.5, 0.45], [0.5, 0.45]), zoom: { from: 1, to: 1.04, t0: 0, t1: 7 } })] });

  // 3:34,4 · Lời cảm ơn trên giấy ngà, dấu sáp đồng nhỏ, nhánh lá vàng in chìm ở góc; giữ đến hết nhạc
  at(T(242), {
    in: { type: 'dissolve', d: 0.6 },
    layers: [
      { kind: 'paper' },
      { kind: 'deco', src: 'canh-la-vang.webp', box: pick([0.83, 0.62, 0.21], [0.7, 0.8, 0.36]), rotate: -28, opacity: 0.28, blend: 'multiply' },
      { kind: 'deco', src: 'bia/dau-sap.webp', box: pick([0.475, 0.605, 0.05], [0.4555, 0.585, 0.089]), appear: 0.6, fade: 0.8 },
    ],
    texts: [
      { text: 'Cảm ơn mọi người đã ở đây,', font: 'serif', size: pick(48, 50), x: 0.5, y: pick(0.41, 0.44), appear: 0.6 },
      { text: 'cùng hai đứa trong ngày hôm nay.', font: 'serif', size: pick(48, 50), x: 0.5, y: pick(0.41 + 60 / 1080, 0.44 + 62 / 1920), appear: 0.6 },
    ],
  });

  return {
    ten: 'qua-nhung-o-cua',
    nhac: 'xanh-pastel/assets/nhac/le-duong-dreamland-version-kai-dinh-official-mv.mp3',
    total: 222.35,
    ink: INK,
    shots,
  };
}
