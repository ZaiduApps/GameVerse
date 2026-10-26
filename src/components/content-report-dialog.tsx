'use client';

import { useState } from 'react';
import { Flag, Loader2 } from 'lucide-react';

import AuthModal from '@/components/auth/auth-modal';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import {
  CONTENT_REPORT_REASONS,
  buildContentReportPayload,
  describeContentReportTarget,
  type ContentReportReason,
  type ContentReportTargetType,
} from '@/lib/content-report';
import { submitFeedbackTicket } from '@/lib/feedback';
import { cn } from '@/lib/utils';

interface ContentReportDialogProps {
  targetType: ContentReportTargetType;
  targetId: string;
  /** 提交时的参考页面；缺省取 window.location.href */
  refUrl?: string;
  /** 只显示图标（列表/评论等紧凑场景） */
  iconOnly?: boolean;
  className?: string;
}

/**
 * 帖子 / 评论 / 资源的举报入口。
 *
 * 复用现有反馈工单（POST /feedbacks, type=content_report），不新建后台页面；
 * 未登录先弹登录框，登录成功后可继续举报。
 */
export default function ContentReportDialog({
  targetType,
  targetId,
  refUrl,
  iconOnly = false,
  className,
}: ContentReportDialogProps) {
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [reason, setReason] = useState<ContentReportReason>('illegal');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const targetLabel = describeContentReportTarget(targetType);
  const trimmedTargetId = String(targetId || '').trim();

  function handleOpen() {
    if (!isAuthenticated || !token) {
      setAuthOpen(true);
      toast({
        title: '请先登录后再举报',
        description: '登录后可提交内容举报，我们会按反馈流程处理。',
        variant: 'destructive',
      });
      return;
    }
    if (!trimmedTargetId) {
      toast({ title: '无法举报', description: '缺少被举报内容的标识。', variant: 'destructive' });
      return;
    }
    setOpen(true);
  }

  async function handleSubmit() {
    if (!token || submitting) return;
    setSubmitting(true);
    try {
      const payload = buildContentReportPayload({
        targetType,
        targetId: trimmedTargetId,
        reason,
        note,
        refUrl,
        user,
      });
      await submitFeedbackTicket(payload, token);
      toast({ title: '举报已提交', description: '我们会按反馈流程核对处理。' });
      setOpen(false);
      setNote('');
      setReason('illegal');
    } catch (error) {
      toast({
        title: '举报提交失败',
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleOpen}
        aria-label={`举报该${targetLabel}`}
        title={`举报该${targetLabel}`}
        data-acbox-action={`content_report_${targetType}`}
        data-acbox-label={trimmedTargetId || targetLabel}
        className={cn(
          'h-8 px-2 text-muted-foreground hover:text-destructive',
          iconOnly && 'h-7 px-1.5',
          className,
        )}
      >
        <Flag size={iconOnly ? 14 : 15} aria-hidden="true" />
        {iconOnly ? null : <span className="ml-1">{`举报`}</span>}
      </Button>

      <Dialog open={open} onOpenChange={(next) => (submitting ? undefined : setOpen(next))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>举报{targetLabel}</DialogTitle>
            <DialogDescription>
              请选择举报原因；我们会按反馈流程核对处理，恶意举报可能影响账号使用。
            </DialogDescription>
          </DialogHeader>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">举报原因</legend>
            <div className="grid gap-1.5 sm:grid-cols-2">
              {CONTENT_REPORT_REASONS.map((item) => (
                <label
                  key={item.value}
                  className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/60 px-2.5 py-2 text-sm hover:bg-muted/50"
                >
                  <input
                    type="radio"
                    name="content-report-reason"
                    value={item.value}
                    checked={reason === item.value}
                    onChange={() => setReason(item.value)}
                    className="h-3.5 w-3.5"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="space-y-1.5">
            <Label htmlFor="content-report-note">补充说明（可选）</Label>
            <Textarea
              id="content-report-note"
              value={note}
              maxLength={200}
              placeholder="说明具体问题，便于我们更快核对"
              onChange={(event) => setNote(event.target.value)}
            />
            <p className="text-right text-[11px] text-muted-foreground">{note.length}/200</p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary" disabled={submitting}>
                取消
              </Button>
            </DialogClose>
            <Button type="button" onClick={() => void handleSubmit()} disabled={submitting}>
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              提交举报
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
    </>
  );
}
