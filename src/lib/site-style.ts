export const SITE_STYLE_PRESETS = ['magazine', 'classic'] as const;

export type SiteStylePreset = (typeof SITE_STYLE_PRESETS)[number];

export function resolveSiteStylePreset(rawStyle?: string | null): SiteStylePreset {
  const normalized = (rawStyle || '').trim().toLowerCase();
  if (SITE_STYLE_PRESETS.includes(normalized as SiteStylePreset)) {
    return normalized as SiteStylePreset;
  }
  return 'magazine';
}
