
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import type { SiteConfig } from '@/types';
import Script from 'next/script';

interface FooterProps {
  config: SiteConfig | null;
}

function isSafeFooterLink(url: string) {
  const value = String(url || '').trim();
  if (!value) return false;
  if (value === '#' || /^javascript:/i.test(value)) return false;
  if (/^(?:https?:\/\/|\/)/i.test(value)) return true;
  return false;
}

export default function Footer({ config }: FooterProps) {
  if (!config) {
    return (
      <footer className="bg-muted/40 text-muted-foreground py-8 mt-12 border-t-2 border-foreground">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs">&copy; {new Date().getFullYear()} APKScc. 安卓游戏与应用下载平台。</p>
        </div>
      </footer>
    );
  }

  const footer = config.footer || {
    copyright: `© ${new Date().getFullYear()} APKScc. All rights reserved.`,
    footer_text: 'APKScc',
  };
  const friend_links = config.friend_links || [];
  const quick_links = (config.quick_links || []).map((group) => {
    if (group.group_name === '关于我们') {
      return {
        ...group,
        links: [
          { name: '关于我们', url: '/about', sort: 0 },
          { name: '联系我们', url: '/contact', sort: 1 },
          { name: '隐私政策', url: '/privacy-policy', sort: 2 },
          { name: '用户协议', url: '/terms', sort: 3 },
        ],
      };
    }
    return group;
  });
  const basic = config.basic || {
    site_name: 'APKScc',
    site_slogan: 'APKScc',
    logo_url: '',
    favicon_url: '',
    share_image: '',
  };

  return (
    <>
      <footer className="bg-muted/40 text-muted-foreground pt-12 pb-8 mt-12 border-t-2 border-foreground">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="md:w-1/3 lg:w-1/4">
              <p className="text-xl font-bold text-foreground mb-3 tracking-wide">{basic.site_name}</p>
              <p className="text-sm">{footer.footer_text}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              {quick_links.map((group, groupIndex) => (
                <div key={group.group_name}>
                  <p className="font-semibold text-foreground mb-3">{group.group_name}</p>
                  <ul className="space-y-2">
                      {(group.links || [])
                        .filter((link) => isSafeFooterLink(link.url))
                        .sort((a, b) => a.sort - b.sort)
                        .map(link => (
                       <li key={`${group.group_name}-${groupIndex}-${typeof link._id === 'string' ? link._id : link._id?.$oid || link.name}-${link.sort}`}>
                         <Link href={link.url} className="text-sm hover:text-primary transition-colors">
                           {link.name}
                         </Link>
                       </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>


          {friend_links && friend_links.length > 0 && (
            <>
              <Separator className="my-6 bg-border/50" />
              <div className="mb-6">
                <p className="text-sm font-semibold text-foreground mb-3 text-center md:text-left">友情链接</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
                   {friend_links.filter((link) => isSafeFooterLink(link.url)).sort((a, b) => a.sort - b.sort).map(link => (
                      <Link key={`${link.name}-${link.url}-${link.sort}`} href={link.url} target="_blank" rel="noopener noreferrer"
                            className="text-sm hover:text-primary transition-colors">
                         {link.name}
                     </Link>
                  ))}
                </div>
              </div>
            </>
          )}

          <Separator className="my-6 bg-border/50" />

          <div className="text-center text-xs space-y-1">
          <p dangerouslySetInnerHTML={{ __html: footer.copyright || '' }} />
          </div>
        </div>
      </footer>
      {footer.footer_scripts && (
         <Script id="footer-scripts" strategy="afterInteractive">
          {footer.footer_scripts.replace(/<script>|<\/script>/g, '')}
        </Script>
      )}
    </>
  );
}
