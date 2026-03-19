import type { SiteConfig, ApiResponse } from '@/types';
import { trackedApiFetch } from '@/lib/api';

const SITE_CONFIG_KEY = process.env.SITE_CONFIG_KEY || process.env.NEXT_PUBLIC_SITE_CONFIG_KEY || 'main';
const SITE_CONFIG_PATH = `/config/site/public?key=${encodeURIComponent(SITE_CONFIG_KEY)}`;

export async function getPublicSiteConfig(revalidate = 300): Promise<SiteConfig | null> {
  try {
    const res = await trackedApiFetch(SITE_CONFIG_PATH, {
      next: { revalidate },
    });

    if (!res.ok) {
      console.error('Failed to fetch public site config:', res.status, res.statusText);
      return null;
    }

    const json: ApiResponse<SiteConfig> = await res.json();
    if (json.code !== 0 || !json.data) {
      console.error('Public site config API error:', json.message);
      return null;
    }

    return json.data;
  } catch (error) {
    console.error('Error fetching public site config:', error);
    return null;
  }
}
