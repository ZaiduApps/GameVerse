export interface CommunityRuntimeConfig {
  post_enabled: boolean;
  auto_publish: boolean;
  max_images: number;
  max_image_bytes: number;
  max_content_chars: number;
  rules: string[];
}

export const DEFAULT_COMMUNITY_CONFIG: CommunityRuntimeConfig = {
  post_enabled: false,
  auto_publish: false,
  max_images: 9,
  max_image_bytes: 10 * 1024 * 1024,
  max_content_chars: 50000,
  rules: [],
};

export function normalizeCommunityConfig(input?: any): CommunityRuntimeConfig {
  const source = input && typeof input === 'object' ? input : {};
  const rules = Array.isArray(source.rules)
    ? source.rules
        .map((item: unknown) => String(item || '').trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  return {
    post_enabled:
      source.post_enabled === undefined
        ? DEFAULT_COMMUNITY_CONFIG.post_enabled
        : Boolean(source.post_enabled),
    auto_publish: Boolean(source.auto_publish),
    max_images: Math.max(1, Number(source.max_images) || 9),
    max_image_bytes: Math.max(1024, Number(source.max_image_bytes) || 10 * 1024 * 1024),
    max_content_chars: Math.max(1000, Number(source.max_content_chars) || 50000),
    rules,
  };
}
