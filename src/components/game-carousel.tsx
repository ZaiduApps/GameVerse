
"use client"

import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface GameCarouselProps {
  games: Game[];
  autoPlayInterval?: number; // in milliseconds
}

export default function GameCarousel({ games, autoPlayInterval = 5000 }: GameCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? games.length - 1 : prevIndex - 1));
  }, [games.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === games.length - 1 ? 0 : prevIndex + 1));
  }, [games.length]);

  useEffect(() => {
    if (autoPlayInterval > 0 && games.length > 1) {
      const timer = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
      return () => clearInterval(timer);
    }
  }, [goToNext, autoPlayInterval, games.length]);

  if (!games || games.length === 0) {
    return <div className="text-center p-4">暂无推荐游戏</div>;
  }

  const currentGame = games[currentIndex];

  return (
    <Card className="relative w-full overflow-hidden shadow-lg rounded-lg">
      <div className="relative w-full aspect-[16/7] md:aspect-[16/6]">
        <Link href={`/games/${currentGame.id}`}>
          <Image
            src={currentGame.imageUrl}
            alt={currentGame.title}
            fill
            priority={currentIndex === 0} // Prioritize first image for LCP
            className="object-cover transition-opacity duration-500 ease-in-out"
            data-ai-hint={currentGame.dataAiHint}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
        </Link>
        <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white">
          <h2 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 drop-shadow-lg">{currentGame.title}</h2>
          <p className="text-sm md:text-lg text-gray-200 hidden sm:block max-w-xl truncate drop-shadow-md">{currentGame.shortDescription || currentGame.description}</p>
        </div>
      </div>

      {games.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white border-none btn-interactive"
            onClick={goToPrevious}
            aria-label="上一张"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white border-none btn-interactive"
            onClick={goToNext}
            aria-label="下一张"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
      
      {games.length > 1 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {games.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                aria-label={`幻灯片 ${index + 1}`}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  currentIndex === index ? 'bg-primary' : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
      )}
    </Card>
  );
}
