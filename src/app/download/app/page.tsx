import type { Metadata } from 'next';

import { ThemeToggle } from '@/components/theme-toggle';
import { getClientLandingAppData } from '@/lib/client-landing';
import { getSiteUrl } from '@/lib/seo';

function formatPublishDate(value?: string | null) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getLogoFallbackName(name: string) {
  const value = String(name || '').trim();
  return value ? value.slice(0, 1).toUpperCase() : 'A';
}

async function buildDownloadQrCodeDataUrl(downloadUrl: string) {
  const url = String(downloadUrl || '').trim();
  if (!url) return '';
  try {
    const qrcode = await import('qrcode');
    return await qrcode.toDataURL(url, {
      width: 240,
      margin: 1,
      color: {
        dark: '#001e05',
        light: '#ffffff',
      },
    });
  } catch {
    return '';
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const landing = await getClientLandingAppData(300);
  const siteName = String(landing?.site?.site_name || 'APKScc').trim() || 'APKScc';
  const titleSuffix = String(landing?.site?.seo?.title_suffix || '').trim();
  const title = `${siteName} APP 下载${titleSuffix}`;
  const description =
    String(landing?.site?.seo?.description || '').trim() ||
    `${siteName} 安卓客户端下载页`;
  const keywords = String(landing?.site?.seo?.keywords || '').trim();
  const shareImage = String(landing?.site?.share_image || '').trim();
  const favicon = String(landing?.site?.favicon_url || '').trim();

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    keywords: keywords
      ? keywords
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : undefined,
    icons: favicon
      ? {
          icon: favicon,
          shortcut: favicon,
          apple: favicon,
        }
      : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
      siteName,
      images: shareImage ? [{ url: shareImage }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareImage ? [shareImage] : undefined,
    },
  };
}

export default async function DownloadAppPage() {
  const landing = await getClientLandingAppData(120);
  const siteName = String(landing?.site?.site_name || 'A-Mark').trim() || 'A-Mark';
  const siteSlogan = String(landing?.site?.site_slogan || '').trim();
  const logoUrl = String(landing?.site?.logo_url || '').trim();
  const downloadUrl =
    String(landing?.client?.download_url || '').trim() || 'https://app.apks.cc';
  const versionText = String(landing?.client?.latest_version || '').trim() || '2.4.0';
  const fileSizeText =
    String(landing?.client?.file_size_text || '').trim() || '-';
  const publishDateText = formatPublishDate(landing?.client?.publish_at || null);
  const brandLetter = getLogoFallbackName(siteName);
  const qrCodeDataUrl = await buildDownloadQrCodeDataUrl(downloadUrl);
  const heroDescription =
    siteSlogan || `${siteName} 不仅仅是一个应用管理工具，它是你探索移动互联网的加速器。极致效率，如影随形。`;

  return (
    <div className="download-landing bg-[#fdfdfd] font-body text-[#001e05] selection:bg-[#0070f3]/10 selection:text-[#0070f3] overflow-x-hidden">
      {/* Module: Decorative particle background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="particle w-4 h-4 top-1/4 left-1/4" style={{ animationDelay: '0s' }} />
        <div className="particle w-6 h-6 top-1/2 left-1/3" style={{ animationDelay: '-2s' }} />
        <div className="particle w-3 h-3 top-3/4 left-2/3" style={{ animationDelay: '-5s' }} />
        <div className="particle w-5 h-5 top-1/3 left-3/4" style={{ animationDelay: '-7s' }} />
      </div>

      {/* Module: Top navigation bar */}
      <nav className="fixed top-0 w-full z-50 bg-white/60 backdrop-blur-md border-b border-gray-100/50">
        <div className="flex justify-between items-center max-w-7xl mx-auto px-4 py-3 sm:px-6 sm:py-4">
          {/* Block: Brand */}
          <div className="text-lg sm:text-xl font-black text-[#0070f3] italic font-headline tracking-tight flex items-center gap-2">
            {logoUrl ? (
              <img
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover"
                alt={`${siteName} logo`}
                src={logoUrl}
              />
            ) : (
              <span className="w-7 h-7 sm:w-8 sm:h-8 brand-token rounded-lg flex items-center justify-center text-white not-italic text-sm">
                {brandLetter}
              </span>
            )}
            {siteName}
          </div>
          {/* Block: Desktop nav links */}
          <div className="hidden md:flex gap-10 items-center">
            <a className="text-[#0070f3] font-headline font-bold tracking-tight relative after:content-[''] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-0.5 after:bg-[#0070f3] after:rounded-full" href="#">
              首页
            </a>
            <a className="text-[#001e05]/70 hover:text-[#0070f3] transition-colors duration-300 font-headline font-bold tracking-tight" href="#features">
              核心功能
            </a>
            <a className="text-[#001e05]/70 hover:text-[#e53935] transition-colors duration-300 font-headline font-bold tracking-tight" href="#community">
              玩家社区
            </a>
            <a className="text-[#001e05]/70 hover:text-[#ffb300] transition-colors duration-300 font-headline font-bold tracking-tight" href="#">
              帮助中心
            </a>
          </div>
          {/* Block: Action buttons (download + theme switch) */}
          <div className="landing-actions flex items-center gap-2 sm:gap-3">
            <a
              className="landing-theme-btn text-white px-4 py-2 sm:px-5 sm:py-2 rounded-full font-semibold hover:shadow-lg transition-all duration-300 active:scale-95 text-xs sm:text-sm"
              href={downloadUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              立即下载 APK
            </a>
            <ThemeToggle />
          </div>
        </div>
      </nav>

      {/* Module: Hero section */}
      <section className="relative min-h-screen flex items-center pt-20 pb-10 px-4 sm:pt-24 sm:pb-12 sm:px-6 overflow-hidden">
        {/* Block: Background ribbons */}
        <svg className="ribbon-flow top-0 left-0 w-full h-full opacity-20" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <path d="M-100,300 Q150,100 400,300 T900,300" fill="none" stroke="#0070f3" strokeLinecap="round" strokeWidth="60" />
          <path d="M1100,400 Q850,600 600,400 T-100,400" fill="none" stroke="#e53935" strokeLinecap="round" strokeWidth="40" />
          <path d="M-100,700 Q300,900 600,700 T1100,700" fill="none" stroke="#ffb300" strokeLinecap="round" strokeWidth="30" />
        </svg>

        {/* Block: Floating decorations */}
        <div className="floating-shape top-32 right-1/4 w-12 h-12 border-4 border-[#0070f3]/20 rounded-xl" style={{ animationDelay: '1s' }} />
        <div className="floating-shape bottom-1/4 left-1/3 w-8 h-8 bg-[#e53935]/10 rounded-full" style={{ animationDelay: '2s' }} />
        <div
          className="floating-shape top-1/2 right-10 w-16 h-16 border-4 border-[#ffb300]/20 rounded-full"
          style={{ animationDelay: '0.5s', borderStyle: 'dashed' }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 items-center relative z-10">
          {/* Block: Hero copy and CTAs */}
          <div className="space-y-6 sm:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0070f3]/5 text-[#0070f3] text-xs font-black tracking-widest uppercase border border-[#0070f3]/10">
              <span className="material-symbols-outlined text-xs fill-icon">bolt</span>
              New Release v{versionText}
            </div>

            <h1 className="font-headline text-3xl sm:text-5xl md:text-6xl font-extrabold text-[#001e05] tracking-tighter leading-[1.1]">
              开启你的
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0070f3] to-blue-400">智能新境界</span>
            </h1>

            <p className="text-sm sm:text-base text-[#4a5568] max-w-lg leading-relaxed font-medium opacity-80">
              {heroDescription}
            </p>

            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 pt-2 sm:pt-4">
              <a
                className="landing-theme-btn text-white w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold flex items-center justify-center gap-3 shadow-xl transition-all hover:scale-105 active:scale-95"
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined">download</span>
                下载安卓 APK
              </a>
              <a
                className="bg-white w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl text-sm sm:text-base font-bold border border-gray-200 text-[#001e05]/70 transition-all hover:bg-gray-50 inline-flex items-center justify-center"
                href="/"
              >
                前往网页版
              </a>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 pt-4 sm:pt-6">
              <div className="flex -space-x-4">
                <img
                  className="w-11 h-11 rounded-full border-4 border-white shadow-sm"
                  alt="avatar 1"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqvk_J9GGvAodmXGLedgvBF_toJkvAKZ3_JtwjP8_Uvy_ian80MXJ1gixf4D11bLFguDREgY8AeiEjQdP4EsDAiK_hvNB4YFe2qMLz9IZPbfa42iqMFjp-2bzBuwCh3uVWO_UwM6Gtl_Pk8MKGMgydb51Ac0dH2N1XXVrpbcMCr244CT4cEWjorXq0oovUPoJk8-m_jc1LRKa66VVr2dHNaMlvgstqQtWJfLxZYQzveaJZqdnqgQ38s3XQLYmwWr74HPfEivRy_4hL"
                />
                <img
                  className="w-11 h-11 rounded-full border-4 border-white shadow-sm"
                  alt="avatar 2"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCel95FTxxKC_OcWSVr0deuzEn9gKuIrpI2msBXHZeKLR8wMgsXFemczoGWSege0tXzIL0KbzxYsuLjCAVUIh3PGN8CUruXmob8XF_Ni6kVctf9XgpQJKInczAY6wa3EFw0Xyz1QRuJD8U6YaVrtpJdB63lG7E1s_JQje-CBHQjTK1WWq7Sef3HzR6-EDCZ5Maz0cBrSCEq9ga8_e8NIh5UI5CPTOX41h1PfOAO3BrN960qlHic0YrM1J7k5EcslmWkPwNXDbB5WGWE"
                />
                <img
                  className="w-11 h-11 rounded-full border-4 border-white shadow-sm"
                  alt="avatar 3"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW0hSzRI2tajFPYToYUY1tPpLqaMm7PJf_mHNirICrbBGrPw4zJ1bZ9gCgrYDIS_7HHj1DYxGWzOlV6KoyhQ12o_IdB4Wxyqa2VWX2s97DzOOxJcsrAGxMp6RtefTmP1HajAMX6USFH54Ag2y-wVLAEpwUJB9QVk6F1WEGQeVcwh3k6yATEjTRS2FroAYOBlDiIxhXbmnmrbJb3_ULnmXhRMv9Ubj0NnRy0HKmD7pzRbJd14f2ijC-6M01PkVFKHEmlSaVQHCkJMWA"
                />
              </div>
              <span className="text-sm font-bold text-[#001e05]/40">+ 1.2M 活跃用户已加入</span>
            </div>
          </div>

          {/* Block: Hero device mockup */}
          <div className="relative group mt-2 sm:mt-0">
            <div className="relative z-10 w-full max-w-[230px] sm:max-w-[300px] mx-auto transform rotate-1 sm:rotate-2 transition-transform group-hover:rotate-0 duration-700">
              <div className="bg-gray-900 rounded-[3.5rem] p-3 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.15)] overflow-hidden aspect-[9/19.5]">
                <img
                  className="w-full h-full object-cover rounded-[3rem]"
                  alt="phone preview"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJWYiZJPWbjf_xZV22GKjO9x3xQQnsCESXhsX5eWFhdKMVFQvVR7ThPFqu-Xi-JgDJzfHoTKjIgZ149kZm74ybWcN1zbiUz93oP_3J4RDQH-v3xa_Oci4ojiJHOjb1sjBBlNxxocIfqofW1zgE8je0pRyk9fCsqTwdvJ3ZPnOYcU1lrGVNMAI_cAzvPB23X6JFkjkzhje2VofJJAzAS_Iej-RQDFP7taGGuRxbtYOIzj8dFtgB1MMWmqaR73Zo7LCOq-zDxdqhdz7f"
                />
              </div>
              <div className="absolute -top-7 -right-7 sm:-top-10 sm:-right-10 w-20 h-20 sm:w-28 sm:h-28 brand-token flex items-center justify-center rounded-3xl shadow-2xl transform -rotate-12 group-hover:rotate-0 transition-all duration-500">
                {logoUrl ? (
                  <img
                    className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl object-cover bg-white/95 p-1.5"
                    alt={`${siteName} logo`}
                    src={logoUrl}
                  />
                ) : (
                  <span className="text-4xl sm:text-6xl font-black text-white italic">{brandLetter}</span>
                )}
              </div>
            </div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-gradient-to-br from-[#0070f3]/10 via-transparent to-[#e53935]/10 blur-[120px] -z-10 rounded-full" />
          </div>
        </div>
      </section>

      {/* Module: Features section */}
      <section className="relative py-20 sm:py-32 px-4 sm:px-6 bg-white overflow-hidden" id="features">
        {/* Block: Top decorative wave */}
        <svg className="absolute top-0 left-0 w-full h-32 opacity-10" preserveAspectRatio="none" viewBox="0 0 1440 320">
          <path d="M0,160 C240,280 480,40 720,160 C960,280 1200,40 1440,160 L1440,0 L0,0 Z" fill="#0070f3" />
        </svg>
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Block: Section heading */}
          <div className="text-center mb-12 sm:mb-24 space-y-4">
            <div className="flex items-center justify-center gap-3">
              <span className="w-3 h-3 bg-[#e53935] rounded-full" />
              <span className="w-3 h-3 bg-[#0070f3] rounded-full" />
              <span className="w-3 h-3 bg-[#ffb300] rounded-full" />
            </div>
            <h2 className="font-headline text-2xl sm:text-4xl font-black">核心优势</h2>
            <p className="text-[#4a5568] max-w-xl mx-auto text-sm sm:text-base opacity-60">融合极致科技与青春美学，打造通透自由的操作体验。</p>
          </div>

          {/* Block: Feature cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-8">
            <div className="glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:shadow-2xl hover:shadow-[#0070f3]/10 transition-all duration-500 border border-gray-100">
              <div className="w-14 h-14 bg-[#0070f3]/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-2xl text-[#0070f3] fill-icon">bolt</span>
              </div>
              <h3 className="font-headline text-xl font-extrabold mb-4">闪电加速</h3>
              <p className="text-[#4a5568] leading-relaxed opacity-70">底层渲染引擎深度优化，应用加载提升 45%。瞬时启动，拒绝等待，享受极致流畅。</p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:shadow-2xl hover:shadow-[#e53935]/10 transition-all duration-500 border border-gray-100">
              <div className="w-14 h-14 bg-[#e53935]/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-2xl text-[#e53935] fill-icon">shield_with_heart</span>
              </div>
              <h3 className="font-headline text-xl font-extrabold mb-4">纯净安全</h3>
              <p className="text-[#4a5568] leading-relaxed opacity-70">三重隐私保护盾，实时监测潜在风险。为你的手机构筑坚不可摧的次元防线。</p>
            </div>

            <div className="glass-card p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] group hover:shadow-2xl hover:shadow-[#ffb300]/10 transition-all duration-500 border border-gray-100">
              <div className="w-14 h-14 bg-[#ffb300]/10 rounded-2xl flex items-center justify-center mb-8">
                <span className="material-symbols-outlined text-2xl text-[#ffb300] fill-icon">auto_awesome</span>
              </div>
              <h3 className="font-headline text-xl font-extrabold mb-4">灵动界面</h3>
              <p className="text-[#4a5568] leading-relaxed opacity-70">摒弃复杂回归简约，智能分类一目了然。每一个交互都像翻阅精美画册般赏心悦目。</p>
            </div>
          </div>
        </div>
      </section>

      {/* Module: Community testimonials section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-[#f8fff7] relative overflow-hidden" id="community">
        {/* Block: Decorative ring */}
        <div className="absolute top-1/2 -right-40 w-[600px] h-[600px] border-[40px] border-[#0070f3]/5 rounded-full pointer-events-none" />
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 sm:gap-20 relative z-10">
          {/* Block: Left testimonial quote */}
          <div className="lg:w-1/2 space-y-8">
            <h2 className="font-headline text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              千万玩家的
              <br />
              <span className="text-[#0070f3]">青春共鸣</span>
            </h2>

            <div className="space-y-6">
              <p className="text-sm sm:text-base text-[#4a5568] leading-relaxed italic opacity-80">
                “界面真的很轻快，完全没有以前那种笨重感。作为二次元爱好者，这种通透的配色真的太戳我了！”
              </p>
              <div className="flex items-center gap-4">
                <img
                  className="w-14 h-14 rounded-full ring-4 ring-white shadow-md"
                  alt="user avatar"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8wMxygPKyYwZ5_Sjib3WfbYtoEgOAAgzdyyzOq70yjEcVn3HEMvfmW1lvLHSLKvmXcNNNS0ywIOZKH7CwptH4y5AnmYPyF9PngyVRjmQd37CVmWEWBDcBqnbV8QFllpEa8o4Huh2HA9iFr8baiCm1gVoO35IkClznoS_Opdxe1Q_6UcwzIzsi1Qd3OE4IEInltBVFEtBuXVXv7odtGC-mASKSbIHDZDO3EHZl-IdYtsCIBl5f6GomXDuEVcR_6tb_n14VzBguhbSd"
                />
                <div>
                  <p className="font-bold text-base">云川 喵子</p>
                  <p className="text-sm text-[#0070f3] font-bold">资深画师 & 极客玩家</p>
                </div>
              </div>
            </div>
          </div>

          {/* Block: Right stacked social proof cards */}
          <div className="lg:w-1/2 grid grid-cols-2 gap-6">
            <div className="space-y-6">
              <div className="bg-white/80 backdrop-blur p-8 rounded-3xl shadow-sm border border-white">
                <p className="text-sm font-bold text-[#001e05]/60 mb-4">"流畅度满分，配色很清爽。"</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#0070f3]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#0070f3]">@Ace_Kun</span>
                </div>
              </div>
              <div className="bg-white/80 backdrop-blur p-8 rounded-3xl shadow-sm border border-white transform translate-x-6">
                <p className="text-sm font-bold text-[#001e05]/60 mb-4">"APK 解析非常快，无广告。"</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#e53935]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#e53935]">@TechOtaku</span>
                </div>
              </div>
            </div>

            <div className="space-y-6 pt-12">
              <div className="bg-white/80 backdrop-blur p-8 rounded-3xl shadow-sm border border-white">
                <p className="text-sm font-bold text-[#001e05]/60 mb-4">"心目中完美的 APK 管理器。"</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#ffb300]" />
                  <span className="text-xs font-black uppercase tracking-widest text-[#ffb300]">@Lin_Small</span>
                </div>
              </div>
              <div className="relative rounded-3xl overflow-hidden group">
                <img
                  className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-110"
                  alt="community event"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb8lgWU3mfvYMAtfB9qs00NjA0T9SOkeksBb2yAfgW-cnYJqudcitweeq4jCN0XcHUd5BhDaY1txGS0wIX8tsJ-40nCV56crsNJ_erOMU4X_v2EDOUfJ-1g7DpsZyFeOIJrS-dJmI89z4EMZc6ZQFrSfJRoGTxjribMYI4xGFQozjuEKgZuqleuL-jcp9zE5ZVHV-weS80NhRyc8yQ-EUPkOEhZDEnrFC5rVAOjC_hbDOZu6Q4Keu7XzIKDQMCwX1wpain0768TzDI"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                  <p className="text-[10px] text-white font-bold tracking-widest uppercase">Community Event</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Module: Download hub section */}
      <section className="py-20 sm:py-32 px-4 sm:px-6 bg-white relative overflow-hidden">
        <div className="max-w-5xl mx-auto glass-card p-6 sm:p-12 md:p-20 rounded-[2rem] sm:rounded-[4rem] relative z-10 text-center shadow-xl border-gray-100">
          {/* Block: Trust badge */}
          <div className="mb-10 inline-flex items-center gap-2 bg-[#0070f3]/5 text-[#0070f3] px-6 py-2 rounded-full font-bold text-sm border border-[#0070f3]/10">
            <span className="material-symbols-outlined text-sm fill-icon">verified_user</span>
            100% 官方验证 · 安全无忧
          </div>

          <h2 className="font-headline text-2xl sm:text-4xl font-black mb-8 sm:mb-16">立即获取 {siteName} APK</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-16 items-center">
            {/* Block: Version info and main download CTA */}
            <div className="text-left space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-[#001e05]/30 uppercase tracking-[0.2em] mb-1">当前版本</p>
                  <p className="text-xl font-black text-[#0070f3]">v{versionText}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#001e05]/30 uppercase tracking-[0.2em] mb-1">文件大小</p>
                  <p className="text-xl font-black">{fileSizeText}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#001e05]/30 uppercase tracking-[0.2em] mb-1">系统要求</p>
                  <p className="text-xl font-bold">Android 8.0+</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-[#001e05]/30 uppercase tracking-[0.2em] mb-1">最近更新</p>
                  <p className="text-xl font-bold">{publishDateText}</p>
                </div>
              </div>

              <a
                className="w-full landing-theme-btn text-white py-3.5 sm:py-4 rounded-[2rem] text-base sm:text-lg font-black shadow-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 sm:gap-4"
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="material-symbols-outlined text-3xl">download_for_offline</span>
                点击下载 APK
              </a>
            </div>

            {/* Block: QR placeholder card */}
            <div className="flex justify-center">
              <div className="p-6 bg-white rounded-[3.5rem] shadow-xl border border-gray-50 relative group">
                <div className="w-48 h-48 bg-gray-50 rounded-3xl flex items-center justify-center border-2 border-dashed border-[#0070f3]/20 group-hover:border-[#0070f3]/40 transition-colors">
                  {qrCodeDataUrl ? (
                    <img
                      className="w-44 h-44 rounded-2xl object-contain bg-white p-1"
                      alt="下载二维码"
                      src={qrCodeDataUrl}
                    />
                  ) : (
                    <div className="text-center p-4">
                      <span className="material-symbols-outlined text-5xl text-[#0070f3]/20 mb-3">qr_code_2</span>
                      <p className="text-[10px] font-black text-[#001e05]/30 uppercase tracking-widest">扫码秒下</p>
                    </div>
                  )}
                </div>
                <div className="absolute -top-3 -right-3 bg-[#e53935] text-white px-4 py-1 rounded-full text-[10px] font-black shadow-lg uppercase tracking-widest">
                  Quick Scan
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Block: Bottom decorative wave */}
        <svg className="absolute bottom-0 right-0 w-1/2 h-64 opacity-5 pointer-events-none" viewBox="0 0 500 500">
          <path d="M500,500 Q250,400 0,500" fill="none" stroke="#0070f3" strokeWidth="100" />
        </svg>
      </section>

      {/* Module: Footer */}
      <footer className="bg-white border-t border-gray-100 w-full py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex flex-col md:flex-row justify-between items-center gap-8 sm:gap-10">
          {/* Block: Brand and copyright */}
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="font-black text-[#0070f3] text-xl italic font-headline flex items-center gap-2">
              {logoUrl ? (
                <img
                  className="w-6 h-6 rounded object-cover"
                  alt={`${siteName} logo`}
                  src={logoUrl}
                />
              ) : (
                <div className="w-6 h-6 bg-[#0070f3] rounded flex items-center justify-center text-white not-italic text-[10px]">
                  {brandLetter}
                </div>
              )}
              {siteName}
            </div>
            <p className="text-[#001e05]/30 text-sm font-medium">© 2026 {siteName}. 开启智能新纪元。</p>
          </div>
          {/* Block: Footer links */}
          <div className="flex gap-12 text-sm font-bold text-[#001e05]/50">
            <a className="hover:text-[#0070f3] transition-colors" href="#">
              隐私条款
            </a>
            <a className="hover:text-[#0070f3] transition-colors" href="#">
              用户协议
            </a>
            <a className="hover:text-[#0070f3] transition-colors" href="#">
              联系支持
            </a>
          </div>
        </div>
      </footer>

      {/* Module: Page-scoped style rules */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;700;800&family=Manrope:wght@400;500;600;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

        html {
          scrollbar-gutter: stable;
        }

        .dark .download-landing {
          background: #0b1118 !important;
          color: #e6edf7 !important;
        }

        .dark .download-landing nav {
          background: rgba(11, 17, 24, 0.75) !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .dark .download-landing section.bg-white {
          background: #0f1724 !important;
        }

        .dark .download-landing #community {
          background: #0d1420 !important;
        }

        .dark .download-landing footer {
          background: #0f1724 !important;
          border-color: rgba(255, 255, 255, 0.08) !important;
        }

        .dark .download-landing .glass-card {
          background: rgba(17, 24, 39, 0.55) !important;
          border-color: rgba(255, 255, 255, 0.12) !important;
        }

        .dark .download-landing [class*='text-[#001e05]'] {
          color: #e6edf7 !important;
        }

        .dark .download-landing [class*='text-[#4a5568]'] {
          color: #b5c3d6 !important;
        }

        .landing-actions button {
          border: 0 !important;
          outline: none !important;
          box-shadow: none !important;
        }

        .material-symbols-outlined {
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .landing-theme-btn,
        .brand-token {
          background-color: hsl(var(--primary));
        }

        .landing-theme-btn:hover {
          box-shadow: 0 14px 30px -12px hsl(var(--primary) / 0.45);
        }

        .fill-icon {
          font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }

        .ribbon-flow {
          position: absolute;
          z-index: 1;
          pointer-events: none;
          filter: blur(0.5px);
        }

        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }

        .floating-shape {
          position: absolute;
          pointer-events: none;
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
          }
        }

        .particle {
          position: absolute;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0) 70%);
          border-radius: 50%;
          pointer-events: none;
          animation: drift 10s linear infinite;
        }

        @keyframes drift {
          from {
            transform: translate(0, 0) rotate(0deg);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          to {
            transform: translate(100px, -100px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}


