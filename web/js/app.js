/**
 * AI 去水印 - 智能图片水印去除工具
 * 主应用逻辑
 */

class WatermarkRemoverApp {
    constructor() {
        this.currentTab = 'auto';
        this.currentTool = 'mark';
        this.image = null;
        this.originalImageData = null;
        this.canvas = null;
        this.ctx = null;
        this.brushStrokes = [];
        this.history = [];
        this.historyIndex = -1;
        this.isDrawing = false;
        this.brushSize = 20;
        this.zoom = 100;
        this.isProcessing = false;
        this.progress = 0;
        this.apiBaseUrl = 'http://localhost:5000/api';
        this.selectedRegion = 'bottom-right';
        this.isShowingOriginal = false;
        this.processedImageData = null;
        this.originalImageDataUrl = null;
        
        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.checkApiHealth();
    }

    /**
     * 缓存DOM元素引用
     */
    cacheElements() {
        this.elements = {
            landingPage: document.getElementById('landingPage'),
            editorPage: document.getElementById('editorPage'),
            feedbackPage: document.getElementById('feedbackPage'),
            privacyPage: document.getElementById('privacyPage'),
            mainFooter: document.getElementById('mainFooter'),
            mainNav: document.getElementById('mainNav'),
            logoLink: document.getElementById('logoLink'),
            navLinks: document.querySelectorAll('.nav-link'),
            
            uploadArea: document.getElementById('uploadArea'),
            fileInput: document.getElementById('fileInput'),
            
            canvas: document.getElementById('imageCanvas'),
            canvasWrapper: document.getElementById('canvasWrapper'),
            selectionOverlay: document.getElementById('selectionOverlay'),
            processingOverlay: document.getElementById('processingOverlay'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),
            
            tabBtns: document.querySelectorAll('.tab-btn'),
            autoTab: document.getElementById('autoTab'),
            manualTab: document.getElementById('manualTab'),
            
            brushSize: document.getElementById('brushSize'),
            brushSizeValue: document.getElementById('brushSizeValue'),
            markTool: document.getElementById('markTool'),
            eraserTool: document.getElementById('eraserTool'),
            
            undoBtn: document.getElementById('undoBtn'),
            redoBtn: document.getElementById('redoBtn'),
            resetBtn: document.getElementById('resetBtn'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            fitScreenBtn: document.getElementById('fitScreenBtn'),
            zoomValue: document.getElementById('zoomValue'),
            compareBtn: document.getElementById('compareBtn'),
            
            processBtn: document.getElementById('processBtn'),
            downloadBtn: document.getElementById('downloadBtn'),
            backHomeBtn: document.getElementById('backHomeBtn'),
            
            feedbackForm: document.getElementById('feedbackForm'),
            feedbackSuccess: document.getElementById('feedbackSuccess'),
            feedbackFormWrapper: document.getElementById('feedbackFormWrapper'),
            continueFeedbackBtn: document.getElementById('continueFeedbackBtn'),
            
            toastContainer: document.getElementById('toastContainer')
        };
        
        this.canvas = this.elements.canvas;
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 绑定事件监听器
     */
    bindEvents() {
        this.elements.uploadArea.addEventListener('click', (e) => {
            if (e.target.closest('.upload-btn') || e.target === this.elements.uploadArea || e.target.closest('.upload-content')) {
                this.elements.fileInput.click();
            }
        });
        
        this.elements.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        
        this.elements.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.elements.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.elements.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        this.elements.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });
        
        this.elements.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.addEventListener('click', () => this.selectRegion(btn.dataset.region));
        });
        
        this.elements.brushSize.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            this.elements.brushSizeValue.textContent = `${this.brushSize}px`;
        });
        
        this.elements.markTool.addEventListener('click', () => this.switchTool('mark'));
        this.elements.eraserTool.addEventListener('click', () => this.switchTool('eraser'));
        
        this.elements.undoBtn.addEventListener('click', () => this.undo());
        this.elements.redoBtn.addEventListener('click', () => this.redo());
        this.elements.resetBtn.addEventListener('click', () => this.reset());
        this.elements.zoomInBtn.addEventListener('click', () => this.zoomIn());
        this.elements.zoomOutBtn.addEventListener('click', () => this.zoomOut());
        this.elements.fitScreenBtn.addEventListener('click', () => this.fitScreen());
        
        this.elements.compareBtn.addEventListener('click', () => this.toggleCompare());
        
        this.elements.processBtn.addEventListener('click', () => this.process());
        this.elements.downloadBtn.addEventListener('click', () => this.download());
        this.elements.backHomeBtn.addEventListener('click', () => this.goBack());
        this.elements.logoLink.addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('home');
        });
        
        this.canvas.addEventListener('mousedown', (e) => this.handleCanvasMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleCanvasMouseUp(e));
        this.canvas.addEventListener('mouseleave', (e) => this.handleCanvasMouseUp(e));
        
        if (this.elements.feedbackForm) {
            this.elements.feedbackForm.addEventListener('submit', (e) => this.handleFeedbackSubmit(e));
        }
        
        if (this.elements.continueFeedbackBtn) {
            this.elements.continueFeedbackBtn.addEventListener('click', () => this.resetFeedbackForm());
        }
        
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }

    /**
     * 检查API健康状态
     */
    async checkApiHealth() {
        try {
            const response = await fetch(`${this.apiBaseUrl}/health`);
            const data = await response.json();
            console.log('API状态:', data.message);
        } catch (error) {
            console.warn('后端服务未启动，将使用本地处理模式');
        }
    }

    /**
     * 处理文件选择
     * @param {Event} e - 文件选择事件
     */
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.loadImage(file);
        }
    }

    /**
     * 处理拖拽悬停
     * @param {DragEvent} e - 拖拽事件
     */
    handleDragOver(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.add('drag-over');
    }

    /**
     * 处理拖拽离开
     * @param {DragEvent} e - 拖拽事件
     */
    handleDragLeave(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('drag-over');
    }

    /**
     * 处理文件拖放
     * @param {DragEvent} e - 拖拽事件
     */
    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('drag-over');
        
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        } else {
            this.showToast('请上传图片文件', 'error');
        }
    }

    /**
     * 加载图片到画布
     * @param {File} file - 图片文件
     */
    loadImage(file) {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.image = img;
                this.imageDataUrl = e.target.result;
                this.originalImageDataUrl = e.target.result;
                this.setupCanvas();
                this.showEditor();
                this.saveToHistory();
                this.showToast('图片加载成功', 'success');
            };
            img.onerror = () => {
                this.showToast('图片加载失败', 'error');
            };
            img.src = e.target.result;
        };
        
        reader.onerror = () => {
            this.showToast('文件读取失败', 'error');
        };
        
        reader.readAsDataURL(file);
    }

    /**
     * 设置画布尺寸和绘制图片
     */
    setupCanvas() {
        const container = this.elements.canvasWrapper.parentElement;
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
        console.log('Canvas setup complete:', width, 'x', height);
    }

    /**
     * 显示编辑器界面
     */
    showEditor() {
        this.hideAllPages();
        this.elements.editorPage.classList.remove('hidden');
        
        setTimeout(() => {
            if (this.image) {
                this.setupCanvas();
            }
        }, 100);
    }

    /**
     * 隐藏所有页面
     */
    hideAllPages() {
        this.elements.landingPage.classList.add('hidden');
        this.elements.editorPage.classList.add('hidden');
        this.elements.feedbackPage.classList.add('hidden');
        this.elements.privacyPage.classList.add('hidden');
        this.elements.mainFooter.classList.add('hidden');
    }

    /**
     * 导航到指定页面
     * @param {string} page - 页面名称 ('home' | 'feedback' | 'privacy')
     */
    navigateTo(page) {
        this.hideAllPages();
        
        this.elements.navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.page === page);
        });
        
        switch (page) {
            case 'home':
                this.elements.landingPage.classList.remove('hidden');
                this.elements.mainFooter.classList.remove('hidden');
                break;
            case 'feedback':
                this.elements.feedbackPage.classList.remove('hidden');
                this.elements.mainFooter.classList.remove('hidden');
                break;
            case 'privacy':
                this.elements.privacyPage.classList.remove('hidden');
                this.elements.mainFooter.classList.remove('hidden');
                break;
        }
        
        window.scrollTo(0, 0);
    }

    /**
     * 返回首页
     */
    goBack() {
        this.navigateTo('home');
        this.reset();
    }

    /**
     * 切换标签页
     * @param {string} tab - 标签名称 ('auto' | 'manual')
     */
    switchTab(tab) {
        this.currentTab = tab;
        
        this.elements.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });
        
        this.elements.autoTab.classList.toggle('hidden', tab !== 'auto');
        this.elements.autoTab.classList.toggle('active', tab === 'auto');
        this.elements.manualTab.classList.toggle('hidden', tab !== 'manual');
        this.elements.manualTab.classList.toggle('active', tab === 'manual');
    }

    /**
     * 切换工具
     * @param {string} tool - 工具名称 ('mark' | 'eraser')
     */
    switchTool(tool) {
        this.currentTool = tool;
        
        this.elements.markTool.classList.toggle('active', tool === 'mark');
        this.elements.eraserTool.classList.toggle('active', tool === 'eraser');
    }

    /**
     * 选择水印区域位置
     * @param {string} region - 区域名称
     */
    selectRegion(region) {
        if (region === 'custom') {
            this.switchTab('manual');
            this.showToast('请使用画笔工具标记水印区域', 'info');
            return;
        }
        
        this.selectedRegion = region;
        
        document.querySelectorAll('.region-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.region === region);
        });
    }

    /**
     * 处理画布鼠标按下事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleCanvasMouseDown(e) {
        if (!this.image || this.currentTab !== 'manual') return;
        
        this.isDrawing = true;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.addBrushStroke(x, y);
    }

    /**
     * 处理画布鼠标移动事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleCanvasMouseMove(e) {
        if (!this.isDrawing || !this.image || this.currentTab !== 'manual') return;
        
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        this.addBrushStroke(x, y);
    }

    /**
     * 处理画布鼠标松开事件
     * @param {MouseEvent} e - 鼠标事件
     */
    handleCanvasMouseUp(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
    }

    /**
     * 添加画笔笔触
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     */
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
        
        this.elements.selectionOverlay.appendChild(stroke);
    }

    /**
     * 处理图片（去水印）
     */
    async process() {
        if (this.isProcessing) return;
        
        this.isProcessing = true;
        this.progress = 0;
        this.elements.processingOverlay.classList.remove('hidden');
        this.elements.processBtn.disabled = true;
        
        const progressInterval = setInterval(() => {
            if (this.progress < 90) {
                this.progress += 5;
                this.elements.progressFill.style.width = `${this.progress}%`;
                this.elements.progressText.textContent = `${this.progress}%`;
            }
        }, 100);
        
        try {
            const imageData = this.canvas.toDataURL('image/png');
            
            if (this.currentTab === 'manual' && this.brushStrokes.length > 0) {
                await this.processManual(imageData);
            } else {
                await this.processAuto(imageData);
            }
            
            this.progress = 100;
            this.elements.progressFill.style.width = '100%';
            this.elements.progressText.textContent = '100%';
            
            this.clearBrushStrokes();
            this.saveToHistory();
            this.showToast('水印去除完成', 'success');
        } catch (error) {
            console.error('处理失败:', error);
            this.showToast('处理失败，请重试', 'error');
        } finally {
            clearInterval(progressInterval);
            this.isProcessing = false;
            this.elements.processingOverlay.classList.add('hidden');
            this.elements.processBtn.disabled = false;
        }
    }

    /**
     * 自动去水印处理
     * @param {string} imageData - 图片base64数据
     */
    async processAuto(imageData) {
        try {
            const response = await fetch(`${this.apiBaseUrl}/process/auto`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    image: imageData,
                    region: this.selectedRegion
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.image) {
                    this.loadProcessedImage(data.image);
                    if (data.detected_regions && data.detected_regions.length > 0) {
                        this.showToast(`已处理 ${data.detected_regions.length} 个水印区域`, 'success');
                    }
                    return;
                }
            }
        } catch (error) {
            console.warn('API调用失败，使用本地处理:', error);
        }
        
        this.processLocal();
    }

    /**
     * 手动去水印处理
     * @param {string} imageData - 图片base64数据
     */
    async processManual(imageData) {
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = this.canvas.width;
        maskCanvas.height = this.canvas.height;
        const maskCtx = maskCanvas.getContext('2d');
        
        maskCtx.fillStyle = 'black';
        maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
        
        maskCtx.fillStyle = 'white';
        this.brushStrokes.forEach(stroke => {
            maskCtx.beginPath();
            maskCtx.arc(stroke.x, stroke.y, stroke.size / 2, 0, Math.PI * 2);
            maskCtx.fill();
        });
        
        const maskData = maskCanvas.toDataURL('image/png');
        
        try {
            const response = await fetch(`${this.apiBaseUrl}/process/manual`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ image: imageData, mask: maskData })
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.image) {
                    this.loadProcessedImage(data.image);
                    return;
                }
            }
        } catch (error) {
            console.warn('API调用失败，使用本地处理:', error);
        }
        
        this.processLocal();
    }

    /**
     * 加载处理后的图片
     * @param {string} imageData - 图片base64数据
     */
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

    /**
     * 切换显示原图/处理后图片
     */
    toggleCompare() {
        if (!this.processedImageData && !this.originalImageDataUrl) {
            this.showToast('请先处理图片后再对比', 'warning');
            return;
        }

        this.isShowingOriginal = !this.isShowingOriginal;

        if (this.isShowingOriginal) {
            const img = new Image();
            img.onload = () => {
                this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
            };
            img.src = this.originalImageDataUrl;
            this.elements.compareBtn.textContent = '显示处理后';
        } else {
            if (this.processedImageData) {
                const img = new Image();
                img.onload = () => {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
                };
                img.src = this.processedImageData;
            }
            this.elements.compareBtn.textContent = '显示对比';
        }
    }

    /**
     * 本地处理（备用方案）
     */
    processLocal() {
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        const data = imageData.data;
        
        if (this.currentTab === 'manual' && this.brushStrokes.length > 0) {
            const bounds = this.getBrushBounds();
            this.inpaintAreaLocal(data, bounds.x, bounds.y, bounds.width, bounds.height);
        } else {
            const watermarkX = Math.floor(this.canvas.width * 0.7);
            const watermarkY = Math.floor(this.canvas.height * 0.8);
            const watermarkW = Math.floor(this.canvas.width * 0.25);
            const watermarkH = Math.floor(this.canvas.height * 0.15);
            this.inpaintAreaLocal(data, watermarkX, watermarkY, watermarkW, watermarkH);
        }
        
        this.ctx.putImageData(imageData, 0, 0);
    }

    /**
     * 本地图像修复
     * @param {Uint8ClampedArray} data - 图像数据
     * @param {number} x - X坐标
     * @param {number} y - Y坐标
     * @param {number} width - 宽度
     * @param {number} height - 高度
     */
    inpaintAreaLocal(data, x, y, width, height) {
        const startX = Math.max(0, Math.floor(x));
        const startY = Math.max(0, Math.floor(y));
        const endX = Math.min(this.canvas.width, Math.floor(x + width));
        const endY = Math.min(this.canvas.height, Math.floor(y + height));
        
        const surroundingColors = this.getSurroundingColorsLocal(data, startX, startY, endX, endY);
        
        for (let py = startY; py < endY; py++) {
            for (let px = startX; px < endX; px++) {
                const idx = (py * this.canvas.width + px) * 4;
                const noise = (Math.random() - 0.5) * 20;
                data[idx] = Math.min(255, Math.max(0, surroundingColors.r + noise));
                data[idx + 1] = Math.min(255, Math.max(0, surroundingColors.g + noise));
                data[idx + 2] = Math.min(255, Math.max(0, surroundingColors.b + noise));
            }
        }
    }

    /**
     * 获取周围区域颜色
     * @param {Uint8ClampedArray} data - 图像数据
     * @param {number} startX - 起始X
     * @param {number} startY - 起始Y
     * @param {number} endX - 结束X
     * @param {number} endY - 结束Y
     * @returns {Object} RGB颜色对象
     */
    getSurroundingColorsLocal(data, startX, startY, endX, endY) {
        let r = 0, g = 0, b = 0, count = 0;
        const margin = 10;
        
        for (let y = Math.max(0, startY - margin); y < Math.min(this.canvas.height, endY + margin); y++) {
            for (let x = Math.max(0, startX - margin); x < Math.min(this.canvas.width, endX + margin); x++) {
                if (x >= startX && x < endX && y >= startY && y < endY) continue;
                
                const idx = (y * this.canvas.width + x) * 4;
                r += data[idx];
                g += data[idx + 1];
                b += data[idx + 2];
                count++;
            }
        }
        
        return {
            r: count > 0 ? Math.round(r / count) : 128,
            g: count > 0 ? Math.round(g / count) : 128,
            b: count > 0 ? Math.round(b / count) : 128
        };
    }

    /**
     * 获取画笔笔触边界
     * @returns {Object} 边界对象
     */
    getBrushBounds() {
        if (this.brushStrokes.length === 0) return null;
        
        let minX = Infinity, minY = Infinity;
        let maxX = -Infinity, maxY = -Infinity;
        
        this.brushStrokes.forEach(stroke => {
            minX = Math.min(minX, stroke.x - stroke.size);
            minY = Math.min(minY, stroke.y - stroke.size);
            maxX = Math.max(maxX, stroke.x + stroke.size);
            maxY = Math.max(maxY, stroke.y + stroke.size);
        });
        
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }

    /**
     * 清除画笔笔触
     */
    clearBrushStrokes() {
        this.brushStrokes = [];
        this.elements.selectionOverlay.innerHTML = '';
    }

    /**
     * 下载处理后的图片
     */
    download() {
        const link = document.createElement('a');
        link.download = `removed-watermark-${Date.now()}.png`;
        link.href = this.canvas.toDataURL('image/png');
        link.click();
        
        this.showToast('图片已下载', 'success');
    }

    /**
     * 重置画布
     */
    reset() {
        if (this.image && this.originalImageData) {
            this.ctx.putImageData(this.originalImageData, 0, 0);
            this.clearBrushStrokes();
            this.history = [];
            this.historyIndex = -1;
            this.saveToHistory();
            this.showToast('已重置', 'success');
        }
    }

    /**
     * 保存历史记录
     */
    saveToHistory() {
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        this.historyIndex = this.history.length - 1;
        
        this.updateHistoryButtons();
    }

    /**
     * 撤销操作
     */
    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            this.updateHistoryButtons();
        }
    }

    /**
     * 重做操作
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.ctx.putImageData(this.history[this.historyIndex], 0, 0);
            this.updateHistoryButtons();
        }
    }

    /**
     * 更新历史按钮状态
     */
    updateHistoryButtons() {
        this.elements.undoBtn.disabled = this.historyIndex <= 0;
        this.elements.redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    }

    /**
     * 放大
     */
    zoomIn() {
        if (this.zoom < 200) {
            this.zoom += 10;
            this.updateZoom();
        }
    }

    /**
     * 缩小
     */
    zoomOut() {
        if (this.zoom > 50) {
            this.zoom -= 10;
            this.updateZoom();
        }
    }

    /**
     * 适应屏幕
     */
    fitScreen() {
        this.zoom = 100;
        this.updateZoom();
    }

    /**
     * 更新缩放
     */
    updateZoom() {
        this.elements.zoomValue.textContent = `${this.zoom}%`;
        this.elements.canvasWrapper.style.transform = `scale(${this.zoom / 100})`;
        this.elements.canvasWrapper.style.transformOrigin = 'center';
    }

    /**
     * 处理键盘快捷键
     * @param {KeyboardEvent} e - 键盘事件
     */
    handleKeyDown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        }
    }

    /**
     * 处理反馈表单提交
     * @param {Event} e - 表单提交事件
     */
    handleFeedbackSubmit(e) {
        e.preventDefault();
        
        const name = document.getElementById('feedbackName').value;
        const email = document.getElementById('feedbackEmail').value;
        const category = document.getElementById('feedbackCategory').value;
        const message = document.getElementById('feedbackMessage').value;
        
        console.log('Feedback submitted:', { name, email, category, message });
        
        this.elements.feedbackFormWrapper.classList.add('hidden');
        this.elements.feedbackSuccess.classList.remove('hidden');
        
        this.showToast('反馈提交成功', 'success');
    }

    /**
     * 重置反馈表单
     */
    resetFeedbackForm() {
        this.elements.feedbackForm.reset();
        this.elements.feedbackSuccess.classList.add('hidden');
        this.elements.feedbackFormWrapper.classList.remove('hidden');
    }

    /**
     * 显示Toast通知
     * @param {string} message - 消息内容
     * @param {string} type - 类型 ('success' | 'error' | 'warning')
     */
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
            error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
            warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
            info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
        `;
        
        this.elements.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new WatermarkRemoverApp();
});
