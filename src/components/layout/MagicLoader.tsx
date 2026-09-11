'use client';

interface MagicLoaderProps {
  fullscreen?: boolean;
}

export default function MagicLoader({ fullscreen = true }: MagicLoaderProps) {
  const wrapperClassName = fullscreen
    ? 'fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm'
    : 'flex items-center justify-center';

  return (
    <div className={wrapperClassName}>
      <div className="flex flex-col items-center justify-center gap-4" aria-live="polite" aria-busy="true" role="status">
        <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        <span className="text-xs font-medium text-muted-foreground">加载中</span>
      </div>
    </div>
  );
}
