/**
 * 画布编辑器：Canvas 绑定、画笔、缩放、历史记录
 */
class CanvasEditor {
    constructor(canvas, selectionOverlay) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.selectionOverlay = selectionOverlay;

        this.image = null;
        this.originalImageData = null;
        this.brushStrokes = [];
        this.history = [];
        this.historyIndex = -1;
        this.isDrawing = false;
        this.brushSize = 20;
        this.currentTool = 'mark';
        this.zoom = 100;
    }

    loadImage(img, dataUrl) {
        this.image = img;
        this.originalImage = img; // 全分辨率原图，用于保真修复与导出
        this.originalImageDataUrl = dataUrl;
        this.setupCanvas();
        this.saveToHistory();
    }

    setupCanvas() {
        const container = this.canvas.parentElement.parentElement;
        let maxWidth = container.clientWidth - 64;
        let maxHeight = container.clientHeight - 64;

        if (maxWidth <= 0 || maxHeight <= 0) {
            maxWidth = Math.min(window.innerWidth - 500, 800);
            maxHeight = Math.min(window.innerHeight - 200, 600);
        }

        let width = this.image.width;
        let height = this.image.height;
        const scale = Math.min(maxWidth / width, maxHeight / height, 1);
        width = Math.max(100, Math.floor(width * scale));
        height = Math.max(100, Math.floor(height * scale));

        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx.clearRect(0, 0, width, height);
        this.ctx.drawImage(this.image, 0, 0, width, height);
        this.originalImageData = this.ctx.getImageData(0, 0, width, height);
        this.canvas.style.display = 'block';
    }

    getImageDataUrl() {
        return this.canvas.toDataURL('image/png');
    }

    // ── 画笔 ────────────────────────────────

    handleMouseDown(e) {
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        this.addBrushStroke(e.clientX - rect.left, e.clientY - rect.top);
    }

    handleMouseMove(e) {
        if (!this.isDrawing) return;
        const rect = this.canvas.getBoundingClientRect();
        this.addBrushStroke(e.clientX - rect.left, e.clientY - rect.top);
    }

    handleMouseUp() {
        this.isDrawing = false;
    }

    addBrushStroke(x, y) {
        this.brushStrokes.push({ x, y, size: this.brushSize, type: this.currentTool });

        const stroke = document.createElement('div');
        stroke.className = 'brush-stroke';
        stroke.style.left = `${x - this.brushSize / 2}px`;
        stroke.style.top = `${y - this.brushSize / 2}px`;
        stroke.style.width = `${this.brushSize}px`;
        stroke.style.height = `${this.brushSize}px`;

        if (this.currentTool === 'eraser') {
            stroke.style.background = 'rgba(245, 63, 63, 0.3)';
        }

        this.selectionOverlay.appendChild(stroke);
    }

    clearBrushStrokes() {
        this.brushStrokes = [];
        this.selectionOverlay.innerHTML = '';
    }

    // ── 历史记录 ────────────────────────────────

    saveToHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        this.historyIndex = this.history.length - 1;
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
        }
    }

    canUndo() { return this.historyIndex > 0; }
    canRedo() { return this.historyIndex < this.history.length - 1; }

    reset() {
        if (this.image && this.originalImageData) {
            this.ctx.putImageData(this.originalImageData, 0, 0);
            this.clearBrushStrokes();
            this.history = [];
            this.historyIndex = -1;
            this.saveToHistory();
        }
    }

    // ── 缩放 ────────────────────────────────

    zoomIn() {
        if (this.zoom < 200) { this.zoom += 10; this.updateZoom(); }
    }

    zoomOut() {
        if (this.zoom > 50) { this.zoom -= 10; this.updateZoom(); }
    }

    fitScreen() {
        this.zoom = 100;
        this.updateZoom();
    }

    updateZoom() {
        const wrapper = this.canvas.parentElement;
        wrapper.style.transform = `scale(${this.zoom / 100})`;
        wrapper.style.transformOrigin = 'center';
    }

    getZoomText() { return `${this.zoom}%`; }

    // ── 图像显示 ────────────────────────────────

    loadProcessedImage(imageData) {
        this.processedImageData = imageData;
        const img = new Image();
        img.onload = () => {
            this.processedImage = img;
            // 保存全分辨率结果用于下载（保真）
            const off = document.createElement('canvas');
            off.width = img.naturalWidth;
            off.height = img.naturalHeight;
            off.getContext('2d').drawImage(img, 0, 0);
            this.fullResResult = off;
            // 显示缩放到画布
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = imageData;
    }

    showOriginal() {
        const img = new Image();
        img.onload = () => {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        };
        img.src = this.originalImageDataUrl;
    }

    showProcessed() {
        if (this.processedImageData) {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            };
            img.src = this.processedImageData;
        }
    }

    hasProcessed() { return !!this.processedImageData; }
    hasOriginal() { return !!this.originalImageDataUrl; }

    download() {
        const link = document.createElement('a');
        link.download = `${this.downloadName || 'removed-watermark'}-${Date.now()}.png`;
        if (this.fullResResult) {
            link.href = this.fullResResult.toDataURL('image/png');
        } else if (this.originalImage) {
            // 未处理时也按原图全分辨率导出，避免被显示缩放压缩
            const off = document.createElement('canvas');
            off.width = this.originalImage.width;
            off.height = this.originalImage.height;
            off.getContext('2d').drawImage(this.originalImage, 0, 0);
            link.href = off.toDataURL('image/png');
        } else {
            link.href = this.canvas.toDataURL('image/png');
        }
        link.click();
    }

    // 返回全分辨率原图 dataURL（供后端 API 使用，保证处理与导出保真）
    getFullResDataUrl() {
        const off = document.createElement('canvas');
        off.width = this.originalImage.width;
        off.height = this.originalImage.height;
        off.getContext('2d').drawImage(this.originalImage, 0, 0);
        return off.toDataURL('image/png');
    }

    // CSS 显示坐标 → 全分辨率 的缩放系数（含缩放控件 transform）
    getFullResFactor() {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.width > 0) return this.originalImage.width / rect.width;
        return 1;
    }

    // 本地处理：在全分辨率离屏画布上修复，导出保持原清晰度
    // 返回 true 表示有像素被改动（用于提示用户），false 表示未检测到目标
    processLocal(processor, currentTab) {
        const off = document.createElement('canvas');
        off.width = this.originalImage.width;
        off.height = this.originalImage.height;
        const octx = off.getContext('2d');
        octx.drawImage(this.originalImage, 0, 0);
        const offData = octx.getImageData(0, 0, off.width, off.height);

        const W = off.width, H = off.height;
        const factor = this.getFullResFactor();
        let changed = false;

        if (currentTab === 'manual' && this.brushStrokes.length > 0) {
            let mask = processor.buildMaskFromStrokes(W, H, this.brushStrokes, factor);
            // 膨胀以覆盖抗锯齿/半透明水印残留光晕，避免涂抹后仍有鬼影
            processor.dilateMask(mask, W, H, Math.max(2, Math.round(Math.min(W, H) * 0.004)));
            processor.inpaintTelea(offData.data, W, H, mask, 6);
            changed = true;
        } else {
            // 自动模式：边缘检测定位水印区域并修复（无后端时也能生效）
            changed = processor.removeWatermarkAuto(offData.data, W, H, { radius: 6 });
        }

        octx.putImageData(offData, 0, 0);
        this.fullResResult = off; // 供下载使用（全分辨率）

        // 显示：缩放到显示画布
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(off, 0, 0, this.canvas.width, this.canvas.height);
        this.processedImageData = off.toDataURL('image/png');
        return changed;
    }

    // 本地一键去背景：全分辨率离屏画布 + 区域生长算法（无后端时的降级方案）
    processLocalBackground(processor, opts) {
        const off = document.createElement('canvas');
        off.width = this.originalImage.width;
        off.height = this.originalImage.height;
        const octx = off.getContext('2d');
        octx.drawImage(this.originalImage, 0, 0);
        const offData = octx.getImageData(0, 0, off.width, off.height);

        processor.removeBackground(offData.data, off.width, off.height, opts || {});

        octx.putImageData(offData, 0, 0);
        this.fullResResult = off; // 含 alpha，供下载（保真）

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(off, 0, 0, this.canvas.width, this.canvas.height);
        this.processedImageData = off.toDataURL('image/png');
    }

    // 棋盘格背景：透明区域可视化（去背景模式开启）
    setBgMode(on) {
        const wrapper = this.canvas.parentElement;
        if (wrapper) wrapper.classList.toggle('bg-mode', !!on);
    }
}
