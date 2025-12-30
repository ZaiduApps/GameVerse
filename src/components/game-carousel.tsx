
"use client"

import type { ApiBanner } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { Star, ChevronRight as ChevronRightIcon, Gamepad2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface GameCarouselProps {
  bannerItems: ApiBanner[];
  autoPlayInterval?: number; // in milliseconds
}

const SWIPE_THRESHOLD = 50; // Minimum pixels to swipe to change slide

export default function GameCarousel({ bannerItems, autoPlayInterval = 5000 }: GameCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? bannerItems.length - 1 : prevIndex - 1));
    setTranslateX(0);
    setIsInteracting(true);
  }, [bannerItems.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prevIndex) => (prevIndex === bannerItems.length - 1 ? 0 : prevIndex + 1));
    setTranslateX(0);
    setIsInteracting(true);
  }, [bannerItems.length]);

  const startAutoPlay = useCallback(() => {
    if (autoPlayInterval > 0 && bannerItems.length > 1 && !isInteracting) {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
      autoPlayTimerRef.current = setInterval(() => {
        goToNext();
      }, autoPlayInterval);
    }
  }, [autoPlayInterval, bannerItems.length, goToNext, isInteracting]);

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
    if (bannerItems.length <= 1) return;
    stopAutoPlay();
    setIsDragging(true);
    setStartX(e.touches[0].clientX);
    setTranslateX(0);
    setIsInteracting(true);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || bannerItems.length <= 1) return;
    const currentX = e.touches[0].clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleTouchEnd = () => {
    if (!isDragging || bannerItems.length <= 1) return;
    setIsDragging(false);
    if (translateX > SWIPE_THRESHOLD) goToPrevious();
    else if (translateX < -SWIPE_THRESHOLD) goToNext();
    else setTranslateX(0);
  };
  
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (bannerItems.length <= 1) return;
    stopAutoPlay();
    setIsDragging(true);
    setStartX(e.clientX);
    setTranslateX(0);
    setIsInteracting(true);
    if (carouselRef.current) carouselRef.current.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || bannerItems.length <= 1) return;
    const currentX = e.clientX;
    const diffX = currentX - startX;
    setTranslateX(diffX);
  };

  const handleMouseUpOrLeave = () => {
    if (!isDragging || bannerItems.length <= 1) return;
    setIsDragging(false);
    if (carouselRef.current) carouselRef.current.style.cursor = 'grab';
    if (translateX > SWIPE_THRESHOLD) goToPrevious();
    else if (translateX < -SWIPE_THRESHOLD) goToNext();
    else setTranslateX(0);
  };

  const getLinkHref = (item: ApiBanner): string => {
    switch (item.goto_type) {
      case 'game':
        return `/games/${item.url_link}`;
      case 'article':
        return `/article/${item.url_link}`;
      case 'news':
        return `/news/${item.url_link}`;
      case 'url':
        return item.url_link;
      default:
        return '#';
    }
  };


  if (!bannerItems || bannerItems.length === 0) {
    return <div className="text-center p-4 bg-muted rounded-lg shadow">暂无推荐内容</div>;
  }

  return (
    <div className="md:flex md:gap-4 lg:gap-6 rounded-lg overflow-hidden bg-card shadow-lg p-0 md:p-1">
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
        style={{ cursor: bannerItems.length > 1 ? 'grab' : 'default' }}
      >
        <div 
          className="flex transition-transform duration-300 ease-out h-full"
          style={{ transform: `translateX(${-(currentIndex * 100)}%) translateX(${translateX}px)` }}
        >
          {bannerItems.map((item, index) => (
            <div key={item._id} className="w-full flex-shrink-0 relative aspect-[16/9] md:aspect-auto md:h-[320px] lg:h-[360px]">
               <Link href={getLinkHref(item)} draggable="false" className="block h-full">
                <Image
                  src={item.url_image}
                  alt={item.name}
                  fill
                  priority={index === 0}
                  className="object-cover"
                  sizes="(max-width: 767px) 100vw, (max-width: 1023px) 75vw, 70vw"
                  draggable="false"
                  onDragStart={(e) => e.preventDefault()}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
              </Link>
              <div className="absolute bottom-0 left-0 p-3 sm:p-4 md:p-6 text-white pointer-events-none w-full">
                <div className="flex items-end gap-4">
                  {item.goto_type === 'game' && item.game && (
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
                      <Image
                        src={item.game.icon}
                        alt={`${item.game.name} icon`}
                        fill
                        className="object-cover rounded-lg"
                        sizes="80px"
                      />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-1 drop-shadow-lg">{item.name}</h2>
                    <p className="text-xs text-gray-200 line-clamp-2 drop-shadow-md">
                      {item.description}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side: Preview List (Desktop Only) */}
      <div className="hidden md:block md:w-1/4 lg:w-[30%] space-y-1.5 py-2 pr-2 md:max-h-[320px] lg:max-h-[360px] overflow-y-auto">
        {bannerItems.map((item, index) => (
          <Link
            key={item._id}
            href={getLinkHref(item)}
            className={cn(
              "flex items-center p-2.5 rounded-md cursor-pointer transition-all duration-200 ease-in-out group",
              currentIndex === index 
                ? "bg-primary/15 border border-primary/50 shadow-sm" 
                : "hover:bg-muted/60 hover:shadow-sm"
            )}
            onMouseEnter={() => { 
              setCurrentIndex(index); 
              setIsInteracting(true); 
              setTranslateX(0);
            }}
          >
            <div className="relative w-20 h-12 lg:w-24 lg:h-14 flex-shrink-0 bg-muted rounded-sm flex items-center justify-center">
              <Image
                src={item.game?.icon || item.url_image}
                alt={item.name}
                fill
                className="object-cover rounded-sm"
                sizes="100px"
              />
            </div>
            <div className="ml-2.5 flex-1 min-w-0">
              <h4 className="text-xs lg:text-sm font-semibold truncate text-foreground group-hover:text-primary transition-colors">
                {item.name}
              </h4>
              {item.goto_type === 'game' && item.game ? (
                <div className="text-xs text-muted-foreground mt-0.5 space-y-1">
                   <div className="flex items-center">
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">{item.game.tags?.[0] || '游戏'}</Badge>
                      <span className="mx-1.5">|</span>
                      <Badge variant="outline" className="text-xs px-1.5 py-0.5">{item.game.metadata.region}</Badge>
                   </div>
                   {item.game.star > 0 && (
                     <div className="flex items-center">
                       <Star size={12} className="mr-1 text-yellow-400 fill-yellow-400" />
                       {item.game.star.toFixed(1)}
                     </div>
                   )}
                </div>
              ) : (
                 <p className="text-xs text-muted-foreground truncate mt-0.5">{item.goto_type}</p>
              )}
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
