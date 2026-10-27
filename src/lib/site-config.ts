import { cache } from 'react';

import type { SiteConfig, ApiResponse } from '@/types';
import { trackedApiFetch, type TrackedFetchInit } from '@/lib/api';
import { reportServerErrorEvent } from '@/lib/client-errors';

const SITE_CONFIG_KEY = process.env.SITE_CONFIG_KEY || process.env.NEXT_PUBLIC_SITE_CONFIG_KEY || 'main';
const SITE_CONFIG_PATH = `/config/site/public?key=${encodeURIComponent(SITE_CONFIG_KEY)}`;
const SITE_CONFIG_TIMEOUT_MS = 10000;
const SITE_CONFIG_RETRIES = 1;
const SITE_CONFIG_POISON_MS = 5 * 60_000;

// 根因：Next 15.0.7 在 origin fetch reject 时不会释放该 cacheKey 的 fetch 缓存锁，同 URL 的
// 第二次 fetch 会永久等在锁上。上游已在 15.2（vercel/next.js#74623）修掉，本仓已升到 15.5.28。
// 这里仍保留进程级毒化隔离作为兜底：万一新版本回归，毒化窗口内所有调用改走带一次性 query 的
// 旁路 URL + no-store，不再碰被毒化的 cacheKey；窗口过期后自动回到正常的 force-cache 路径，无需重启。
let siteConfigKeyPoisonedUntil = 0;

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

function isSiteConfigCachePoisoned(now = Date.now()): boolean {
  return now < siteConfigKeyPoisonedUntil;
}

/** 旁路 URL 带一次性 query，每次都与被毒化的 cacheKey 不同，且配合 no-store 不再进缓存。 */
function buildSiteConfigBypassPath(): string {
  return `${SITE_CONFIG_PATH}&_poison=${Date.now()}`;
}

function poisonSiteConfigCacheKey(): number {
  siteConfigKeyPoisonedUntil = Date.now() + SITE_CONFIG_POISON_MS;
  // 毒化是稀有事件，静默日志没人看：走既有上报通道全量报一次（60s 内去重），
  // 只带事件名与组件名，不带 URL / 配置内容；上报失败不影响渲染。
  void reportServerErrorEvent({ message: 'cache_poisoned', component: 'site-config' });
  return SITE_CONFIG_POISON_MS;
}

/**
 * 一次性旁路补取：瞬时故障时同一次调用里再试一把，成功就直接用，页面不至于空着。
 * 失败一律返回 null（不重试、不再毒化），保证这条路径永远不会自己挂住。
 */
async function requestSiteConfigViaBypass(
  timeoutMs: number,
  logKey: string,
): Promise<SiteConfig | null> {
  const requestPath = buildSiteConfigBypassPath();
  const startedAt = Date.now();
  try {
    const res = await trackedApiFetch(requestPath, { cache: 'no-store', timeoutMs });
    const durationMs = Date.now() - startedAt;

    if (!res.ok) {
      console.error(`[${logKey}] bypass non-200 response`, {
        requestPath,
        status: res.status,
        statusText: res.statusText,
        durationMs,
      });
      return null;
    }

    const json: ApiResponse<SiteConfig> | null = await res.json().catch(() => null);
    if (!json || json.code !== 0 || !json.data) {
      console.error(`[${logKey}] bypass invalid-payload`, {
        requestPath,
        durationMs,
        code: json?.code ?? null,
        message: json?.message || null,
      });
      return null;
    }

    console.warn(`[${logKey}] site-config-bypass-recovered`, { requestPath, durationMs });
    return json.data;
  } catch (error) {
    console.error(`[${logKey}] bypass request exception`, {
      requestPath,
      durationMs: Date.now() - startedAt,
      errorType: isTimeoutLikeError(error) ? 'timeout' : 'exception',
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

const loadPublicSiteConfig = cache(async (
  revalidate: number,
  cacheMode: TrackedFetchInit['cache'],
  timeoutMs: number,
  retries: number,
  logKey: string,
): Promise<SiteConfig | null> => {
  const safeRevalidate = Math.max(1, Number(revalidate) || 300);
  const maxAttempts = Math.max(1, retries + 1);

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const startedAt = Date.now();
    // 毒化窗口内一律走旁路：不再碰可能带着泄漏锁的 cacheKey。
    const bypass = isSiteConfigCachePoisoned(startedAt);
    const requestPath = bypass ? buildSiteConfigBypassPath() : SITE_CONFIG_PATH;
    try {
      const res = await trackedApiFetch(
        requestPath,
        bypass
          ? { cache: 'no-store', timeoutMs }
          : { cache: cacheMode, next: { revalidate: safeRevalidate }, timeoutMs },
      );
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
      const poisonMs = poisonSiteConfigCacheKey();
      console.error(`[${logKey}] site-config-cache-poisoned`, {
        event: 'site-config-cache-poisoned',
        poisonMs,
        requestPath,
        attempt,
        maxAttempts,
        durationMs: Date.now() - startedAt,
        errorType: isTimeoutLikeError(error) ? 'timeout' : 'exception',
        error: error instanceof Error ? error.message : String(error),
      });
      // 网络层抛错后不再重试同一个 URL：15.0.7 里 origin fetch reject 不会释放该 cacheKey
      // 的 fetch 缓存锁，同 URL 的第二次 fetch 会永久等在锁上，整个渲染挂死。该缺陷已在
      // Next 15.2 修复（本仓 15.5.28），此处的隔离是对未来回归的兜底。
      // 5xx / 脏数据（fetch 已 resolve）仍然走上面的重试。
      // 本次调用内用一次性旁路补取，避免一次瞬时故障让页面空着；旁路本身失败就直接返回 null。
      if (!bypass) {
        return requestSiteConfigViaBypass(timeoutMs, logKey);
      }
      return null;
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
