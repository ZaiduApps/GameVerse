'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * 详情页「无法安装？」三选一分流（待决策 #132）。
 *
 * 文案事实口径来自客服 FAQ 011 / 023 / 024，只描述症状，不写死机型与系统版本；
 * 选中一项后当场给出排查建议。交互用点击按钮 + `aria-pressed`，键盘 Tab / Enter
 * 可用，弹窗焦点与 Esc 关闭沿用既有 Dialog。
 */
type TroubleshootingId = 'parse_error' | 'opens_crash' | 'download_failed';

/**
 * 每项在 `/help/install` 上的落点。页面按四类症状组织，弹窗的三个入口
 * 分别挂到最接近的一类：打不开归到系统版本不兼容，下载失败归到解析包错误
 * （下载不完整是解析失败最常见的原因）。
 */
const TROUBLESHOOTING_OPTIONS: ReadonlyArray<{
  id: TroubleshootingId;
  label: string;
  symptom: string;
  advice: string;
  helpAnchor: 'parse_error' | 'install_failed' | 'storage_full' | 'incompatible';
}> = [
  {
    id: 'parse_error',
    label: '解析包错误',
    symptom: '安装时提示解析包出错、安装包损坏',
    advice:
      '多半是下载不完整：删掉这个文件重新下载一次；如果还是报错，说明文件本身可能已损坏，把下载链接发给我们核验。',
    helpAnchor: 'parse_error',
  },
  {
    id: 'opens_crash',
    label: '装上了打不开',
    symptom: '安装完成后打不开、闪退或黑屏',
    advice:
      '先确认设备是否满足游戏的运行要求，再尝试清除应用数据后重新打开；如果仍然打不开，请带上设备信息与系统版本反馈给我们。',
    helpAnchor: 'incompatible',
  },
  {
    id: 'download_failed',
    label: '下载失败',
    symptom: '下载没反应、页面空白或一直加载',
    advice:
      '先换一个浏览器，或关闭广告拦截插件后重试；如果还是打不开，把下载链接和截图发给我们，我们检查 CDN 和资源状态。',
    helpAnchor: 'parse_error',
  },
];

export default function InstallTroubleshootingDialog() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<TroubleshootingId | null>(null);
  const selected = TROUBLESHOOTING_OPTIONS.find((option) => option.id === selectedId);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) setSelectedId(null);
      }}
    >
      <DialogTrigger asChild>
        <button
          type="button"
          aria-haspopup="dialog"
          className="rounded text-xs font-semibold text-primary underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [@media(hover:hover)]:hover:decoration-solid"
          data-acbox-action="install_help_open"
        >
          无法安装？
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>装不上或打不开？</DialogTitle>
          <DialogDescription>
            先选一个最接近的症状，按下面的方法排查。
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2">
          {TROUBLESHOOTING_OPTIONS.map((option) => {
            const isSelected = option.id === selectedId;
            return (
              <div
                key={option.id}
                className={cn(
                  'rounded-xl border transition-colors',
                  isSelected
                    ? 'border-primary/50 bg-primary/[0.06]'
                    : 'border-border/60 bg-card [@media(hover:hover)]:hover:bg-muted/60',
                )}
              >
                <button
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedId(option.id)}
                  className="flex w-full flex-col items-start rounded-t-xl px-3 pb-1 pt-2.5 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  data-acbox-action="install_help_option"
                  data-acbox-label={option.label}
                >
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="mt-0.5 text-xs leading-5 text-muted-foreground">{option.symptom}</span>
                </button>
                <Link
                  href={`/help/install#${option.helpAnchor}`}
                  className="inline-flex items-center gap-1 rounded-b-xl px-3 pb-2.5 text-xs font-semibold text-primary underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [@media(hover:hover)]:hover:decoration-solid"
                  data-acbox-action="install_help_more"
                  data-acbox-label={option.label}
                >
                  查看完整排障
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </Link>
              </div>
            );
          })}
        </div>

        {selected ? (
          <div aria-live="polite">
            <Alert variant="default" className="bg-muted/60">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              <AlertTitle>{selected.label}：先这样排查</AlertTitle>
              <AlertDescription>
                <p className="text-xs leading-6 text-muted-foreground">{selected.advice}</p>
              </AlertDescription>
            </Alert>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
