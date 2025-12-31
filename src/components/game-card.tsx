
import Image from 'next/image';
import Link from 'next/link';
import type { Game } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Download } from 'lucide-react';
import { Button } from './ui/button';

interface GameCardProps extends React.HTMLAttributes<HTMLDivElement> {
  game: Game;
}

export default function GameCard({ game, className, ...props }: GameCardProps) {
  return (
    <Card
      className={`overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 flex flex-col min-w-[140px] ${className}`}
      {...props}
    >
      <Link href={`/app/${game.pkg || game.id}`} className="block flex flex-col flex-grow">
        <CardHeader className="p-0">
          <div className="relative w-full aspect-video">
            <Image
              src={game.bannerUrl || game.imageUrl}
              alt={game.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover"
              data-ai-hint={game.dataAiHint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-1.5 flex-grow">
          <div className="flex items-start space-x-2.5">
            <Image
              src={game.imageUrl} // Using main image as icon source
              alt={`${game.title} icon`}
              width={40}
              height={40}
              className="rounded object-cover flex-shrink-0 mt-0.5"
              data-ai-hint={game.dataAiHint ? `${game.dataAiHint} icon` : "game icon"}
            />
            <div className="flex-grow min-w-0">
              <CardTitle className="text-base font-semibold truncate leading-tight" title={game.title}>
                {game.title}
              </CardTitle>
              <p className="text-xs text-muted-foreground truncate mt-0.5" title={game.shortDescription || game.description}>
                {game.shortDescription || game.description}
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
             {game.rating && game.rating > 0 ? (
                <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                    <span>{game.rating.toFixed(1)}</span>
                </div>
            ) : <div />}
            <Badge variant="outline" className="text-xs">{game.category}</Badge>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="p-3 pt-0 mt-auto">
        <Button asChild size="sm" className="w-full btn-interactive text-[10px] sm:px-3 sm:text-xs">
          <Link href={`/app/${game.pkg || game.id}`}>
            <Download size={16} className="mr-1 sm:mr-2" />
            获取游戏
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
