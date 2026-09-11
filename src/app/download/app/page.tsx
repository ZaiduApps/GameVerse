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
    alternates: {
      canonical: '/download/app',
    },
    robots: {
      index: false,
      follow: true,
      googleBot: {
        index: false,
        follow: true,
      },
    },
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
    <div className="min-h-screen bg-background text-foreground antialiased">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 text-base font-medium">
            {logoUrl ? (
              <img className="h-8 w-8 rounded-md object-cover" alt={`${siteName} logo`} src={logoUrl} />
            ) : (
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                {brandLetter}
              </span>
            )}
            <span className="truncate">{siteName}</span>
          </div>

          <nav className="hidden items-center gap-8 text-sm md:flex">
            <a className="font-medium text-foreground hover:text-primary" href="#" data-acbox-action="client_download_nav_home" data-acbox-label="首页">首页</a>
            <a className="font-medium text-muted-foreground hover:text-foreground" href="#features" data-acbox-action="client_download_nav_features" data-acbox-label="核心功能">核心功能</a>
            <a className="font-medium text-muted-foreground hover:text-foreground" href="#community" data-acbox-action="client_download_nav_community" data-acbox-label="玩家社区">玩家社区</a>
            <a className="font-medium text-muted-foreground hover:text-foreground" href="#" data-acbox-action="client_download_nav_help" data-acbox-label="帮助中心">帮助中心</a>
          </nav>

          <div className="flex items-center gap-2">
            <a className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90" href={downloadUrl} target="_blank" rel="noopener noreferrer" data-acbox-action="client_download_nav_apk" data-acbox-label={`导航下载 v${versionText}`}>下载 APK</a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <p className="text-sm font-medium text-muted-foreground">最新版本 v{versionText}</p>
            <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl md:text-6xl">
              开启你的
              <br />
              智能新境界
            </h1>
            <p className="max-w-lg text-base leading-relaxed text-muted-foreground">{heroDescription}</p>

            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
              <a className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90" href={downloadUrl} target="_blank" rel="noopener noreferrer" data-acbox-action="client_download_hero_apk" data-acbox-label={`Hero 下载 v${versionText}`}>下载安卓 APK</a>
              <a className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted" href="/" data-acbox-action="client_download_open_web" data-acbox-label="前往网页版">前往网页版</a>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="flex -space-x-3">
                <img className="h-10 w-10 rounded-full border-2 border-background object-cover" alt="社区活跃用户头像" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqvk_J9GGvAodmXGLedgvBF_toJkvAKZ3_JtwjP8_Uvy_ian80MXJ1gixf4D11bLFguDREgY8AeiEjQdP4EsDAiK_hvNB4YFe2qMLz9IZPbfa42iqMFjp-2bzBuwCh3uVWO_UwM6Gtl_Pk8MKGMgydb51Ac0dH2N1XXVrpbcMCr244CT4cEWjorXq0oovUPoJk8-m_jc1LRKa66VVr2dHNaMlvgstqQtWJfLxZYQzveaJZqdnqgQ38s3XQLYmwWr74HPfEivRy_4hL" />
                <img className="h-10 w-10 rounded-full border-2 border-background object-cover" alt="社区活跃用户头像" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCel95FTxxKC_OcWSVr0deuzEn9gKuIrpI2msBXHZeKLR8wMgsXFemczoGWSege0tXzIL0KbzxYsuLjCAVUIh3PGN8CUruXmob8XF_Ni6kVctf9XgpQJKInczAY6wa3EFw0Xyz1QRuJD8U6YaVrtpJdB63lG7E1s_JQje-CBHQjTK1WWq7Sef3HzR6-EDCZ5Maz0cBrSCEq9ga8_e8NIh5UI5CPTOX41h1PfOAO3BrN960qlHic0YrM1J7k5EcslmWkPwNXDbB5WGWE" />
                <img className="h-10 w-10 rounded-full border-2 border-background object-cover" alt="社区活跃用户头像" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDW0hSzRI2tajFPYToYUY1tPpLqaMm7PJf_mHNirICrbBGrPw4zJ1bZ9gCgrYDIS_7HHj1DYxGWzOlV6KoyhQ12o_IdB4Wxyqa2VWX2s97DzOOxJcsrAGxMp6RtefTmP1HajAMX6USFH54Ag2y-wVLAEpwUJB9QVk6F1WEGQeVcwh3k6yATEjTRS2FroAYOBlDiIxhXbmnmrbJb3_ULnmXhRMv9Ubj0NnRy0HKmD7pzRbJd14f2ijC-6M01PkVFKHEmlSaVQHCkJMWA" />
              </div>
              <span className="text-sm text-muted-foreground">+ 1.2M 活跃用户已加入</span>
            </div>
          </div>

          <div className="mx-auto w-full max-w-xs">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-sm">
              <img className="aspect-[9/19.5] w-full rounded-2xl object-cover" alt={`${siteName} 应用界面截图预览`} src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJWYiZJPWbjf_xZV22GKjO9x3xQQnsCESXhsX5eWFhdKMVFQvVR7ThPFqu-Xi-JgDJzfHoTKjIgZ149kZm74ybWcN1zbiUz93oP_3J4RDQH-v3xa_Oci4ojiJHOjb1sjBBlNxxocIfqofW1zgE8je0pRyk9fCsqTwdvJ3ZPnOYcU1lrGVNMAI_cAzvPB23X6JFkjkzhje2VofJJAzAS_Iej-RQDFP7taGGuRxbtYOIzj8dFtgB1MMWmqaR73Zo7LCOq-zDxdqhdz7f" />
            </div>
          </div>
        </section>

        <section id="features" className="border-y border-border bg-muted/30">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="mb-10 max-w-2xl">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">核心优势</h2>
              <p className="mt-3 text-muted-foreground">融合极致科技与青春美学，打造通透自由的操作体验。</p>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              <div className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-lg font-semibold">闪电加速</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">底层渲染引擎深度优化，应用加载提升 45%。瞬时启动，拒绝等待，享受极致流畅。</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-lg font-semibold">纯净安全</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">三重隐私保护盾，实时监测潜在风险，为你的手机提供纯净安全的使用环境。</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <h3 className="text-lg font-semibold">灵动界面</h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">摒弃复杂回归简约，智能分类一目了然，让每次操作都更直观高效。</p>
              </div>
            </div>
          </div>
        </section>

        <section id="community" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">千万玩家的青春共鸣</h2>
              <blockquote className="text-base leading-relaxed text-muted-foreground">“界面真的很轻快，完全没有以前那种笨重感。作为二次元爱好者，这种通透的配色真的太戳我了！”</blockquote>
              <div className="flex items-center gap-4">
                <img className="h-14 w-14 rounded-full object-cover" alt="玩家 云川喵子 头像" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8wMxygPKyYwZ5_Sjib3WfbYtoEgOAAgzdyyzOq70yjEcVn3HEMvfmW1lvLHSLKvmXcNNNS0ywIOZKH7CwptH4y5AnmYPyF9PngyVRjmQd37CVmWEWBDcBqnbV8QFllpEa8o4Huh2HA9iFr8baiCm1gVoO35IkClznoS_Opdxe1Q_6UcwzIzsi1Qd3OE4IEInltBVFEtBuXVXv7odtGC-mASKSbIHDZDO3EHZl-IdYtsCIBl5f6GomXDuEVcR_6tb_n14VzBguhbSd" />
                <div>
                  <p className="font-medium">云川 喵子</p>
                  <p className="text-sm text-muted-foreground">资深画师 & 极客玩家</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="text-sm leading-relaxed">“流畅度满分，配色很清爽。”</p>
                <p className="mt-4 text-sm text-muted-foreground">@Ace_Kun</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="text-sm leading-relaxed">“APK 解析非常快，无广告。”</p>
                <p className="mt-4 text-sm text-muted-foreground">@TechOtaku</p>
              </div>
              <div className="rounded-2xl border border-border bg-background p-6">
                <p className="text-sm leading-relaxed">“心目中完美的 APK 管理器。”</p>
                <p className="mt-4 text-sm text-muted-foreground">@Lin_Small</p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-border">
                <img className="h-full min-h-40 w-full object-cover" alt="社区活动照片" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBb8lgWU3mfvYMAtfB9qs00NjA0T9SOkeksBb2yAfgW-cnYJqudcitweeq4jCN0XcHUd5BhDaY1txGS0wIX8tsJ-40nCV56crsNJ_erOMU4X_v2EDOUfJ-1g7DpsZyFeOIJrS-dJmI89z4EMZc6ZQFrSfJRoGTxjribMYI4xGFQozjuEKgZuqleuL-jcp9zE5ZVHV-weS80NhRyc8yQ-EUPkOEhZDEnrFC5rVAOjC_hbDOZu6Q4Keu7XzIKDQMCwX1wpain0768TzDI" />
              </div>
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-muted/30">
          <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 sm:py-24">
            <p className="text-sm font-medium text-primary">100% 官方验证 · 安全无忧</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">立即获取 {siteName} APK</h2>

            <div className="mt-10 grid gap-10 text-left sm:grid-cols-2 sm:items-center">
              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-sm text-muted-foreground">当前版本</p>
                    <p className="mt-1 text-xl font-medium">v{versionText}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">文件大小</p>
                    <p className="mt-1 text-xl font-medium">{fileSizeText}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">系统要求</p>
                    <p className="mt-1 text-xl font-medium">Android 8.0+</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">最近更新</p>
                    <p className="mt-1 text-xl font-medium">{publishDateText}</p>
                  </div>
                </div>
                <a className="flex items-center justify-center rounded-full bg-primary px-6 py-3.5 text-base font-medium text-primary-foreground transition-opacity hover:opacity-90" href={downloadUrl} target="_blank" rel="noopener noreferrer" data-acbox-action="client_download_main_apk" data-acbox-label={`主下载区 v${versionText}`}>点击下载 APK</a>
              </div>

              <div className="mx-auto">
                <div className="rounded-2xl border border-border bg-background p-6">
                  {qrCodeDataUrl ? (
                    <img className="mx-auto h-56 w-56 object-contain" alt="下载二维码" src={qrCodeDataUrl} />
                  ) : (
                    <div className="flex h-56 w-56 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">扫码下载</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-10 sm:px-6 md:flex-row">
          <div className="flex items-center gap-2 text-sm font-medium">
            {logoUrl ? (
              <img className="h-6 w-6 rounded object-cover" alt={`${siteName} logo`} src={logoUrl} />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">{brandLetter}</span>
            )}
            <span>{siteName}</span>
            <span className="text-muted-foreground">© 2026</span>
          </div>
          <div className="flex gap-8 text-sm">
            <a className="text-muted-foreground hover:text-foreground" href="#" data-acbox-action="client_download_footer_privacy" data-acbox-label="隐私条款">隐私条款</a>
            <a className="text-muted-foreground hover:text-foreground" href="#" data-acbox-action="client_download_footer_terms" data-acbox-label="用户协议">用户协议</a>
            <a className="text-muted-foreground hover:text-foreground" href="#" data-acbox-action="client_download_footer_contact" data-acbox-label="联系支持">联系支持</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
