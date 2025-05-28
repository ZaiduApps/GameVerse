
import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';

interface PreregistrationGameCardProps {
  game: Game;
  className?: string;
}

export default function PreregistrationGameCard({ game, className }: PreregistrationGameCardProps) {
  return (
    <Link href={`/games/${game.id}`} className={`flex flex-col items-center text-center group ${className}`}>
      <div className="relative w-24 h-24 md:w-28 md:h-28 mb-2">
        <Image
          src={game.imageUrl}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 96px, 112px"
          className="rounded-lg object-cover group-hover:shadow-lg transition-shadow"
          data-ai-hint={game.dataAiHint || "game icon square prereg"}
        />
      </div>
      <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate w-full px-1" title={game.title}>
        {game.title}
      </h3>
      <p className="text-xs text-primary font-semibold mt-1 group-hover:underline">
        立即预约
      </p>
    </Link>
  );
}
