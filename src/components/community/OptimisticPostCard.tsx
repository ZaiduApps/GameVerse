'use client';

import { AlertCircle, Loader2, RotateCcw, Trash2, UploadCloud } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { CommunityPublishJob } from '@/lib/community-publish-queue';

function stripMarkdown(text: string, maxLength = 180) {
  const plain = String(text || '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > maxLength ? `${plain.slice(0, maxLength)}...` : plain;
}

export interface OptimisticPostCardProps {
  avatar?: string;
  job: CommunityPublishJob;
  onDelete: (job: CommunityPublishJob) => void;
  onEdit: (job: CommunityPublishJob) => void;
  onRetry: (job: CommunityPublishJob) => void;
  userName?: string;
}

export default function OptimisticPostCard({
  avatar,
  job,
  onDelete,
  onEdit,
  onRetry,
  userName,
}: OptimisticPostCardProps) {
  const failed = job.status === 'failed';
  const busy = job.status === 'pending' || job.status === 'running';

  return (
    <Card className="border-dashed shadow-sm">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-sm font-semibold">
                {job.title || '无标题动态'}
              </span>
              {busy ? (
                <Badge variant="secondary" className="gap-1 text-[11px]">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  发布中
                </Badge>
              ) : null}
              {failed ? (
                <Badge variant="destructive" className="gap-1 text-[11px]">
                  <AlertCircle className="h-3 w-3" />
                  发布失败
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              {userName || '我'} · {busy ? '图片后台上传中，离开页面也会继续' : '本地草稿已保留'}
            </p>
          </div>
          <img
            src={avatar || '/favicon.ico'}
            alt={userName || '我'}
            className="h-8 w-8 rounded-full object-cover"
          />
        </div>

        <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">
          {stripMarkdown(job.content) || '（图片内容）'}
        </p>

        {failed ? (
          <div className="space-y-2 rounded-md bg-destructive/5 px-2.5 py-2 text-xs text-destructive">
            <div className="flex items-start gap-1.5">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="break-words">{job.lastError || '发布失败，请重试'}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" className="h-7 px-2 text-xs" onClick={() => onRetry(job)}>
                <UploadCloud className="mr-1 h-3.5 w-3.5" />
                重试
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 px-2 text-xs"
                onClick={() => onEdit(job)}
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" />
                返回编辑
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2 text-xs"
                onClick={() => onDelete(job)}
              >
                <Trash2 className="mr-1 h-3.5 w-3.5" />
                删除
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
