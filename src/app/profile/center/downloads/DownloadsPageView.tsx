'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getMyDownloadHistory, type MyDownloadItem } from '@/lib/profile-dashboard-api';
import CenterAuthRequired from '../CenterAuthRequired';
import CenterPageHeader from '../CenterPageHeader';
import CenterLoadError from '../CenterLoadError';
import CenterPageSkeleton from '../CenterPageSkeleton';

const PAGE_SIZE = 20;

function formatDownloadedAt(value?: string): string {
  const raw = String(value || '').trim();
  if (!raw) return '时间未知';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '时间未知';
  return new Intl.DateTimeFormat('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatAppLabel(appId: string): string {
  const value = String(appId || '').trim();
  if (!value) return '未知应用';
  return value.length > 10 ? `应用 ${value.slice(0, 6)}…${value.slice(-4)}` : `应用 ${value}`;
}

export default function DownloadsPageView() {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [list, setList] = useState<MyDownloadItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loadError, setLoadError] = useState('');
  const [unavailable, setUnavailable] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) return;
      setLoading(true);
      const res = await getMyDownloadHistory({ token, page: 1, pageSize: PAGE_SIZE });
      if (cancelled) return;
      if (res.unavailable) {
        setUnavailable(true);
        setLoadError('');
        setList([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      if (!res.ok) {
        // 失败必须可见：不要把它渲染成「你还没有下载记录」。
        setLoadError(res.message || '下载记录加载失败，请稍后重试');
        setUnavailable(false);
        setList([]);
        setTotal(0);
        setLoading(false);
        return;
      }
      setUnavailable(false);
      setLoadError('');
      setList(res.list);
      setTotal(res.total);
      setPage(res.page || 1);
      setLoading(false);
    }

    if (isAuthenticated && token) {
      void load();
    }
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, reloadKey, token]);

  async function loadMore() {
    if (!token || loadingMore || list.length >= total) return;
    const next = page + 1;
    setLoadingMore(true);
    try {
      const res = await getMyDownloadHistory({ token, page: next, pageSize: PAGE_SIZE });
      if (res.unavailable) {
        setUnavailable(true);
        return;
      }
      if (!res.ok) {
        toast({
          title: '加载更多失败',
          description: res.message || '下载记录加载失败，请稍后重试',
          variant: 'destructive',
        });
        return;
      }
      setList((prev) => [...prev, ...res.list]);
      setTotal(res.total);
      setPage(res.page || next);
    } finally {
      setLoadingMore(false);
    }
  }

  if (isAuthLoading) {
    return <CenterPageSkeleton maxWidthClassName="max-w-4xl" label="正在确认登录状态" />;
  }

  if (!isAuthenticated) {
    return (
      <CenterAuthRequired
        title="我的下载"
        description="按时间查看你签发过的资源与版本。"
        containerClassName="max-w-4xl"
      />
    );
  }

  if (loading) {
    return <CenterPageSkeleton maxWidthClassName="max-w-4xl" label="正在加载下载记录" />;
  }

  const canLoadMore = list.length < total;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 py-4 md:py-8">
      <CenterPageHeader title="我的下载" description="按时间查看你签发过的资源与版本。" />
      <Card>
        <CardHeader>
          <CardTitle>我的下载</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {unavailable ? (
            <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground">功能即将上线</p>
              <p className="mt-1 text-xs leading-6">
                下载记录接口还未在本环境上线，上线后这里会按时间列出你下载过的资源与版本。
              </p>
            </div>
          ) : loadError ? (
            <CenterLoadError
              message={loadError}
              action="profile_center_downloads_reload"
              actionLabel="重新加载下载记录"
              onRetry={() => {
                setLoadError('');
                setReloadKey((value) => value + 1);
              }}
            />
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">你还没有下载记录。</p>
          ) : (
            <>
              <p className="text-xs text-muted-foreground">已加载 {list.length} / {total}</p>
              <ul className="space-y-2">
                {list.map((item) => (
                  <li key={item.id || `${item.appId}-${item.createdAt || ''}`} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/app/${encodeURIComponent(item.appId)}`}
                        prefetch={false}
                        className="text-sm font-semibold hover:text-primary"
                        data-acbox-action="profile_center_download_app"
                        data-acbox-label={item.appId}
                      >
                        {formatAppLabel(item.appId)}
                      </Link>
                      <span className="text-xs text-muted-foreground">{formatDownloadedAt(item.createdAt)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {item.version ? `版本 ${item.version}` : '版本未记录'}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
          {!unavailable && !loadError && canLoadMore ? (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => void loadMore()}
              disabled={loadingMore}
              data-acbox-action="profile_center_downloads_load_more"
              data-acbox-label="加载更多下载记录"
            >
              {loadingMore ? '加载中...' : '加载更多'}
            </Button>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
