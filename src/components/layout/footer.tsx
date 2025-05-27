
import { Github, Twitter, Linkedin } from 'lucide-react';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { name: 'GitHub', href: 'https://github.com/apkscc', icon: Github },
    { name: 'Twitter/X', href: 'https://x.com/apkscc', icon: Twitter },
    { name: 'LinkedIn', href: 'https://linkedin.com/in/apkscc', icon: Linkedin },
  ];

  return (
    <footer className="bg-muted/50 text-muted-foreground py-8 mt-12">
      <div className="container mx-auto px-4 text-center">
        <div className="mb-4">
          <p className="text-sm">网站作者：<span className="font-semibold">Apks.cc</span></p>
        </div>
        <div className="flex justify-center space-x-6 mb-6">
          {socialLinks.map((link) => (
            <Link key={link.name} href={link.href} target="_blank" rel="noopener noreferrer" aria-label={link.name}
                  className="text-muted-foreground hover:text-primary transition-colors duration-300 transform hover:scale-110">
              <link.icon size={24} />
            </Link>
          ))}
        </div>
        <Separator className="my-4 bg-border/50" />
        <p className="text-xs">
          &copy; {currentYear} GameVerse (游戏宇宙). 保留所有权利.
        </p>
        <p className="text-xs mt-1">
          本网站内容仅供娱乐参考.
        </p>
      </div>
    </footer>
  );
}
