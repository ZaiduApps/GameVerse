'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BellRing, Download, Heart, Link as LinkIcon, MessageSquare, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { buildFeedbackCommonFields, submitFeedbackTicket } from '@/lib/feedback';
import { getGamePrimaryActionKind, isWebGameType } from '@/lib/game-resource-type';
import { cn } from '@/lib/utils';
import type { ApiDownloadResource, ApiGameDetail, CardConfigItem } from '@/types';
import { formatBytes } from './game-detail-presenter';

const AuthModal = dynamic(() => import('@/components/auth/auth-modal'), { ssr: false });
const AppDownloadGuideDialog = dynamic(() => import('@/components/app-download-guide-dialog'), { ssr: false });
const GameDownloadDialog = dynamic(() => import('@/components/game-download-dialog'), { ssr: false });

type ActionGame = Pick<ApiGameDetail, '_id' | 'pkg' | 'name' | 'version' | 'type' | 'file_size'>;

interface GameDetailActionsProps {
  game: ActionGame;
  resources: ApiDownloadResource[];
  downloadNotices: CardConfigItem[];
  showPreregReminder: boolean;
}

export default function GameDetailActions({
  game,
  resources,
  downloadNotices,
  showPreregReminder,
}: GameDetailActionsProps) {
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [isSubmittingUrge, setIsSubmittingUrge] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [appGuideOpen, setAppGuideOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const isWebGame = isWebGameType(game.type);
  const primaryActionKind = getGamePrimaryActionKind(game.type);

  useEffect(() => {
    const reminderKey = game._id || game.pkg;
    if (!reminderKey) return;
    try {
      setIsReminderEnabled(window.localStorage.getItem(`game-remind:${reminderKey}`) === '1');
    } catch {
      setIsReminderEnabled(false);
    }
  }, [game._id, game.pkg]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${game.name} - ACBOX`, url: window.location.href });
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: '复制成功', description: '链接已复制。' });
      }
    } catch {
      // 用户主动取消系统分享时无需提示错误。
    }
  }, [game.name, toast]);

  const handleFavoriteToggle = useCallback(() => {
    setIsFavorite((current) => {
      const next = !current;
      toast({
        title: next ? '已加入收藏' : '已取消收藏',
        description: next ? '你可以在收藏列表中快速找到该游戏。' : '该游戏已从收藏中移除。',
      });
      return next;
    });
  }, [toast]);

  const handleReminderToggle = useCallback(() => {
    const reminderKey = game._id || game.pkg;
    if (!reminderKey) return;
    setIsReminderEnabled((current) => {
      const next = !current;
      try {
        window.localStorage.setItem(`game-remind:${reminderKey}`, next ? '1' : '0');
      } catch {
        // 存储不可用时仍保留本次会话内状态。
      }
      toast({
        title: next ? '已开启上线提醒' : '已取消上线提醒',
        description: next ? '游戏上线后可在消息中心查看提醒。' : '你可以随时再次开启提醒。',
      });
      return next;
    });
  }, [game._id, game.pkg, toast]);

  const handleUrge = useCallback(async () => {
    if (isSubmittingUrge) return;
    if (!isAuthenticated || !token) {
      setAuthModalOpen(true);
      toast({ title: '请先登录或注册', description: '登录账号后即可提交催更请求。', variant: 'destructive' });
      return;
    }
    setIsSubmittingUrge(true);
    try {
      const common = buildFeedbackCommonFields(user || undefined, window.location.href);
      await submitFeedbackTicket({
        type: 'missing',
        title: '求添加资源反馈',
        description: [
          `缺少资源：${game.name}`,
          `游戏包名：${game.pkg || '未提供'}`,
          `当前版本：${game.version || '未提供'}`,
          `提交用户：${common.nickname || '游客'}`,
          `联系方式：${common.contact || '未提供'}`,
          '提交入口：Web /app/[id] 详情页催更',
        ].join('\n'),
        ...common,
      }, token);
      toast({ title: '催更已提交', description: '工单已提交，请等待处理。' });
    } catch {
      toast({ title: '提交失败', description: '请稍后重试。', variant: 'destructive' });
    } finally {
      setIsSubmittingUrge(false);
    }
  }, [game, isAuthenticated, isSubmittingUrge, token, toast, user]);

  const openPrimaryAction = () => {
    if (primaryActionKind === 'app-guide') setAppGuideOpen(true);
    else setDownloadOpen(true);
  };

  const primaryButton = (className: string) => (
    <Button
      type="button"
      aria-haspopup="dialog"
      data-acbox-action={isWebGame ? 'web_game_app_guide_open' : 'game_download_open'}
      data-acbox-label={game.name}
      className={cn('h-12 rounded-full border-none bg-[#b71211] font-semibold text-white hover:bg-[#9f1110]', className)}
      onClick={openPrimaryAction}
    >
      {isWebGame ? <Smartphone className="mr-2 h-5 w-5" /> : <Download className="mr-2 h-5 w-5" />}
      {isWebGame ? '在 App 中游玩' : '立即下载'}
    </Button>
  );

  const reminderButton = (className = '') => (
    <Button
      type="button"
      data-acbox-action="game_detail_reminder_toggle"
      data-acbox-label={game.name}
      onClick={handleReminderToggle}
      className={cn(
        'h-12 shrink-0 whitespace-nowrap rounded-full border border-[#b71211] bg-transparent px-4 text-sm font-bold text-[#b71211] hover:bg-[#b71211]/8',
        isReminderEnabled && 'bg-[#b71211] text-white hover:bg-[#9f1110]',
        className,
      )}
    >
      <BellRing className="mr-1.5 h-4 w-4" />
      {isReminderEnabled ? '已提醒' : '上线提醒'}
    </Button>
  );

  return (
    <>
      <div className="fixed left-0 top-0 z-[70] flex h-16 w-full items-center justify-between bg-white/80 px-4 shadow-sm backdrop-blur-xl dark:bg-[#111824]/90 lg:hidden">
        <div className="flex items-center gap-3">
          <button
            type="button"
            aria-label="返回上一页"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5"
            onClick={() => window.history.length > 1 ? window.history.back() : window.location.assign('/app')}
          >
            <ArrowLeft className="h-5 w-5 text-[#b71211]" />
          </button>
          <p className="text-xl font-semibold tracking-tight text-[#2c2f30] dark:text-foreground">游戏详情</p>
        </div>
        <button type="button" aria-label="分享当前游戏页面" className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-black/5" onClick={() => void handleShare()}>
          <LinkIcon className="h-5 w-5 text-[#b71211]" />
        </button>
      </div>

      {!isWebGame ? (
        <div className="relative z-20 mx-4 mt-8 flex items-center justify-between gap-4 rounded-2xl border border-[#abadae]/10 bg-white/75 p-4 dark:border-border/45 dark:bg-card/70 sm:mx-6 lg:hidden">
          <div className="min-w-0"><p className="text-[10px] font-bold tracking-normal text-[#757778]">当前版本</p><p className="truncate text-sm font-bold">v {game.version || '未知'} · {formatBytes(game.file_size)}</p></div>
          <Button type="button" onClick={() => void handleUrge()} disabled={isSubmittingUrge} className="rounded-full border border-[#b71211] bg-transparent px-4 py-2 text-sm font-bold text-[#b71211] hover:bg-[#b71211]/5">
            <BellRing className="mr-1 h-4 w-4" />{isSubmittingUrge ? '提交中...' : '催更'}
          </Button>
        </div>
      ) : null}

      <div className="relative z-30 mx-auto -mt-24 hidden max-w-7xl justify-end gap-3 px-8 pb-12 lg:flex">
        {!isWebGame ? <Button type="button" onClick={() => void handleUrge()} disabled={isSubmittingUrge} className="h-12 rounded-full border border-white/70 bg-black/25 px-5 text-base font-bold text-white backdrop-blur hover:bg-black/40"><BellRing className="mr-2 h-4 w-4" />{isSubmittingUrge ? '提交中...' : '催更'}</Button> : null}
        {showPreregReminder ? reminderButton('border-white/70 bg-black/25 px-5 text-base text-white backdrop-blur hover:bg-black/40') : null}
        {primaryButton('min-w-48 px-8 text-base')}
      </div>

      <div className="fixed bottom-8 right-8 z-[60] hidden flex-col gap-3 lg:flex">
        <Button type="button" size="icon" variant="outline" aria-label="分享当前游戏页面" className="h-12 w-12 rounded-full border-[#abadae]/30 bg-white/80 shadow-sm backdrop-blur-md dark:border-border/50 dark:bg-card/90" onClick={() => void handleShare()}><LinkIcon className="h-4 w-4" /></Button>
        <Button type="button" size="icon" variant="outline" aria-label={isFavorite ? '取消收藏当前游戏' : '收藏当前游戏'} className={cn('h-12 w-12 rounded-full border-[#abadae]/30 bg-white/80 shadow-sm backdrop-blur-md dark:border-border/50 dark:bg-card/90', isFavorite && 'border-[#b71211]/30 text-[#b71211]')} onClick={handleFavoriteToggle}><Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} /></Button>
      </div>

      <div className="fixed inset-x-0 z-50 rounded-t-2xl bg-white/90 px-4 pt-3 shadow-sm backdrop-blur-2xl dark:bg-[#111824]/95 lg:hidden" style={{ bottom: 'max(env(safe-area-inset-bottom), 0px)', paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
        <div className="flex items-center gap-3">
          <Link
            href="/community"
            prefetch={false}
            aria-label="前往游戏社区"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#595c5d] hover:bg-black/5 hover:text-[#b71211]"
            onMouseEnter={() => router.prefetch('/community')}
            onFocus={() => router.prefetch('/community')}
          >
            <MessageSquare className="h-5 w-5" />
          </Link>
          <button type="button" aria-label={isFavorite ? '取消收藏当前游戏' : '收藏当前游戏'} className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#595c5d] hover:bg-black/5', isFavorite && 'text-[#b71211]')} onClick={handleFavoriteToggle}><Heart className={cn('h-5 w-5', isFavorite && 'fill-current')} /></button>
          {showPreregReminder ? reminderButton() : null}
          {primaryButton('min-w-0 flex-1 px-4 text-sm')}
        </div>
      </div>

      {downloadOpen ? <GameDownloadDialog open={downloadOpen} onOpenChange={setDownloadOpen} hideTrigger appId={game._id} pkg={game.pkg} resources={resources} downloadNotices={downloadNotices} triggerLabel="立即下载" /> : null}
      {appGuideOpen ? <AppDownloadGuideDialog open={appGuideOpen} onOpenChange={setAppGuideOpen} title="请在 AC 盒子中游玩" mobileDescription={`${game.name} 为页游，请先安装或打开 AC 盒子，在 App 内开始游玩。`} desktopDescription={`请使用手机扫码下载 AC 盒子，在 App 内搜索 ${game.name} 并开始游玩。`} mobileFeatureText="AC 盒子会在 App 内打开页游，并应用现有 WebView 加速策略。" desktopQrCaption="使用手机扫码下载 AC 盒子，安装后在 App 内开始游玩。" primaryActionLabel="前往下载 AC 盒子" /> : null}
      {authModalOpen ? <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} /> : null}
    </>
  );
}
