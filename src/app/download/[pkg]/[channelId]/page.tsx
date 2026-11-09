import { cache } from 'react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertTriangle, ArrowRight, Download, LifeBuoy } from 'lucide-react';

import GameTrustStrip from '@/components/game-detail/GameTrustStrip';
import { trackedApiFetch } from '@/lib/api';
import {
  buildDownloadLandingMetadata,
  buildDownloadLandingView,
  type DownloadLandingView,
} from '@/lib/download-landing';
import { isDownloadChannelId, resolveDownloadRedirectId } from '@/lib/game-download-redirect';
import { classifyGameDetailPayload } from '@/lib/game-detail-resilience';
import { resolveGameName } from '@/lib/game-display-name';
import { getPreviewImageUrl } from '@/lib/image-preview';
import type { ApiDownloadResource, ApiGameDetail } from '@/types';

/**
 * 直达下载落地页（#179）：`/download/[pkg]/[channelId]`。
 *
 * 外部浏览器从 302 入口被分流到这里，先看版本/包大小/更新日/来源/校验值，
 * 再点「继续下载」走原 `/app/{pkg}/download/{channelId}?confirm=1`（计数与签发不变）。
 *
 * 这是转化页不是 SEO 页：恒 noindex，canonical 指回详情页，不进 sitemap。
 * 渠道匹配不到、上游故障都渲染带出口的提示页，不抛 500，也不渲染空壳。
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const LANDING_API_TIMEOUT_MS = 8000;

type LandingData =
  | { status: 'ok'; app: ApiGameDetail; resources: ApiDownloadResource[] }
  | { status: 'missing' }
  | { status: 'unavailable' };

const loadLandingData = cache(async (id: string): Promise<LandingData> => {
  try {
    const response = await trackedApiFetch(
      `/game/details?param=${encodeURIComponent(id)}`,
      {
        cache: 'no-store',
        timeoutMs: LANDING_API_TIMEOUT_MS,
        logKey: 'download-landing',
      },
    );
    if (!response.ok) {
      if (response.status === 404) return { status: 'missing' };
      console.error('[download-landing] details responded with error', {
        param: id,
        status: response.status,
      });
      return { status: 'unavailable' };
    }

    const parsed = classifyGameDetailPayload(await response.json());
    if (parsed.kind === 'ok') {
      return {
        status: 'ok',
        app: parsed.data.app,
        resources: Array.isArray(parsed.data.resources) ? parsed.data.resources : [],
      };
    }
    if (parsed.kind === 'missing') return { status: 'missing' };
    console.error('[download-landing] details payload unusable', {
      param: id,
      reason: parsed.reason,
      message: parsed.message,
    });
    return { status: 'unavailable' };
  } catch (error) {
    console.error('[download-landing] details request failed', {
      param: id,
      error: error instanceof Error ? error.message : String(error),
    });
    return { status: 'unavailable' };
  }
});

function detailPathFor(pkg: string | null | undefined, fallbackId: string): string {
  return `/app/${encodeURIComponent(String(pkg || fallbackId || '').trim())}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ pkg: string; channelId: string }>;
}): Promise<Metadata> {
  const { pkg, channelId } = await params;
  const data = await loadLandingData(pkg);
  const app = data.status === 'ok' ? data.app : null;
  const view = app
    ? buildDownloadLandingView({
        app,
        resources: data.status === 'ok' ? data.resources : [],
        channelId,
        fallbackId: pkg,
      })
    : null;

  return buildDownloadLandingMetadata({
    pkg: app?.pkg || pkg,
    gameName: app ? resolveGameName(app) : '',
    channelName: view?.channelName || '',
  });
}

function LandingFallback({
  title,
  message,
  detailHref,
}: {
  title: string;
  message: string;
  detailHref?: string;
}) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-12">
      <div className="rounded-2xl border border-border/60 bg-card p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-tone-amber" aria-hidden />
          <div className="min-w-0">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
            <div className="mt-4 flex flex-wrap gap-3 text-sm">
              {detailHref ? (
                <Link
                  href={detailHref}
                  className="inline-flex items-center gap-1 font-semibold text-primary underline decoration-dotted underline-offset-2"
                >
                  返回游戏详情
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
              ) : null}
              <Link
                href="/help/install"
                className="inline-flex items-center gap-1 font-semibold text-primary underline decoration-dotted underline-offset-2"
              >
                查看安装排障
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LandingReady({ view }: { view: DownloadLandingView }) {
  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-border/60 bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted">
            {view.icon ? (
              <Image
                src={getPreviewImageUrl(view.icon, 160)}
                alt={`${view.gameName} 图标`}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground" title={view.gameName}>
              {view.gameName}
            </h1>
            {view.channelName ? (
              <p className="mt-1 text-sm text-muted-foreground">下载渠道：{view.channelName}</p>
            ) : null}
            <p className="mt-1 break-all text-xs text-muted-foreground">包名：{view.pkg}</p>
          </div>
        </div>

        <GameTrustStrip items={view.trustItems} className="mt-5" />

        {view.signatureShort ? (
          <p className="mt-3 break-all text-xs text-muted-foreground">
            SHA-256：<code className="font-mono text-foreground">{view.signatureShort}</code>
            <span className="ml-1">（前 12 位）</span>
          </p>
        ) : null}

        <a
          href={view.continueHref}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          data-acbox-action="download_landing_continue"
        >
          <Download className="h-4 w-4" aria-hidden />
          继续下载
        </a>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          点击后会跳转到渠道资源地址；下载与安装由设备与渠道完成。
        </p>

        <details className="mt-6 rounded-xl border border-border/60 bg-muted/40 p-4">
          <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-foreground">
            <LifeBuoy className="h-4 w-4 text-tone-blue" aria-hidden />
            下载/安装遇到问题？
          </summary>
          <ul className="mt-3 grid gap-2 text-sm">
            {view.troubleshooting.map((item) => (
              <li key={item.href + item.label}>
                <Link
                  href={item.href}
                  className="text-primary underline decoration-dotted underline-offset-2"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </details>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          <Link href={view.detailHref} className="underline decoration-dotted underline-offset-2">
            返回游戏详情
          </Link>
        </p>
      </div>
    </section>
  );
}

export default async function DownloadLandingPage({
  params,
}: {
  params: Promise<{ pkg: string; channelId: string }>;
}) {
  const { pkg, channelId } = await params;

  // 与 302 入口同一套格式校验；非法路径直接 404，不查上游。
  if (!resolveDownloadRedirectId(pkg) || !isDownloadChannelId(channelId)) {
    notFound();
  }

  const data = await loadLandingData(pkg);
  if (data.status === 'missing') {
    return (
      <LandingFallback
        title="游戏不存在或已下线"
        message="这个下载链接对应的游戏已经不在目录里，请回到游戏库重新查找。"
      />
    );
  }
  if (data.status === 'unavailable') {
    return (
      <LandingFallback
        title="暂时无法获取下载信息"
        message="下载信息暂时取不到，请稍后重试；你也可以直接回到游戏详情页重新下载。"
        detailHref={detailPathFor(null, pkg)}
      />
    );
  }

  const view = buildDownloadLandingView({
    app: data.app,
    resources: data.resources,
    channelId,
    fallbackId: pkg,
  });
  if (!view) {
    return (
      <LandingFallback
        title="该渠道暂不可用"
        message="这个下载渠道当前没有可用资源，请回到游戏详情页选择其它渠道或版本。"
        detailHref={detailPathFor(data.app.pkg, pkg)}
      />
    );
  }

  return <LandingReady view={view} />;
}
