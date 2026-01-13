
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import type { SiteConfig } from '@/types';

interface FooterProps {
  config: SiteConfig | null;
}

export default function Footer({ config }: FooterProps) {
  if (!config) {
    return (
      <footer className="bg-muted/50 text-muted-foreground py-8 mt-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-xs">&copy; {new Date().getFullYear()} PlayAPKS. Site data failed to load.</p>
        </div>
      </footer>
    );
  }

  const { footer, friend_links, quick_links, basic } = config;

  return (
    <>
      <footer className="bg-muted/50 text-muted-foreground pt-12 pb-8 mt-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-8">
            <div className="col-span-2 lg:col-span-1">
              <h3 className="text-lg font-bold text-foreground mb-3">{basic.site_name}</h3>
              <p className="text-sm">{footer.footer_text}</p>
            </div>

            {quick_links.map((group) => (
              <div key={group.group_name}>
                <h4 className="font-semibold text-foreground mb-3">{group.group_name}</h4>
                <ul className="space-y-2">
                  {group.links.sort((a, b) => a.sort - b.sort).map(link => (
                    <li key={link._id}>
                      <Link href={link.url} className="text-sm hover:text-primary transition-colors">
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {friend_links && friend_links.length > 0 && (
            <>
              <Separator className="my-6 bg-border/50" />
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-foreground mb-3 text-center md:text-left">友情链接</h4>
                <div className="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2">
                  {friend_links.sort((a, b) => a.sort - b.sort).map(link => (
                     <Link key={link.name} href={link.url} target="_blank" rel="noopener noreferrer"
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
            <p>{footer.copyright}</p>
            {footer.icp_number && (
              <p>
                <a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  {footer.icp_number}
                </a>
              </p>
            )}
          </div>
        </div>
      </footer>
      {footer.footer_scripts && (
        <div dangerouslySetInnerHTML={{ __html: footer.footer_scripts }} />
      )}
    </>
  );
}
