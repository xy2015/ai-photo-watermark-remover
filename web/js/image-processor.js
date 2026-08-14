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

        // 预计算原始图像的梯度（仅在已知像素上取用，稳定不反馈）
        const gx = new Float32Array(N * 3);
        const gy = new Float32Array(N * 3);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = y * w + x;
                for (let c = 0; c < 3; c++) {
                    const xl = x > 0 ? data[(i - 1) * 4 + c] : data[i * 4 + c];
                    const xr = x < w - 1 ? data[(i + 1) * 4 + c] : data[i * 4 + c];
                    const yt = y > 0 ? data[(i - w) * 4 + c] : data[i * 4 + c];
                    const yb = y < h - 1 ? data[(i + w) * 4 + c] : data[i * 4 + c];
                    gx[i * 3 + c] = (xr - xl) * 0.5;
                    gy[i * 3 + c] = (yb - yt) * 0.5;
                }
            }
        }

        // 空洞到最近已知像素的欧氏距离（用于快速行进的推进顺序与前沿法线）
        const sq = distanceTransformSquared(known, w, h); // seeds = 已知像素
        const dist = new Float32Array(N);
        for (let i = 0; i < N; i++) dist[i] = Math.sqrt(sq[i]);

        // 按距离从小到大推进（快速行进）
        const heap = new MinHeap();
        for (let i = 0; i < N; i++) if (hole[i]) heap.push(i, dist[i]);

        const R = radius, R2 = R * R;

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

                    // Telea 估计：I(q) + ∇I(q)·(p−q)
                    const vr = data[qi * 4] + gx[qi * 3] * rx + gy[qi * 3] * ry;
                    const vg = data[qi * 4 + 1] + gx[qi * 3 + 1] * rx + gy[qi * 3 + 1] * ry;
                    const vb = data[qi * 4 + 2] + gx[qi * 3 + 2] * rx + gy[qi * 3 + 2] * ry;
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

    // ── 一键去背景（纯前端降级算法）────────────────────────────
    // 区域生长：从四边种子出发，沿"局部颜色相近"的邻域蔓延，
    // 可跟随渐变背景、在遇到强边缘（主体轮廓）处停止。
    // mode='keep'  → 背景透明（alpha=0）；mode='remove' → 删除主体并用 Telea 修复。
    static removeBackground(data, width, height, opts = {}) {
        const tolerance = opts.tolerance != null ? opts.tolerance : 34; // 邻域颜色距离阈值
        const feather = opts.feather != null ? opts.feather : 2;         // alpha 边缘羽化半径
        const mode = opts.mode || 'keep';
        const n = width * height;

        const at = (x, y) => (y * width + x) * 4;
        const dist2 = (r, g, b, R, G, B) => {
            const dr = r - R, dg = g - G, db = b - B;
            return dr * dr + dg * dg + db * db;
        };

        const isBg = new Uint8Array(n);
        const visited = new Uint8Array(n);
        const stack = [];
        const seedTol2 = tolerance * tolerance * 3;

        // 1) 背景参考色：四角 3x3 小块的均值（四角几乎总是背景；渐变时各自独立）
        const cornerColor = (cx, cy) => {
            let r = 0, g = 0, b = 0, c = 0;
            for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const xx = Math.min(width - 1, Math.max(0, cx + dx));
                const yy = Math.min(height - 1, Math.max(0, cy + dy));
                const i = at(xx, yy); r += data[i]; g += data[i + 1]; b += data[i + 2]; c++;
            }
            return [r / c, g / c, b / c];
        };
        const corners = [
            cornerColor(1, 1), cornerColor(width - 2, 1),
            cornerColor(1, height - 2), cornerColor(width - 2, height - 2)
        ];
        const nearestCorner = (x, y) => {
            const cxs = [1, width - 2, 1, width - 2];
            const cys = [1, 1, height - 2, height - 2];
            let best = 0, bd = Infinity;
            for (let k = 0; k < 4; k++) {
                const d = (x - cxs[k]) * (x - cxs[k]) + (y - cys[k]) * (y - cys[k]);
                if (d < bd) { bd = d; best = k; }
            }
            return corners[best];
        };

        // 2) 仅"接近最近角颜色"的边框像素作为背景种子（主体贴边的边不会被误种）
        const seedBorder = (x, y) => {
            const i = y * width + x;
            if (visited[i]) return;
            visited[i] = 1;
            const p = at(x, y);
            const ref = nearestCorner(x, y);
            if (dist2(data[p], data[p + 1], data[p + 2], ref[0], ref[1], ref[2]) <= seedTol2) {
                isBg[i] = 1; stack.push(i);
            }
        };
        for (let x = 0; x < width; x++) { seedBorder(x, 0); seedBorder(x, height - 1); }
        for (let y = 0; y < height; y++) { seedBorder(0, y); seedBorder(width - 1, y); }

        // 3) 区域生长：邻居被接受当且仅当"与当前像素"局部颜色接近（跟随渐变、止步强边缘）
        while (stack.length) {
            const i = stack.pop();
            const x = i % width, y = (i / width) | 0;
            const p = i * 4;
            const cr = data[p], cg = data[p + 1], cb = data[p + 2];
            if (x > 0) ImageProcessor._growNeighbor(isBg, visited, stack, data, width, i - 1, cr, cg, cb, tolerance);
            if (x < width - 1) ImageProcessor._growNeighbor(isBg, visited, stack, data, width, i + 1, cr, cg, cb, tolerance);
            if (y > 0) ImageProcessor._growNeighbor(isBg, visited, stack, data, width, i - width, cr, cg, cb, tolerance);
            if (y < height - 1) ImageProcessor._growNeighbor(isBg, visited, stack, data, width, i + width, cr, cg, cb, tolerance);
        }

        // 4) 写入 alpha（背景透明）
        for (let p = 0; p < n; p++) data[p * 4 + 3] = isBg[p] ? 0 : 255;

        // 5) 边缘羽化：对 alpha 做多次 3x3 均值模糊，仅过渡带产生半透明
        if (feather > 0) ImageProcessor._featherAlpha(data, width, height, feather);

        // 6) 删除主体模式：用 Telea 把主体区域（非背景）修复为背景内容
        if (mode === 'remove') {
            const hole = new Uint8Array(n);
            for (let p = 0; p < n; p++) hole[p] = isBg[p] ? 0 : 255;
            ImageProcessor.inpaintTelea(data, width, height, hole, 5);
            for (let p = 0; p < n; p++) data[p * 4 + 3] = 255; // 输出不透明
        }
        return data;
    }

    static _growNeighbor(isBg, visited, stack, data, width, j, cr, cg, cb, tolerance) {
        if (visited[j]) return;
        visited[j] = 1;
        const p = j * 4;
        const dr = data[p] - cr, dg = data[p + 1] - cg, db = data[p + 2] - cb;
        if (dr * dr + dg * dg + db * db <= tolerance * tolerance * 3) {
            isBg[j] = 1;
            stack.push(j);
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
