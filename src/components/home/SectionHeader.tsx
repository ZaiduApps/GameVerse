import Link from 'next/link';
import type React from 'react';
import { ChevronRight } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  icon?: React.ElementType;
  iconClassName?: string;
  moreHref?: string;
  moreText?: string;
  as?: 'h1' | 'h2' | 'h3';
}

export default function SectionHeader({ title, icon: Icon, iconClassName, moreHref, moreText = '更多', as }: SectionHeaderProps) {
  const Tag = as || 'h2';
  return (
    <div className="flex items-center justify-between mb-4 md:mb-6">
      <div className="flex items-center">
        {Icon && <Icon className={`w-6 h-6 md:w-7 md:h-7 mr-2 md:mr-3 ${iconClassName || ''}`} />}
        <Tag className="text-xl md:text-2xl font-bold text-foreground">{title}</Tag>
      </div>
      {moreHref && (
        <Link href={moreHref} className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center">
          {moreText}
          <ChevronRight className="w-4 h-4 ml-0.5" />
        </Link>
      )}
    </div>
  );
}
