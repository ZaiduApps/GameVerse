import { NextResponse, type NextRequest } from 'next/server';

import { apiUrl } from '@/lib/api';
import {
  describeDownloadErrorPage,
  renderDownloadErrorPage,
} from '@/lib/download-error-page';
import {
  decideDownloadRedirect,
  type DownloadIssueResult,
} from '@/lib/game-download-redirect';

/**
 * 下载 302 入口：`/app/[id]/download/[channelId]`。
 *
 * 服务端调 interface 的 `POST /game/getAppDownload` 拿真实地址后 302 过去；
 * 计数（download_url_issued / download_count）仍由 interface 在同一个 POST 里完成。
 * 这样详情页的下载链接在禁用 JS 的 HTML 里也能点，爬虫也能跟到真实文件。
 *
 * 不新增 interface 路由是有意为之：新增路由要重导 OpenAPI 契约，而本机跑不起
 * `contract:export`（需要 API + Mongo），生成物又不许手改。
 */

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const DOWNLOAD_API_TIMEOUT_MS = 5000;
const VISITOR_UA_MAX_LENGTH = 256;
const NO_STORE = { 'cache-control': 'no-store' } as const;
/**
 * 下载中转端点不进索引（待决策 #74）：它 302 到网盘/CDN，目标文件死了就是
 * 一条死链，被收录只会给 Bing 的 Crawl Errors 添数。`follow` 保留，
 * 让已经抓到的页面还能顺着回到游戏页。
 */
const NO_INDEX = { 'x-robots-tag': 'noindex, follow' } as const;

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string; channelId: string }> },
) {
  const params = await context.params;
  const requestId =
    String(request.headers.get('x-request-id') || '').trim() ||
    `dl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  const decision = await decideDownloadRedirect({
    id: params?.id,
    channelId: params?.channelId,
    requestIssuedUrl: (body) => requestIssuedDownloadUrl(body, request, requestId),
  });

  if (decision.kind === 'error_page') {
    // 显式错误页，不是裸 400/404 纯文本：说明原因 + 给出口 + noindex。
    const copy = describeDownloadErrorPage(decision.failure);
    console.error('[download-redirect] explicit error page', {
      request_id: requestId,
      status: copy.status,
      failure: decision.failure,
      app_id: String(params?.id || '').slice(0, 160),
      channel_id: String(params?.channelId || '').slice(0, 64),
    });
    return new NextResponse(
      renderDownloadErrorPage({
        status: copy.status,
        title: copy.title,
        message: copy.message,
        // 游戏不存在时不给「返回游戏页」：那里只会二次 404。
        appId: decision.failure === 'app_missing' ? undefined : params?.id,
        requestId,
      }),
      {
        status: copy.status,
        headers: {
          ...NO_STORE,
          ...NO_INDEX,
          'content-type': 'text/html; charset=utf-8',
        },
      },
    );
  }

  // 302 绝不能被 CDN / 浏览器缓存，否则计数与换渠道都失真。
  return new NextResponse(null, {
    status: 302,
    headers: { ...NO_STORE, ...NO_INDEX, location: decision.location },
  });
}

async function requestIssuedDownloadUrl(
  body: Record<string, string>,
  request: NextRequest,
  requestId: string,
): Promise<DownloadIssueResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DOWNLOAD_API_TIMEOUT_MS);

  try {
    const response = await fetch(apiUrl('/game/getAppDownload'), {
      method: 'POST',
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'content-type': 'application/json',
        // 来源位：区分「服务端直出」与弹窗/原生 App，统计上必须能拆开。
        'x-ac-surface': 'detail_ssr',
        // 真实访客 UA 转发给 interface：本请求的 UA 是 Next 的 fetch，不能用来判机器人。
        'x-ac-visitor-ua': resolveVisitorUserAgent(request),
        'x-request-id': requestId,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error('[download-redirect] interface responded with error', {
        request_id: requestId,
        status: response.status,
        channel_id: body.channel_id,
      });
      return { ok: false };
    }

    return { ok: true, payload: await response.json() };
  } catch (error) {
    console.error('[download-redirect] interface request failed', {
      request_id: requestId,
      channel_id: body.channel_id,
      aborted: controller.signal.aborted,
      error: error instanceof Error ? error.message : String(error),
    });
    return { ok: false };
  } finally {
    clearTimeout(timer);
  }
}

function resolveVisitorUserAgent(request: NextRequest): string {
  return String(request.headers.get('user-agent') || '')
    .trim()
    .slice(0, VISITOR_UA_MAX_LENGTH);
}
