import { createHmac, timingSafeEqual } from 'node:crypto';

export const GAMEVERSE_PACKAGE_PATTERN = /^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+$/;
export const MAX_REVALIDATION_PACKAGES = 20;
export const MAX_REVALIDATION_BODY_BYTES = 64 * 1024;

export type GameVerseRebuildPayload = {
  packages: string[];
  reason: string;
};

export function verifyGameVerseSignature(
  body: string,
  signature: string | null | undefined,
  secret: string,
): boolean {
  const supplied = String(signature || '').trim().toLowerCase();
  const expected = createHmac('sha256', secret).update(body).digest('hex');
  if (!supplied || supplied.length !== expected.length) return false;

  try {
    return timingSafeEqual(Buffer.from(supplied, 'utf8'), Buffer.from(expected, 'utf8'));
  } catch {
    return false;
  }
}

export function parseGameVerseRebuildPayload(body: string): GameVerseRebuildPayload | null {
  if (Buffer.byteLength(body, 'utf8') > MAX_REVALIDATION_BODY_BYTES) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    return null;
  }

  if (!parsed || typeof parsed !== 'object') return null;
  const rawPackages = (parsed as { packages?: unknown }).packages;
  if (!Array.isArray(rawPackages) || rawPackages.length === 0 || rawPackages.length > MAX_REVALIDATION_PACKAGES) {
    return null;
  }

  const normalizedPackages = rawPackages.map((item) => (typeof item === 'string' ? item.trim() : ''));
  if (normalizedPackages.some((pkg) => !GAMEVERSE_PACKAGE_PATTERN.test(pkg))) return null;
  const packages = Array.from(new Set(normalizedPackages));

  return {
    packages,
    reason: String((parsed as { reason?: unknown }).reason || 'game-updated').trim().slice(0, 120) || 'game-updated',
  };
}
