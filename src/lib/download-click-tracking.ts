import { trackedApiFetch } from '@/lib/api';
import { buildTrackingHeaders, getTrackingDeviceId } from '@/lib/tracking-headers';

/**
 * 下载点击上报（待决策 #65 / #118）。
 *
 * 口径：`download_click` = **客户端声明的用户点击意图**，必须带 `event_id`，
 * 服务端按 id 去重。服务端不再把「getAppDownload 被调用一次」记成点击。
 *
 * 只在用户真正发起下载动作时调用（「获取游戏」打开下载弹窗、弹窗里的渠道按钮、
 * 服务端直出直链）；`surface` 用来区分来源页。`list_card` / `search_result` 是为
 * 「列表卡直下 / 搜索落地直下」预留的来源位：当前这两处都只跳详情页，没有直下
 * 路径，所以暂无上报点，不允许为了凑指标凭空补埋点。
 *
 * `intent_stage`（待决策 #74）标出这次点击是不是终态：
 * - `open`：`detail_open`，只是打开了下载弹窗，还没下发任何地址；
 * - `terminal`：其余 surface，真正拿了一次下载地址。
 * 同一个用户的一次下载会先 open 再 terminal，统计侧只数 terminal 才不会被算成两次；
 * 老事件没有这个字段，按「未知」处理，不猜。
 *
 * `dedupe_key`（待决策 #118）= 同访客 + 同日(UTC) + 同游戏 + 同 surface 归并：
 * `event_id` 每次点击都会新生成，挡不住同一来源位的重复点击；统计脚本按
 * `dedupe_key` 想去重。`props.schema_version` 标出口径切换日，新旧事件不可比。
 *
 * 同一次终态意图的点击 / 服务端签发 / 失败回执共用这一个键（待决策 #131）：
 * `reportDownloadClick` 把本次意图的 `dedupeKey` 返回给调用方，调用方把它
 * 传给 `requestDownloadUrl`（服务端签发事件）与 `reportDownloadFailure`（失败回执），
 * 服务端用同一个键的顺序去重做签发幂等（事件表无唯一索引，并发仍可能重复），
 * 统计侧按 `props.dedupe_key` 对齐三条事件。
 *
 * 不阻塞跳转：失败静默，下载可用性永远优先。
 */

export type DownloadClickSurface =
  | 'list_card'
  | 'search_result'
  | 'detail_open'
  | 'detail_dialog'
  | 'detail_ssr';

/**
 * 口径切换日：从这一天起 `props` 带 `dedupe_key`，统计按它归并；
 * 更早的事件没有该字段，两段数字不能直接相比。
 */
export const DOWNLOAD_CLICK_SCHEMA_VERSION = '2026-11-01';

export interface DownloadClickInput {
  appId?: string | null;
  pkg?: string | null;
  channelId?: string | null;
  surface: DownloadClickSurface;
}

/** 去重键的纯函数形式：输入全部显式传入，便于单测固定访客与时间。 */
export function buildDownloadClickDedupeKey(input: {
  visitorId: string;
  occurredAt: Date;
  gameId: string;
  surface: DownloadClickSurface;
}): string {
  const day = input.occurredAt.toISOString().slice(0, 10);
  return [input.visitorId, day, String(input.gameId || '').trim(), input.surface].join('|');
}

function createEventId(): string {
  const cryptoObj = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  return `dl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 两个上报共用：keepalive + 不缓存 + 失败静默，不阻塞跳转也不排队重试。 */
function postTrackingEvent(body: Record<string, unknown>): void {
  void trackedApiFetch('/tracking/event', {
    method: 'POST',
    keepalive: true,
    cache: 'no-store',
    headers: { 'content-type': 'application/json', ...buildTrackingHeaders() },
    body: JSON.stringify(body),
  }).catch(() => {});
}

/**
 * 下载失败上报（待决策 #119）：复用既有的 `fail_reason` 事件，不新造事件名。
 *
 * `pump` 标出失败发生在哪条下载链路，`channel_*` 标出具体渠道，`reason` 是给
 * 人看的失败原因；三者齐全才能归因「是某个渠道坏了，还是整条链路挂了」。
 * `dedupe_key` 与同一次点击 / 签发相同（待决策 #131），失败回执因此能对齐到意图。
 * 与点击上报一样不阻塞用户操作、失败静默。
 */
export interface DownloadFailureInput {
  appId?: string | null;
  pkg?: string | null;
  channelId?: string | null;
  channelCode?: string | null;
  channelName?: string | null;
  /** 下载链路标识，例如 web 详情页弹窗 `web_detail_dialog`。 */
  pump: string;
  /** 链路阶段，例如 `request_download_url`。 */
  stage?: string;
  reason: string;
  reasonCode?: string | number | null;
  /** 与本次点击 / 服务端签发相同的 intent 键（待决策 #131）；老调用方可省略。 */
  dedupeKey?: string | null;
}

export const DOWNLOAD_FAILURE_EVENT = 'fail_reason';

export function reportDownloadFailure(input: DownloadFailureInput): void {
  if (typeof window === 'undefined') return;

  try {
    const body = {
      event_name: DOWNLOAD_FAILURE_EVENT,
      event_id: createEventId(),
      occurred_at: new Date().toISOString(),
      app_id: String(input.appId || '').trim() || undefined,
      pkg: String(input.pkg || '').trim() || undefined,
      channel_id: String(input.channelId || '').trim() || undefined,
      channel_code: String(input.channelCode || '').trim() || undefined,
      channel_name: String(input.channelName || '').trim() || undefined,
      props: {
        pump: input.pump,
        stage: String(input.stage || '').trim(),
        reason: String(input.reason || 'unknown').trim().slice(0, 200),
        ...(input.dedupeKey
          ? { dedupe_key: String(input.dedupeKey).trim().slice(0, 200) }
          : {}),
        ...(input.reasonCode != null && String(input.reasonCode).trim() !== ''
          ? { reason_code: String(input.reasonCode).slice(0, 40) }
          : {}),
      },
    };

    postTrackingEvent(body);
  } catch {
    // 失败上报本身失败不打扰用户。
  }
}

/**
 * 上报点击并返回本次意图的 dedupe_key：调用方把它继续传给签发请求与失败上报，
 * 三条事件就能在统计侧按同一个键对齐（待决策 #131）。
 * 浏览器环境不可用或序列化失败时返回 `null`，由调用方按「无键」继续。
 */
export function reportDownloadClick(input: DownloadClickInput): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const occurredAt = new Date();
    const gameId = String(input.appId || input.pkg || '').trim();
    const dedupeKey = buildDownloadClickDedupeKey({
      visitorId: getTrackingDeviceId(),
      occurredAt,
      gameId,
      surface: input.surface,
    });
    const body = {
      event_name: 'download_click',
      event_id: createEventId(),
      occurred_at: occurredAt.toISOString(),
      app_id: String(input.appId || '').trim() || undefined,
      pkg: String(input.pkg || '').trim() || undefined,
      channel_id: String(input.channelId || '').trim() || undefined,
      props: {
        surface: input.surface,
        intent_stage: input.surface === 'detail_open' ? 'open' : 'terminal',
        dedupe_key: dedupeKey,
        schema_version: DOWNLOAD_CLICK_SCHEMA_VERSION,
      },
    };

    // keepalive：跳转到 302 入口后请求仍然送达；失败静默，不重试、不排队。
    postTrackingEvent(body);
    return dedupeKey;
  } catch {
    // 序列化失败、隐私模式等一律静默。
    return null;
  }
}
