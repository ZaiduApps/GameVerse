'use client';

import { Button } from '@/components/ui/button';

type CenterLoadErrorProps = {
  message: string;
  onRetry: () => void;
  action: string;
  actionLabel: string;
};

/** 个人中心列表页统一的失败态：把后端/网络错误原样展示，并给一个重试入口。 */
export default function CenterLoadError({
  message,
  onRetry,
  action,
  actionLabel,
}: CenterLoadErrorProps) {
  return (
    <div role="alert" className="rounded-lg bg-destructive/5 px-4 py-5 text-sm text-destructive">
      <p>{message}</p>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-3"
        onClick={onRetry}
        data-acbox-action={action}
        data-acbox-label={actionLabel}
      >
        重新加载
      </Button>
    </div>
  );
}
