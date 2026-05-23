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
        link.download = `removed-watermark-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
    }

    processLocal(processor, currentTab) {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);

        if (currentTab === 'manual' && this.brushStrokes.length > 0) {
            const bounds = processor.getBrushBounds(this.brushStrokes);
            if (bounds) {
                processor.inpaintWeighted(imageData.data, this.canvas.width, this.canvas.height, bounds);
            }
        } else {
            const startX = Math.floor(this.canvas.width * 0.65);
            const startY = Math.floor(this.canvas.height * 0.75);
            const w = Math.floor(this.canvas.width * 0.3);
            const h = Math.floor(this.canvas.height * 0.2);
            processor.inpaintWeighted(imageData.data, this.canvas.width, this.canvas.height, { x: startX, y: startY, w, h });
        }

        this.ctx.putImageData(imageData, 0, 0);
    }
}
