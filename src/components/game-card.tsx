
import Image from 'next/image';
import Link from 'next/link';
import type { Game } from '@/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Download } from 'lucide-react';
import { Button } from './ui/button';

interface GameCardProps {
  game: Game;
  className?: string;
}

export default function GameCard({ game, className }: GameCardProps) {
  return (
    <Card className={`overflow-hidden transition-all duration-300 ease-in-out hover:shadow-xl hover:border-primary/50 ${className}`}>
      <Link href={`/games/${game.id}`} className="block">
        <CardHeader className="p-0">
          <div className="relative w-full h-48">
            <Image
              src={game.imageUrl}
              alt={game.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover"
              data-ai-hint={game.dataAiHint}
            />
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-2">
          <CardTitle className="text-lg font-semibold truncate" title={game.title}>{game.title}</CardTitle>
          <p className="text-xs text-muted-foreground truncate h-8">{game.shortDescription || game.description}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
              <span>{game.rating || 'N/A'}</span>
            </div>
            <Badge variant="outline" className="text-xs">{game.category}</Badge>
          </div>
        </CardContent>
      </Link>
      <CardFooter className="p-4 pt-0">
        <Button asChild size="sm" className="w-full btn-interactive">
          <Link href={`/games/${game.id}/download`}>
            <Download size={16} className="mr-2" />
            获取游戏
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
