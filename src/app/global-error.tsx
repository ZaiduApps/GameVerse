'use client';

import { useEffect } from 'react';

import { reportClientError } from '@/lib/client-errors';

/**
 * 根布局级错误边界。它替换的是整个 <html>/<body>，此时 layout.tsx 里的
 * globals.css 与 Provider 都不在，因此这里只用内联样式，避免样式丢失后变成裸文本。
 */
export default function GlobalErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void reportClientError(error, { boundary: 'global-error' });
  }, [error]);

  const buttonStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '0.75rem',
    border: '1px solid #d4d4d8',
    background: '#ffffff',
    color: '#18181b',
    padding: '0.625rem 1rem',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: 'pointer',
  } as const;

  return (
    <html lang="zh-CN">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#fafafa',
          color: '#18181b',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
          padding: '2rem',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 600, margin: '0 0 0.75rem' }}>
            站点加载出错了
          </h1>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: '#52525b', margin: '0 0 1.5rem' }}>
            请重试一次；如果仍然打不开，请稍后再访问。
            {error.digest ? `错误编号：${error.digest}` : ''}
          </p>
          <button type="button" onClick={reset} style={buttonStyle}>
            重试
          </button>
        </div>
      </body>
    </html>
  );
}
