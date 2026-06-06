'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck, Loader2, MessageCircle, Heart, Megaphone, ExternalLink } from 'lucide-react';

import { useAuth } from '@/context/auth-context';
import { trackedApiFetch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NotificationItem {
  _id?: string;
  id?: string;
  category: 'system' | 'reply' | 'like';
  title: string;
  content?: string;
  actor_name?: string;
  actor_avatar?: string;
  target_type?: string;
  target_id?: string;
  target_url?: string;
  is_read: boolean;
  created_at?: string;
}

interface NotificationListData {
  list: NotificationItem[];
  total: number;
  page: number;
  pageSize: number;
}

type CategoryFilter = 'all' | 'system' | 'reply' | 'like';

type NotificationTarget = {
  href: string;
  isExternal: boolean;
};

const INTERNAL_TARGET_PREFIXES = [
  'app',
  'category',
  'community',
  'download',
  'messages',
  'profile',
  'search',
  'tag',
  'u',
];

function formatDate(value?: string) {
  if (!value) return '未知时间';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '未知时间';
  return d.toLocaleString('zh-CN');
}

function getNotificationId(item: NotificationItem) {
  return String(item._id || item.id || '').trim();
}

function cleanTargetUrl(input?: string) {
  return String(input || '').replace(/[\u0000-\u001F\u007F]/g, '').trim();
}

function isKnownInternalPath(input: string) {
  const firstSegment = input.split(/[/?#]/)[0]?.toLowerCase();
  return INTERNAL_TARGET_PREFIXES.includes(firstSegment);
}

function normalizeNotificationTarget(input?: string): NotificationTarget | null {
  const raw = cleanTargetUrl(input);
  if (!raw) return null;

  if (raw.startsWith('/') && !raw.startsWith('//')) {
    return { href: raw, isExternal: false };
  }

  if (isKnownInternalPath(raw)) {
    return { href: `/${raw.replace(/^\/+/, '')}`, isExternal: false };
  }

  try {
    const parsed = raw.startsWith('//') ? new URL(`https:${raw}`) : new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;

    const normalizedHref = parsed.toString();
    if (typeof window !== 'undefined' && parsed.origin === window.location.origin) {
      return {
        href: `${parsed.pathname}${parsed.search}${parsed.hash}`,
        isExternal: false,
      };
    }

    return { href: normalizedHref, isExternal: true };
  } catch {
    return null;
  }
}

function resolveTarget(item: NotificationItem): NotificationTarget | null {
  const directTarget = normalizeNotificationTarget(item.target_url);
  if (directTarget) return directTarget;
  if (item.target_type === 'post' && item.target_id) return { href: `/community/post/${encodeURIComponent(item.target_id)}`, isExternal: false };
  if (item.target_type === 'app' && item.target_id) return { href: `/app/${encodeURIComponent(item.target_id)}`, isExternal: false };
  if ((item.target_type === 'user' || item.target_type === 'profile') && item.target_id) return { href: `/u/${encodeURIComponent(item.target_id)}`, isExternal: false };
  if (item.target_type === 'feedback') return { href: '/profile', isExternal: false };
  return null;
}

export default function MessagesPage() {
  const { isAuthenticated, token } = useAuth();
  const { toast } = useToast();

  const [category, setCategory] = useState<CategoryFilter>('all');
  const [loading, setLoading] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const [summary, setSummary] = useState<{ total_unread: number; unread_by_category: Record<string, number> } | null>(null);
  const [data, setData] = useState<NotificationListData>({ list: [], total: 0, page: 1, pageSize: 20 });
  const [page, setPage] = useState(1);

  const categoryLabel = useMemo(
    () => ({ all: '全部', system: '系统', reply: '回复', like: '点赞' } as const),
    [],
  );

  const requestHeaders = useMemo(() => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const loadSummary = async () => {
    const res = await trackedApiFetch('/notifications/summary', { headers: requestHeaders, cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) throw new Error(json?.message || `HTTP ${res.status}`);
    setSummary(json.data || { total_unread: 0, unread_by_category: {} });
  };

  const loadList = async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: '20' });
    if (category !== 'all') params.set('category', category);

    const res = await trackedApiFetch(`/notifications?${params.toString()}`, { headers: requestHeaders, cache: 'no-store' });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.code !== 0) throw new Error(json?.message || `HTTP ${res.status}`);
    setData(json.data || { list: [], total: 0, page: 1, pageSize: 20 });
  };

  const reload = async () => {
    if (!isAuthenticated || !token) return;
    setLoading(true);
    try {
      await Promise.all([loadSummary(), loadList()]);
    } catch (error) {
      toast({
        title: '加载失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, [category, isAuthenticated, page, token]);

  useEffect(() => {
    setPage(1);
  }, [category]);

  const markRead = async (id: string, options: { silent?: boolean } = {}) => {
    if (!id) return false;
    const targetItem = data.list.find((item) => getNotificationId(item) === id);
    const shouldUpdateSummary = Boolean(targetItem && !targetItem.is_read);

    if (shouldUpdateSummary) {
      setData((prev) => ({
        ...prev,
        list: prev.list.map((item) => (getNotificationId(item) === id ? { ...item, is_read: true } : item)),
      }));
      setSummary((prev) => {
        if (!prev) return prev;
        const categoryKey = targetItem?.category || '';
        const categoryUnread = Math.max(0, Number(prev.unread_by_category?.[categoryKey] || 0) - 1);
        return {
          total_unread: Math.max(0, Number(prev.total_unread || 0) - 1),
          unread_by_category: {
            ...prev.unread_by_category,
            [categoryKey]: categoryUnread,
          },
        };
      });
    }

    try {
      const res = await trackedApiFetch('/notifications/read', {
        method: 'POST',
        keepalive: true,
        headers: requestHeaders,
        body: JSON.stringify({ id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) throw new Error(json?.message || `HTTP ${res.status}`);
      await loadSummary();
      return true;
    } catch (error) {
      if (shouldUpdateSummary) {
        setData((prev) => ({
          ...prev,
          list: prev.list.map((item) => (getNotificationId(item) === id ? { ...item, is_read: false } : item)),
        }));
        void loadSummary().catch(() => {});
      }
      if (!options.silent) {
        toast({
          title: '操作失败',
          description: error instanceof Error ? error.message : '请稍后重试',
          variant: 'destructive',
        });
      }
      return false;
    }
  };

  const openNotificationTarget = (item: NotificationItem) => {
    const id = getNotificationId(item);
    if (!item.is_read && id) {
      void markRead(id, { silent: true });
    }
  };

  const markAllRead = async () => {
    if (markingAll) return;
    setMarkingAll(true);
    try {
      const body = category === 'all' ? {} : { category };
      const res = await trackedApiFetch('/notifications/read-all', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || json?.code !== 0) throw new Error(json?.message || `HTTP ${res.status}`);
      await reload();
      toast({ title: '已全部标记为已读' });
    } catch (error) {
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setMarkingAll(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto max-w-4xl py-8 px-4">
        <Card>
          <CardHeader>
            <CardTitle>我的消息</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">请先登录后查看消息中心。</CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 px-4 space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              我的消息
            </CardTitle>
            <Button variant="outline" size="sm" className="btn-interactive" onClick={markAllRead} disabled={markingAll || loading}>
              {markingAll ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCheck className="h-4 w-4 mr-1" />}
              全部已读
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(categoryLabel) as CategoryFilter[]).map((key) => (
              <Button
                key={key}
                size="sm"
                variant={category === key ? 'default' : 'outline'}
                className="btn-interactive"
                onClick={() => setCategory(key)}
              >
                {categoryLabel[key]}
                {key !== 'all' && <span className="ml-1">{summary?.unread_by_category?.[key] || 0}</span>}
              </Button>
            ))}
            <Badge variant="secondary" className="ml-auto">未读 {summary?.total_unread || 0}</Badge>
          </div>

          {loading ? (
            <div className="py-10 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 mr-2 animate-spin" /> 加载中...
            </div>
          ) : data.list.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">暂无消息</div>
          ) : (
            <div className="space-y-2">
              {data.list.map((item) => {
                const itemId = getNotificationId(item);
                const target = resolveTarget(item);
                return (
                  <div key={itemId} className={`rounded-lg border p-3 ${item.is_read ? 'bg-card' : 'bg-primary/5 border-primary/30'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {item.category === 'reply' && <MessageCircle className="h-4 w-4 text-blue-500" />}
                          {item.category === 'like' && <Heart className="h-4 w-4 text-rose-500" />}
                          {item.category === 'system' && <Megaphone className="h-4 w-4 text-amber-500" />}
                          <p className="text-sm font-semibold line-clamp-1">{item.title}</p>
                          {!item.is_read && <Badge className="h-5">未读</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{item.content || '-'}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{formatDate(item.created_at)}</p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {target && (
                          <Button asChild size="sm" variant="outline" className="btn-interactive">
                            {target.isExternal ? (
                              <a href={target.href} target="_blank" rel="noopener noreferrer" onClick={() => openNotificationTarget(item)}>
                                查看
                                <ExternalLink className="ml-1 h-3.5 w-3.5" />
                              </a>
                            ) : (
                              <Link href={target.href} onClick={() => openNotificationTarget(item)}>
                                查看
                                <ExternalLink className="ml-1 h-3.5 w-3.5" />
                              </Link>
                            )}
                          </Button>
                        )}
                        {!item.is_read && (
                          <Button size="sm" variant="ghost" onClick={() => void markRead(itemId)}>
                            标记已读
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {data.total > data.pageSize ? (
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
              >
                上一页
              </Button>
              <span className="text-xs text-muted-foreground">
                第 {data.page || page} / {Math.max(1, Math.ceil(data.total / data.pageSize))} 页
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={loading || page >= Math.ceil(data.total / data.pageSize)}
                onClick={() => setPage((value) => value + 1)}
              >
                下一页
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

