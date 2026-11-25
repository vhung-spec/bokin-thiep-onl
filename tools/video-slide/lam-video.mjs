#!/usr/bin/env node
/*
 * Dựng video slide ảnh cưới từ cau-hinh.mjs.
 *
 *   node tools/video-slide/lam-video.mjs                 video đầy đủ (Full HD, 30 hình/giây)
 *   node tools/video-slide/lam-video.mjs --nhap          bản nháp nhanh (nửa kích thước, 15 hình/giây)
 *   node tools/video-slide/lam-video.mjs --khung 9:16    đổi khung dọc cho điện thoại
 *   node tools/video-slide/lam-video.mjs --xem 3,12,20   chỉ chụp ảnh tĩnh ở các giây 3, 12, 20 để xem bố cục
 *   thêm  --anh <thư mục>  --ra <file.mp4>  --cau-hinh <file.mjs>  để dùng thư mục ảnh, file ra, cấu hình khác
 *
 * Cần: Node 18+, ffmpeg, python3 + Pillow, Playwright (npm i playwright && npx playwright install chromium).
 */
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');

// ---------- Tham số dòng lệnh ----------
const argv = process.argv.slice(2);
const opt = (name) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : undefined;
};
const DRAFT = argv.includes('--nhap');
const cfgPath = path.resolve(opt('--cau-hinh') || path.join(HERE, 'cau-hinh.mjs'));
const C = (await import(pathToFileURL(cfgPath).href)).default;
const fromRoot = (p) => (path.isAbsolute(p) ? p : path.join(ROOT, p));

const khung = opt('--khung') || C.khung || '16:9';
const [W, H] = khung === '9:16' ? [1080, 1920] : [1920, 1080];
const k = DRAFT ? 0.5 : 1;
const fps = DRAFT ? 15 : C.fps || 30;
const X = C.giayChuyenCanh ?? 1.2;
const stills = opt('--xem')?.split(',').map(Number);
let out = fromRoot(opt('--ra') || C.ra || 'tools/video-slide/ra/video-cuoi.mp4');
if (DRAFT && !opt('--ra')) out = out.replace(/\.mp4$/, '-nhap.mp4');
if (khung === '9:16' && !opt('--ra')) out = out.replace(/\.mp4$/, '-doc.mp4');

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'video-slide-'));
const cleanup = () => fs.rmSync(tmp, { recursive: true, force: true });
process.on('exit', cleanup);

function run(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} lỗi:\n${r.stderr || r.error}`);
  return r.stdout;
}
const duration = (file) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', file]).trim());

// ---------- 1. Ảnh ----------
const readPhotos = (dir) => {
  console.log(`Đọc ảnh trong ${path.relative(ROOT, dir) || dir} …`);
  return JSON.parse(run('python3', ['-I', path.join(HERE, 'chuan_bi_anh.py'), dir, path.join(tmp, 'anh'), String(Math.round(2400 * k)), C.sapXep || 'ten']));
};
let photos = readPhotos(fromRoot(opt('--anh') || C.anh));
if (!photos.length && C.anhThu && !opt('--anh')) {
  console.log(`Thư mục ảnh chưa có ảnh nào → dựng thử bằng ảnh trong ${C.anhThu}`);
  photos = readPhotos(fromRoot(C.anhThu));
}
if (!photos.length) throw new Error('Không thấy ảnh nào (jpg, png, webp, heic) trong thư mục ảnh.');
photos.forEach((p) => (p.src = `/__anh__/${path.basename(p.file)}`));

// ---------- 2. Chia cảnh ----------
const land = W > H;
const off = (p) => (land ? p.w / p.h < 1.15 : p.w / p.h > 0.87); // ảnh lệch chiều khung → in trên nền giấy
const chuThich = C.chuThich || {};
const loi = C.loiCanhAnh || [];
const scenes = [{ kind: 'intro', photos: [] }];
let pairsInRow = 0;
let capIdx = 0;
for (let i = 0; i < photos.length; i++) {
  const p = photos[i];
  const q = photos[i + 1];
  if (!off(p)) {
    scenes.push({ kind: 'full', photos: [p], caption: chuThich[p.ten] || '' });
    pairsInRow = 0;
  } else if (C.ghepDoi !== false && q && off(q) && !chuThich[p.ten] && !chuThich[q.ten] && pairsInRow < 2) {
    scenes.push({ kind: 'pair', photos: [p, q] });
    pairsInRow++;
    i++;
  } else {
    scenes.push({ kind: 'single', photos: [p], caption: chuThich[p.ten] || (loi.length ? loi[capIdx++ % loi.length] : '') });
    pairsInRow = 0;
  }
}
scenes.push({ kind: 'outro', photos: [] });

// ---------- 3. Nhạc & thời lượng ----------
const songs = [C.nhac].flat().filter(Boolean).map(fromRoot);
const XF = 3; // giây nối hai bài
let audio = null;
let audioLen = 0;
if (songs.length) {
  for (const s of songs) if (!fs.existsSync(s)) throw new Error(`Không thấy file nhạc ${s}`);
  audio = path.join(tmp, 'nhac.flac');
  const start = C.nhacBatDau || 0;
  const args = ['-y', '-v', 'error', '-ss', String(start), '-i', songs[0]];
  songs.slice(1).forEach((s) => args.push('-i', s));
  if (songs.length > 1) {
    let f = '';
    let prev = '0:a';
    for (let i = 1; i < songs.length; i++) {
      const o = i === songs.length - 1 ? 'a' : `a${i}`;
      f += `[${prev}][${i}:a]acrossfade=d=${XF}[${o}];`;
      prev = o;
    }
    args.push('-filter_complex', f.slice(0, -1), '-map', '[a]');
  }
  args.push('-vn', '-c:a', 'flac', audio);
  run('ffmpeg', args);
  audioLen = duration(audio);
}

const INTRO = 7.5;
const OUTRO = 8.5;
const weight = (s) => (s.kind === 'pair' ? 1.3 : 1);
const middle = scenes.filter((s) => s.kind !== 'intro' && s.kind !== 'outro');
const wsum = middle.reduce((a, s) => a + weight(s), 0);
const lenFor = (d) => INTRO + OUTRO + d * wsum - X * (scenes.length - 1);
let D = C.giayMoiCanh || 5;
if (C.vuaBaiNhac && audioLen && wsum) D = Math.min(8, Math.max(3.5, (audioLen - INTRO - OUTRO + X * (scenes.length - 1)) / wsum));
let t = 0;
for (const s of scenes) {
  s.dur = s.kind === 'intro' ? INTRO : s.kind === 'outro' ? OUTRO : D * weight(s);
  s.start = t;
  t += s.dur - X;
}
const total = lenFor(D);

const kinds = middle.reduce((a, s) => ((a[s.kind] = (a[s.kind] || 0) + 1), a), {});
const mmss = (x) => `${Math.floor(x / 60)}:${String(Math.round(x % 60)).padStart(2, '0')}`;
console.log(`${photos.length} ảnh → ${middle.length} cảnh (${kinds.full || 0} ảnh phủ kín, ${kinds.pair || 0} cảnh 2 ảnh, ${kinds.single || 0} cảnh 1 ảnh + chữ)`);
console.log(`Mỗi cảnh ~${D.toFixed(1)} giây · video dài ${mmss(total)}${audioLen ? ` · nhạc dài ${mmss(audioLen)}${audioLen < total ? ' (nhạc sẽ phát lại từ đầu)' : ''}` : ' · không có nhạc'}`);

// ---------- 4. Máy chủ tĩnh cho trang mẫu ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = url.startsWith('/__anh__/') ? path.join(tmp, 'anh', path.basename(url)) : path.join(ROOT, path.normalize(url));
  if (!file.startsWith(ROOT) && !file.startsWith(tmp)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' }).end(data);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

// ---------- 5. Dựng từng khung hình ----------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(W * k), height: Math.round(H * k) } });
page.on('pageerror', (e) => console.error('Lỗi trong trang mẫu:', e.message));
await page.goto(`http://127.0.0.1:${port}/tools/video-slide/mau.html`);
await page.evaluate((cfg) => window.setup(cfg), { W, H, k, X, total, scenes, moDau: C.moDau || {}, ketThuc: C.ketThuc || {} });
const cdp = await page.context().newCDPSession(page);
const shot = async (format = 'jpeg') => {
  const { data } = await cdp.send('Page.captureScreenshot', { format, quality: format === 'jpeg' ? 93 : undefined, optimizeForSpeed: true });
  return Buffer.from(data, 'base64');
};

fs.mkdirSync(path.dirname(out), { recursive: true });
if (stills) {
  for (const s of stills) {
    await page.evaluate((x) => window.render(x), s);
    const f = out.replace(/\.mp4$/, `-giay-${s}.png`);
    fs.writeFileSync(f, await shot('png'));
    console.log('Ảnh tĩnh:', path.relative(ROOT, f));
  }
} else {
  const ffArgs = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-'];
  if (audio) ffArgs.push('-stream_loop', '-1', '-i', audio);
  ffArgs.push('-map', '0:v', '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'medium', '-crf', DRAFT ? '24' : '20', '-pix_fmt', 'yuv420p', '-r', String(fps));
  if (audio) ffArgs.push('-map', '1:a', '-af', `afade=t=in:st=0:d=1.5,afade=t=out:st=${(total - 4).toFixed(2)}:d=4`, '-c:a', 'aac', '-b:a', '192k');
  ffArgs.push('-t', total.toFixed(3), '-movflags', '+faststart', out);
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.ceil(total * fps);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((x) => window.render(x), f / fps);
    if (!ff.stdin.write(await shot())) await once(ff.stdin, 'drain');
    if (f % (fps * 5) === 0 || f === frames - 1) {
      const pct = ((f + 1) / frames) * 100;
      const eta = ((Date.now() - t0) / (f + 1)) * (frames - f - 1) / 1000;
      process.stdout.write(`\rĐang dựng ${pct.toFixed(0).padStart(3)}%  (còn ~${mmss(eta)})   `);
    }
  }
  ff.stdin.end();
  const [code] = await once(ff, 'close');
  if (code !== 0) throw new Error('ffmpeg lỗi khi ghi video');
  console.log(`\nXong: ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB, ${mmss(total)})`);
}
await browser.close();
server.close();
