import { Link } from 'react-router';
import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { Button } from '../components/button';
import { Home, Search } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 w-full flex items-center justify-center">
        <div className="max-w-[600px] mx-auto px-6 py-20 text-center">
          <div className="w-24 h-24 bg-[#F2F3F5] rounded-full flex items-center justify-center mx-auto mb-6">
            <Search className="w-12 h-12 text-[#C9CDD4]" />
          </div>
          
          <h1 className="text-6xl mb-4 text-[#1D2129]">404</h1>
          <h2 className="text-2xl mb-4 text-[#1D2129]">页面未找到</h2>
          <p className="text-[#4E5969] mb-8">
            抱歉，您访问的页面不存在或已被删除
          </p>

          <Link to="/">
            <Button variant="primary" size="large">
              <Home className="w-5 h-5" />
              返回首页
            </Button>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}
