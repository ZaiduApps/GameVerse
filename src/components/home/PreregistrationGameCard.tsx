
'use client';
import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface PreregistrationGameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  game: Game;
  className?: string;
}

export default function PreregistrationGameCard({ game, className, ...props }: PreregistrationGameCardProps) {
  return (
    <Link href={`/app/${game.pkg || game.id}`} className={`flex flex-col items-center text-center group flex-shrink-0 w-24 md:w-28 ${className}`} {...props}>
      <div className="relative w-16 h-16 md:w-20 md:h-20 mb-2">
        <Image
          src={game.imageUrl}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 64px, 80px"
          className="rounded-lg object-cover group-hover:shadow-lg transition-shadow"
          data-ai-hint={game.dataAiHint || "game icon square prereg"}
        />
      </div>
      <h3 className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate w-full px-1" title={game.title}>
        {game.title}
      </h3>
      <p className="text-xs text-primary font-semibold mt-0.5 group-hover:underline"> {/* Reduced mt-1 to mt-0.5 */}
        立即预约
      </p>
    </Link>
  );
}
