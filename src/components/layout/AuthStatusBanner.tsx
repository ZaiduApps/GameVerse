'use client';

import { AlertTriangle, X } from 'lucide-react';

import { useAuth } from '@/context/auth-context';

/**
 * 认证请求失败的可读提示条。auth-context 过去把 /auth/me、/auth/refresh 的异常
 * 全部吞掉，用户只会看到「莫名其妙没登录」；这里把原因固定暴露在页面角落，
 * 由用户手动关闭，不阻塞操作。
 */
export default function AuthStatusBanner() {
  const { authError, clearAuthError } = useAuth();

  if (!authError) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      className="fixed inset-x-4 bottom-4 z-[70] mx-auto flex max-w-xl items-start gap-3 rounded-xl border border-destructive/30 bg-background px-4 py-3 text-sm shadow-lg sm:inset-x-auto sm:left-1/2 sm:w-[28rem] sm:-translate-x-1/2"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
      <p className="flex-1 leading-6 text-foreground">{authError}</p>
      <button
        type="button"
        onClick={clearAuthError}
        aria-label="关闭提示"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
