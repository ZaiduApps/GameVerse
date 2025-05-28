
"use client"

import type { Game } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  const [isInteracting, setIsInteracting] = useState(false);
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
  }, [startAutoPlay, stopAutoPlay, currentIndex]); 
  
  useEffect(() => {
    if (isInteracting) {
      stopAutoPlay();
      const interactionTimer = setTimeout(() => {
        setIsInteracting(false);
        startAutoPlay(); 
      }, autoPlayInterval * 1.5); 
      return () => clearTimeout(interactionTimer);
    }
  }, [isInteracting, autoPlayInterval, startAutoPlay, stopAutoPlay]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (games.length <= 1) return;
    stopAutoPlay();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
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
    if (translateX > SWIPE_THRESHOLD) goToPrevious();
    else if (translateX < -SWIPE_THRESHOLD) goToNext();
    else setTranslateX(0);
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
    if (translateX > SWIPE_THRESHOLD) goToPrevious();
    else if (translateX < -SWIPE_THRESHOLD) goToNext();
    else setTranslateX(0);
  };

  if (!games || games.length === 0) {
    return <div className="text-center p-4 bg-muted rounded-lg shadow">暂无推荐游戏</div>;
  }

  return (
    <div className="md:flex md:gap-4 lg:gap-6 rounded-lg overflow-hidden bg-card shadow-lg p-0 md:p-1"> {/* Adjusted padding for desktop */}
      {/* Left Side: Main Carousel Display */}
      <div 
        className="w-full md:w-3/4 lg:w-[70%] relative overflow-hidden select-none rounded-l-lg"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        style={{ cursor: games.length > 1 ? 'grab' : 'default' }}
      >
        <div 
          className="flex transition-transform duration-300 ease-out h-full" // h-full helps contain the fixed height image
          style={{ transform: `translateX(${-(currentIndex * 100)}%) translateX(${translateX}px)` }}
        >
          {games.map((game, index) => (
            <div key={game.id || index} className="w-full flex-shrink-0 relative aspect-[16/9] md:aspect-auto md:h-[400px] lg:h-[450px]"> {/* Fixed height for images */}
               <Link href={`/games/${game.id}`} draggable="false" className="block h-full">
                <Image
                  src={game.imageUrl}
                  alt={game.title}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  data-ai-hint={game.dataAiHint}
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 75vw, 70vw"
                  draggable="false"
                  onDragStart={(e) => e.preventDefault()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </Link>
              <div className="absolute bottom-0 left-0 p-4 md:p-6 text-white pointer-events-none">
                <h2 className="text-xl md:text-3xl font-bold mb-1 drop-shadow-lg">{game.title}</h2>
                <p className="text-xs md:text-base text-gray-200 hidden sm:block max-w-lg truncate drop-shadow-md">{game.shortDescription || game.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Preview List (Desktop Only) */}
      <div className="hidden md:block md:w-1/4 lg:w-[30%] space-y-1.5 py-2 pr-2 md:max-h-[400px] lg:max-h-[450px] overflow-y-auto"> {/* Added max-h and overflow-y-auto */}
        {games.map((game, index) => (
          <Link
            key={game.id}
            href={`/games/${game.id}`}
            className={cn(
              "flex items-center p-2.5 rounded-md cursor-pointer transition-all duration-200 ease-in-out group",
              currentIndex === index 
                ? "bg-primary/15 border border-primary/50 shadow-sm" 
                : "hover:bg-muted/60 hover:shadow-sm"
            )}
            onMouseEnter={() => { 
              setCurrentIndex(index); 
              setIsInteracting(true); 
              setTranslateX(0); // Reset any drag translation on main image
            }}
          >
            <div className="relative w-20 h-12 lg:w-24 lg:h-14 flex-shrink-0">
              <Image
                src={game.imageUrl}
                alt={game.title}
                fill
                className="object-cover rounded-sm"
                data-ai-hint={`${game.dataAiHint || 'game'} thumbnail`}
                sizes="100px"
              />
            </div>
            <div className="ml-2.5 flex-1 min-w-0">
              <h4 className="text-xs lg:text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                {game.title}
              </h4>
              {game.rating && (
                <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                  <Star size={12} className="mr-1 text-yellow-400 fill-yellow-400" />
                  {game.rating.toFixed(1)}
                </div>
              )}
              <p className="text-xs text-muted-foreground truncate mt-0.5">{game.category}</p>
            </div>
            {currentIndex === index && (
              <ChevronRightIcon size={18} className="ml-auto text-primary opacity-70 flex-shrink-0" />
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
