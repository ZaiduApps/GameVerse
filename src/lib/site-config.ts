import type { SiteConfig, ApiResponse } from '@/types';
import { trackedApiFetch } from '@/lib/api';

const SITE_CONFIG_KEY = process.env.SITE_CONFIG_KEY || process.env.NEXT_PUBLIC_SITE_CONFIG_KEY || 'main';
const SITE_CONFIG_PATH = `/config/site/public?key=${encodeURIComponent(SITE_CONFIG_KEY)}`;

export async function getPublicSiteConfig(revalidate = 300): Promise<SiteConfig | null> {
  const startedAt = Date.now();
  const requestPath = SITE_CONFIG_PATH;
  try {
    const res = await trackedApiFetch(requestPath, {
      next: { revalidate },
    });
    const durationMs = Date.now() - startedAt;

    if (!res.ok) {
      console.error('[site-config] fetch failed', {
        requestPath,
        status: res.status,
        statusText: res.statusText,
        durationMs,
      });
      return null;
    }

    const json: ApiResponse<SiteConfig> = await res.json();
    if (json.code !== 0 || !json.data) {
      console.error('[site-config] invalid payload', {
        requestPath,
        code: json.code,
        message: json.message,
        durationMs,
      });
      return null;
    }

    return json.data;
  } catch (error) {
    console.error('[site-config] request exception', {
      requestPath,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}
