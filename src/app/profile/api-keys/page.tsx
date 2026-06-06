'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { Copy, Eye, KeyRound, Loader2, Plus, ShieldCheck, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { trackedApiFetch } from '@/lib/api';
import type { ApiResponse } from '@/types';
import { useAuth } from '@/context/auth-context';
import CenterAuthRequired from '../center/CenterAuthRequired';

type ApiKeyStatus = 'active' | 'disabled' | 'revoked';

type UserApiKeyItem = {
  _id: string;
  name: string;
  key_mask: string;
  status: ApiKeyStatus;
  key_type?: 'content_user' | 'admin_agent' | 'integration' | 'legacy';
  capabilities?: string[];
  risk_level?: 'low' | 'medium' | 'high';
  expires_at: null | string;
  last_used_at: null | string;
  last_used_ip: string;
  usage_count: number;
  created_at: null | string;
};

type UserApiKeyUsageSummary = {
  total_calls: number;
  total_errors: number;
  avg_duration_ms: number;
  last_used_at: null | string;
  top_paths: Array<{ path: string; count: number }>;
};

type UserApiKeyUsageLogItem = {
  _id: string;
  method: string;
  path: string;
  status_code: number;
  duration_ms: number;
  request_id: string;
  ip: string;
  error_code: string;
  error_message: string;
  idempotency_key: string;
  is_replay: boolean;
  created_at: null | string;
};

type UsageErrorCodeItem = {
  code: string;
  count: number;
};

type UsagePathItem = {
  path: string;
  count: number;
};

type UserApiKeyCreateResult = {
  _id: string;
  name: string;
  key: string;
  status: ApiKeyStatus;
  expires_at: null | string;
  created_at: null | string;
};

function getFriendlyApiKeyError(message?: string): string {
  const text = String(message || '').trim().toLowerCase();
  if (!text) return '请稍后重试';
  if (text.includes('invalid auth context')) return '登录态异常，请重新登录后重试';
  if (text.includes('invalid user id')) return '账号信息异常，请重新登录后重试';
  if (text.includes('user not found')) return '账号不存在或已失效，请重新登录';
  if (text.includes('invalid api key id')) return '密钥标识无效，请刷新列表后重试';
  if (text.includes('api key not found')) return '密钥不存在或已被吊销，请刷新列表';
  if (text.includes('invalid expires_at')) return '过期时间格式无效';
  if (text.includes('expires_at must be in future')) return '过期时间必须晚于当前时间';
  return String(message || '请稍后重试');
}

function formatTime(input?: null | string) {
  if (!input) return '-';
  const date = new Date(input);
  if (!Number.isFinite(date.getTime())) return '-';
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

function createIdempotencyKeySample() {
  return `post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function buildPublishCurlWithKey(apiKey: string, idempotencyKey: string) {
  return `curl -X POST "http://127.0.0.1:9527/open/content/posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Idempotency-Key: ${idempotencyKey}" \\
  -d '{
    "post_type": "post",
    "title": "今日更新进度",
    "content": "正文内容",
    "summary": "30 秒速览今日更新",
    "topic_id": "69d22fa1a75bd91bed8f9731"
  }'`;
}

export default function ProfileApiKeysPage() {
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
  const [idempotencyKeySample, setIdempotencyKeySample] = useState(createIdempotencyKeySample);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailKey, setDetailKey] = useState<UserApiKeyItem | null>(null);
  const [usageSummary, setUsageSummary] = useState<UserApiKeyUsageSummary | null>(null);
  const [usageLogs, setUsageLogs] = useState<UserApiKeyUsageLogItem[]>([]);
  const [detailActionNotice, setDetailActionNotice] = useState('');

  const anomalyHint = useMemo(() => {
    if (!usageSummary) return '';
    const totalCalls = Number(usageSummary.total_calls || 0);
    const totalErrors = Number(usageSummary.total_errors || 0);
    const ratio = totalCalls > 0 ? totalErrors / totalCalls : 0;
    const hasRecentServerError = usageLogs.some((item) => Number(item.status_code || 0) >= 500);
    if (hasRecentServerError) {
      return '最近存在 5xx 调用，建议复制 request_id 给后端排查。';
    }
    if (ratio >= 0.3 && totalCalls >= 10) {
      return `错误率偏高（${(ratio * 100).toFixed(1)}%），建议检查密钥状态、参数和幂等键生成。`;
    }
    if (totalErrors > 0) {
      return `近期开启中有 ${totalErrors} 次失败调用，建议重点查看 error_code。`;
    }
    return '当前调用健康度正常。';
  }, [usageLogs, usageSummary]);

  const anomalyLevel = useMemo<'normal' | 'warning' | 'high'>(() => {
    if (!usageSummary) return 'normal';
    const totalCalls = Number(usageSummary.total_calls || 0);
    const totalErrors = Number(usageSummary.total_errors || 0);
    const ratio = totalCalls > 0 ? totalErrors / totalCalls : 0;
    const hasRecentServerError = usageLogs.some((item) => Number(item.status_code || 0) >= 500);
    if (hasRecentServerError) return 'high';
    if (ratio >= 0.3 && totalCalls >= 10) return 'high';
    if (totalErrors > 0) return 'warning';
    return 'normal';
  }, [usageLogs, usageSummary]);

  const topErrorCodes = useMemo<UsageErrorCodeItem[]>(() => {
    const map = new Map<string, number>();
    for (const item of usageLogs) {
      const code = String(item.error_code || '').trim();
      if (!code) continue;
      map.set(code, Number(map.get(code) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([code, count]) => ({ code, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [usageLogs]);

  const topPaths = useMemo<UsagePathItem[]>(() => {
    const map = new Map<string, number>();
    if (usageSummary?.top_paths?.length) {
      for (const item of usageSummary.top_paths) {
        const key = String(item.path || '').trim();
        if (!key) continue;
        map.set(key, Number(map.get(key) || 0) + Number(item.count || 0));
      }
    }
    if (map.size === 0) {
      for (const item of usageLogs) {
        const key = String(item.path || '').trim();
        if (!key) continue;
        map.set(key, Number(map.get(key) || 0) + 1);
      }
    }
    return Array.from(map.entries())
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [usageLogs, usageSummary]);

  const activeCount = useMemo(
    () => list.filter((item) => item.status !== 'revoked').length,
    [list],
  );
  const reachedKeyLimit = activeCount >= 5;

  const publishCurlExample = `curl -X POST "http://127.0.0.1:9527/open/content/posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your_api_key>" \\
  -H "Idempotency-Key: ${idempotencyKeySample}" \\
  -d '{
    "post_type": "post",
    "title": "今日更新进度",
    "content": "正文内容",
    "summary": "30 秒速览今日更新",
    "topic_id": "69d22fa1a75bd91bed8f9731"
  }'`;

  const publishCurlFullExample = `curl -X POST "http://127.0.0.1:9527/open/content/posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your_api_key>" \\
  -H "Idempotency-Key: ${idempotencyKeySample}" \\
  -d '{
    "post_type": "post",
    "title": "版本更新说明",
    "summary": "修复登录问题并优化活动页",
    "content": "## 更新内容\\n- 修复登录问题\\n- 优化活动页加载速度",
    "content_html": "<h2>更新内容</h2><ul><li>修复登录问题</li><li>优化活动页加载速度</li></ul>",
    "cover": "https://cdn.example.com/post/cover-main.jpg",
    "media_urls": ["https://cdn.example.com/post/cover-1.jpg"],
    "addition_links": [{"title": "更新公告", "url": "https://example.com/changelog"}],
    "tags": ["更新", "公告"],
    "publish_at": "2026-05-24T10:00:00.000Z"
  }'`;

  const publishFetchExample = `await fetch("http://127.0.0.1:9527/open/content/posts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-Key": "<your_api_key>",
    "Idempotency-Key": "${idempotencyKeySample}"
  },
  body: JSON.stringify({
    post_type: "post",
    title: "今日更新进度",
    content: "正文内容",
    topic_id: "69d22fa1a75bd91bed8f9731"
  })
});`;

  const publishNewsCurlExample = `curl -X POST "http://127.0.0.1:9527/open/content/posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your_api_key>" \\
  -H "Idempotency-Key: ${idempotencyKeySample}" \\
  -d '{
    "post_type": "news",
    "title": "维护公告",
    "summary": "本周维护窗口与影响范围",
    "content": "维护时间：2026-05-25 02:00~04:00",
    "cover": "https://cdn.example.com/news/maintenance-cover.jpg",
    "tags": ["公告", "维护"]
  }'`;

  const publishTopicBindingCurlExample = `curl -X POST "http://127.0.0.1:9527/open/content/posts" \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: <your_api_key>" \\
  -H "Idempotency-Key: ${idempotencyKeySample}" \\
  -d '{
    "post_type": "post",
    "title": "赛季活动攻略",
    "content": "这里是活动攻略正文...",
    "app_id": "68f5d0c08902ae6d797b83ca",
    "topic_id": "69d22fa1a75bd91bed8f9731",
    "topic_ids": ["69d22fa1a75bd91bed8f9731", "69d22fa1a75bd91bed8f9732"],
    "publish_at": "2026-05-24T10:00:00.000Z"
  }'`;

  const listMyPostsCurlExample = `curl "http://127.0.0.1:9527/open/content/my/posts?page=1&pageSize=20&post_type=post&review_status=pending&status=0&q=更新" \\
  -H "X-API-Key: <your_api_key>"`;

  const myPostDetailCurlExample = `curl "http://127.0.0.1:9527/open/content/my/posts/682f0f0f0f0f0f0f0f0f0f0f" \\
  -H "X-API-Key: <your_api_key>"`;

  const openDetailCurlExample = `curl "http://127.0.0.1:9527/open/content/posts/682f0f0f0f0f0f0f0f0f0f0f" \\
  -H "X-API-Key: <your_api_key>"`;

  const publishSuccessResponseExample = `{
  "code": "OK",
  "message": "ok",
  "data": {
    "post_id": "682f0f0f0f0f0f0f0f0f0f0f",
    "post_type": "post",
    "review_status": "pending",
    "status": 0,
    "publish_at": null,
    "topic_id": "",
    "topic_ids": []
  },
  "idempotent_replay": false,
  "request_id": "req-xxxx"
}`;

  const publishReplayResponseExample = `{
  "code": "OK_REPLAY",
  "message": "ok(replay)",
  "data": {
    "post_id": "682f0f0f0f0f0f0f0f0f0f0f",
    "post_type": "post",
    "review_status": "pending",
    "status": 0,
    "publish_at": null,
    "topic_id": "",
    "topic_ids": []
  },
  "idempotent_replay": true,
  "request_id": "req-xxxx"
}`;

  const publishFieldRulesExample = `字段约束（严格对齐 OpenContentCreatePostDto）
- post_type: post | news（默认 post）
- title: 可选，最大 200
- summary: 可选，最大 500
- content: 必填，1 ~ 300000
- content_html: 可选，最大 500000
- cover: 可选，最大 800
- media_urls: 可选数组，最多 100 项；单项最大 1000
- addition_links: 可选数组，最多 50 项；每项 title(1~80), url(1~800)
- app_id: 可选 MongoId
- topic_id: 可选 MongoId
- topic_ids: 可选数组，最多 20 项，单项 MongoId
- tags: 可选数组，最多 30 项，单项最大 40
- publish_at: 可选 ISO 时间`;

  const publishServerManagedFields = `服务端自动控制字段（无需传）
- author_id / author_name / author_avatar / author_type
- review_status / review_reason / reviewed_at / reviewed_by
- status / is_top / is_recommended / sort

说明：作者身份由 X-API-Key 的 owner 自动绑定。`;

  const publishUnsupportedFields = `当前不要传（会被忽略或不作为可信输入）
- topic_names
- source
- language
- author_* / review_* / status / is_top / is_recommended

原因：/open/content/posts 的 DTO 未声明这些字段，且服务端启用了 whitelist 校验。`;

  const publishErrorExamples = `401 API_KEY_UNAUTHORIZED
  - 常见原因：X-API-Key 缺失、无效、过期或被禁用
  - 认证头支持：优先 X-API-Key；兼容 Authorization: Bearer ak_live_... 或 Authorization: ApiKey ak_live_...

403 API_KEY_FORBIDDEN
  - API Key 缺少 content:write 能力

409 IDEMPOTENCY_KEY_CONFLICT
  - 同一个 Idempotency-Key 对应了不同请求体

409 IDEMPOTENCY_REQUEST_IN_PROGRESS
  - 同一个 Idempotency-Key 的前一次请求仍在处理中

400 INVALID_PARAMS
  - 参数格式错误（如 post_type 非 post/news，或 content 为空）`;

  const publishIdempotencyRules = `幂等规则（第一性原理）
1) 新业务动作必须生成新 Idempotency-Key
2) 网络重试同一次动作，必须复用同一个 Idempotency-Key
3) 同 key + 同请求体 => 返回首次结果（code=OK_REPLAY）
4) 同 key + 不同请求体 => 409 IDEMPOTENCY_KEY_CONFLICT`;

  const mcpCurlInitializeExample = `curl -X POST "https://api.hk.apks.cc/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {}
  }'`;

  const mcpCurlToolsListExample = `curl -X POST "https://api.hk.apks.cc/mcp" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/list",
    "params": {}
  }'`;

  const mcpInitializeExample = `{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {}
}`;

  const mcpToolsListExample = `{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}`;

  const mcpToolCallExample = `{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "content.get_feed",
    "arguments": {
      "post_type": "post",
      "page": 1,
      "pageSize": 10
    }
  }
}`;

  useEffect(() => {
    if (isAuthenticated && token) {
      void loadKeys();
    }
  }, [isAuthLoading, isAuthenticated, token]);

  if (isAuthLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <CenterAuthRequired
        title="API 密钥"
        description="管理用于开放接口发布内容的个人 API 密钥。"
        containerClassName="max-w-6xl"
      />
    );
  }

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
    if (reachedKeyLimit) {
      toast({ variant: 'destructive', title: '已达到 5 个密钥上限', description: '请先吊销不再使用的密钥后再创建。' });
      return;
    }
    if (!name.trim()) {
      toast({ variant: 'destructive', title: '请输入密钥名称' });
      return;
    }

    let normalizedExpiresAt: string | undefined;
    if (expiresAt) {
      const parsed = new Date(expiresAt);
      if (!Number.isFinite(parsed.getTime())) {
        toast({ variant: 'destructive', title: '过期时间格式无效' });
        return;
      }
      normalizedExpiresAt = parsed.toISOString();
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
          key_type: 'content_user',
          capabilities: ['content:write'],
          expires_at: normalizedExpiresAt,
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
      toast({ variant: 'destructive', title: '创建失败', description: getFriendlyApiKeyError(json.message) });
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
      toast({ variant: 'destructive', title: '查看失败', description: getFriendlyApiKeyError(json.message) });
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
      toast({ variant: 'destructive', title: '操作失败', description: getFriendlyApiKeyError(json.message) });
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
      toast({ variant: 'destructive', title: '吊销失败', description: getFriendlyApiKeyError(json.message) });
    } catch {
      toast({ variant: 'destructive', title: '网络错误', description: '请检查网络连接' });
    }
  }

  async function loadDetailData(keyId: string) {
    if (!token) return;
    const [detailRes, summaryRes, logsRes] = await Promise.all([
      trackedApiFetch(`/users/api-keys/${keyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      trackedApiFetch(`/users/api-keys/${keyId}/usage-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      trackedApiFetch(`/users/api-keys/${keyId}/usage-logs?page=1&pageSize=5`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);
    const detailJson: ApiResponse<UserApiKeyItem> = await detailRes.json();
    const summaryJson: ApiResponse<UserApiKeyUsageSummary> = await summaryRes.json();
    const logsJson: ApiResponse<{ list: UserApiKeyUsageLogItem[] }> = await logsRes.json();
    if (detailJson.code === 0 && detailJson.data) {
      setDetailKey(detailJson.data);
    }
    if (summaryJson.code === 0 && summaryJson.data) {
      setUsageSummary(summaryJson.data);
    }
    if (logsJson.code === 0) {
      setUsageLogs(logsJson.data?.list || []);
    }
  }

  async function viewDetail(item: UserApiKeyItem) {
    if (!token) return;
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailActionNotice('');
    setDetailKey(null);
    setUsageSummary(null);
    setUsageLogs([]);
    try {
      await loadDetailData(item._id);
    } catch {
      toast({ variant: 'destructive', title: '加载详情失败', description: '请稍后重试' });
      setDetailModalOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  async function exportUsageLogs() {
    if (usageLogs.length === 0) {
      toast({ title: '暂无日志可导出' });
      return;
    }
    const lines = [
      'time,method,path,status_code,duration_ms,ip,request_id,error_code,is_replay,idempotency_key',
      ...usageLogs.map((log) => [
        formatTime(log.created_at),
        log.method,
        log.path,
        String(log.status_code),
        String(log.duration_ms),
        log.ip,
        log.request_id,
        log.error_code,
        log.is_replay ? 'true' : 'false',
        log.idempotency_key,
      ].map((cell) => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `api-key-usage-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: '日志已导出' });
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
            使用 API 密钥调用公开内容接口。当前已创建 {activeCount}/5 个内容发布密钥。
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
                placeholder="例如：自动发帖服务（content:write）"
                maxLength={60}
                data-acbox-action="profile_api_keys_name_input"
                data-acbox-label="密钥名称"
              />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="api-key-expire">过期时间</Label>
              <Input
                id="api-key-expire"
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                data-acbox-action="profile_api_keys_expire_input"
                data-acbox-label="过期时间"
              />
            </div>
            <div className="flex items-end md:col-span-1">
              <Button
                className="w-full md:w-auto"
                onClick={createKey}
                disabled={submitting || reachedKeyLimit}
                data-acbox-action="profile_api_keys_create"
                data-acbox-label="新建发布密钥"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    {reachedKeyLimit ? '已达上限（5/5）' : '新建发布密钥'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
          {reachedKeyLimit
            ? '已达到 5 个密钥上限，需先吊销不再使用的密钥后才能继续创建。'
            : '创建的是内容发布密钥（content:write）。创建成功后只展示一次明文，建议立即保存。'}
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>密钥使用方式</CardTitle>
          <CardDescription>
            API 密钥有两种主要用途：发布文章，以及连接只读 MCP（/mcp）。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="publish" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="publish"
                data-acbox-action="profile_api_keys_tab_publish"
                data-acbox-label="发布文章"
              >
                发布文章
              </TabsTrigger>
              <TabsTrigger
                value="mcp"
                data-acbox-action="profile_api_keys_tab_mcp"
                data-acbox-label="连接 MCP"
              >
                连接 MCP（只读）
              </TabsTrigger>
            </TabsList>

            <TabsContent value="publish" className="space-y-4 pt-4">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-medium">接口：POST /open/content/posts</p>
                <p className="mt-1 text-muted-foreground">
                  必填请求头：X-API-Key、Idempotency-Key。每次新请求必须更换 Idempotency-Key，建议格式：post-时间戳-随机串。
                </p>
                <p className="mt-1 text-muted-foreground">
                  认证头建议优先使用 X-API-Key。兼容写法：Authorization: Bearer ak_live_... 或 Authorization: ApiKey ak_live_...。
                </p>
                <p className="mt-1 text-muted-foreground">
                  作者身份由 API Key 所属用户自动绑定，后端会按密钥 owner 写入作者信息。
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIdempotencyKeySample(createIdempotencyKeySample());
                    }}
                    data-acbox-action="profile_api_keys_generate_idempotency_key"
                    data-acbox-label="生成新幂等键"
                  >
                    生成新幂等键
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void copyText(idempotencyKeySample, '幂等键已复制');
                    }}
                    data-acbox-action="profile_api_keys_copy_idempotency_key"
                    data-acbox-label="复制当前幂等键"
                  >
                    <Copy className="mr-1 h-4 w-4" />
                    复制当前幂等键
                  </Button>
                  <span className="font-mono text-xs text-muted-foreground">{idempotencyKeySample}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL 示例</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishCurlExample, 'cURL 示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishCurlExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>fetch 示例</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishFetchExample, 'fetch 示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishFetchExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL 完整参数示例</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishCurlFullExample, '完整 cURL 示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishCurlFullExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL 新闻示例（post_type=news）</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishNewsCurlExample, '新闻 cURL 示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishNewsCurlExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL 话题/游戏关联示例</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishTopicBindingCurlExample, '话题关联 cURL 示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishTopicBindingCurlExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>字段约束速查</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishFieldRulesExample, '字段约束已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  <code>{publishFieldRulesExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>服务端自动控制字段</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishServerManagedFields, '服务端控制字段说明已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  <code>{publishServerManagedFields}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>当前不要传的字段</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishUnsupportedFields, '字段兼容边界说明已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  <code>{publishUnsupportedFields}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>幂等策略速查</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishIdempotencyRules, '幂等策略说明已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  <code>{publishIdempotencyRules}</code>
                </pre>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">接口文档与响应说明</p>
                <p className="mt-1">
                  详细字段、错误码与幂等行为请参考 interface 文档：
                  <span className="ml-1 font-mono">docs/OPEN_CONTENT_API_KEY_API.md</span>
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>成功响应示例（首次）</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishSuccessResponseExample, '成功响应示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishSuccessResponseExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>成功响应示例（幂等重放）</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishReplayResponseExample, '幂等重放响应示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{publishReplayResponseExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>常见错误排查</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(publishErrorExamples, '错误排查说明已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border border-dashed p-3 text-xs leading-5 text-muted-foreground">
                  <code>{publishErrorExamples}</code>
                </pre>
              </div>

              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-medium">查询接口（X-API-Key）</p>
                <p className="mt-1 text-muted-foreground">
                  发布后可通过我的内容列表和详情接口回读状态（pending/published、status、topic 绑定等）。
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL：我的内容列表（带筛选）</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(listMyPostsCurlExample, '我的内容列表示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{listMyPostsCurlExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL：我的内容详情</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(myPostDetailCurlExample, '我的内容详情示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{myPostDetailCurlExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL：内容详情（公开规则 + 本人特权）</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(openDetailCurlExample, '内容详情示例已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{openDetailCurlExample}</code>
                </pre>
              </div>
            </TabsContent>

            <TabsContent value="mcp" className="space-y-4 pt-4">
              <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                <p className="font-medium">端点：POST /mcp（公开只读）</p>
                <p className="mt-1 text-muted-foreground">
                  本端点用于读取能力，不支持发布写入。无需 X-API-Key，请求头使用 Content-Type: application/json。
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL：initialize</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(mcpCurlInitializeExample, 'MCP initialize cURL 已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{mcpCurlInitializeExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>cURL：tools/list</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(mcpCurlToolsListExample, 'MCP tools/list cURL 已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{mcpCurlToolsListExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Step 1: initialize</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(mcpInitializeExample, 'initialize 请求已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{mcpInitializeExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Step 2: tools/list</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(mcpToolsListExample, 'tools/list 请求已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{mcpToolsListExample}</code>
                </pre>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>Step 3: tools/call（示例）</Label>
                  <Button variant="outline" size="sm" onClick={() => void copyText(mcpToolCallExample, 'tools/call 请求已复制')}>
                    <Copy className="mr-1 h-4 w-4" />
                    复制
                  </Button>
                </div>
                <pre className="overflow-x-auto rounded-lg border bg-muted/30 p-3 text-xs leading-5">
                  <code>{mcpToolCallExample}</code>
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
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
                      类型：{item.key_type || 'legacy'} · 能力：{(item.capabilities || []).join(', ') || '-'} · 风险：{item.risk_level || 'low'}
                    </div>
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
                        data-acbox-action="profile_api_keys_toggle_status"
                        data-acbox-label={item.name || '切换密钥状态'}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void viewDetail(item);
                      }}
                      data-acbox-action="profile_api_keys_view_detail"
                      data-acbox-label={item.name || '密钥详情'}
                    >
                      详情
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        void viewSecret(item);
                      }}
                      data-acbox-action="profile_api_keys_view_secret"
                      data-acbox-label={item.name || '查看密钥'}
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
                      data-acbox-action="profile_api_keys_copy_id"
                      data-acbox-label={item.name || '复制密钥ID'}
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
                      data-acbox-action="profile_api_keys_revoke"
                      data-acbox-label={item.name || '吊销密钥'}
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
            <p className="text-xs text-muted-foreground">
              可直接复制下方命令进行发布测试。命令仅在复制时使用当前明文密钥，不会替换页面上的占位示例。
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setSecretModalOpen(false);
              }}
              data-acbox-action="profile_api_keys_secret_close"
              data-acbox-label="关闭密钥明文弹窗"
            >
              关闭
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                void copyText(
                  buildPublishCurlWithKey(secretPayload.key, createIdempotencyKeySample()),
                  '发布 cURL 已复制',
                );
              }}
              data-acbox-action="profile_api_keys_copy_secret_curl"
              data-acbox-label="复制可直接发布的 cURL"
            >
              <Copy className="mr-2 h-4 w-4" />
              复制可直接发布的 cURL
            </Button>
            <Button
              onClick={() => {
                void copyText(secretPayload.key, '密钥已复制');
              }}
              data-acbox-action="profile_api_keys_copy_secret"
              data-acbox-label="复制密钥"
            >
              <Copy className="mr-2 h-4 w-4" />
              复制密钥
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>密钥详情与调用概览</DialogTitle>
            <DialogDescription>
              查看密钥治理字段、调用摘要和最近调用日志。
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded border p-3 text-sm">类型：{detailKey?.key_type || 'legacy'}</div>
                <div className="rounded border p-3 text-sm">风险：{detailKey?.risk_level || 'low'}</div>
                <div className="rounded border p-3 text-sm">最近使用：{formatTime(detailKey?.last_used_at)}</div>
                <div className="rounded border p-3 text-sm">最近 IP：{detailKey?.last_used_ip || '-'}</div>
              </div>
              <div className="rounded border p-3 text-sm">
                能力：{(detailKey?.capabilities || []).join(', ') || '-'}
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded border p-3 text-sm">总调用：{usageSummary?.total_calls ?? 0}</div>
                <div className="rounded border p-3 text-sm">失败调用：{usageSummary?.total_errors ?? 0}</div>
                <div className="rounded border p-3 text-sm">平均耗时：{Number(usageSummary?.avg_duration_ms || 0).toFixed(2)} ms</div>
              </div>
              <div className="rounded border border-dashed p-3 text-xs text-muted-foreground">
                异常提示：{anomalyHint || '-'}
              </div>
              {anomalyLevel !== 'normal' && detailKey ? (
                <div className="rounded border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                  检测到异常调用风险，建议先禁用该密钥，排查完成后再启用。
                  <div className="mt-2">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={async () => {
                        if (!detailKey) return;
                        await toggleStatus(detailKey, false);
                        await loadDetailData(detailKey._id);
                        setDetailActionNotice('已执行禁用操作，并刷新最新状态。');
                      }}
                      data-acbox-action="profile_api_keys_disable_risky_key"
                      data-acbox-label={detailKey.name || '一键禁用当前密钥'}
                    >
                      一键禁用当前密钥
                    </Button>
                  </div>
                </div>
              ) : null}
              {detailActionNotice ? (
                <div className="rounded border border-green-200 bg-green-50 p-3 text-xs text-green-700">
                  {detailActionNotice}
                </div>
              ) : null}
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded border p-3">
                  <div className="mb-2 text-xs text-muted-foreground">最近错误码 TopN</div>
                  {topErrorCodes.length === 0 ? (
                    <div className="text-xs text-muted-foreground">暂无错误码</div>
                  ) : (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {topErrorCodes.map((item) => (
                        <div key={item.code}>{item.code}: {item.count}</div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="rounded border p-3">
                  <div className="mb-2 text-xs text-muted-foreground">最常调用路径 TopN</div>
                  {topPaths.length === 0 ? (
                    <div className="text-xs text-muted-foreground">暂无路径数据</div>
                  ) : (
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {topPaths.map((item) => (
                        <div key={item.path}>{item.path}: {item.count}</div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Label>最近调用日志（5条）</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void exportUsageLogs()}
                    data-acbox-action="profile_api_keys_export_usage_logs"
                    data-acbox-label="导出调用日志"
                  >
                    导出 CSV
                  </Button>
                </div>
                <div className="space-y-2">
                  {usageLogs.length === 0 ? (
                    <div className="rounded border border-dashed p-3 text-xs text-muted-foreground">暂无日志</div>
                  ) : (
                    usageLogs.map((log) => (
                      <div key={log._id} className="rounded border p-3 text-xs text-muted-foreground">
                        <div>{formatTime(log.created_at)} · {log.method} {log.path} · {log.status_code} · {log.duration_ms}ms</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-mono">request_id: {log.request_id || '-'}</span>
                          {log.request_id ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => void copyText(log.request_id, 'request_id 已复制')}
                              data-acbox-action="profile_api_keys_copy_request_id"
                              data-acbox-label={log.request_id}
                            >
                              复制 request_id
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDetailModalOpen(false)}
              data-acbox-action="profile_api_keys_detail_close"
              data-acbox-label="关闭密钥详情"
            >
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
