
'use client';
import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface NewReleaseGameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  game: Game;
}

export default function NewReleaseGameCard({ game, className, ...props }: NewReleaseGameCardProps) {
  const roundedRating = Math.round(game.rating || 0);

  return (
    <Link href={`/app/${game.pkg || game.id}`} className={`flex flex-col items-center text-center group flex-shrink-0 w-24 md:w-28 ${className}`} {...props}>
      <div className="relative w-16 h-16 md:w-20 md:h-20 mb-2">
        <Image
          src={game.imageUrl}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 64px, 80px"
          className="rounded-lg object-cover group-hover:shadow-lg transition-shadow"
          data-ai-hint={game.dataAiHint || "game icon square"}
        />
      </div>
      <h3 className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate w-full px-1" title={game.title}>
        {game.title}
      </h3>
      {typeof game.rating === 'number' && game.rating > 0 && (
        <div className="flex items-center mt-0.5"> {/* Reduced mt-1 to mt-0.5 */}
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3 h-3 md:w-3.5 md:h-3.5 ${i < roundedRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>
      )}
    </Link>
  );
}
