'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Copy, Eye, KeyRound, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import type { ApiResponse } from '@/types';
import { useAuth } from '@/context/auth-context';

type ApiKeyStatus = 'active' | 'disabled' | 'revoked';

type UserApiKeyItem = {
  _id: string;
  name: string;
  key_mask: string;
  status: ApiKeyStatus;
  expires_at: null | string;
  last_used_at: null | string;
  last_used_ip: string;
  usage_count: number;
  created_at: null | string;
};

type UserApiKeyCreateResult = {
  _id: string;
  name: string;
  key: string;
  status: ApiKeyStatus;
  expires_at: null | string;
  created_at: null | string;
};

function formatTime(input?: null | string) {
  if (!input) return '-';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '-';
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export default function ProfileApiKeysPage() {
  const router = useRouter();
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [list, setList] = useState<UserApiKeyItem[]>([]);

  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [secretModalOpen, setSecretModalOpen] = useState(false);
  const [secretPayload, setSecretPayload] = useState<{ key: string; name: string }>({
    key: '',
    name: '',
  });

  const activeCount = useMemo(
    () => list.filter((item) => item.status !== 'revoked').length,
    [list],
  );

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push('/');
      return;
    }
    if (isAuthenticated && token) {
      void loadKeys();
    }
  }, [isAuthLoading, isAuthenticated, router, token]);

  async function loadKeys() {
    if (!token) return;
    setLoading(true);
    try {
      const res = await trackedApiFetch('/users/api-keys', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json: ApiResponse<{ list: UserApiKeyItem[]; total: number }> = await res.json();
      if (json.code === 0) {
        setList(json.data?.list || []);
      } else {
        toast({ variant: 'destructive', title: '加载失败', description: json.message || '请稍后重试' });
      }
    } catch {
      toast({ variant: 'destructive', title: '网络错误', description: '请检查网络连接' });
    } finally {
      setLoading(false);
    }
  }

  async function createKey() {
    if (!token) return;
    if (!name.trim()) {
      toast({ variant: 'destructive', title: '请输入密钥名称' });
      return;
    }
    setSubmitting(true);
    try {
      const res = await trackedApiFetch('/users/api-keys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          expires_at: expiresAt || undefined,
        }),
      });
      const json: ApiResponse<UserApiKeyCreateResult> = await res.json();
      if (json.code === 0 && json.data?.key) {
        setSecretPayload({ key: json.data.key, name: json.data.name || name.trim() });
        setSecretModalOpen(true);
        setName('');
        setExpiresAt('');
        await loadKeys();
        return;
      }
      toast({ variant: 'destructive', title: '创建失败', description: json.message || '请稍后重试' });
    } catch {
      toast({ variant: 'destructive', title: '网络错误', description: '请检查网络连接' });
    } finally {
      setSubmitting(false);
    }
  }

  async function copyText(value: string, title = '复制成功') {
    try {
      await navigator.clipboard.writeText(value || '');
      toast({ title });
    } catch {
      toast({ variant: 'destructive', title: '复制失败', description: '请手动复制' });
    }
  }

  async function viewSecret(item: UserApiKeyItem) {
    if (!token) return;
    try {
      const res = await trackedApiFetch(`/users/api-keys/${item._id}/secret`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json: ApiResponse<{ _id: string; key: string; name: string }> = await res.json();
      if (json.code === 0 && json.data?.key) {
        setSecretPayload({
          key: json.data.key,
          name: json.data.name || item.name,
        });
        setSecretModalOpen(true);
        return;
      }
      toast({ variant: 'destructive', title: '查看失败', description: json.message || '请稍后重试' });
    } catch {
      toast({ variant: 'destructive', title: '网络错误', description: '请检查网络连接' });
    }
  }

  async function toggleStatus(item: UserApiKeyItem, nextActive: boolean) {
    if (!token) return;
    const nextStatus: ApiKeyStatus = nextActive ? 'active' : 'disabled';
    try {
      const res = await trackedApiFetch(`/users/api-keys/${item._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.code === 0) {
        toast({ title: nextActive ? '密钥已启用' : '密钥已禁用' });
        await loadKeys();
        return;
      }
      toast({ variant: 'destructive', title: '操作失败', description: json.message || '请稍后重试' });
    } catch {
      toast({ variant: 'destructive', title: '网络错误', description: '请检查网络连接' });
    }
  }

  async function revoke(item: UserApiKeyItem) {
    if (!token) return;
    const confirmed = window.confirm(`确认吊销密钥「${item.name}」吗？`);
    if (!confirmed) return;
    try {
      const res = await trackedApiFetch(`/users/api-keys/${item._id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.code === 0) {
        toast({ title: '密钥已吊销' });
        await loadKeys();
        return;
      }
      toast({ variant: 'destructive', title: '吊销失败', description: json.message || '请稍后重试' });
    } catch {
      toast({ variant: 'destructive', title: '网络错误', description: '请检查网络连接' });
    }
  }

  if (isAuthLoading || loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">正在加载 API 密钥...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 py-4 md:py-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            API 密钥管理
          </CardTitle>
          <CardDescription>
            使用 API 密钥调用公开内容接口。当前已创建 {activeCount}/5 个密钥。
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="api-key-name">密钥名称</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例如：自动发帖服务"
                maxLength={60}
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="api-key-expire">过期时间</Label>
              <Input
                id="api-key-expire"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <Button
                className="w-full md:w-auto"
                onClick={createKey}
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    新建密钥
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          创建成功后只展示一次明文，建议立即保存。
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            我的密钥
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {list.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              暂无 API 密钥
            </div>
          ) : (
            list.map((item) => (
              <div key={item._id} className="rounded-lg border p-4">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div className="space-y-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{item.key_mask}</div>
                    <div className="text-xs text-muted-foreground">
                      过期：{formatTime(item.expires_at)} · 最近使用：{formatTime(item.last_used_at)} ·
                      调用次数：{item.usage_count}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 rounded border px-2 py-1">
                      <span className="text-xs text-muted-foreground">
                        {item.status === 'active' ? '启用' : '禁用'}
                      </span>
                      <Switch
                        checked={item.status === 'active'}
                        onCheckedChange={(checked) => {
                          void toggleStatus(item, checked);
                        }}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void viewSecret(item);
                      }}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      查看
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void copyText(item._id, '密钥ID已复制');
                      }}
                    >
                      <Copy className="mr-1 h-4 w-4" />
                      复制ID
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        void revoke(item);
                      }}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      吊销
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Dialog open={secretModalOpen} onOpenChange={setSecretModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>API 密钥明文</DialogTitle>
            <DialogDescription>
              请立即保存。离开页面后仍可通过“查看”再次读取，所有读取行为都会记录审计日志。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>名称</Label>
            <div className="rounded border bg-muted/30 px-3 py-2 text-sm">{secretPayload.name || '-'}</div>
            <Label>密钥</Label>
            <div className="break-all rounded border bg-muted/30 px-3 py-2 font-mono text-sm">
              {secretPayload.key || '-'}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSecretModalOpen(false);
              }}
            >
              关闭
            </Button>
            <Button
              onClick={() => {
                void copyText(secretPayload.key, '密钥已复制');
              }}
            >
              <Copy className="mr-2 h-4 w-4" />
              复制密钥
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

