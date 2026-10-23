'use client';

import { Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { cn } from '@/lib/utils';
import type { HeroVideoView } from './game-detail-video';

interface GameHeroVideoProps extends HeroVideoView {
  gameName: string;
  // 位置类由父级传，组件只负责按钮外观与弹层。
  className?: string;
}

export default function GameHeroVideo({ source, poster, gameName, className }: GameHeroVideoProps) {
  const [open, setOpen] = useState(false);
  const [failed, setFailed] = useState(false);
  const [mounted, setMounted] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // 弹层走 portal，服务端渲染阶段没有 document，挂载后才允许渲染。
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const openPlayer = () => {
    setFailed(false);
    setOpen(true);
  };

  const closePlayer = () => setOpen(false);

  return (
    <>
      <button
        type="button"
        aria-label={`播放${gameName}的实机 PV`}
        onClick={openPlayer}
        className={cn(
          'inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/60 px-2.5 py-1 text-xs text-white backdrop-blur-sm transition hover:bg-black/75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
          className,
        )}
      >
        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
        实机 PV
      </button>

      {mounted && open
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`${gameName} 实机 PV`}
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/92 p-4 backdrop-blur-sm"
              onClick={closePlayer}
            >
              <button
                ref={closeButtonRef}
                type="button"
                aria-label="关闭视频"
                onClick={closePlayer}
                className="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="relative w-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
                  <video
                    src={source.url}
                    controls
                    autoPlay
                    playsInline
                    preload="metadata"
                    poster={poster}
                    className="h-full w-full"
                    onError={() => setFailed(true)}
                  />
                </div>
                {failed ? (
                  <p role="status" className="mt-3 text-center text-sm text-white/85">
                    视频加载失败，源地址可能已失效。
                  </p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
