import { Link } from 'react-router';

export function Footer() {
  return (
    <footer className="w-full border-t border-[#E5E6EB] bg-white">
      <div className="max-w-[1440px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-[#1D2129] mb-4">关于我们</h3>
            <p className="text-sm text-[#4E5969] leading-relaxed">
              AI 去水印工具致力于为用户提供简单、高效、隐私安全的图片处理服务。
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-[#1D2129] mb-4">快速链接</h3>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm text-[#4E5969] hover:text-[#165DFF] transition-colors duration-200">
                首页
              </Link>
              <Link to="/feedback" className="text-sm text-[#4E5969] hover:text-[#165DFF] transition-colors duration-200">
                问题反馈
              </Link>
              <Link to="/privacy" className="text-sm text-[#4E5969] hover:text-[#165DFF] transition-colors duration-200">
                隐私政策
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[#1D2129] mb-4">联系我们</h3>
            <div className="flex flex-col gap-2">
              <p className="text-sm text-[#4E5969]">邮箱：support@aiwatermark.com</p>
              <p className="text-sm text-[#4E5969]">工作时间：周一至周五 9:00-18:00</p>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 border-t border-[#E5E6EB] flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#4E5969]">
            © 2026 AI 去水印工具 · 保留所有权利
          </p>
          <div className="flex items-center gap-4">
            <Link to="/privacy" className="text-sm text-[#4E5969] hover:text-[#165DFF] transition-colors duration-200">
              隐私政策
            </Link>
            <span className="text-[#E5E6EB]">|</span>
            <span className="text-sm text-[#4E5969]">用户协议</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
