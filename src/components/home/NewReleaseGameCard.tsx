
import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { Star } from 'lucide-react';

interface NewReleaseGameCardProps {
  game: Game;
  className?: string;
}

export default function NewReleaseGameCard({ game, className }: NewReleaseGameCardProps) {
  const roundedRating = Math.round(game.rating || 0);

  return (
    <Link href={`/games/${game.id}`} className={`flex flex-col items-center text-center group ${className}`}>
      <div className="relative w-24 h-24 md:w-28 md:h-28 mb-2">
        <Image
          src={game.imageUrl}
          alt={game.title}
          fill
          sizes="(max-width: 768px) 96px, 112px"
          className="rounded-lg object-cover group-hover:shadow-lg transition-shadow"
          data-ai-hint={game.dataAiHint || "game icon square"}
        />
      </div>
      <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate w-full px-1" title={game.title}>
        {game.title}
      </h3>
      {typeof game.rating === 'number' && (
        <div className="flex items-center mt-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 md:w-4 md:h-4 ${i < roundedRating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground/30'}`}
            />
          ))}
        </div>
      )}
    </Link>
  );
}
