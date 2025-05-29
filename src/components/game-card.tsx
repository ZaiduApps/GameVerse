
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
      className={`overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 flex flex-col ${className}`}
      {...props}
    >
      <Link href={`/games/${game.id}`} className="block flex flex-col flex-grow">
        <CardHeader className="p-0">
          <div className="relative w-full h-36"> {/* Removed max-w-[233px] and mx-auto */}
            <Image
              src={game.imageUrl}
              alt={game.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" // Updated sizes
              className="object-cover"
              data-ai-hint={game.dataAiHint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-3 space-y-1.5 flex-grow"> {/* Reduced padding, smaller space */}
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
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{game.rating || 'N/A'}</span>
            </div>
            <Badge variant="outline" className="text-xs">{game.category}</Badge>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="p-3 pt-0 mt-auto"> {/* Reduced padding, ensure footer is at bottom */}
        <Button asChild size="sm" className="w-full btn-interactive">
          <Link href={`/games/${game.id}/download`}> {/* Assuming a download page/action exists */}
            <Download size={16} className="mr-2" />
            获取游戏
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
