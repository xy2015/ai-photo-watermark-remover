/**
 * 图像修复算法集合
 *
 * 手动去水印使用 Telea 快速行进法（FMM）进行修复：
 *   - 结构保持：通过边缘（等值线）向内传播，保留纹理与边界，避免"糊成一片"
 *   - 仅修复 mask 标记的像素，原始像素纹丝不动，最大限度保真
 *
 * 相比原「加权邻域平均」实现（本质是模糊），本算法在视觉保真度上有质的提升。
 */
class ImageProcessor {
    // ──────────────────────────────────────────────────────────────
    // Telea 快速行进法（Fast Marching Method）修复
    //   data  : Uint8ClampedArray（RGBA），原地修改
    //   w/h   : 图像宽高
    //   mask  : Uint8Array，长度 w*h，>0 表示需要修复（空洞）的像素
    //   radius: 修复时参考邻域半径（默认 5，越大越平滑）
    // ──────────────────────────────────────────────────────────────
    static inpaintTelea(data, width, height, mask, radius = 5) {
        const w = width, h = height, N = w * h;

        const known = new Uint8Array(N); // 1 = 原始已知像素
        const done = new Uint8Array(N);  // 1 = 已定稿（原始 or 已修复）
        const hole = new Uint8Array(N);  // 1 = 空洞（待修复）
        let holeCount = 0;

        for (let i = 0; i < N; i++) {
            if (mask[i] > 0) { hole[i] = 1; holeCount++; }
            else { known[i] = 1; done[i] = 1; }
        }
        if (holeCount === 0) return; // 没有需要修复的区域

        // 空洞到最近已知像素的欧氏距离（用于快速行进的推进顺序与前沿法线）
        const sq = distanceTransformSquared(known, w, h); // seeds = 已知像素
        const dist = new Float32Array(N);
        for (let i = 0; i < N; i++) dist[i] = Math.sqrt(sq[i]);

        // 按距离从小到大推进（快速行进）
        const heap = new MinHeap();
        for (let i = 0; i < N; i++) if (hole[i]) heap.push(i, dist[i]);

        const R = radius, R2 = R * R;

        // 仅在"已定稿(done)"像素上取用局部梯度，避免空洞原始内容反馈污染传播
        const gradAt = (qi, c) => {
            const qx = qi % w, qy = (qi / w) | 0;
            const center = data[qi * 4 + c];
            const xl = qx > 0 && done[qi - 1] ? data[(qi - 1) * 4 + c] : center;
            const xr = qx < w - 1 && done[qi + 1] ? data[(qi + 1) * 4 + c] : center;
            const yt = qy > 0 && done[qi - w] ? data[(qi - w) * 4 + c] : center;
            const yb = qy < h - 1 && done[qi + w] ? data[(qi + w) * 4 + c] : center;
            return { gx: (xr - xl) * 0.5, gy: (yb - yt) * 0.5 };
        };

        while (!heap.isEmpty()) {
            const p = heap.pop();
            if (done[p]) continue;

            const px = p % w;
            const py = (p - px) / w;

            // 前沿法线 = 距离场的梯度方向（指向空洞内部）
            const xl = px > 0 ? dist[p - 1] : dist[p];
            const xr = px < w - 1 ? dist[p + 1] : dist[p];
            const yt = py > 0 ? dist[p - w] : dist[p];
            const yb = py < h - 1 ? dist[p + w] : dist[p];
            let nx = xr - xl;
            let ny = yb - yt;
            const nlen = Math.hypot(nx, ny);
            if (nlen > 1e-6) { nx /= nlen; ny /= nlen; }
            else { nx = 0; ny = 0; }

            let sr = 0, sg = 0, sb = 0, wsum = 0; // 方向加权（Telea 主项）
            let fr = 0, fg = 0, fb = 0, fw = 0;   // 无方向邻居时的兜底

            for (let dy = -R; dy <= R; dy++) {
                const qy = py + dy;
                if (qy < 0 || qy >= h) continue;
                for (let dx = -R; dx <= R; dx++) {
                    const d2 = dx * dx + dy * dy;
                    if (d2 > R2) continue;
                    const qx = px + dx;
                    if (qx < 0 || qx >= w) continue;

                    const qi = qy * w + qx;
                    if (!done[qi]) continue; // 只使用已定稿的邻居

                    // 从已知邻居 q 指向当前像素 p 的向量
                    const rx = -dx, ry = -dy;
                    const d = Math.sqrt(d2);
                    if (d < 1e-6) continue;
                    const rhx = rx / d, rhy = ry / d;

                    let wgt;
                    if (nlen > 1e-6) {
                        const dotn = nx * rhx + ny * rhy;
                        if (dotn <= 0) {
                            // 位于前沿"前方"的邻居不贡献方向项，仅计入兜底
                            const fwq = 1 / d;
                            fr += fwq * data[qi * 4];
                            fg += fwq * data[qi * 4 + 1];
                            fb += fwq * data[qi * 4 + 2];
                            fw += fwq;
                            continue;
                        }
                        wgt = dotn / d;
                    } else {
                        wgt = 1 / d;
                    }

                    // Telea 估计：I(q) + ∇I(q)·(p−q)，梯度取自已定稿像素，杜绝空洞污染
                    const gR = gradAt(qi, 0), gG = gradAt(qi, 1), gB = gradAt(qi, 2);
                    const vr = data[qi * 4] + gR.gx * rx + gR.gy * ry;
                    const vg = data[qi * 4 + 1] + gG.gx * rx + gG.gy * ry;
                    const vb = data[qi * 4 + 2] + gB.gx * rx + gB.gy * ry;
                    sr += wgt * vr; sg += wgt * vg; sb += wgt * vb; wsum += wgt;
                }
            }

            if (wsum > 0) {
                data[p * 4] = ImageProcessor._clamp(sr / wsum);
                data[p * 4 + 1] = ImageProcessor._clamp(sg / wsum);
                data[p * 4 + 2] = ImageProcessor._clamp(sb / wsum);
            } else if (fw > 0) {
                data[p * 4] = ImageProcessor._clamp(fr / fw);
                data[p * 4 + 1] = ImageProcessor._clamp(fg / fw);
                data[p * 4 + 2] = ImageProcessor._clamp(fb / fw);
            } else {
                data[p * 4] = data[p * 4 + 1] = data[p * 4 + 2] = 128;
            }
            done[p] = 1;
        }
    }

    // ──────────────────────────────────────────────────────────────
    // 由画笔轨迹构建 mask（Uint8Array）
    //   factor: 画笔坐标（CSS 像素）→ 目标分辨率 的缩放系数
    //   连续笔触用线段连接，避免快速拖动产生断点；橡皮擦从 mask 中擦除
    // ──────────────────────────────────────────────────────────────
    static buildMaskFromStrokes(width, height, brushStrokes, factor = 1) {
        const mask = new Uint8Array(width * height); // 0 = 保留，255 = 修复

        const stamp = (cx, cy, r, value) => {
            const x0 = Math.max(0, Math.floor(cx - r));
            const x1 = Math.min(width - 1, Math.ceil(cx + r));
            const y0 = Math.max(0, Math.floor(cy - r));
            const y1 = Math.min(height - 1, Math.ceil(cy + r));
            const r2 = r * r;
            for (let y = y0; y <= y1; y++) {
                for (let x = x0; x <= x1; x++) {
                    const dx = x - cx, dy = y - cy;
                    if (dx * dx + dy * dy <= r2) mask[y * width + x] = value;
                }
            }
        };

        const drawSeg = (x0, y0, x1, y1, r, value) => {
            const len = Math.hypot(x1 - x0, y1 - y0);
            const steps = Math.max(1, Math.ceil(len / Math.max(1, r))); // 步长≈r，圆相互重叠保证连续
            for (let s = 0; s <= steps; s++) {
                const t = s / steps;
                stamp(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, value);
            }
        };

        let prev = null;
        for (const s of brushStrokes) {
            const cx = s.x * factor, cy = s.y * factor, r = Math.max(0.5, (s.size / 2) * factor);

            if (s.type === 'eraser') {
                // 仅与"上一个橡皮擦点"连接，避免回连到远处的画笔点造成误擦
                if (prev && prev.type === 'eraser') {
                    drawSeg(prev.x * factor, prev.y * factor, cx, cy, Math.max(r, (prev.size / 2) * factor), 0);
                }
                stamp(cx, cy, r, 0);
                prev = s;
                continue;
            }

            // 仅与"上一个画笔点"连接，保证连续笔触
            if (prev && prev.type === 'mark') {
                drawSeg(prev.x * factor, prev.y * factor, cx, cy, Math.max(r, (prev.size / 2) * factor), 255);
            }
            stamp(cx, cy, r, 255);
            prev = s;
        }
        return mask;
    }

    // 将 mask 数组编码为 PNG dataURL（供后端 API 使用）
    static maskArrayToDataUrl(width, height, mask) {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        const img = ctx.createImageData(width, height);
        for (let i = 0; i < width * height; i++) {
            const v = mask[i] > 0 ? 255 : 0;
            img.data[i * 4] = v;
            img.data[i * 4 + 1] = v;
            img.data[i * 4 + 2] = v;
            img.data[i * 4 + 3] = 255;
        }
        ctx.putImageData(img, 0, 0);
        return canvas.toDataURL('image/png');
    }

    // ── mask 膨胀（覆盖抗锯齿/半透明残留）──────────────────────
    static dilateMask(mask, w, h, r) {
        if (r <= 0) return;
        const src = mask.slice();
        const r2 = r * r;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (!src[y * w + x]) continue;
                const y0 = Math.max(0, y - r), y1 = Math.min(h - 1, y + r);
                const x0 = Math.max(0, x - r), x1 = Math.min(w - 1, x + r);
                for (let yy = y0; yy <= y1; yy++) {
                    const dy = yy - y;
                    for (let xx = x0; xx <= x1; xx++) {
                        const dx = xx - x;
                        if (dx * dx + dy * dy <= r2) mask[yy * w + xx] = 255;
                    }
                }
            }
        }
    }

    // ── 一键去水印：自动检测水印区域 ──────────────────────────
    // 纯前端实现（无后端也可生效）。策略：
    //  1) 降采样灰度（提速）
    //  2) Sobel 边缘 + 自适应阈值（Canny 式）
    //  3) 连通分量 + 文字/logo 筛选（面积、长宽比、填充率）
    //  4) 合并邻近框（同一水印的笔画/字母）
    // 返回原图分辨率下的区域数组 [{x,y,width,height}]，未检测到返回 []
    static detectWatermarkRegions(data, width, height) {
        const MAX = 480;
        const scale = Math.min(1, MAX / Math.max(width, height));
        const sw = Math.max(1, Math.round(width * scale));
        const sh = Math.max(1, Math.round(height * scale));

        // 1) 降采样灰度（最近点采样，检测足够）
        const gray = new Float32Array(sw * sh);
        for (let yy = 0; yy < sh; yy++) {
            for (let xx = 0; xx < sw; xx++) {
                const sx = Math.min(width - 1, Math.floor(xx / scale));
                const sy = Math.min(height - 1, Math.floor(yy / scale));
                const i = (sy * width + sx) * 4;
                gray[yy * sw + xx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            }
        }

        // 2) Sobel 边缘 + 自适应阈值
        const mag = new Float32Array(sw * sh);
        let mx = 0;
        for (let y = 0; y < sh; y++) {
            for (let x = 0; x < sw; x++) {
                const xl = x > 0 ? gray[y * sw + x - 1] : gray[y * sw + x];
                const xr = x < sw - 1 ? gray[y * sw + x + 1] : gray[y * sw + x];
                const yt = y > 0 ? gray[(y - 1) * sw + x] : gray[y * sw + x];
                const yb = y < sh - 1 ? gray[(y + 1) * sw + x] : gray[y * sw + x];
                const m = Math.hypot(xr - xl, yb - yt);
                mag[y * sw + x] = m;
                if (m > mx) mx = m;
            }
        }
        const th = Math.max(14, mx * 0.15);
        const edge = new Uint8Array(sw * sh);
        for (let i = 0; i < sw * sh; i++) edge[i] = mag[i] > th ? 1 : 0;

        // 3) 连通分量（4 邻）
        const labels = new Int32Array(sw * sh).fill(-1);
        const comps = [];
        for (let i = 0; i < sw * sh; i++) {
            if (edge[i] && labels[i] < 0) {
                let x0 = sw, y0 = sh, x1 = 0, y1 = 0, cnt = 0;
                const stack = [i];
                labels[i] = comps.length;
                while (stack.length) {
                    const j = stack.pop();
                    const x = j % sw, y = (j / sw) | 0;
                    cnt++;
                    if (x < x0) x0 = x; if (x > x1) x1 = x;
                    if (y < y0) y0 = y; if (y > y1) y1 = y;
                    if (x > 0 && edge[j - 1] && labels[j - 1] < 0) { labels[j - 1] = comps.length; stack.push(j - 1); }
                    if (x < sw - 1 && edge[j + 1] && labels[j + 1] < 0) { labels[j + 1] = comps.length; stack.push(j + 1); }
                    if (y > 0 && edge[j - sw] && labels[j - sw] < 0) { labels[j - sw] = comps.length; stack.push(j - sw); }
                    if (y < sh - 1 && edge[j + sw] && labels[j + sw] < 0) { labels[j + sw] = comps.length; stack.push(j + sw); }
                }
                comps.push({ cnt, x0, y0, x1, y1 });
            }
        }

        // 4) 收集候选框（先不按长宽比剔除，避免细笔画被单独过滤）
        const rawBoxes = [];
        const minA = Math.max(6, Math.round(sw * sh * 0.0004));
        const maxA = sw * sh * 0.2;
        for (const c of comps) {
            const bw = c.x1 - c.x0 + 1, bh = c.y1 - c.y0 + 1;
            if (c.cnt < minA || c.cnt > maxA) continue;
            if (bw > sw * 0.95 || bh > sh * 0.95) continue;
            const aspect = bw / Math.max(1, bh);
            if (aspect > 200 || aspect < 1 / 200) continue;
            rawBoxes.push({ x: c.x0, y: c.y0, w: bw, h: bh });
        }

        // 5) 合并邻近框（同一水印的笔画/字母）
        rawBoxes.sort((a, b) => a.y - b.y || a.x - b.x);
        const merged = [];
        const gap = Math.max(4, Math.round(Math.min(sw, sh) * 0.012));
        for (const b of rawBoxes) {
            let placed = false;
            for (const m of merged) {
                const ox = Math.min(b.x + b.w, m.x + m.w) - Math.max(b.x, m.x);
                const oy = Math.min(b.y + b.h, m.y + m.h) - Math.max(b.y, m.y);
                if (ox > -gap && oy > -gap) {
                    const nx0 = Math.min(m.x, b.x), ny0 = Math.min(m.y, b.y);
                    const nx1 = Math.max(m.x + m.w, b.x + b.w), ny1 = Math.max(m.y + m.h, b.y + b.h);
                    m.x = nx0; m.y = ny0; m.w = nx1 - nx0; m.h = ny1 - ny0;
                    placed = true; break;
                }
            }
            if (!placed) merged.push({ ...b });
        }

        // 6) 合并后筛选：剔除极端细长/超大框（多为噪点或照片主体）
        const boxes = [];
        for (const m of merged) {
            if (m.w > sw * 0.95 || m.h > sh * 0.95) continue;
            const aspect = m.w / Math.max(1, m.h);
            if (aspect > 40 || aspect < 1 / 40) continue;
            // 实心文字/纯色 logo 填充率高，不能排除；照片主体由 maxA 拦截
            boxes.push(m);
        }

        // 7) 映射回原图分辨率
        return boxes.map(b => ({
            x: Math.floor(b.x / scale), y: Math.floor(b.y / scale),
            width: Math.ceil(b.w / scale), height: Math.ceil(b.h / scale)
        }));
    }

    // 一键去水印（纯前端）：检测→膨胀→Telea 修复。返回是否检测到区域
    static removeWatermarkAuto(data, width, height, opts = {}) {
        const regions = ImageProcessor.detectWatermarkRegions(data, width, height);
        if (!regions.length) return false;
        const mask = new Uint8Array(width * height);
        const pad = Math.max(2, Math.round(Math.min(width, height) * 0.004));
        for (const r of regions) {
            const x0 = Math.max(0, r.x - pad), y0 = Math.max(0, r.y - pad);
            const x1 = Math.min(width - 1, r.x + r.width + pad);
            const y1 = Math.min(height - 1, r.y + r.height + pad);
            for (let y = y0; y <= y1; y++)
                for (let x = x0; x <= x1; x++) mask[y * width + x] = 255;
        }
        ImageProcessor.dilateMask(mask, width, height, pad);
        ImageProcessor.inpaintTelea(data, width, height, mask, opts.radius || 6);
        return true;
    }

    // ── 一键去背景（纯前端）──────────────────────────────────
    // 区域生长：所有边框像素作为背景种子，沿"相邻像素颜色相近"的邻域蔓延，
    // 在主体与背景颜色不连续处自然停止，从而把居中主体保留为前景。
    // mode='keep'  → 背景透明（alpha=0）；mode='remove' → 删除主体并用 Telea 修复。
    static removeBackground(data, width, height, opts = {}) {
        const tolerance = opts.tolerance != null ? opts.tolerance : 36; // 邻域颜色距离阈值
        const feather = opts.feather != null ? opts.feather : 2;          // alpha 边缘羽化半径
        const mode = opts.mode || 'keep';
        const n = width * height;

        const isBg = new Uint8Array(n);
        const visited = new Uint8Array(n);
        const stack = [];

        // 种子：所有边框像素（边框几乎总是背景）
        const seed = (x, y) => {
            const i = y * width + x;
            if (visited[i]) return;
            visited[i] = 1; isBg[i] = 1; stack.push(i);
        };
        for (let x = 0; x < width; x++) { seed(x, 0); seed(x, height - 1); }
        for (let y = 0; y < height; y++) { seed(0, y); seed(width - 1, y); }

        const tol2 = tolerance * tolerance * 3;
        while (stack.length) {
            const i = stack.pop();
            const x = i % width, y = (i / width) | 0;
            const p = i * 4;
            const cr = data[p], cg = data[p + 1], cb = data[p + 2];
            const tryGrow = (j) => {
                if (visited[j]) return;
                const jp = j * 4;
                const dr = data[jp] - cr, dg = data[jp + 1] - cg, db = data[jp + 2] - cb;
                if (dr * dr + dg * dg + db * db <= tol2) {
                    visited[j] = 1; isBg[j] = 1; stack.push(j);
                }
            };
            if (x > 0) tryGrow(i - 1);
            if (x < width - 1) tryGrow(i + 1);
            if (y > 0) tryGrow(i - width);
            if (y < height - 1) tryGrow(i + width);
        }

        // 清理：少量迭代多数投票，去除噪点/小洞
        for (let it = 0; it < 2; it++) ImageProcessor._cleanupMask(isBg, width, height);

        // 写入 alpha（背景透明）
        for (let p = 0; p < n; p++) data[p * 4 + 3] = isBg[p] ? 0 : 255;

        // 边缘羽化：对 alpha 做多次 3x3 均值模糊，仅过渡带产生半透明
        if (feather > 0) ImageProcessor._featherAlpha(data, width, height, feather);

        // 删除主体模式：用 Telea 把主体区域（非背景）修复为背景内容
        if (mode === 'remove') {
            const hole = new Uint8Array(n);
            for (let p = 0; p < n; p++) hole[p] = isBg[p] ? 0 : 255;
            ImageProcessor.inpaintTelea(data, width, height, hole, 6);
            for (let p = 0; p < n; p++) data[p * 4 + 3] = 255; // 输出不透明
        }
        return data;
    }

    static _cleanupMask(mask, w, h) {
        const src = mask.slice();
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                let s = src[y * w + x], c = 1;
                if (x > 0) { s += src[y * w + x - 1]; c++; }
                if (x < w - 1) { s += src[y * w + x + 1]; c++; }
                if (y > 0) { s += src[(y - 1) * w + x]; c++; }
                if (y < h - 1) { s += src[(y + 1) * w + x]; c++; }
                mask[y * w + x] = s * 2 >= c ? 1 : 0;
            }
        }
    }

    static _featherAlpha(data, width, height, radius) {
        const n = width * height;
        let alpha = new Uint8ClampedArray(n);
        for (let p = 0; p < n; p++) alpha[p] = data[p * 4 + 3];
        const iters = Math.max(1, radius);
        for (let it = 0; it < iters; it++) {
            const tmp = new Uint8ClampedArray(n);
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    let s = 0, c = 0;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const xx = x + dx, yy = y + dy;
                            if (xx < 0 || yy < 0 || xx >= width || yy >= height) continue;
                            s += alpha[yy * width + xx]; c++;
                        }
                    }
                    tmp[y * width + x] = s / c;
                }
            }
            alpha = tmp;
        }
        for (let p = 0; p < n; p++) data[p * 4 + 3] = alpha[p];
    }

    // ── 内部工具 ────────────────────────────────────────────────
    static _clamp(v) {
        return v < 0 ? 0 : (v > 255 ? 255 : (v + 0.5) | 0);
    }
}

/* ============================================================
 * 纯函数工具（与 DOM 无关，便于单测）
 * ============================================================ */

// 二叉最小堆，按 key 排序存储 index
class MinHeap {
    constructor() { this.items = []; this.keys = []; }
    push(item, key) {
        this.items.push(item); this.keys.push(key);
        let i = this.items.length - 1;
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.keys[p] <= this.keys[i]) break;
            this._swap(i, p); i = p;
        }
    }
    pop() {
        const n = this.items.length;
        const top = this.items[0];
        const lastItem = this.items.pop(), lastKey = this.keys.pop();
        if (n > 1) {
            this.items[0] = lastItem; this.keys[0] = lastKey;
            let i = 0;
            for (;;) {
                const l = 2 * i + 1, r = 2 * i + 2;
                let smallest = i;
                if (l < this.items.length && this.keys[l] < this.keys[smallest]) smallest = l;
                if (r < this.items.length && this.keys[r] < this.keys[smallest]) smallest = r;
                if (smallest === i) break;
                this._swap(i, smallest); i = smallest;
            }
        }
        return top;
    }
    _swap(a, b) {
        const ti = this.items[a]; this.items[a] = this.items[b]; this.items[b] = ti;
        const tk = this.keys[a]; this.keys[a] = this.keys[b]; this.keys[b] = tk;
    }
    isEmpty() { return this.items.length === 0; }
}

// 一维平方距离变换（Felzenszwalb & Huttenlocher 算法）
function _edt1d(f, n) {
    const d = new Float64Array(n);
    const v = new Int32Array(n);
    const z = new Float64Array(n + 1);
    let k = 0;
    v[0] = 0; z[0] = -Infinity; z[1] = Infinity;
    for (let q = 1; q < n; q++) {
        let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        while (s <= z[k]) {
            k--;
            s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
        }
        k++; v[k] = q; z[k] = s; z[k + 1] = Infinity;
    }
    k = 0;
    for (let q = 0; q < n; q++) {
        while (z[k + 1] < q) k++;
        const dx = q - v[k];
        d[q] = dx * dx + f[v[k]];
    }
    return d;
}

// 二维欧氏距离变换（平方）。seedMask: 1 表示"种子"（已知），0 表示空洞
function distanceTransformSquared(seedMask, width, height) {
    const N = width * height;
    const INF = 1e20;
    const f = new Float64Array(N);
    for (let i = 0; i < N; i++) f[i] = seedMask[i] ? 0 : INF;

    const tmp = new Float64Array(N);
    const col = new Float64Array(height);
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) col[y] = f[y * width + x];
        const d = _edt1d(col, height);
        for (let y = 0; y < height; y++) tmp[y * width + x] = d[y];
    }
    const row = new Float64Array(width);
    const out = new Float64Array(N);
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) row[x] = tmp[y * width + x];
        const d = _edt1d(row, width);
        for (let x = 0; x < width; x++) out[y * width + x] = d[x];
    }
    return out;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ImageProcessor, distanceTransformSquared };
}
