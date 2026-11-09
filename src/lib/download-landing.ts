/**
 * 直达下载落地页（#179）的全部纯逻辑。
 *
 * 三件事都放在这里，路由与页面只做取数/渲染：
 * 1. `DOWNLOAD_LANDING_MODE` 三档开关（默认 `off`，未知值一律按 `off`）；
 * 2. `shouldShowLanding`：判断一次下载请求是不是「外部浏览器导航」，决定是否先落页；
 * 3. `resolveDownloadPagePath`：落地页路径与 `x-ac-path` 归因值；
 * 4. 落地页的资源匹配与展示口径（全部复用 #180 的 `buildGameTrustItems`）。
 *
 * 纯函数不读 env、不碰 Next Runtime，node:test 可以直接 import。
 */

import { normalizeResourceSignature } from '@/lib/game-resource-signature';
import { buildGameTrustItems, type GameTrustItem } from '@/lib/game-trust-strip';
import { isDownloadChannelId, resolveDownloadRedirectId } from '@/lib/game-download-redirect';
import { resolveGameName } from '@/lib/game-display-name';
import type { ApiDownloadResource, ApiGameDetail } from '@/types';

export type DownloadLandingMode = 'off' | 'external' | 'all';

/** 只认三个值；空值、拼错、大小写之外的一律退回最安全的 `off`。 */
export function resolveDownloadLandingMode(raw: unknown): DownloadLandingMode {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  if (value === 'external' || value === 'all') return value;
  return 'off';
}

/** NextRequest 的结构子集：测试里传普通对象即可，不依赖 Next 运行时。 */
export interface DownloadLandingRequestLike {
  headers?: { get(name: string): string | null } | null;
  url?: string | null;
}

function readHeader(request: DownloadLandingRequestLike | null | undefined, name: string): string {
  try {
    return String(request?.headers?.get(name) || '').trim();
  } catch {
    return '';
  }
}

function parseRequestUrl(request: DownloadLandingRequestLike | null | undefined): URL | null {
  const raw = String(request?.url || '').trim();
  if (!raw) return null;
  try {
    return new URL(raw);
  } catch {
    return null;
  }
}

function hasConfirmFlag(request: DownloadLandingRequestLike | null | undefined): boolean {
  return parseRequestUrl(request)?.searchParams.get('confirm') === '1';
}

/** 站内详情页的 Referer：同源且 pathname 以 `/app/` 开头。跨域 Referer 不算站内。 */
function isInternalDetailReferer(
  referer: string,
  requestUrl: URL | null,
): boolean {
  if (!referer) return false;
  try {
    const parsed = new URL(referer);
    if (requestUrl && parsed.host !== requestUrl.host) return false;
    return parsed.pathname.startsWith('/app/');
  } catch {
    return false;
  }
}

/**
 * 是否把这次下载请求先送到落地页。
 *
 * - `off`：恒 false（默认，线上行为与改动前完全一致）；
 * - `external`：只接外部浏览器导航。四条同时满足才落页：
 *   ① `Accept` 含 `text/html`；② `Sec-Fetch-Dest` 是 `document`（缺失按浏览器导航处理）；
 *   ③ Referer 不是站内详情页；④ 没有 `confirm=1`；
 * - `all`：忽略第 ③ 条（站内详情页点击也先落页），其余不变。
 *
 * `confirm=1` 恒不落页：那是落地页「继续下载」按钮发出的请求，再落回去会形成回环。
 */
export function shouldShowLanding(
  request: DownloadLandingRequestLike | null | undefined,
  mode: DownloadLandingMode,
): boolean {
  if (mode === 'off') return false;

  const accept = readHeader(request, 'accept');
  if (!/text\/html/i.test(accept)) return false;

  // 缺失按浏览器导航处理；其它值（empty / image / script / iframe）都不是顶层导航。
  const destination = readHeader(request, 'sec-fetch-dest').toLowerCase();
  if (destination && destination !== 'document') return false;

  if (hasConfirmFlag(request)) return false;

  if (
    mode === 'external' &&
    isInternalDetailReferer(readHeader(request, 'referer'), parseRequestUrl(request))
  ) {
    return false;
  }

  return true;
}

export interface DownloadLandingTarget {
  /** 307 的 Location，同时是落地页分支的 `x-ac-path`。 */
  path: string;
  /** 本次请求签发的 `x-ac-path`：从落地页点的仍是落地页，站内其余入口仍是详情页。 */
  pagePath: string;
}

/** 从落地页发出的请求（落地页 Referer 或 `confirm=1`）都按落地页归因。 */
function isFromLandingPage(
  request: DownloadLandingRequestLike | null | undefined,
  landingPath: string,
): boolean {
  if (hasConfirmFlag(request)) return true;
  const referer = readHeader(request, 'referer');
  if (!referer) return false;
  try {
    return new URL(referer).pathname === landingPath;
  } catch {
    return false;
  }
}

/**
 * 产出落地页路径与归因值。id / channelId 不合法时返回 null，路由继续走原 302 逻辑。
 *
 * id 保持入口原样（包名或 24 位 id），与详情页 `/app/[id]` 的两种形态一致；
 * 落地页拿到数据后再用真实 pkg 生成 canonical 与「继续下载」链接。
 */
export function resolveDownloadPagePath(
  id: unknown,
  channelId: unknown,
  request?: DownloadLandingRequestLike | null,
): DownloadLandingTarget | null {
  const resolvedId = resolveDownloadRedirectId(id);
  const channel = String(channelId ?? '').trim();
  if (!resolvedId || !isDownloadChannelId(channel)) return null;

  const path = `/download/${encodeURIComponent(resolvedId.value)}/${encodeURIComponent(channel)}`;
  const pagePath = isFromLandingPage(request, path)
    ? path
    : `/app/${encodeURIComponent(resolvedId.value)}`;
  return { path, pagePath };
}

function resourceChannelId(resource: ApiDownloadResource | null | undefined): string {
  return (
    String(resource?.channel?._id || '').trim() ||
    String(resource?.channel_id || '').trim()
  );
}

/**
 * 按渠道匹配资源。同一渠道存在多条时优先 `is_latest_version`，其次 `status=1`，
 * 再退到第一条——详情接口正常只会返回一条，这里只是不让脏数据把匹配变成随机。
 */
export function selectLandingResource(
  resources: ApiDownloadResource[] | null | undefined,
  channelId: unknown,
): ApiDownloadResource | null {
  const target = String(channelId ?? '').trim();
  if (!target) return null;

  const matches = (Array.isArray(resources) ? resources : []).filter(
    (resource) => resourceChannelId(resource) === target,
  );
  if (matches.length === 0) return null;

  return (
    matches.find((resource) => resource?.is_latest_version === true) ||
    matches.find((resource) => Number(resource?.status ?? 1) === 1) ||
    matches[0]
  );
}

export interface DownloadLandingTroubleshootingLink {
  label: string;
  href: string;
}

/**
 * 用户自选的五类排障入口（Web 无法自动识别设备侧安装失败，不做「智能判断」）。
 * 网络中断没有独立章节，落到覆盖「下载失败」的解析包错误一节。
 */
export function buildInstallTroubleshootingLinks(): DownloadLandingTroubleshootingLink[] {
  return [
    { label: '网络中断 / 下载失败', href: '/help/install#parse_error' },
    { label: '存储空间不足', href: '/help/install#storage_full' },
    { label: '安装包损坏 / 签名冲突', href: '/help/install#install_failed' },
    { label: '安装权限被拒', href: '/help/install#permission' },
    { label: '其它问题', href: '/submit-resource' },
  ];
}

export interface DownloadLandingView {
  gameName: string;
  icon: string;
  pkg: string;
  channelId: string;
  channelName: string;
  version: string;
  sizeText: string;
  updatedText: string;
  sourceLabel: string;
  /** 当前渠道的 SHA-256 前 12 位；没有合法校验值时为空串。 */
  signatureShort: string;
  /** 完整校验值，供复制/比对；没有时为空串。 */
  signature: string;
  trustItems: GameTrustItem[];
  canonicalPath: string;
  detailHref: string;
  continueHref: string;
  troubleshooting: DownloadLandingTroubleshootingLink[];
}

export interface DownloadLandingViewInput {
  app: ApiGameDetail | null | undefined;
  resources?: ApiDownloadResource[] | null;
  channelId: unknown;
  /** URL 里的原始标识（包名或 24 位 id），app.pkg 缺失时用它兜底。 */
  fallbackId?: string | null;
}

/**
 * 落地页视图模型。渠道匹配不到返回 null，由页面渲染「该渠道暂不可用」而不是空壳。
 *
 * 版本/包大小优先取渠道资源本身，再回落到应用级字段；日期/来源/校验值口径全部
 * 交给 `buildGameTrustItems`，页面不再另算一套。
 */
export function buildDownloadLandingView(
  input: DownloadLandingViewInput,
): DownloadLandingView | null {
  const app = input.app;
  if (!app) return null;

  const resource = selectLandingResource(input.resources, input.channelId);
  if (!resource) return null;

  const pkg = String(app.pkg || input.fallbackId || '').trim();
  const channelId = String(input.channelId ?? '').trim();
  if (!pkg || !isDownloadChannelId(channelId)) return null;

  const resources = Array.isArray(input.resources) ? input.resources : [];
  const resourceSize =
    typeof resource.size === 'number' && Number.isFinite(resource.size) && resource.size > 0
      ? resource.size
      : app.file_size;

  const trustItems = buildGameTrustItems({
    version: resource.version || app.version,
    fileSize: resourceSize,
    updatedAt: app.latest_at,
    sourceType: app.source_type,
    resources,
  });
  // 展示口径与 #180 完全一致：buildGameTrustItems 已过滤 VARY 等占位版本，缺项直接为空。
  const trustValue = (key: GameTrustItem['key']) =>
    trustItems.find((item) => item.key === key)?.value || '';

  const signature = normalizeResourceSignature(resource.signature);
  const canonicalPath = `/app/${encodeURIComponent(pkg)}`;

  return {
    gameName: resolveGameName(app) || pkg,
    icon: String(app.icon || '').trim(),
    pkg,
    channelId,
    channelName: String(resource.channel?.name || '').trim(),
    version: trustValue('version'),
    sizeText: trustValue('size'),
    updatedText: trustValue('updated'),
    sourceLabel: trustValue('source'),
    signatureShort: signature ? signature.slice(0, 12) : '',
    signature,
    trustItems,
    canonicalPath,
    detailHref: canonicalPath,
    continueHref: `${canonicalPath}/download/${encodeURIComponent(channelId)}?confirm=1`,
    troubleshooting: buildInstallTroubleshootingLinks(),
  };
}

export interface DownloadLandingMetadataInput {
  /** 用于拼 canonical 的包名（或入口原始标识）。 */
  pkg?: unknown;
  gameName?: unknown;
  channelName?: unknown;
}

/**
 * 落地页 metadata：转化页不是 SEO 页，恒 `noindex, follow`，canonical 指回详情页。
 */
export function buildDownloadLandingMetadata(input: DownloadLandingMetadataInput = {}) {
  const pkg = String(input.pkg || '').trim();
  const gameName = String(input.gameName || '').trim();
  const channelName = String(input.channelName || '').trim();
  const suffix = channelName ? `（${channelName}）` : '';

  return {
    title: gameName ? `${gameName} 下载${suffix}` : '游戏下载',
    description: '确认版本、包大小与校验值后继续下载；旧链接与站内下载入口行为不变。',
    alternates: { canonical: pkg ? `/app/${encodeURIComponent(pkg)}` : '/app' },
    robots: { index: false, follow: true } as const,
  };
}
