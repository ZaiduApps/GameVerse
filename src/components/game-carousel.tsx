
"use client"

import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/card'; // Removed CardContent as it's not used directly

interface GameCarouselProps {
  games: Game[];
  autoPlayInterval?: number; // in milliseconds
}

const SWIPE_THRESHOLD = 50; // Minimum pixels to swipe to change slide

export default function GameCarousel({ games, autoPlayInterval = 5000 }: GameCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false); // Track user interaction (touch or button click)
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? games.length - 1 : prevIndex - 1));
    setTranslateX(0);
    setIsInteracting(true);
  }, [games.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === games.length - 1 ? 0 : prevIndex + 1));
    setTranslateX(0);
    setIsInteracting(true);
  }, [games.length]);

  const startAutoPlay = useCallback(() => {
    if (autoPlayInterval > 0 && games.length > 1 && !isInteracting) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    }
  }, [autoPlayInterval, games.length, goToNext, isInteracting]);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayTimerRef.current) {
      clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);
  
  // Reset interaction flag and restart autoplay after a delay
  useEffect(() => {
    if (isInteracting) {
      stopAutoPlay();
      const interactionTimer = setTimeout(() => {
        setIsInteracting(false);
        startAutoPlay(); 
      }, autoPlayInterval * 2); // Restart after 2x interval of no interaction
      return () => clearTimeout(interactionTimer);
    }
  }, [isInteracting, autoPlayInterval, startAutoPlay, stopAutoPlay]);


  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (games.length <= 1) return;
    stopAutoPlay();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0); // Reset translateX for the current slide
    setIsInteracting(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || games.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || games.length <= 1) return;
    setIsDragging(false);

    if (translateX > SWIPE_THRESHOLD) {
      goToPrevious();
    } else if (translateX < -SWIPE_THRESHOLD) {
      goToNext();
    } else {
      // Snap back if not enough swipe
      setTranslateX(0);
    }
    // Restart autoplay logic is handled by isInteracting effect
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (games.length <= 1) return;
    stopAutoPlay();
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
    setIsInteracting(true);
    if (carouselRef.current) carouselRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || games.length <= 1) return;
    const currentX = e.clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging || games.length <= 1) return;
    setIsDragging(false);
    if (carouselRef.current) carouselRef.current.style.cursor = 'grab';

    if (translateX > SWIPE_THRESHOLD) {
      goToPrevious();
    } else if (translateX < -SWIPE_THRESHOLD) {
      goToNext();
    } else {
      setTranslateX(0);
    }
  };


  if (!games || games.length === 0) {
    return <div className="text-center p-4">暂无推荐游戏</div>;
  }

  const currentGame = games[currentIndex];

  return (
    <Card 
      className="relative w-full overflow-hidden shadow-lg rounded-lg select-none" // Added select-none
      ref={carouselRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown} // Added mouse events for desktop dragging
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave} // Reset if mouse leaves while dragging
      style={{ cursor: games.length > 1 ? 'grab' : 'default' }}
    >
      <div 
        className="flex transition-transform duration-300 ease-out"
        style={{ transform: `translateX(${-(currentIndex * 100)}%) translateX(${translateX}px)` }}
      >
        {games.map((game, index) => (
          <div key={game.id || index} className="w-full flex-shrink-0 relative aspect-[16/7] md:aspect-[16/6]">
             <Link href={`/games/${game.id}`} draggable="false">
              <Image
                src={game.imageUrl}
                alt={game.title}
                fill
                priority={index === 0}
                className="object-cover"
                data-ai-hint={game.dataAiHint}
                sizes="(max-width: 768px) 100vw, 100vw"
                draggable="false" // Prevent image default drag
                onDragStart={(e) => e.preventDefault()} // Further prevent image drag
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
            </Link>
            <div className="absolute bottom-0 left-0 p-4 md:p-8 text-white pointer-events-none">
              <h2 className="text-2xl md:text-4xl font-bold mb-1 md:mb-2 drop-shadow-lg">{game.title}</h2>
              <p className="text-sm md:text-lg text-gray-200 hidden sm:block max-w-xl truncate drop-shadow-md">{game.shortDescription || game.description}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* This div below is for the item currently being interacted with, but needs to be part of the map for proper rendering with translateX */}
      {/* The actual logic is now applying translateX to the container of all slides */}

      {games.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white border-none btn-interactive z-10"
            onClick={(e) => { e.stopPropagation(); goToPrevious();}}
            aria-label="上一张"
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 rounded-full bg-black/30 hover:bg-black/50 text-white border-none btn-interactive z-10"
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            aria-label="下一张"
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
      
      {games.length > 1 && (
         <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
            {games.map((_, index) => (
              <button
                key={index}
                onClick={(e) => { e.stopPropagation(); setCurrentIndex(index); setTranslateX(0); setIsInteracting(true); }}
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

