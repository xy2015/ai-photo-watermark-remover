class ImageProcessor {
    /**
     * 加权邻域插值修复（替代原有的平均色+噪声）
     * 对每个待修复像素，从周围已知像素按距离加权取色
     */
    static inpaintWeighted(data, width, height, maskBounds) {
        const { x, y, w, h } = maskBounds;
        const startX = Math.max(0, Math.floor(x));
        const startY = Math.max(0, Math.floor(y));
        const endX = Math.min(width, Math.ceil(x + w));
        const endY = Math.min(height, Math.ceil(y + h));

        const temp = new Uint8ClampedArray(data);

        for (let py = startY; py < endY; py++) {
            for (let px = startX; px < endX; px++) {
                const idx = (py * width + px) * 4;
                const result = this._weightedSample(data, width, height, px, py, 15);
                temp[idx] = result.r;
                temp[idx + 1] = result.g;
                temp[idx + 2] = result.b;
            }
        }

        for (let i = 0; i < data.length; i++) {
            data[i] = temp[i];
        }
    }

    static _weightedSample(data, width, height, cx, cy, radius) {
        let rSum = 0, gSum = 0, bSum = 0, weightSum = 0;

        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                if (dx === 0 && dy === 0) continue;
                const px = cx + dx;
                const py = cy + dy;
                if (px < 0 || px >= width || py < 0 || py >= height) continue;

                const idx = (py * width + px) * 4;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const weight = 1 / (dist + 0.01);

                rSum += data[idx] * weight;
                gSum += data[idx + 1] * weight;
                bSum += data[idx + 2] * weight;
                weightSum += weight;
            }
        }

        if (weightSum === 0) return { r: 128, g: 128, b: 128 };

        return {
            r: Math.round(rSum / weightSum),
            g: Math.round(gSum / weightSum),
            b: Math.round(bSum / weightSum)
        };
    }

    static generateMask(canvas, brushStrokes) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = canvas.width;
        maskCanvas.height = canvas.height;
        const maskCtx = maskCanvas.getContext('2d');

        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        maskCtx.fillStyle = 'white';

        brushStrokes.forEach(stroke => {
            maskCtx.beginPath();
            maskCtx.arc(stroke.x, stroke.y, stroke.size / 2, 0, Math.PI * 2);
            maskCtx.fill();
        });

        return maskCanvas.toDataURL('image/png');
    }

    static getBrushBounds(brushStrokes) {
        if (brushStrokes.length === 0) return null;

        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;

        brushStrokes.forEach(stroke => {
            minX = Math.min(minX, stroke.x - stroke.size);
            minY = Math.min(minY, stroke.y - stroke.size);
            maxX = Math.max(maxX, stroke.x + stroke.size);
            maxY = Math.max(maxY, stroke.y + stroke.size);
        });

        return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
    }
}
