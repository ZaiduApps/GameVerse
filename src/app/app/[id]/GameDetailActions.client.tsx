'use client';

// 详情页操作区（视觉稿：PC 信息卡右侧 CTA 组 + 移动端浮动顶栏与底部操作栏）。
// 三块 UI 必须共享同一份收藏 / 上线提醒 / 下载弹窗状态，因此放在同一个客户端组件里：
// 1) PC：外层用 hidden lg:flex 控制的主下载按钮 + 次级操作（订阅动态 / 催更新 / 分享 / 收藏）；
// 2) 移动端：顶部浮动玻璃导航（滚动 120px 后变白）+ 底部悬浮操作栏（想玩 / 论坛 / 催更 / 订阅动态 + 主下载）；
// 3) 重型弹窗只在交互后挂载，避免首屏加载与详情无关的代码。

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BellPlus, BookmarkPlus, Download, Heart, MessageSquare, RefreshCw, Share2, Smartphone } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/auth-context';
import { useToast } from '@/hooks/use-toast';
import { buildFeedbackCommonFields, submitFeedbackTicket } from '@/lib/feedback';
import { getGamePrimaryActionKind, isWebGameType } from '@/lib/game-resource-type';
import { cn } from '@/lib/utils';
import type { ApiDownloadResource, ApiGameDetail, CardConfigItem } from '@/types';

import { buildPrimaryActionMeta } from './game-detail-stitch-mapper';

const AuthModal = dynamic(() => import('@/components/auth/auth-modal'), { ssr: false });
const AppDownloadGuideDialog = dynamic(() => import('@/components/app-download-guide-dialog'), { ssr: false });
const GameDownloadDialog = dynamic(() => import('@/components/game-download-dialog'), { ssr: false });

// 移动端顶部栏滚动超过该距离后，从透明玻璃切换为实心导航。
const HEADER_SOLID_OFFSET = 120;

// PC 次级操作按钮的统一外观。
const secondaryButtonClass =
  'inline-flex h-10 items-center justify-center gap-1 rounded-xl border border-[#abadae]/20 bg-[#eff1f2] px-3 text-xs font-medium text-[#2c2f30] transition-colors [@media(hover:hover)]:hover:bg-[#e6e8ea] dark:border-border/45 dark:bg-muted/60 dark:text-foreground dark:[@media(hover:hover)]:hover:bg-muted';

export type GameDetailActionGame = Pick<ApiGameDetail, '_id' | 'pkg' | 'name' | 'version' | 'type' | 'file_size'>;

export interface GameDetailActionsInput {
  game: GameDetailActionGame;
  resources: ApiDownloadResource[];
  downloadNotices: CardConfigItem[];
  showPreregReminder: boolean;
}

export default function GameDetailActions({
  game,
  resources,
  downloadNotices,
  showPreregReminder,
}: GameDetailActionsInput) {
  const { isAuthenticated, token, user } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReminderEnabled, setIsReminderEnabled] = useState(false);
  const [isSubmittingUrge, setIsSubmittingUrge] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [appGuideOpen, setAppGuideOpen] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const [isHeaderSolid, setIsHeaderSolid] = useState(false);
  const isWebGame = isWebGameType(game.type);
  const primaryActionKind = getGamePrimaryActionKind(game.type);

  // 上线提醒状态按游戏维度存在本地，刷新后仍保持。
  useEffect(() => {
    const reminderKey = game._id || game.pkg;
    if (!reminderKey) return;
    try {
      setIsReminderEnabled(window.localStorage.getItem('game-remind:' + reminderKey) === '1');
    } catch {
      setIsReminderEnabled(false);
    }
  }, [game._id, game.pkg]);

  // 移动端顶栏：滚过封面后切换为实心导航。
  useEffect(() => {
    const onScroll = () => setIsHeaderSolid(window.scrollY > HEADER_SOLID_OFFSET);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: game.name + ' - ACBOX', url: window.location.href });
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
        window.localStorage.setItem('game-remind:' + reminderKey, next ? '1' : '0');
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
      await submitFeedbackTicket(
        {
          type: 'missing',
          title: '求添加资源反馈',
          description: [
            '缺少资源：' + game.name,
            '游戏包名：' + (game.pkg || '未提供'),
            '当前版本：' + (game.version || '未提供'),
            '提交用户：' + (common.nickname || '游客'),
            '联系方式：' + (common.contact || '未提供'),
            '提交入口：Web /app/[id] 详情页催更',
          ].join('\n'),
          ...common,
        },
        token,
      );
      toast({ title: '催更已提交', description: '工单已提交，请等待处理。' });
    } catch {
      toast({ title: '提交失败', description: '请稍后重试。', variant: 'destructive' });
    } finally {
      setIsSubmittingUrge(false);
    }
  }, [game, isAuthenticated, isSubmittingUrge, token, toast, user]);

  const openPrimaryAction = useCallback(() => {
    if (primaryActionKind === 'app-guide') setAppGuideOpen(true);
    else setDownloadOpen(true);
  }, [primaryActionKind]);

  const primaryActionLabel = isWebGame ? '前往 AC 盒子游玩' : '立即高速下载';
  const primaryActionMeta = buildPrimaryActionMeta(game);
  const reminderLabel = isReminderEnabled ? '已提醒' : '上线提醒';

  const floatingIconClass = cn(
    'flex h-8 w-8 items-center justify-center rounded-full transition-colors',
    isHeaderSolid
      ? 'bg-[#eff1f2] text-[#2c2f30] dark:bg-muted/70 dark:text-foreground'
      : 'bg-black/30 text-white backdrop-blur-sm',
  );

  return (
    <>
      {/* PC：Hero 信息卡右侧主操作区。视觉稿只画了三个次级按钮，这里额外保留收藏方形按钮，避免 PC 端丢失既有收藏入口。 */}
      <div className="hidden w-full shrink-0 flex-col gap-2.5 lg:flex lg:w-72">
        <button
          type="button"
          aria-haspopup="dialog"
          data-acbox-action={isWebGame ? 'web_game_app_guide_open' : 'game_download_open'}
          data-acbox-label={game.name}
          onClick={openPrimaryAction}
          className="group flex h-14 w-full items-center justify-between rounded-xl bg-primary px-5 text-white shadow-sm transition-colors [@media(hover:hover)]:hover:bg-primary/90"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/20">
              {isWebGame ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            </span>
            <span className="text-left">
              <span className="block text-sm font-bold leading-tight">{primaryActionLabel}</span>
              <span className="block text-[11px] font-normal text-white/85">{primaryActionMeta}</span>
            </span>
          </span>
          <ArrowRight className="h-[18px] w-[18px] text-white/85 transition-transform group-hover:translate-x-1" />
        </button>

        <div className="flex items-center gap-2">
          {isWebGame ? null : (
            <button type="button" onClick={() => void handleUrge()} disabled={isSubmittingUrge} className={cn(secondaryButtonClass, 'flex-1')}>
              <RefreshCw className="h-4 w-4 text-[#757778]" />
              {isSubmittingUrge ? '提交中…' : '催更新'}
            </button>
          )}
          {showPreregReminder ? (
            <button
              type="button"
              onClick={handleReminderToggle}
              className={cn(secondaryButtonClass, 'flex-1', isReminderEnabled && 'border-primary/40 bg-primary/10 text-primary')}
            >
              <BookmarkPlus className="h-4 w-4" />
              {isReminderEnabled ? '已订阅' : '订阅动态'}
            </button>
          ) : null}
          <button
            type="button"
            title="分享此游戏"
            aria-label="分享当前游戏页面"
            onClick={() => void handleShare()}
            className={cn(secondaryButtonClass, 'w-10 px-0')}
          >
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            title={isFavorite ? '取消收藏' : '收藏此游戏'}
            aria-label={isFavorite ? '取消收藏当前游戏' : '收藏当前游戏'}
            aria-pressed={isFavorite}
            onClick={handleFavoriteToggle}
            className={cn(secondaryButtonClass, 'w-10 px-0', isFavorite && 'border-primary/40 bg-primary/10 text-primary')}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </button>
        </div>
      </div>

      {/* 移动端：顶部浮动导航，初始透明叠在封面上，滚动后变白并显示游戏名。 */}
      <header
        className={cn(
          'fixed inset-x-0 top-0 z-[70] flex h-14 items-center justify-between px-3 transition-colors duration-300 lg:hidden',
          isHeaderSolid
            ? 'border-b border-[#abadae]/20 bg-white/85 backdrop-blur-md dark:border-border/45 dark:bg-[#111824]/90'
            : 'bg-transparent',
        )}
      >
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            aria-label="返回上一页"
            className={floatingIconClass}
            onClick={() => (window.history.length > 1 ? window.history.back() : window.location.assign('/app'))}
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <span
            className={cn(
              'truncate text-sm font-semibold transition-opacity duration-300',
              isHeaderSolid ? 'text-[#2c2f30] opacity-100 dark:text-foreground' : 'max-w-[170px] text-white/90 opacity-0',
            )}
          >
            {game.name}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" aria-label="分享当前游戏页面" className={floatingIconClass} onClick={() => void handleShare()}>
            <Share2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label={isFavorite ? '取消收藏当前游戏' : '收藏当前游戏'}
            aria-pressed={isFavorite}
            className={cn(floatingIconClass, isFavorite && 'text-tone-red')}
            onClick={handleFavoriteToggle}
          >
            <Heart className={cn('h-4 w-4', isFavorite && 'fill-current')} />
          </button>
        </div>
      </header>

      {/* 移动端：底部悬浮操作栏。 */}
      <div
        className="fixed inset-x-0 bottom-0 z-50 border-t border-[#abadae]/20 bg-white/95 px-4 pt-2.5 backdrop-blur-lg dark:border-border/45 dark:bg-[#111824]/95 lg:hidden"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.625rem)' }}
      >
        <div className="mx-auto flex max-w-md items-center gap-2.5">
          <button
            type="button"
            aria-label={isFavorite ? '取消收藏当前游戏' : '收藏当前游戏'}
            aria-pressed={isFavorite}
            onClick={handleFavoriteToggle}
            className="flex flex-col items-center justify-center gap-0.5 px-1 text-[#595c5d] dark:text-muted-foreground"
          >
            <Heart className={cn('h-5 w-5', isFavorite && 'fill-current text-tone-red')} />
            <span className="text-[10px]">想玩</span>
          </button>
          <Link
            href="/community"
            prefetch={false}
            aria-label="前往游戏社区"
            onMouseEnter={() => router.prefetch('/community')}
            onFocus={() => router.prefetch('/community')}
            className="flex flex-col items-center justify-center gap-0.5 px-1 text-[#595c5d] dark:text-muted-foreground"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-[10px]">论坛</span>
          </Link>
          {isWebGame ? null : (
            <button
              type="button"
              aria-label="提交催更请求"
              disabled={isSubmittingUrge}
              onClick={() => void handleUrge()}
              className="flex flex-col items-center justify-center gap-0.5 px-1 text-[#595c5d] dark:text-muted-foreground"
            >
              <RefreshCw className="h-5 w-5" />
              <span className="text-[10px]">{isSubmittingUrge ? '提交中' : '催更'}</span>
            </button>
          )}
          {showPreregReminder ? (
            <button
              type="button"
              aria-label="切换上线提醒"
              aria-pressed={isReminderEnabled}
              onClick={handleReminderToggle}
              className={cn('flex flex-col items-center justify-center gap-0.5 px-1 text-[#595c5d] dark:text-muted-foreground', isReminderEnabled && 'text-primary')}
            >
              <BellPlus className={cn('h-5 w-5', isReminderEnabled && 'fill-current')} />
              <span className="text-[10px]">{reminderLabel}</span>
            </button>
          ) : null}
          <button
            type="button"
            aria-haspopup="dialog"
            data-acbox-action={isWebGame ? 'web_game_app_guide_open' : 'game_download_open'}
            data-acbox-label={game.name}
            onClick={openPrimaryAction}
            className="flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-white shadow-sm transition-colors [@media(hover:hover)]:hover:bg-primary/90 active:bg-primary/90"
          >
            {isWebGame ? <Smartphone className="h-5 w-5" /> : <Download className="h-5 w-5" />}
            <span className="truncate">
              {isWebGame ? '在 AC 盒子中游玩' : '立即下载' + (game.file_size ? ' ' + formatSizeLabel(game.file_size) : '')}
            </span>
          </button>
        </div>
      </div>

      {downloadOpen ? <GameDownloadDialog
        open={downloadOpen}
        onOpenChange={setDownloadOpen}
        hideTrigger
        appId={game._id}
        pkg={game.pkg}
        resources={resources}
        downloadNotices={downloadNotices}
        triggerLabel="立即下载"
      /> : null}
      {appGuideOpen ? (
        <AppDownloadGuideDialog
          open={appGuideOpen}
          onOpenChange={setAppGuideOpen}
          title="请在 AC 盒子中游玩"
          mobileDescription={game.name + ' 为页游，请先安装或打开 AC 盒子，在 App 内开始游玩。'}
          desktopDescription={'请使用手机扫码下载 AC 盒子，在 App 内搜索 ' + game.name + ' 并开始游玩。'}
          mobileFeatureText="AC 盒子会在 App 内打开页游，并应用现有 WebView 加速策略。"
          desktopQrCaption="使用手机扫码下载 AC 盒子，安装后在 App 内开始游玩。"
          primaryActionLabel="前往下载 AC 盒子"
        />
      ) : null}
      {authModalOpen ? <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} /> : null}
    </>
  );
}

// 底部主按钮上的包体大小展示，统一用 MB 口径，避免长小数挤压按钮宽度。
function formatSizeLabel(size?: number | null): string {
  if (!size || size <= 0) return '';
  const mb = size / 1024 / 1024;
  if (mb >= 1024) return (mb / 1024).toFixed(1) + ' GB';
  return (mb >= 10 ? mb.toFixed(0) : mb.toFixed(1)) + ' MB';
}
