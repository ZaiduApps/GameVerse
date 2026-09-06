'use client';

import { createPortal } from 'react-dom';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent,
  type WheelEvent,
} from 'react';
import { ChevronLeft, ChevronRight, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface GameScreenshotLightboxProps {
  gameName: string;
  screenshots: string[];
  initialIndex: number;
  onClose: () => void;
}

interface DragState {
  dragging: boolean;
  startX: number;
  startY: number;
  baseX: number;
  baseY: number;
}

export default function GameScreenshotLightbox({
  gameName,
  screenshots,
  initialIndex,
  onClose,
}: GameScreenshotLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoomState] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [imageError, setImageError] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dragStateRef = useRef<DragState>({
    dragging: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });
  const canNavigate = screenshots.length > 1;
  const currentUrl = screenshots[currentIndex] || screenshots[0] || '';

  const resetTransform = useCallback(() => {
    setZoomState(1);
    setOffset({ x: 0, y: 0 });
    setImageError(false);
  }, []);

  const setZoom = useCallback((value: number) => {
    const next = Math.min(3, Math.max(1, Number(value.toFixed(2))));
    setZoomState(next);
    if (next <= 1) setOffset({ x: 0, y: 0 });
  }, []);

  const showPrevious = useCallback(() => {
    if (!canNavigate) return;
    setCurrentIndex((index) => (index - 1 + screenshots.length) % screenshots.length);
    resetTransform();
  }, [canNavigate, resetTransform, screenshots.length]);

  const showNext = useCallback(() => {
    if (!canNavigate) return;
    setCurrentIndex((index) => (index + 1) % screenshots.length);
    resetTransform();
  }, [canNavigate, resetTransform, screenshots.length]);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const frame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [mounted]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key === 'Tab') {
        const dialog = dialogRef.current;
        const focusable = dialog
          ? Array.from(
              dialog.querySelectorAll<HTMLElement>(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
              ),
            ).filter((element) => element.getClientRects().length > 0)
          : [];
        if (focusable.length > 0) {
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          const active = document.activeElement;
          if (event.shiftKey && (active === first || !dialog?.contains(active))) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
      if (event.key === 'ArrowLeft') showPrevious();
      if (event.key === 'ArrowRight') showNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, showNext, showPrevious]);

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    setZoom(zoom + (event.deltaY < 0 ? 0.2 : -0.2));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return;
    dragStateRef.current = {
      dragging: true,
      startX: event.clientX,
      startY: event.clientY,
      baseX: offset.x,
      baseY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragStateRef.current;
    if (!drag.dragging) return;
    setOffset({
      x: drag.baseX + event.clientX - drag.startX,
      y: drag.baseY + event.clientY - drag.startY,
    });
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStateRef.current.dragging) return;
    dragStateRef.current.dragging = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  if (!mounted || !currentUrl) return null;

  return createPortal(
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${gameName} 截图预览`}
      className="fixed inset-0 z-[10000] bg-black/92 backdrop-blur-sm"
    >
      <div className="absolute right-4 top-4 z-[130] flex items-center gap-2">
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="缩小预览图片"
          className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
          onClick={() => setZoom(zoom - 0.2)}
        >
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="放大预览图片"
          className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
          onClick={() => setZoom(zoom + 0.2)}
        >
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          size="icon"
          variant="secondary"
          aria-label="重置预览图片缩放"
          className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
          onClick={resetTransform}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          ref={closeButtonRef}
          type="button"
          size="icon"
          variant="secondary"
          aria-label="关闭图片预览"
          className="h-10 w-10 rounded-full bg-white/15 text-white hover:bg-white/25"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {canNavigate ? (
        <>
          <button
            type="button"
            aria-label="查看上一张截图"
            className="absolute left-3 top-1/2 z-[130] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex"
            onClick={showPrevious}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="查看下一张截图"
            className="absolute right-3 top-1/2 z-[130] hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25 sm:flex"
            onClick={showNext}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </>
      ) : null}

      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center p-6',
          zoom > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-out',
        )}
        onClick={zoom > 1 ? resetTransform : onClose}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div
          className="relative max-h-[92vh] max-w-[92vw]"
          onClick={(event) => event.stopPropagation()}
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: dragStateRef.current.dragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          <img
            src={currentUrl}
            alt={`${gameName} 截图 ${currentIndex + 1}`}
            draggable={false}
            className="max-h-[92vh] w-auto max-w-[92vw] rounded-xl object-contain"
            onError={() => setImageError(true)}
          />
        </div>
        {imageError ? (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
            <div className="rounded-md bg-black/55 px-3 py-2 text-sm text-white">
              图片加载失败，请切换下一张或稍后重试
            </div>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
