
import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import PageTransitionLoader from '@/components/layout/PageTransitionLoader';
import { Suspense } from 'react';
import type { SiteConfig } from '@/types';
import Script from 'next/script';
const CONFIG_API_URL = 'https://api.hk.apks.cc/config/info?site_name=APKScc';

async function getSiteConfig(): Promise<SiteConfig | null> {
  try {
    const res = await fetch(CONFIG_API_URL, {
      next: { revalidate: 10 }, // Revalidate every hour
    });
    if (!res.ok) {
      console.error('Failed to fetch site config:', res.status, res.statusText);
      return null;
    }
    const json = await res.json();
    if (json.code !== 0) {
      console.error('API error for site config:', json.message);
      return null;
    }
    return json.data;
  } catch (error) {
    console.error('Error fetching site config:', error);
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getSiteConfig();

  if (!config) {
    return {
      title: 'APKScc',
      description: 'Failed to load site configuration.',
    };
  }

  const { header, basic, seo } = config;

  const verification: Metadata['verification'] = {};
  if (header.verifications) {
    const { google, baidu, q360, sogou } = header.verifications;
    if (google) {
      verification.google = google;
    }
    const other: { [key: string]: string } = {};
    if (baidu) {
      other['baidu-site-verification'] = baidu;
    }
    if (q360) {
      other['360-site-verification'] = q360;
    }
    if (sogou) {
      other['sogou_site_verification'] = sogou;
    }
    if (Object.keys(other).length > 0) {
      verification.other = other;
    }
  }

  return {
    metadataBase: new URL('https://apks.cc'),
    title: {
      default: basic.site_slogan,
      template: `%s${seo.title_suffix}`,
    },
    description: seo.description,
    keywords: seo.keywords.split(','),
    verification,
    openGraph: {
      title: basic.site_slogan,
      description: seo.description,
      images: [
        {
          url: basic.share_image,
          width: 1200,
          height: 630,
          alt: basic.site_name,
        },
      ],
      siteName: basic.site_name,
      type: 'website',
      locale: 'zh_CN',
    },
    twitter: {
      card: 'summary_large_image',
      title: basic.site_slogan,
      description: seo.description,
      images: [basic.share_image],
    },
    icons: {
      icon: basic.favicon_url,
      shortcut: basic.favicon_url,
      apple: basic.favicon_url,
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
  maximumScale: 1,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteConfig = await getSiteConfig();

  return (
    <html lang="zh-CN" suppressHydrationWarning>
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
      <body id="Top" className={`${GeistSans.variable} ${GeistMono.variable} antialiased flex flex-col min-h-screen`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Suspense fallback={null}>
            <PageTransitionLoader />
          </Suspense>
          <Header siteName={siteConfig?.basic.site_name} logoUrl={siteConfig?.basic.logo_url} />
          <main className="flex-grow container mx-auto px-4 py-8">
            {children}
          </main>
          <Footer config={siteConfig} />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
