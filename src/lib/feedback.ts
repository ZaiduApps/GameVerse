import { trackedApiFetch } from '@/lib/api';

type FeedbackUserLike = {
  _id?: string;
  email?: string;
  name?: string;
  username?: string;
};

export function buildFeedbackCommonFields(
  user?: FeedbackUserLike,
  refUrl?: null | string,
) {
  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  return {
    user_id: user?._id || '',
    nickname: user?.name || user?.username || '游客',
    contact: user?.email || '',
    clientType: 'Web',
    clientVersion: process.env.NEXT_PUBLIC_CLIENT_VERSION || '',
    osVersion: userAgent,
    deviceModel: typeof navigator !== 'undefined' ? navigator.platform : '',
    userAgent,
    ipAddress: '',
    ref_url: refUrl || (typeof window !== 'undefined' ? window.location.href : ''),
  };
}

export async function submitFeedbackTicket(
  payload: Record<string, unknown>,
  token?: null | string,
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await trackedApiFetch('/feedbacks', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.code !== 0) {
    throw new Error(json?.message || `HTTP ${res.status}`);
  }
}
