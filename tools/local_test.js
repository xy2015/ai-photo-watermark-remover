/**
 * 本地端到端测试（纯 JS，无需浏览器/后端）
 * 生成合成测试图 → 运行三个算法 → 输出 before/after PNG 到 tools/output/
 * 运行： node tools/local_test.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { ImageProcessor } = require('../web/js/image-processor.js');

// ── 最小 PNG 编码器（RGBA，filter=0）──────────────────────────
function writePNG(file, data, w, h) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    data.subarray(y * stride, y * stride + stride).forEach((v, i) => { raw[y * (stride + 1) + 1 + i] = v; });
  }
  const idat = zlib.deflateSync(raw);
  const crc = (buf) => {
    let c = ~0;
    for (let i = 0; i < buf.length; i++) { c ^= buf[i]; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1)); }
    return (~c) >>> 0;
  };
  const chunk = (type, body) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(body.length, 0);
    const t = Buffer.from(type, 'ascii');
    const cb = Buffer.concat([t, body]);
    const cr = Buffer.alloc(4); cr.writeUInt32BE(crc(cb), 0);
    return Buffer.concat([len, cb, cr]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  fs.writeFileSync(file, Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]));
}

const outDir = path.join(__dirname, 'output');
fs.mkdirSync(outDir, { recursive: true });
const save = (name, data, w, h) => { writePNG(path.join(outDir, name), data, w, h); console.log('  写入', name); };

// ── 1) 去水印测试图：自然渐变背景 + 角落半透明水印文字 ────────
{
  const W = 480, H = 320;
  const img = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    img[i] = 30 + (x / W) * 180;
    img[i + 1] = 60 + (y / H) * 120;
    img[i + 2] = 90 + ((x + y) / (W + H)) * 120;
    img[i + 3] = 255;
  }
  // 右下角半透明水印（若干细横线模拟文字笔画）
  for (let y = 230; y < 295; y += 5) for (let x = 320; x < 455; x++) {
    const i = (y * W + x) * 4;
    img[i] = Math.min(255, img[i] + 70);
    img[i + 1] = Math.min(255, img[i + 1] + 70);
    img[i + 2] = Math.min(255, img[i + 2] + 70);
  }
  save('wm_original.png', img, W, H);
  const auto = img.slice();
  const ok = ImageProcessor.removeWatermarkAuto(auto, W, H, { radius: 6 });
  save('wm_auto.png', auto, W, H);
  console.log('[自动去水印]', ok ? '检测到水印并已修复' : '未检测到（回退）');
}

// ── 2) 手动去水印：涂抹矩形区域 ─────────────────────────────
{
  const W = 480, H = 320;
  const img = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    img[i] = 40 + (x / W) * 160; img[i + 1] = 50; img[i + 2] = 140; img[i + 3] = 255;
  }
  for (let y = 90; y < 180; y++) for (let x = 110; x < 260; x++) {
    const i = (y * W + x) * 4; img[i] = Math.min(255, img[i] + 80); img[i + 1] = Math.min(255, img[i + 1] + 80); img[i + 2] = Math.min(255, img[i + 2] + 80);
  }
  save('manual_original.png', img, W, H);
  // 模拟画笔：在涂抹区中心画一条粗线段
  const strokes = [];
  for (let t = 0; t <= 20; t++) {
    strokes.push({ x: 110 + (150 * t / 20), y: 135, size: 50, type: 'mark' });
  }
  const mask = ImageProcessor.buildMaskFromStrokes(W, H, strokes, 1);
  ImageProcessor.dilateMask(mask, W, H, 4);
  const manual = img.slice();
  ImageProcessor.inpaintTelea(manual, W, H, mask, 6);
  save('manual_result.png', manual, W, H);
  console.log('[手动去水印] 笔刷mask已生成并修复');
}

// ── 3) 一键去背景：渐变背景 + 居中彩色主体 ───────────────────
{
  const W = 360, H = 360;
  const img = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    img[i] = 230 - (x / W) * 60; img[i + 1] = 235; img[i + 2] = 235 - (y / H) * 60; img[i + 3] = 255;
  }
  // 居中主体（红色圆）
  for (let y = 110; y < 250; y++) for (let x = 110; x < 250; x++) {
    const dx = x - 180, dy = y - 180;
    if (dx * dx + dy * dy <= 65 * 65) { const i = (y * W + x) * 4; img[i] = 220; img[i + 1] = 40; img[i + 2] = 40; }
  }
  save('bg_original.png', img, W, H);
  const keep = img.slice();
  ImageProcessor.removeBackground(keep, W, H, { mode: 'keep', feather: 2, tolerance: 28 });
  save('bg_keep.png', keep, W, H);
  let trans = 0; for (let i = 0; i < W * H; i++) if (keep[i * 4 + 3] === 0) trans++;
  console.log('[一键去背景-keep] 透明像素占比', (trans / (W * H) * 100).toFixed(1) + '%', '(主体应保留不透明)');
  const rm = img.slice();
  ImageProcessor.removeBackground(rm, W, H, { mode: 'remove', feather: 2, tolerance: 28 });
  save('bg_remove.png', rm, W, H);
  console.log('[一键去背景-remove] 输出不透明，主体区已修复为背景内容');
}

console.log('\n完成。请打开 tools/output/ 目录查看 before/after 对比图。');
