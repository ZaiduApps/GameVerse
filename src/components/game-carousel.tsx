
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
        return `/app/${item.url_link}`;
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
    <div className="overflow-hidden rounded-xl bg-card p-0 shadow-lg md:flex md:gap-4 md:p-1 lg:gap-6">
      {/* Left Side: Main Carousel Display */}
      <div 
        className="relative w-full select-none overflow-hidden rounded-xl md:w-3/4 md:rounded-l-xl md:rounded-r-md lg:w-[70%]"
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
              <div className="pointer-events-none absolute bottom-0 left-0 w-full p-3 text-white sm:p-4 md:p-6">
                <div className="flex items-end gap-3 md:gap-4">
                  {item.goto_type === 'game' && item.game && (
                    <div className="relative h-10 w-10 flex-shrink-0 sm:h-12 sm:w-12 md:h-14 md:w-14">
                      <Image
                        src={item.game.icon}
                        alt={`${item.game.name} icon`}
                        fill
                        className="rounded-xl object-cover"
                        sizes="64px"
                      />
                    </div>
                  )}
                  <div className="flex-grow min-w-0">
                    <h2 className="mb-1 text-base font-bold drop-shadow-lg sm:text-lg md:text-lg lg:text-xl">{item.name}</h2>
                    <p className="line-clamp-2 text-sm text-gray-200 drop-shadow-md sm:text-sm md:text-base">
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
      <div className="hidden space-y-2 overflow-y-auto py-2 pr-2 md:block md:max-h-[320px] md:w-1/4 lg:max-h-[360px] lg:w-[30%]">
        {bannerItems.map((item, index) => (
          <Link
            key={item._id}
            href={getLinkHref(item)}
            className={cn(
              "group flex cursor-pointer items-center rounded-xl p-2.5 transition-all duration-200 ease-in-out",
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
            <div className="relative flex h-11 w-[72px] flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-muted lg:h-12 lg:w-[88px]">
              <Image
                src={item.url_image}
                alt={item.name}
                fill
                className="rounded-xl object-cover"
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
