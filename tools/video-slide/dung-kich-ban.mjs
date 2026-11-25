#!/usr/bin/env node
/*
 * Dựng video theo một kịch bản viết sẵn (tools/video-slide/kich-ban/*.mjs): từng cảnh có giờ cắt theo phách nhạc,
 * ảnh, khung, chuyển động, chữ. Khác lam-video.mjs (tự chia cảnh theo mẫu).
 *
 *   node tools/video-slide/dung-kich-ban.mjs --anh <thư mục ảnh>                    bản 16:9 Full HD
 *   node tools/video-slide/dung-kich-ban.mjs --anh <thư mục ảnh> --khung 9:16       bản dọc 1080×1920
 *   thêm  --nhap (nửa kích thước, 15 hình/giây) · --xem 5,80.5 (chỉ chụp ảnh tĩnh) · --ra <file.mp4>
 *         --kich-ban <file.mjs> (mặc định kich-ban/qua-nhung-o-cua.mjs)
 */
import { spawn, spawnSync } from 'node:child_process';
import { once } from 'node:events';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../..');
const argv = process.argv.slice(2);
const opt = (n) => (argv.includes(n) ? argv[argv.indexOf(n) + 1] : undefined);
const DRAFT = argv.includes('--nhap');
const khung = opt('--khung') || '16:9';
const [W, H] = khung === '9:16' ? [1080, 1920] : [1920, 1080];
const k = DRAFT ? 0.5 : 1;
const fps = DRAFT ? 15 : 30;
const stills = opt('--xem')?.split(',').map(Number);
const photoDir = path.resolve(opt('--anh') || path.join(HERE, 'anh'));

const kbPath = path.resolve(opt('--kich-ban') || path.join(HERE, 'kich-ban/qua-nhung-o-cua.mjs'));
const KB = (await import(pathToFileURL(kbPath).href)).default({ khung });
const tag = khung === '9:16' ? '9x16' : '16x9';
const out = path.resolve(opt('--ra') || path.join(HERE, 'ra', `${KB.ten}-${tag}${DRAFT ? '-nhap' : ''}.mp4`));
const mmss = (x) => `${Math.floor(x / 60)}:${(x % 60).toFixed(1).padStart(4, '0')}`;

function run(cmd, args, input) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', input, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error(`${cmd} lỗi:\n${r.stderr || r.error}`);
  return r.stdout;
}

// ---------- 1. Chỉnh màu các ảnh có trong kịch bản (lưu đệm, chỉ làm lại khi ảnh hoặc cách chỉnh đổi) ----------
const cache = path.join(HERE, 'ra', '.anh-da-chinh');
fs.mkdirSync(cache, { recursive: true });
const metaFile = path.join(cache, 'meta.json');
const meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
const gradeStamp = fs.statSync(path.join(HERE, 'chinh_mau.py')).mtimeMs;
const files = new Map(fs.readdirSync(photoDir).map((f) => [f.toLowerCase(), f]));
const used = new Map();
for (const s of KB.shots) for (const L of s.layers || []) if (L.img) used.set(L.img, L.set);
const jobs = [];
for (const [name, set] of used) {
  const real = files.get(name.toLowerCase());
  if (!real) throw new Error(`Không thấy ảnh ${name} trong ${photoDir}`);
  const src = path.join(photoDir, real);
  const m = meta[name];
  const fresh = m && m.set === set && m.stamp === gradeStamp && m.srcTime === fs.statSync(src).mtimeMs && fs.existsSync(path.join(cache, name));
  if (!fresh) jobs.push({ name, src, out: path.join(cache, name), set });
}
const paperFile = path.join(cache, `giay-nga-${W}x${H}.jpg`);
const papers = fs.existsSync(paperFile) ? [] : [{ out: paperFile, w: W, h: H }];
if (jobs.length || papers.length) {
  console.log(`Chỉnh màu ${jobs.length} ảnh${papers.length ? ' + vẽ giấy ngà' : ''} …`);
  const res = JSON.parse(run('python3', ['-I', path.join(HERE, 'chinh_mau.py')], JSON.stringify({ images: jobs, papers, maxEdge: 3000 })));
  for (const j of jobs) meta[j.name] = { ...res[j.name], set: j.set, stamp: gradeStamp, srcTime: fs.statSync(j.src).mtimeMs };
  fs.writeFileSync(metaFile, JSON.stringify(meta, null, 1));
}
console.log(`${KB.shots.length} cảnh · ${used.size} ảnh · ${mmss(KB.total)} · khung ${khung}`);

// ---------- 2. Máy chủ tĩnh ----------
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.woff2': 'font/woff2' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const file = url.startsWith('/__anh__/') ? path.join(cache, path.basename(url)) : path.join(ROOT, path.normalize(url));
  if (!file.startsWith(ROOT)) return res.writeHead(403).end();
  fs.readFile(file, (err, data) => {
    if (err) return res.writeHead(404).end();
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' }).end(data);
  });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

// ---------- 3. Dựng ----------
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: Math.round(W * k), height: Math.round(H * k) } });
page.on('pageerror', (e) => console.error('Lỗi trong trang:', e.message));
await page.goto(`${base}/tools/video-slide/kich-ban.html`);
const info = await page.evaluate((cfg) => window.setup(cfg), {
  W, H, k, total: KB.total, shots: KB.shots, ink: KB.ink,
  meta: Object.fromEntries([...used.keys()].map((n) => [n, meta[n]])),
  paperUrl: `/__anh__/${path.basename(paperFile)}`,
});
if (!info.fontsOk) throw new Error('Font chưa tải xong — dừng để không xuất video sai chữ.');
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
  const music = path.join(ROOT, KB.nhac);
  const ffArgs = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-', '-i', music,
    '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-preset', DRAFT ? 'veryfast' : 'slow', '-crf', DRAFT ? '24' : '19',
    '-pix_fmt', 'yuv420p', '-r', String(fps), '-af', `afade=t=out:st=${(KB.total - 0.4).toFixed(2)}:d=0.4`,
    '-c:a', 'aac', '-b:a', '192k', '-t', KB.total.toFixed(3), '-movflags', '+faststart', out];
  const ff = spawn('ffmpeg', ffArgs, { stdio: ['pipe', 'inherit', 'inherit'] });
  const frames = Math.round(KB.total * fps);
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate((x) => window.render(x), f / fps);
    if (!ff.stdin.write(await shot())) await once(ff.stdin, 'drain');
    if (f % (fps * 10) === 0 || f === frames - 1) {
      const eta = (((Date.now() - t0) / (f + 1)) * (frames - f - 1)) / 1000;
      process.stdout.write(`\rĐang dựng ${(((f + 1) / frames) * 100).toFixed(0).padStart(3)}%  (còn ~${Math.ceil(eta / 60)} phút)   `);
    }
  }
  ff.stdin.end();
  const [code] = await once(ff, 'close');
  if (code !== 0) throw new Error('ffmpeg lỗi khi ghi video');
  console.log(`\nXong: ${path.relative(ROOT, out)} (${(fs.statSync(out).size / 1e6).toFixed(1)} MB)`);
}
await browser.close();
server.close();
