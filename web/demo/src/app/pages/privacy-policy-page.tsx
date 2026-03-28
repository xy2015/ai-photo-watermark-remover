import { Header } from '../components/header';
import { Footer } from '../components/footer';
import { Shield, Lock, Eye, Database } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />

      <main className="flex-1 w-full">
        <div className="max-w-[900px] mx-auto px-6 py-16">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="w-16 h-16 bg-[#F2F8FF] rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-[#165DFF]" />
            </div>
            <h1 className="text-4xl mb-4 text-[#1D2129]">隐私政策</h1>
            <p className="text-[#4E5969]">最后更新日期：2026年3月27日</p>
          </div>

          {/* Key Points */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
            <div className="p-4 bg-[#F2F8FF] rounded-[12px] border border-[#D4E8FF]">
              <Lock className="w-6 h-6 text-[#165DFF] mb-2" />
              <h3 className="text-sm text-[#1D2129] mb-1">本地处理</h3>
              <p className="text-xs text-[#4E5969]">所有图片在浏览器本地处理</p>
            </div>
            <div className="p-4 bg-[#F2F8FF] rounded-[12px] border border-[#D4E8FF]">
              <Eye className="w-6 h-6 text-[#165DFF] mb-2" />
              <h3 className="text-sm text-[#1D2129] mb-1">无数据收集</h3>
              <p className="text-xs text-[#4E5969]">不上传、不存储您的图片</p>
            </div>
            <div className="p-4 bg-[#F2F8FF] rounded-[12px] border border-[#D4E8FF]">
              <Database className="w-6 h-6 text-[#165DFF] mb-2" />
              <h3 className="text-sm text-[#1D2129] mb-1">隐私优先</h3>
              <p className="text-xs text-[#4E5969]">您的隐私是我们的首要任务</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose max-w-none">
            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">1. 信息收集</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  我们重视您的隐私。AI 去水印工具采用前端技术，所有图片处理均在您的浏览器本地完成，我们不会上传、存储或访问您的图片文件。
                </p>
                <p>
                  <strong className="text-[#1D2129]">我们不收集的信息：</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>您上传或处理的图片文件</li>
                  <li>图片中的任何内容或元数据</li>
                  <li>您的个人身份信息</li>
                  <li>您的设备信息或浏览器指纹</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">2. 信息使用</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  由于我们不收集任何个人信息或图片数据，因此不存在信息使用的问题。所有处理过程都在您的设备上完成，处理后的图片仅保存在您的本地存储中。
                </p>
                <p>
                  我们可能会收集匿名的使用统计数据（如页面访问量、功能使用频率等），但这些数据不包含任何可识别个人身份的信息。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">3. 数据安全</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  我们采用行业标准的安全措施来保护我们的网站和服务。由于图片处理在本地完成，您的图片数据始终在您的控制之下，不会通过网络传输到我们的服务器。
                </p>
                <p>
                  <strong className="text-[#1D2129]">安全措施：</strong>
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>HTTPS 加密连接</li>
                  <li>无服务器端数据存储</li>
                  <li>定期安全审计</li>
                  <li>开源代码可审查</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">4. Cookie 使用</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  我们使用必要的 Cookie 来确保网站的基本功能正常运行。这些 Cookie 不包含任何个人信息，仅用于：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>保持用户界面设置（如主题偏好）</li>
                  <li>记录匿名使用统计</li>
                  <li>确保网站安全性</li>
                </ul>
                <p>
                  您可以通过浏览器设置管理或禁用 Cookie，但这可能会影响某些功能的使用。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">5. 第三方服务</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  我们可能使用第三方服务来提供网站分析和性能监控。这些服务可能会收集匿名的使用数据，但不会访问您的图片文件或个人信息。
                </p>
                <p>
                  我们使用的第三方服务包括：
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>网站分析工具（用于了解网站使用情况）</li>
                  <li>内容分发网络（CDN，用于提高网站加载速度）</li>
                </ul>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">6. 儿童隐私</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  我们的服务面向所有年龄段的用户。由于我们不收集任何个人信息，因此不存在儿童隐私保护的特殊问题。我们建议家长和监护人监督未成年人使用互联网服务。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">7. 隐私政策更新</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并注明最后更新日期。重大变更将通过网站通知的方式告知用户。
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl mb-4 text-[#1D2129]">8. 联系我们</h2>
              <div className="space-y-4 text-[#4E5969] leading-relaxed">
                <p>
                  如果您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
                </p>
                <div className="p-4 bg-[#F2F3F5] rounded-[8px]">
                  <p><strong className="text-[#1D2129]">电子邮件：</strong> privacy@aiwatermark.com</p>
                  <p><strong className="text-[#1D2129]">工作时间：</strong> 周一至周五 9:00-18:00</p>
                </div>
              </div>
            </section>
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-[#F2F8FF] rounded-[12px] border border-[#D4E8FF] text-center">
            <Shield className="w-12 h-12 text-[#165DFF] mx-auto mb-3" />
            <h3 className="text-xl text-[#1D2129] mb-2">隐私保护承诺</h3>
            <p className="text-[#4E5969] mb-4">
              我们承诺保护您的隐私，所有图片处理均在本地完成，绝不上传到服务器
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
