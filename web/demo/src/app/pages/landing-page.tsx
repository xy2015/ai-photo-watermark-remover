import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { Button } from '../components/button';
import { FeatureCard } from '../components/ui-elements';
import { Sparkles, Zap, Shield, Upload, Image as ImageIcon } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);

  const handleImageSelect = (file: File) => {
    // Navigate to editor with image
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      navigate('/editor', { state: { imageData } });
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      handleImageSelect(files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleImageSelect(files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 w-full">
        {/* Hero Section */}
        <section className="w-full bg-gradient-to-b from-[#F2F8FF] to-white">
          <div className="max-w-[1440px] mx-auto px-6 py-20">
            {/* Slogan */}
            <div className="text-center mb-16">
              <h1 className="text-5xl mb-6 text-[#1D2129]">
                AI 智能去水印
              </h1>
              <p className="text-xl text-[#4E5969] max-w-[700px] mx-auto leading-relaxed">
                使用先进的 AI 技术，一键去除图片中的水印、文字、LOGO
                <br />
                保持原图质量，快速高效，隐私安全
              </p>
            </div>

            {/* Upload Area */}
            <div className="max-w-[900px] mx-auto mb-20">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                  relative flex flex-col items-center justify-center
                  w-full h-[400px]
                  border-2 border-dashed rounded-[12px]
                  transition-all duration-300 cursor-pointer
                  ${isDragging 
                    ? 'border-[#165DFF] bg-[#F2F8FF] scale-[1.02]' 
                    : 'border-[#E5E6EB] bg-white hover:border-[#165DFF] hover:bg-[#FAFBFC]'
                  }
                `}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileInput}
                  className="hidden"
                />

                <div className="flex flex-col items-center gap-6">
                  <div className={`
                    w-[80px] h-[80px] rounded-full flex items-center justify-center
                    transition-all duration-300
                    ${isDragging ? 'bg-[#165DFF] scale-110' : 'bg-[#F2F3F5]'}
                  `}>
                    {isDragging ? (
                      <Upload className="w-10 h-10 text-white" />
                    ) : (
                      <ImageIcon className="w-10 h-10 text-[#4E5969]" />
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-3 text-center px-4">
                    <p className="text-xl text-[#1D2129]">
                      {isDragging ? '释放鼠标上传图片' : '点击或拖拽图片到此处'}
                    </p>
                    <p className="text-[#4E5969]">
                      支持 JPG、PNG、WEBP 格式，最大 10MB
                    </p>
                  </div>

                  {!isDragging && (
                    <Button variant="primary" size="large">
                      <Upload className="w-5 h-5" />
                      选择图片
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
              <FeatureCard
                icon={<Sparkles className="w-5 h-5" />}
                title="AI 智能识别"
                description="自动检测并精准定位水印、文字、LOGO 等元素，智能修复图片内容"
              />
              <FeatureCard
                icon={<Zap className="w-5 h-5" />}
                title="快速处理"
                description="强大的 AI 算法，秒级完成图片处理，无需漫长等待"
              />
              <FeatureCard
                icon={<Shield className="w-5 h-5" />}
                title="隐私保护"
                description="所有处理在浏览器本地完成，图片不上传服务器，100% 保护隐私"
              />
            </div>
          </div>
        </section>

        {/* Before/After Comparison */}
        <section className="w-full bg-[#FAFBFC] border-y border-[#E5E6EB]">
          <div className="max-w-[1440px] mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-[#1D2129] mb-4">效果对比</h2>
              <p className="text-[#4E5969]">AI 智能去水印，保持原图质量</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1100px] mx-auto">
              {/* Before */}
              <div className="bg-white rounded-[12px] border border-[#E5E6EB] overflow-hidden">
                <div className="p-4 border-b border-[#E5E6EB]">
                  <h3 className="text-[#1D2129]">处理前</h3>
                </div>
                <div className="aspect-video bg-[#F2F3F5] flex items-center justify-center">
                  <div className="text-center">
                    <ImageIcon className="w-16 h-16 text-[#C9CDD4] mx-auto mb-3" />
                    <p className="text-sm text-[#4E5969]">原始图片（含水印）</p>
                  </div>
                </div>
              </div>

              {/* After */}
              <div className="bg-white rounded-[12px] border border-[#165DFF] overflow-hidden relative">
                <div className="absolute top-4 right-4 z-10">
                  <span className="bg-[#165DFF] text-white text-xs px-3 py-1 rounded-full">
                    AI 处理后
                  </span>
                </div>
                <div className="p-4 border-b border-[#E5E6EB]">
                  <h3 className="text-[#1D2129]">处理后</h3>
                </div>
                <div className="aspect-video bg-[#F2F8FF] flex items-center justify-center">
                  <div className="text-center">
                    <Sparkles className="w-16 h-16 text-[#165DFF] mx-auto mb-3" />
                    <p className="text-sm text-[#165DFF]">完美去除水印</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="w-full bg-white">
          <div className="max-w-[1440px] mx-auto px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-3xl text-[#1D2129] mb-4">如何使用</h2>
              <p className="text-[#4E5969]">三步轻松完成图片去水印</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-[1100px] mx-auto">
              <div className="text-center">
                <div className="w-16 h-16 bg-[#165DFF] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  1
                </div>
                <h3 className="text-[#1D2129] mb-2">上传图片</h3>
                <p className="text-sm text-[#4E5969]">
                  点击或拖拽上传需要处理的图片
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#165DFF] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  2
                </div>
                <h3 className="text-[#1D2129] mb-2">标记水印</h3>
                <p className="text-sm text-[#4E5969]">
                  使用画笔工具标记需要去除的区域
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-[#165DFF] rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">
                  3
                </div>
                <h3 className="text-[#1D2129] mb-2">导出结果</h3>
                <p className="text-sm text-[#4E5969]">
                  一键导出处理后的高清图片
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
