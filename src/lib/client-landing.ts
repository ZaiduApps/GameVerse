import { trackedApiFetch } from '@/lib/api';
import type { ApiResponse } from '@/types';

export interface ClientLandingAppSiteInfo {
  key: string;
  site_name?: string;
  site_slogan?: string;
  logo_url?: string;
  favicon_url?: string;
  share_image?: string;
  seo?: {
    title_suffix?: string;
    keywords?: string;
    description?: string;
  };
  is_active?: boolean;
  is_maintenance?: boolean;
}

export interface ClientLandingAppVersionInfo {
  id?: string;
  title?: string;
  platform?: 'android';
  channel?: string;
  pkg?: string;
  latest_version?: string;
  latest_version_code?: number;
  min_supported_version?: string;
  min_supported_version_code?: number;
  force_update?: boolean;
  publish_at?: string | null;
  release_notes?: string;
  download_url?: string;
  file_size?: number;
  file_size_text?: string;
}

export interface ClientLandingAppData {
  key: string;
  site: ClientLandingAppSiteInfo;
  client: ClientLandingAppVersionInfo | null;
}

const LANDING_SITE_KEY =
  process.env.SITE_CONFIG_KEY || process.env.NEXT_PUBLIC_SITE_CONFIG_KEY || 'main';
const LANDING_CHANNEL =
  process.env.CLIENT_APP_CHANNEL || process.env.NEXT_PUBLIC_CLIENT_APP_CHANNEL || 'official';
const LANDING_PKG =
  process.env.CLIENT_APP_PKG || process.env.NEXT_PUBLIC_CLIENT_APP_PKG || '';

function buildLandingPath() {
  const query = new URLSearchParams({
    key: LANDING_SITE_KEY,
    platform: 'android',
    channel: LANDING_CHANNEL,
  });
  const pkg = String(LANDING_PKG || '').trim();
  if (pkg) query.set('pkg', pkg);
  return `/client/landing/app?${query.toString()}`;
}

export async function getClientLandingAppData(
  revalidate = 120,
): Promise<ClientLandingAppData | null> {
  try {
    const res = await trackedApiFetch(buildLandingPath(), {
      next: { revalidate },
    });
    if (!res.ok) return null;
    const json: ApiResponse<ClientLandingAppData> = await res.json();
    if (json.code !== 0 || !json.data) return null;
    return json.data;
  } catch {
    return null;
  }
}

