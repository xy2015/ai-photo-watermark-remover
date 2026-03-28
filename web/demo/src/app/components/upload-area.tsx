import { useState, useRef, DragEvent } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface UploadAreaProps {
  onImageSelect: (file: File) => void;
}

export function UploadArea({ onImageSelect }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onImageSelect(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onImageSelect(files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        relative flex flex-col items-center justify-center
        w-full h-[280px] md:h-[320px]
        border-2 border-dashed rounded-[12px]
        transition-all duration-200 cursor-pointer
        ${isDragging 
          ? 'border-[#165DFF] bg-[#F2F8FF]' 
          : 'border-[#E5E6EB] bg-[#FAFBFC] hover:border-[#165DFF] hover:bg-[#F2F8FF]'
        }
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <div className="flex flex-col items-center gap-4">
        <div className={`
          w-[56px] h-[56px] rounded-full flex items-center justify-center
          transition-colors duration-200
          ${isDragging ? 'bg-[#165DFF]' : 'bg-[#E5E6EB]'}
        `}>
          {isDragging ? (
            <Upload className="w-6 h-6 text-white" />
          ) : (
            <ImageIcon className="w-6 h-6 text-[#4E5969]" />
          )}
        </div>
        
        <div className="flex flex-col items-center gap-2 text-center px-4">
          <p className="text-[#1D2129]">
            <span className="text-[#165DFF]">点击上传</span> 或拖拽图片到此处
          </p>
          <p className="text-sm text-[#4E5969]">
            支持 JPG、PNG、WEBP 格式，最大 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
