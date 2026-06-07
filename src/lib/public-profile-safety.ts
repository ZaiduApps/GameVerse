import { sanitizeSeoText } from '@/lib/seo';

const PUBLIC_PROFILE_EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PUBLIC_PROFILE_PHONE_PATTERN = /(?:\+?\d[\s-]?){7,}/;
const PUBLIC_PROFILE_MAX_SIGNATURE_LENGTH = 120;

export function sanitizePublicProfileSignature(input?: string): string {
  const text = sanitizeSeoText(input || '').trim();
  if (!text) return '';
  if (PUBLIC_PROFILE_EMAIL_PATTERN.test(text)) return '';
  if (PUBLIC_PROFILE_PHONE_PATTERN.test(text)) return '';
  return text.length > PUBLIC_PROFILE_MAX_SIGNATURE_LENGTH
    ? `${text.slice(0, PUBLIC_PROFILE_MAX_SIGNATURE_LENGTH)}...`
    : text;
}
