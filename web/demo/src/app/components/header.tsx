import { Sparkles } from 'lucide-react';
import { Link, useLocation } from 'react-router';

interface HeaderProps {
  simple?: boolean;
}

export function Header({ simple = false }: HeaderProps) {
  const location = useLocation();

  return (
    <header className="w-full border-b border-[#E5E6EB] bg-white sticky top-0 z-50">
      <div className="max-w-[1440px] mx-auto px-6 h-[64px] flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity duration-200">
          <div className="w-8 h-8 bg-[#165DFF] rounded-[8px] flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-[#1D2129] font-medium">AI 去水印</span>
        </Link>
        
        {/* Navigation */}
        {!simple && (
          <nav className="flex items-center gap-2">
            <Link
              to="/"
              className={`h-[36px] px-4 rounded-[8px] transition-all duration-200 flex items-center ${
                location.pathname === '/'
                  ? 'text-[#165DFF] bg-[#F2F8FF]'
                  : 'text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5]'
              }`}
            >
              首页
            </Link>
            <Link
              to="/feedback"
              className={`h-[36px] px-4 rounded-[8px] transition-all duration-200 flex items-center ${
                location.pathname === '/feedback'
                  ? 'text-[#165DFF] bg-[#F2F8FF]'
                  : 'text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5]'
              }`}
            >
              问题反馈
            </Link>
            <Link
              to="/privacy"
              className={`h-[36px] px-4 rounded-[8px] transition-all duration-200 flex items-center ${
                location.pathname === '/privacy'
                  ? 'text-[#165DFF] bg-[#F2F8FF]'
                  : 'text-[#4E5969] hover:text-[#1D2129] hover:bg-[#F2F3F5]'
              }`}
            >
              隐私政策
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
