import { cache } from 'react';

import type { SiteConfig, ApiResponse } from '@/types';
import { trackedApiFetch, type TrackedFetchInit } from '@/lib/api';

const SITE_CONFIG_KEY = process.env.SITE_CONFIG_KEY || process.env.NEXT_PUBLIC_SITE_CONFIG_KEY || 'main';
const SITE_CONFIG_PATH = `/config/site/public?key=${encodeURIComponent(SITE_CONFIG_KEY)}`;
const SITE_CONFIG_TIMEOUT_MS = 10000;
const SITE_CONFIG_RETRIES = 1;

export interface SiteConfigFetchOptions {
  cache?: TrackedFetchInit['cache'];
  next?: TrackedFetchInit['next'];
  timeoutMs?: number;
  retries?: number;
  logKey?: string;
}

function isTimeoutLikeError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const name = 'name' in error ? String((error as { name?: unknown }).name || '') : '';
  const message = error instanceof Error ? error.message : String(error);
  return name === 'TimeoutError' || /timeout/i.test(message);
}

const loadPublicSiteConfig = cache(async (
  revalidate: number,
  cacheMode: TrackedFetchInit['cache'],
  timeoutMs: number,
  retries: number,
  logKey: string,
): Promise<SiteConfig | null> => {
  const safeRevalidate = Math.max(1, Number(revalidate) || 300);
  const requestPath = SITE_CONFIG_PATH;
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    try {
      const res = await trackedApiFetch(requestPath, {
        cache: cacheMode,
        next: { revalidate: safeRevalidate },
        timeoutMs,
      });
      const durationMs = Date.now() - startedAt;

      if (!res.ok) {
        console.error(`[${logKey}] non-200 response`, {
          requestPath,
          attempt,
          maxAttempts,
          status: res.status,
          statusText: res.statusText,
          durationMs,
        });
        if (attempt < maxAttempts && res.status >= 500) continue;
        return null;
      }

      const json: ApiResponse<SiteConfig> | null = await res.json().catch(() => null);
      if (!json || json.code !== 0 || !json.data) {
        console.error(`[${logKey}] invalid-payload`, {
          requestPath,
          attempt,
          maxAttempts,
          durationMs,
          code: json?.code ?? null,
          message: json?.message || null,
        });
        if (attempt < maxAttempts) continue;
        return null;
      }

      if (attempt > 1) {
        console.warn(`[${logKey}] retry-recovered`, {
          requestPath,
          attempt,
          maxAttempts,
          durationMs,
        });
      }

      return json.data;
    } catch (error) {
      console.error(`[${logKey}] request exception`, {
        requestPath,
        attempt,
        maxAttempts,
        durationMs: Date.now() - startedAt,
        errorType: isTimeoutLikeError(error) ? 'timeout' : 'exception',
        error: error instanceof Error ? error.message : String(error),
      });
      if (attempt >= maxAttempts) return null;
    }
  }

  return null;
});

export async function getPublicSiteConfig(
  revalidate = 300,
  options?: SiteConfigFetchOptions,
): Promise<SiteConfig | null> {
  const cacheMode = options?.cache ?? 'force-cache';
  const timeoutMs = Math.max(1, Number(options?.timeoutMs || SITE_CONFIG_TIMEOUT_MS));
  const retries = Math.max(0, Number(options?.retries ?? SITE_CONFIG_RETRIES));
  const logKey = String(options?.logKey || 'site-config').trim() || 'site-config';
  return loadPublicSiteConfig(revalidate, cacheMode, timeoutMs, retries, logKey);
}
