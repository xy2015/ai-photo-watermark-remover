/**
 * 主应用入口：组合各模块，绑定事件
 */
class WatermarkRemoverApp {
    constructor() {
        this.currentTab = 'manual';
        this.isProcessing = false;
        this.isShowingOriginal = false;
        this.bgFeather = 2;
        this.bgMode = 'keep';

        this.api = new ApiClient();
        this.processor = ImageProcessor;

        this.init();
    }

    init() {
        this.cacheElements();
        this.editor = new CanvasEditor(this.elements.canvas, this.elements.selectionOverlay);
        this.router = new Router(this.elements);
        this.ui = new UIController(this.elements.toastContainer);

        this.bindEvents();
        this.api.checkHealth();
    }

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
            selectionOverlay: document.getElementById('selectionOverlay'),
            processingOverlay: document.getElementById('processingOverlay'),
            progressFill: document.getElementById('progressFill'),
            progressText: document.getElementById('progressText'),

            tabBtns: document.querySelectorAll('.tab-btn'),
            manualTab: document.getElementById('manualTab'),
            bgTab: document.getElementById('bgTab'),
            bgFeather: document.getElementById('bgFeather'),
            bgFeatherValue: document.getElementById('bgFeatherValue'),
            keepModeBtn: document.getElementById('keepModeBtn'),
            removeModeBtn: document.getElementById('removeModeBtn'),

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
    }

    bindEvents() {
        const el = this.elements;

        // 上传
        el.uploadArea.addEventListener('click', (e) => {
            if (e.target.closest('.upload-btn') || e.target === el.uploadArea || e.target.closest('.upload-content')) {
                el.fileInput.click();
            }
        });
        el.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        el.uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); el.uploadArea.classList.add('drag-over'); });
        el.uploadArea.addEventListener('dragleave', (e) => { e.preventDefault(); el.uploadArea.classList.remove('drag-over'); });
        el.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // 导航
        el.navLinks.forEach(link => link.addEventListener('click', (e) => { e.preventDefault(); this.router.navigateTo(link.dataset.page); }));
        el.logoLink.addEventListener('click', (e) => { e.preventDefault(); this.router.navigateTo('home'); });

        // 标签页
        el.tabBtns.forEach(btn => btn.addEventListener('click', () => {
            this.switchTab(btn.dataset.tab);
        }));

        // 画笔
        el.brushSize.addEventListener('input', (e) => {
            this.editor.brushSize = parseInt(e.target.value);
            el.brushSizeValue.textContent = `${this.editor.brushSize}px`;
        });
        el.markTool.addEventListener('click', () => {
            this.editor.currentTool = 'mark';
            this.ui.switchTool('mark', el.markTool, el.eraserTool);
        });
        el.eraserTool.addEventListener('click', () => {
            this.editor.currentTool = 'eraser';
            this.ui.switchTool('eraser', el.markTool, el.eraserTool);
        });

        // 去背景：边缘羽化滑块
        el.bgFeather.addEventListener('input', (e) => {
            this.bgFeather = parseInt(e.target.value);
            el.bgFeatherValue.textContent = `${this.bgFeather}px`;
        });
        // 去背景：保留/删除主体切换
        el.keepModeBtn.addEventListener('click', () => this.setBgMode('keep'));
        el.removeModeBtn.addEventListener('click', () => this.setBgMode('remove'));

        // Canvas
        el.canvas.addEventListener('mousedown', (e) => { if (this.currentTab === 'manual') this.editor.handleMouseDown(e); });
        el.canvas.addEventListener('mousemove', (e) => { if (this.currentTab === 'manual') this.editor.handleMouseMove(e); });
        el.canvas.addEventListener('mouseup', () => this.editor.handleMouseUp());
        el.canvas.addEventListener('mouseleave', () => this.editor.handleMouseUp());

        // 工具栏
        el.undoBtn.addEventListener('click', () => { this.editor.undo(); this.updateHistoryButtons(); });
        el.redoBtn.addEventListener('click', () => { this.editor.redo(); this.updateHistoryButtons(); });
        el.resetBtn.addEventListener('click', () => { this.editor.reset(); this.ui.showToast('已重置', 'success'); });
        el.zoomInBtn.addEventListener('click', () => { this.editor.zoomIn(); el.zoomValue.textContent = this.editor.getZoomText(); });
        el.zoomOutBtn.addEventListener('click', () => { this.editor.zoomOut(); el.zoomValue.textContent = this.editor.getZoomText(); });
        el.fitScreenBtn.addEventListener('click', () => { this.editor.fitScreen(); el.zoomValue.textContent = this.editor.getZoomText(); });
        el.compareBtn.addEventListener('click', () => this.toggleCompare());

        // 操作
        el.processBtn.addEventListener('click', () => this.process());
        el.downloadBtn.addEventListener('click', () => { this.editor.download(); this.ui.showToast('图片已下载', 'success'); });
        el.backHomeBtn.addEventListener('click', () => { this.router.navigateTo('home'); this.editor.reset(); });

        // 反馈
        if (el.feedbackForm) el.feedbackForm.addEventListener('submit', (e) => { e.preventDefault(); this.ui.showFeedbackSuccess(el.feedbackFormWrapper, el.feedbackSuccess); this.ui.showToast('反馈提交成功', 'success'); });
        if (el.continueFeedbackBtn) el.continueFeedbackBtn.addEventListener('click', () => this.ui.resetFeedbackForm(el.feedbackForm, el.feedbackFormWrapper, el.feedbackSuccess));

        // 快捷键
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'z') { e.preventDefault(); this.editor.undo(); this.updateHistoryButtons(); }
                else if (e.key === 'y') { e.preventDefault(); this.editor.redo(); this.updateHistoryButtons(); }
            }
        });
    }

    updateHistoryButtons() {
        this.elements.undoBtn.disabled = !this.editor.canUndo();
        this.elements.redoBtn.disabled = !this.editor.canRedo();
    }

    // 切换编辑标签页（manual / bg），并同步界面与画布状态
    switchTab(tab) {
        this.currentTab = tab;
        this.ui.switchTab(tab, this.elements.tabBtns, this.elements.manualTab, this.elements.bgTab);

        const isBg = tab === 'bg';
        this.editor.setBgMode(isBg);
        // 去背景模式下，画布用于透明预览；离开时关闭棋盘格
        if (isBg) {
            this.elements.processBtn.querySelector('span').textContent = '一键去背景';
            this.editor.clearBrushStrokes();
        } else {
            this.elements.processBtn.querySelector('span').textContent = '开始去水印';
        }
    }

    // 设置去背景模式：保留主体（透明）/ 删除主体（修复背景）
    setBgMode(mode) {
        this.bgMode = mode;
        this.ui.switchBgMode(mode, this.elements.keepModeBtn, this.elements.removeModeBtn);
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) this.loadImage(file);
    }

    handleDrop(e) {
        e.preventDefault();
        this.elements.uploadArea.classList.remove('drag-over');
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            this.loadImage(file);
        } else {
            this.ui.showToast('请上传图片文件', 'error');
        }
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.editor.loadImage(img, e.target.result);
                this.router.showEditor();
                setTimeout(() => this.editor.setupCanvas(), 100);
                this.ui.showToast('图片加载成功', 'success');
            };
            img.onerror = () => this.ui.showToast('图片加载失败', 'error');
            img.src = e.target.result;
        };
        reader.onerror = () => this.ui.showToast('文件读取失败', 'error');
        reader.readAsDataURL(file);
    }

    toggleCompare() {
        if (!this.editor.hasProcessed() && !this.editor.hasOriginal()) {
            this.ui.showToast('请先处理图片后再对比', 'warning');
            return;
        }
        this.isShowingOriginal = !this.isShowingOriginal;
        if (this.isShowingOriginal) {
            this.editor.showOriginal();
            this.elements.compareBtn.textContent = '显示处理后';
        } else {
            this.editor.showProcessed();
            this.elements.compareBtn.textContent = '显示对比';
        }
    }

    async process() {
        if (this.isProcessing) return;
        this.isProcessing = true;
        this.elements.processingOverlay.classList.remove('hidden');
        this.elements.processBtn.disabled = true;

        let progress = 0;
        const progressInterval = setInterval(() => {
            if (progress < 90) {
                progress += 5;
                this.elements.progressFill.style.width = `${progress}%`;
                this.elements.progressText.textContent = `${progress}%`;
            }
        }, 100);

        try {
            const imageData = this.editor.getImageDataUrl();

            if (this.currentTab === 'bg') {
                await this.processBackground(imageData);
            } else if (this.currentTab === 'manual' && this.editor.brushStrokes.length > 0) {
                await this.processManual(imageData);
            } else {
                this.ui.showToast('请先用画笔标记需要去除的水印区域', 'warning');
            }

            this.elements.progressFill.style.width = '100%';
            this.elements.progressText.textContent = '100%';

            this.editor.clearBrushStrokes();
            this.editor.saveToHistory();
            this.ui.showToast('水印去除完成', 'success');
        } catch (error) {
            console.error('处理失败:', error);
            this.ui.showToast('处理失败，请重试', 'error');
        } finally {
            clearInterval(progressInterval);
            this.isProcessing = false;
            this.elements.processingOverlay.classList.add('hidden');
            this.elements.processBtn.disabled = false;
        }
    }

    async processManual(imageData) {
        try {
            const fullImg = this.editor.originalImage ? this.editor.getFullResDataUrl() : imageData;
            const W = this.editor.originalImage.width;
            const H = this.editor.originalImage.height;
            const factor = this.editor.getFullResFactor();
            const maskArr = this.processor.buildMaskFromStrokes(W, H, this.editor.brushStrokes, factor);
            const maskData = this.processor.maskArrayToDataUrl(W, H, maskArr);
            const data = await this.api.processManual(fullImg, maskData);
            if (data && data.success && data.image) {
                this.editor.loadProcessedImage(data.image);
                return;
            }
        } catch (e) {
            console.warn('API调用失败，使用本地处理:', e);
        }
        this.editor.processLocal(this.processor, this.currentTab);
    }

    async processBackground(imageData) {
        this.editor.downloadName = this.bgMode === 'remove' ? 'removed-subject' : 'removed-bg';
        try {
            const fullImg = this.editor.originalImage ? this.editor.getFullResDataUrl() : imageData;
            const data = await this.api.processBackground(fullImg, { mode: this.bgMode, feather: this.bgFeather });
            if (data && data.success && data.image) {
                this.editor.loadProcessedImage(data.image);
                return;
            }
        } catch (e) {
            console.warn('API调用失败，使用本地处理:', e);
        }
        // 降级：纯前端区域生长算法（无后端 / 后端不可用时）
        this.editor.processLocalBackground(this.processor, { mode: this.bgMode, feather: this.bgFeather });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new WatermarkRemoverApp();
});
