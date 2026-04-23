
import type { Metadata, Viewport } from 'next';
import { GeistMono } from 'geist/font/mono';
import localFont from 'next/font/local';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/context/auth-context';
import type { SiteConfig } from '@/types';
import Script from 'next/script';
import { resolveSiteStylePreset } from '@/lib/site-style';
import { getPublicSiteConfig } from '@/lib/site-config';
import { getSiteUrl } from '@/lib/seo';
import AppShell from '@/components/layout/AppShell';

const siteStyle = resolveSiteStylePreset(process.env.NEXT_PUBLIC_SITE_STYLE);

const bodyFont = localFont({
  src: '../fonts/NotoSansSC-VariableFont_wght.ttf',
  weight: '100 900',
  style: 'normal',
  variable: '--font-body',
  display: 'swap',
});
async function getSiteConfig(): Promise<SiteConfig | null> {
  return getPublicSiteConfig(300);
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();
  const siteName = config?.basic?.site_name || 'APKScc';
  const siteSlogan = config?.basic?.site_slogan || siteName;
  const seoDescription = config?.seo?.description || 'APKScc - 安卓游戏与应用下载平台';
  const seoKeywords = (config?.seo?.keywords || 'APKScc')
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  const titleSuffix = config?.seo?.title_suffix || '';
  const shareImage = config?.basic?.share_image || '';
  const favicon = config?.basic?.favicon_url || '/favicon.ico';
  const headerVerifications = config?.header?.verifications || {};

  if (!config) {
    return {
      title: 'APKScc',
      description: 'Failed to load site configuration.',
    };
  }

  const verification: Metadata['verification'] = {
    google: headerVerifications.google,
    other: {
      'baidu-site-verification': headerVerifications.baidu || '',
      '360-site-verification': headerVerifications.q360 || '',
      'sogou_site_verification': headerVerifications.sogou || '',
    },
  };

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: siteSlogan,
      template: `%s${titleSuffix}`,
    },
    description: seoDescription,
    keywords: seoKeywords,
    verification,
    openGraph: {
      title: siteSlogan,
      description: seoDescription,
      images: shareImage ? [{ url: shareImage, width: 1200, height: 630, alt: siteName }] : [],
      siteName: siteName,
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: siteSlogan,
      description: seoDescription,
      images: shareImage ? [shareImage] : [],
    },
    icons: {
      icon: favicon,
      shortcut: favicon,
      apple: favicon,
    },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' },
  ],
  width: 'device-width',
  initialScale: 1,
  userScalable: true,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  return (
    <html lang="zh-CN" data-site-style={siteStyle} suppressHydrationWarning>
      <head>
        {siteConfig?.header?.custom_css && (
          <style dangerouslySetInnerHTML={{ __html: siteConfig.header.custom_css }} />
        )}
        {siteConfig?.header?.head_scripts && (
          <Script
            id="analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: siteConfig.header.head_scripts,
            }}
          />
        )}
      </head>
      <body id="Top" className={`${bodyFont.variable} ${GeistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AppShell
              siteName={siteConfig?.basic?.site_name}
              logoUrl={siteConfig?.basic?.logo_url}
              siteConfig={siteConfig}
            >
              {children}
            </AppShell>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

