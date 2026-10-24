'use client';

// 事前登录列表的行尾关注胶囊。
// 未登录点按 → 弹登录；已登录 → POST/DELETE /game/reservations/follow，失败回滚并 toast。
// 已关注态来自一次 /game/reservations/my 批量拉取（按 token 缓存 60s 并在本模块内共享），
// 避免首页 24 个预约游戏各发一次请求；拉取失败静默按未关注处理，不阻塞页面。

import dynamic from 'next/dynamic';
import { Check, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { MouseEvent } from 'react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import { followReservationByAppId, unfollowReservationByAppId } from '@/lib/profile-dashboard-api';

const AuthModal = dynamic(() => import('@/components/auth/auth-modal'), { ssr: false });

// 接口 pageSize 上限是 50（service 侧 Math.min(50, …)），超过会被静默裁剪。
const FOLLOWED_PAGE_SIZE = 50;
const FOLLOWED_CACHE_TTL_MS = 60 * 1000;

type FollowedCache = {
  token: string;
  fetchedAt: number;
  promise: Promise<Set<string>>;
};

let followedCache: FollowedCache | null = null;

async function requestFollowedAppIds(token: string): Promise<Set<string>> {
  try {
    const res = await trackedApiFetch(
      `/game/reservations/my?page=1&pageSize=${FOLLOWED_PAGE_SIZE}`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      },
    );
    const json: { code?: number; data?: { list?: Array<{ app_id?: string }> } } = await res
      .json()
      .catch(() => ({ code: -1 }));
    if (!res.ok || json.code !== 0) return new Set();
    const list = Array.isArray(json.data?.list) ? json.data?.list : [];
    return new Set(
      list.map((item) => String(item?.app_id || '').trim()).filter((id) => Boolean(id)),
    );
  } catch {
    return new Set();
  }
}

function getFollowedAppIds(token: string): Promise<Set<string>> {
  const now = Date.now();
  if (
    followedCache &&
    followedCache.token === token &&
    now - followedCache.fetchedAt < FOLLOWED_CACHE_TTL_MS
  ) {
    return followedCache.promise;
  }
  const promise = requestFollowedAppIds(token);
  followedCache = { token, fetchedAt: now, promise };
  return promise;
}

// 本地改动同步回共享集合，同一页其他按钮不会读到过期状态。
function rememberFollowedState(token: string, appId: string, followed: boolean) {
  if (!followedCache || followedCache.token !== token) return;
  void followedCache.promise.then((set) => {
    if (followed) set.add(appId);
    else set.delete(appId);
  });
}

export interface PreregFollowButtonInput {
  appId: string;
  gameName?: string;
}

export default function PreregFollowButton({ appId, gameName }: PreregFollowButtonInput) {
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();
  const [isFollowed, setIsFollowed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setIsFollowed(false);
      return;
    }
    let active = true;
    void getFollowedAppIds(token).then((set) => {
      if (active) setIsFollowed(set.has(appId));
    });
    return () => {
      active = false;
    };
  }, [appId, isAuthenticated, token]);

  const handleClick = useCallback(
    async (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      if (!isAuthenticated || !token) {
        setAuthModalOpen(true);
        toast({
          title: '请先登录或注册',
          description: '登录账号后即可关注预约游戏的上线动态。',
          variant: 'destructive',
        });
        return;
      }
      if (isSubmitting) return;

      const next = !isFollowed;
      setIsSubmitting(true);
      setIsFollowed(next);
      const result = next
        ? await followReservationByAppId({ token, appId })
        : await unfollowReservationByAppId({ token, appId });
      setIsSubmitting(false);

      if (!result.ok) {
        setIsFollowed(!next);
        toast({
          title: next ? '关注失败' : '取消关注失败',
          description: result.message,
          variant: 'destructive',
        });
        return;
      }
      rememberFollowedState(token, appId, next);
      toast({
        title: next ? '已关注' : '已取消关注',
        description: next
          ? `${gameName || '该游戏'}开服前会收到上线提醒。`
          : `已不再关注${gameName || '该游戏'}。`,
      });
    },
    [appId, gameName, isAuthenticated, isFollowed, isSubmitting, toast, token],
  );

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={isSubmitting}
        aria-pressed={isFollowed}
        aria-label={isFollowed ? `已关注${gameName || '该游戏'}` : `关注${gameName || '该游戏'}`}
        className={`relative z-40 inline-flex shrink-0 items-center gap-0.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 ${
          isFollowed
            ? 'border-transparent bg-[#eff1f2] text-[#8a8d8f] dark:bg-[#223043] dark:text-[#9ca6b8]'
            : 'border-[#005e9f]/45 text-[#005e9f] hover:bg-[#005e9f]/5 dark:border-[#7db6e4]/45 dark:text-[#7db6e4] dark:hover:bg-[#7db6e4]/10'
        }`}
      >
        {isFollowed ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
        {isFollowed ? '已关注' : '关注'}
      </button>
      {authModalOpen ? <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} /> : null}
    </>
  );
}
