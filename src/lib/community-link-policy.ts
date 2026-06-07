export const COMMUNITY_DETAIL_BLOCKED_LINK_HOSTS = ['www.facebook.com', 'acg.gamer.com.tw'];

export function getCommunityUrlHost(value: string): string {
  try {
    return new URL(value).hostname.trim().toLowerCase();
  } catch {
    return '';
  }
}

export function isBlockedCommunityDetailLink(
  value: string,
  blockedHosts = COMMUNITY_DETAIL_BLOCKED_LINK_HOSTS,
): boolean {
  const host = getCommunityUrlHost(value);
  if (!host) return false;
  return blockedHosts.some((blockedHost) => {
    const normalized = blockedHost.trim().toLowerCase();
    return host === normalized || host.endsWith(`.${normalized}`);
  });
}
