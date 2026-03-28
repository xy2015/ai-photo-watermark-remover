import { X, Download, RotateCcw } from 'lucide-react';

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
  isProcessing: boolean;
  progress: number;
}

export function ImagePreview({ imageUrl, onRemove, isProcessing, progress }: ImagePreviewProps) {
  return (
    <div className="relative w-full">
      {/* Image Container */}
      <div className="relative w-full aspect-video bg-[#FAFBFC] rounded-[12px] overflow-hidden">
        <img
          src={imageUrl}
          alt="Preview"
          className="w-full h-full object-contain"
        />
        
        {/* Processing Overlay */}
        {isProcessing && (
          <div className="absolute inset-0 bg-[#1D2129]/60 flex flex-col items-center justify-center gap-4">
            <div className="flex flex-col items-center gap-3">
              <RotateCcw className="w-8 h-8 text-white animate-spin" />
              <p className="text-white">AI 正在处理中...</p>
            </div>
            
            {/* Progress Bar */}
            <div className="w-[240px] h-1 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#165DFF] transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            
            <p className="text-white text-sm">{progress}%</p>
          </div>
        )}
        
        {/* Remove Button */}
        {!isProcessing && (
          <button
            onClick={onRemove}
            className="absolute top-3 right-3 w-8 h-8 bg-[#1D2129]/60 hover:bg-[#1D2129]/80 rounded-full flex items-center justify-center transition-colors duration-200"
            aria-label="Remove image"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        )}
      </div>
      
      {/* Image Info */}
      <div className="mt-3 flex items-center justify-between text-sm text-[#4E5969]">
        <span>预览图片</span>
        <button className="flex items-center gap-1 text-[#165DFF] hover:text-[#4080FF] transition-colors duration-200">
          <Download className="w-4 h-4" />
          <span>下载原图</span>
        </button>
      </div>
    </div>
  );
}
