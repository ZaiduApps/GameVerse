import { NextResponse, type NextRequest } from 'next/server';

import { apiUrl } from '@/lib/api';
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

  if (decision.kind === 'bad_request') {
    // 纯文本、不抛栈：参数错误的正确回法是 400，而不是把异常页面给用户。
    return new NextResponse(decision.message, { status: 400, headers: NO_STORE });
  }

  // 302 绝不能被 CDN / 浏览器缓存，否则计数与换渠道都失真。
  return new NextResponse(null, {
    status: 302,
    headers: { ...NO_STORE, location: decision.location },
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
