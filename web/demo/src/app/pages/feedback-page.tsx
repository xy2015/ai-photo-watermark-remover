import { useState } from 'react';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { Button } from '../components/button';
import { MessageSquare, Send, CheckCircle2 } from 'lucide-react';

export function FeedbackPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'bug',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        category: 'bug',
        message: ''
      });
    }, 1500);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 w-full">
        <div className="max-w-[800px] mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-[#F2F8FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-[#165DFF]" />
            </div>
            <h1 className="text-4xl mb-4 text-[#1D2129]">问题反馈</h1>
            <p className="text-[#4E5969]">
              遇到问题或有建议？请告诉我们，我们会尽快回复您
            </p>
          </div>

          {isSubmitted ? (
            /* Success Message */
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-[#F2F8FF] rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-[#165DFF]" />
              </div>
              <h2 className="text-2xl text-[#1D2129] mb-3">提交成功！</h2>
              <p className="text-[#4E5969] mb-8">
                感谢您的反馈，我们已收到您的消息，将在 1-2 个工作日内回复您
              </p>
              <Button
                variant="primary"
                onClick={() => setIsSubmitted(false)}
              >
                继续反馈
              </Button>
            </div>
          ) : (
            /* Feedback Form */
            <div className="bg-white border border-[#E5E6EB] rounded-[12px] p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm text-[#1D2129] mb-2">
                    姓名 <span className="text-[#F53F3F]">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="请输入您的姓名"
                    className="
                      w-full h-[44px] px-4 bg-[#F2F3F5] rounded-[8px]
                      border-2 border-transparent
                      text-[#1D2129] placeholder:text-[#C9CDD4]
                      focus:bg-white focus:border-[#165DFF] focus:outline-none
                      transition-all duration-200
                    "
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm text-[#1D2129] mb-2">
                    邮箱 <span className="text-[#F53F3F]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="your@email.com"
                    className="
                      w-full h-[44px] px-4 bg-[#F2F3F5] rounded-[8px]
                      border-2 border-transparent
                      text-[#1D2129] placeholder:text-[#C9CDD4]
                      focus:bg-white focus:border-[#165DFF] focus:outline-none
                      transition-all duration-200
                    "
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm text-[#1D2129] mb-2">
                    反馈类型 <span className="text-[#F53F3F]">*</span>
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleChange('category', e.target.value)}
                    className="
                      w-full h-[44px] px-4 bg-[#F2F3F5] rounded-[8px]
                      border-2 border-transparent
                      text-[#1D2129]
                      focus:bg-white focus:border-[#165DFF] focus:outline-none
                      transition-all duration-200
                    "
                  >
                    <option value="bug">Bug 报告</option>
                    <option value="feature">功能建议</option>
                    <option value="question">使用问题</option>
                    <option value="other">其他</option>
                  </select>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm text-[#1D2129] mb-2">
                    详细描述 <span className="text-[#F53F3F]">*</span>
                  </label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => handleChange('message', e.target.value)}
                    placeholder="请详细描述您遇到的问题或建议..."
                    rows={6}
                    className="
                      w-full px-4 py-3 bg-[#F2F3F5] rounded-[8px]
                      border-2 border-transparent
                      text-[#1D2129] placeholder:text-[#C9CDD4]
                      focus:bg-white focus:border-[#165DFF] focus:outline-none
                      transition-all duration-200 resize-none
                    "
                  />
                  <p className="text-xs text-[#4E5969] mt-2">
                    请提供尽可能详细的信息，以便我们更好地帮助您
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  fullWidth
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  <Send className="w-5 h-5" />
                  {isSubmitting ? '提交中...' : '提交反馈'}
                </Button>
              </form>
            </div>
          )}

          {/* Contact Info */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 bg-[#F2F3F5] rounded-[12px]">
              <h3 className="text-[#1D2129] mb-2">邮件联系</h3>
              <p className="text-sm text-[#4E5969] mb-2">
                也可以直接发送邮件到：
              </p>
              <a
                href="mailto:support@aiwatermark.com"
                className="text-sm text-[#165DFF] hover:text-[#4080FF] transition-colors duration-200"
              >
                support@aiwatermark.com
              </a>
            </div>

            <div className="p-6 bg-[#F2F3F5] rounded-[12px]">
              <h3 className="text-[#1D2129] mb-2">工作时间</h3>
              <p className="text-sm text-[#4E5969]">
                周一至周五：9:00 - 18:00
                <br />
                我们会在 1-2 个工作日内回复
              </p>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-12">
            <h2 className="text-2xl text-[#1D2129] mb-6 text-center">常见问题</h2>
            <div className="space-y-4">
              <details className="p-4 bg-[#F2F3F5] rounded-[8px]">
                <summary className="cursor-pointer text-[#1D2129] font-medium">
                  如何上传图片？
                </summary>
                <p className="mt-3 text-sm text-[#4E5969] leading-relaxed">
                  在首页点击上传区域或直接拖拽图片文件到上传区域即可。支持 JPG、PNG、WEBP 格式。
                </p>
              </details>

              <details className="p-4 bg-[#F2F3F5] rounded-[8px]">
                <summary className="cursor-pointer text-[#1D2129] font-medium">
                  我的图片会被上传到服务器吗？
                </summary>
                <p className="mt-3 text-sm text-[#4E5969] leading-relaxed">
                  不会。所有图片处理都在您的浏览器本地完成，我们不会上传、存储或访问您的图片。
                </p>
              </details>

              <details className="p-4 bg-[#F2F3F5] rounded-[8px]">
                <summary className="cursor-pointer text-[#1D2129] font-medium">
                  支持什么格式的图片？
                </summary>
                <p className="mt-3 text-sm text-[#4E5969] leading-relaxed">
                  目前支持 JPG、PNG、WEBP 格式的图片，单个文件最大 10MB。
                </p>
              </details>

              <details className="p-4 bg-[#F2F3F5] rounded-[8px]">
                <summary className="cursor-pointer text-[#1D2129] font-medium">
                  处理后的图片质量会降低吗？
                </summary>
                <p className="mt-3 text-sm text-[#4E5969] leading-relaxed">
                  我们的 AI 算法会尽可能保持原图质量，在去除水印的同时智能修复背景。
                </p>
              </details>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
