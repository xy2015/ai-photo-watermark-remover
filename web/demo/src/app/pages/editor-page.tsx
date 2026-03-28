import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { Header } from '../components/header';
import { Button } from '../components/button';
import { Slider, Tabs, IconButton } from '../components/controls';
import {
  Sparkles,
  Undo2,
  Redo2,
  RotateCcw,
  Download,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Brush,
  Wand2
} from 'lucide-react';

type TabType = 'auto' | 'manual';

export function EditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageData, setImageData] = useState<string | null>(location.state?.imageData || null);
  const [activeTab, setActiveTab] = useState<TabType>('auto');
  const [brushSize, setBrushSize] = useState(20);
  const [zoom, setZoom] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComparison, setShowComparison] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    if (!imageData) {
      navigate('/');
    }
  }, [imageData, navigate]);

  useEffect(() => {
    if (imageData && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = imageData;
    }
  }, [imageData]);

  const handleProcess = () => {
    setIsProcessing(true);
    setProgress(0);

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsProcessing(false);
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
    }
  };

  const handleReset = () => {
    if (canvasRef.current && imageData) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx?.drawImage(img, 0, 0);
      };
      img.src = imageData;
    }
  };

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = 'removed-watermark.png';
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };

  const handleFitScreen = () => {
    setZoom(100);
  };

  if (!imageData) {
    return null;
  }

  return (
    <div className="h-screen bg-[#FAFBFC] flex flex-col">
      <Header simple />

      <main className="flex-1 flex overflow-hidden flex-col lg:flex-row">
        {/* Canvas Area - 70% on desktop, full width on mobile */}
        <div className="flex-1 flex flex-col bg-[#F2F3F5]">
          {/* Toolbar */}
          <div className="h-[56px] bg-white border-b border-[#E5E6EB] flex items-center justify-between px-6">
            <div className="flex items-center gap-2">
              <IconButton
                icon={<Undo2 className="w-4 h-4" />}
                label="撤销"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              />
              <IconButton
                icon={<Redo2 className="w-4 h-4" />}
                label="重做"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              />
              <div className="w-px h-6 bg-[#E5E6EB] mx-2" />
              <IconButton
                icon={<RotateCcw className="w-4 h-4" />}
                label="重置"
                onClick={handleReset}
              />
            </div>

            <div className="flex items-center gap-2">
              <IconButton
                icon={<ZoomOut className="w-4 h-4" />}
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              />
              <span className="text-sm text-[#4E5969] min-w-[60px] text-center">
                {zoom}%
              </span>
              <IconButton
                icon={<ZoomIn className="w-4 h-4" />}
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              />
              <IconButton
                icon={<Maximize2 className="w-4 h-4" />}
                onClick={handleFitScreen}
              />
            </div>
          </div>

          {/* Canvas */}
          <div className="flex-1 overflow-auto flex items-center justify-center p-8">
            <div
              className="relative bg-white rounded-[8px] shadow-lg"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'center' }}
            >
              <canvas
                ref={canvasRef}
                className="max-w-full h-auto rounded-[8px]"
              />
              
              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-[#1D2129]/60 rounded-[8px] flex flex-col items-center justify-center gap-4">
                  <Sparkles className="w-12 h-12 text-white animate-pulse" />
                  <p className="text-white">AI 正在处理中...</p>
                  <div className="w-[240px] h-2 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#165DFF] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <p className="text-white text-sm">{progress}%</p>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Status */}
          <div className="h-[48px] bg-white border-t border-[#E5E6EB] flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#4E5969]">
                就绪
              </span>
            </div>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className="text-sm text-[#165DFF] hover:text-[#4080FF] transition-colors duration-200"
            >
              {showComparison ? '隐藏' : '显示'}对比
            </button>
          </div>
        </div>

        {/* Control Panel - 30% on desktop, bottom sheet on mobile */}
        <div className="w-full lg:w-[420px] bg-white border-l border-[#E5E6EB] flex flex-col max-h-[40vh] lg:max-h-none overflow-auto lg:overflow-visible">
          {/* Header */}
          <div className="p-6 border-b border-[#E5E6EB]">
            <h2 className="text-xl text-[#1D2129]">工具面板</h2>
          </div>

          {/* Tabs */}
          <div className="p-6 border-b border-[#E5E6EB]">
            <Tabs
              tabs={[
                { id: 'auto', label: '智能去水印' },
                { id: 'manual', label: '手动去水印' }
              ]}
              activeTab={activeTab}
              onChange={(id) => setActiveTab(id as TabType)}
            />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6">
            {activeTab === 'auto' ? (
              <div className="space-y-6">
                <div className="p-4 bg-[#F2F8FF] rounded-[8px] border border-[#D4E8FF]">
                  <div className="flex items-start gap-3">
                    <Wand2 className="w-5 h-5 text-[#165DFF] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm text-[#165DFF] mb-1">智能识别模式</h3>
                      <p className="text-xs text-[#4E5969] leading-relaxed">
                        AI 将自动检测并去除图片中的水印、文字和 LOGO
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm text-[#1D2129]">处理选项</h3>
                  
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded accent-[#165DFF]"
                      />
                      <span className="text-sm text-[#4E5969]">自动检测水印</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        defaultChecked
                        className="w-4 h-4 rounded accent-[#165DFF]"
                      />
                      <span className="text-sm text-[#4E5969]">智能修复背景</span>
                    </label>
                    
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        className="w-4 h-4 rounded accent-[#165DFF]"
                      />
                      <span className="text-sm text-[#4E5969]">保持高清画质</span>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-[#F2F8FF] rounded-[8px] border border-[#D4E8FF]">
                  <div className="flex items-start gap-3">
                    <Brush className="w-5 h-5 text-[#165DFF] flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="text-sm text-[#165DFF] mb-1">手动标记模式</h3>
                      <p className="text-xs text-[#4E5969] leading-relaxed">
                        使用画笔工具手动标记需要去除的区域
                      </p>
                    </div>
                  </div>
                </div>

                <Slider
                  label="画笔大小"
                  value={brushSize}
                  onChange={setBrushSize}
                  min={5}
                  max={100}
                  step={5}
                  unit="px"
                />

                <div className="space-y-3">
                  <h3 className="text-sm text-[#1D2129]">画笔工具</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="h-[36px] px-3 bg-[#165DFF] text-white rounded-[8px] text-sm hover:bg-[#4080FF] transition-colors duration-200">
                      标记画笔
                    </button>
                    <button className="h-[36px] px-3 bg-[#F2F3F5] text-[#4E5969] rounded-[8px] text-sm hover:bg-[#E5E6EB] transition-colors duration-200">
                      橡皮擦
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="p-6 border-t border-[#E5E6EB] space-y-3">
            <Button
              variant="primary"
              size="large"
              fullWidth
              onClick={handleProcess}
              disabled={isProcessing}
              loading={isProcessing}
            >
              <Sparkles className="w-5 h-5" />
              {isProcessing ? '处理中...' : '开始去水印'}
            </Button>

            <Button
              variant="secondary"
              size="large"
              fullWidth
              onClick={handleDownload}
              disabled={isProcessing}
            >
              <Download className="w-5 h-5" />
              导出图片
            </Button>

            <button
              onClick={() => navigate('/')}
              className="w-full h-[44px] text-sm text-[#4E5969] hover:text-[#165DFF] transition-colors duration-200"
            >
              返回首页
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}