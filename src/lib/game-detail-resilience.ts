/**
 * 详情页接口故障降级。
 *
 * 目标是把「游戏真的不存在」和「上游暂时坏了」分开：
 * - `missing`：上游明确说「不存在」→ 上层继续 404；
 * - `ok`：拿到完整数据，顺手落一份最近成功快照；
 * - `degraded`：超时/连接失败/非 2xx/解析失败/业务码异常 → 有快照就渲染快照并在页面顶部
 *   标注「数据更新中」，没有快照就抛错走 5xx（不伪装成 404）。
 *
 * 快照只存成功拿到的游戏数据（`/game/details` 的 `data`，或它超集形态的 SEO 快照），
 * 带 `savedAt`，不存 404 结果。
 * 内存一层（LRU 上限 200）+ 文件一层（pkg 粒度，原子写 tmp+rename，默认最多 500 个、
 * 保留 7 天），写失败只告警，不影响正常渲染。
 */
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { GameDetailData } from '@/types';

/** `/game/details` 的超时；沿用改动前的 12000ms。SEO 快照的 8s 超时不在这里。 */
export const DETAIL_API_TIMEOUT_MS = 12000;
export const SNAPSHOT_MEMORY_LIMIT = 200;
export const SNAPSHOT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEFAULT_SNAPSHOT_FILE_LIMIT = 500;
const PRUNE_INTERVAL_MS = 10 * 60 * 1000;
const SNAPSHOT_LOG_PREFIX = '[game-detail]';

export type GameDetailFailureReason =
  | 'timeout'
  | 'connect'
  | 'status'
  | 'parse'
  | 'code'
  | 'other';

export type GameDetailPayloadClassification =
  | { kind: 'ok'; data: GameDetailData }
  | { kind: 'missing' }
  | { kind: 'degraded'; reason: GameDetailFailureReason; message?: string };

export type GameDetailLoadResult =
  | { result: 'ok'; data: GameDetailData }
  | { result: 'missing' }
  | {
      result: 'degraded';
      reason: GameDetailFailureReason;
      message?: string;
      data: GameDetailData | null;
      savedAt: string | null;
    };

type SnapshotRecord = {
  pkg: string;
  savedAt: string;
  data: GameDetailData;
};

type SnapshotEntry = {
  savedAtMs: number;
  savedAt: string;
  data: GameDetailData;
};

export type GameDetailSnapshot = {
  data: GameDetailData;
  savedAt: string;
  ageMs: number;
};

/** 内存快照：Map 的插入顺序即 LRU 顺序，命中时删了再插回去。 */
const memorySnapshots = new Map<string, SnapshotEntry>();
let lastPruneAt = 0;

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function errorName(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  return 'name' in error ? String((error as { name?: unknown }).name || '') : '';
}

function errorCode(error: unknown): string {
  if (!error || typeof error !== 'object') return '';
  const direct = (error as { code?: unknown }).code;
  if (direct) return String(direct).toUpperCase();
  const cause = (error as { cause?: unknown }).cause;
  if (cause && typeof cause === 'object') {
    const causeCode = (cause as { code?: unknown }).code;
    if (causeCode) return String(causeCode).toUpperCase();
  }
  return '';
}

/** 网络/超时类异常归到 `timeout` / `connect`，其余交给 `other`，避免把未知错误硬说成超时。 */
export function classifyGameDetailError(error: unknown): GameDetailFailureReason {
  const name = errorName(error);
  if (name === 'AbortError' || name === 'TimeoutError') return 'timeout';

  const code = errorCode(error);
  if (['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENETUNREACH', 'UND_ERR_CONNECT_TIMEOUT', 'UND_ERR_SOCKET'].includes(code)) {
    return code === 'ETIMEDOUT' || code === 'UND_ERR_CONNECT_TIMEOUT' ? 'timeout' : 'connect';
  }

  const message = errorMessage(error);
  if (/timed? ?out|timeout/i.test(message)) return 'timeout';
  if (/fetch failed|socket hang up|ECONNREFUSED|ECONNRESET|ENOTFOUND|EAI_AGAIN/i.test(message)) {
    return 'connect';
  }
  if (error instanceof SyntaxError || /unexpected token|json/i.test(message)) return 'parse';
  return 'other';
}

/** 上游业务码判定：`code === 0` 且带 `app` 才算成功；message 含「不存在」才是真 404。 */
export function classifyGameDetailPayload(payload: unknown): GameDetailPayloadClassification {
  if (!payload || typeof payload !== 'object') {
    return { kind: 'degraded', reason: 'parse', message: 'empty payload' };
  }

  const record = payload as { code?: unknown; message?: unknown; data?: unknown };
  const code = record.code;
  if (code !== undefined && code !== 0 && code !== '0') {
    const message = String(record.message || '').trim() || 'unknown';
    if (message.includes('不存在')) return { kind: 'missing' };
    return { kind: 'degraded', reason: 'code', message: `code=${String(code)} message=${message}` };
  }

  const data = record.data as GameDetailData | undefined;
  if (!data || typeof data !== 'object' || !data.app) {
    return { kind: 'degraded', reason: 'parse', message: 'payload.data.app missing' };
  }
  return { kind: 'ok', data };
}

/** 文件快照最多保留多少个 pkg（默认 500，可用 `GAME_DETAIL_SNAPSHOT_LIMIT` 覆盖）。 */
export function resolveSnapshotFileLimit(): number {
  const configured = Number.parseInt(String(process.env.GAME_DETAIL_SNAPSHOT_LIMIT || ''), 10);
  return Number.isFinite(configured) && configured > 0 ? configured : DEFAULT_SNAPSHOT_FILE_LIMIT;
}

export function resolveSnapshotDir(): string {
  const configured = String(process.env.GAME_DETAIL_SNAPSHOT_DIR || '').trim();
  if (configured) return configured;
  return path.join(process.cwd(), '.cache', 'game-detail-fallback');
}

function snapshotFilePath(pkg: string): string {
  const safeName = String(pkg || '').trim().replace(/[^A-Za-z0-9._-]/g, '_') || 'unknown';
  return path.join(resolveSnapshotDir(), `${safeName}.json`);
}

function touchMemory(pkg: string, entry: SnapshotEntry) {
  memorySnapshots.delete(pkg);
  memorySnapshots.set(pkg, entry);
  while (memorySnapshots.size > SNAPSHOT_MEMORY_LIMIT) {
    const oldestKey = memorySnapshots.keys().next().value;
    if (oldestKey === undefined) break;
    memorySnapshots.delete(oldestKey);
  }
}

function isExpired(savedAtMs: number, nowMs: number): boolean {
  return !Number.isFinite(savedAtMs) || nowMs - savedAtMs > SNAPSHOT_TTL_MS || savedAtMs > nowMs + 60_000;
}

/**
 * 读最近一次成功快照：先内存（命中即刷新 LRU），再文件。过期/损坏一律当没有。
 */
export async function readGameDetailSnapshot(
  pkg: string,
  { now = Date.now }: { now?: () => number } = {},
): Promise<GameDetailSnapshot | null> {
  const key = String(pkg || '').trim();
  if (!key) return null;
  const nowMs = now();

  const cached = memorySnapshots.get(key);
  if (cached) {
    if (isExpired(cached.savedAtMs, nowMs)) {
      memorySnapshots.delete(key);
    } else {
      touchMemory(key, cached);
      return { data: cached.data, savedAt: cached.savedAt, ageMs: Math.max(0, nowMs - cached.savedAtMs) };
    }
  }

  try {
    const raw = await readFile(snapshotFilePath(key), 'utf8');
    const parsed = JSON.parse(raw) as Partial<SnapshotRecord>;
    const savedAtMs = Date.parse(String(parsed?.savedAt || ''));
    if (isExpired(savedAtMs, nowMs)) return null;
    const data = parsed?.data as GameDetailData | undefined;
    if (!data || typeof data !== 'object' || !data.app) return null;
    const entry: SnapshotEntry = {
      savedAtMs,
      savedAt: new Date(savedAtMs).toISOString(),
      data,
    };
    touchMemory(key, entry);
    return { data: entry.data, savedAt: entry.savedAt, ageMs: Math.max(0, nowMs - savedAtMs) };
  } catch {
    return null;
  }
}

/**
 * 写快照：内存立即生效，文件用 tmp+rename 原子替换。任何失败都只告警。
 *
 * @returns 写入的文件路径；失败返回 null。
 */
export async function saveGameDetailSnapshot(
  pkg: string,
  data: GameDetailData,
  { now = Date.now }: { now?: () => number } = {},
): Promise<string | null> {
  const key = String(pkg || '').trim();
  if (!key || !data || typeof data !== 'object' || !data.app) return null;

  const savedAtMs = now();
  const savedAt = new Date(savedAtMs).toISOString();
  touchMemory(key, { savedAtMs, savedAt, data });

  const filePath = snapshotFilePath(key);
  const tmpPath = `${filePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  try {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(tmpPath, JSON.stringify({ pkg: key, savedAt, data }), 'utf8');
    await rename(tmpPath, filePath);
  } catch (error) {
    console.warn(`${SNAPSHOT_LOG_PREFIX} 快照写入失败（忽略）`, {
      pkg: key,
      error: errorMessage(error),
    });
    await unlink(tmpPath).catch(() => {});
    return null;
  }

  if (savedAtMs - lastPruneAt > PRUNE_INTERVAL_MS) {
    lastPruneAt = savedAtMs;
    await pruneGameDetailSnapshots({ now: () => savedAtMs });
  }
  return filePath;
}

/**
 * 清理过期与超量的快照文件：先按 TTL 删过期的，再按 mtime 最旧淘汰到上限以内。
 * 由 `saveGameDetailSnapshot` 节流调用，也可单独跑（测试直接调用）。
 */
export async function pruneGameDetailSnapshots(
  { now = Date.now }: { now?: () => number } = {},
): Promise<{ removed: number; kept: number }> {
  const dir = resolveSnapshotDir();
  const nowMs = now();

  let names: string[];
  try {
    names = await readdir(dir);
  } catch {
    return { removed: 0, kept: 0 };
  }

  const files: Array<{ fullPath: string; mtimeMs: number }> = [];
  for (const name of names) {
    if (!name.endsWith('.json')) continue;
    const fullPath = path.join(dir, name);
    try {
      const info = await stat(fullPath);
      files.push({ fullPath, mtimeMs: info.mtimeMs });
    } catch {
      // 并发删除/改名，忽略。
    }
  }

  let removed = 0;
  const survivors: Array<{ fullPath: string; mtimeMs: number }> = [];
  for (const file of files) {
    // 淘汰只看 mtime 是否老于 TTL：mtime 比当前时间还新（时钟回拨）时保守保留，
    // 是否「过期不可用」由读取路径按 savedAt 判定。
    if (nowMs - file.mtimeMs > SNAPSHOT_TTL_MS) {
      await unlink(file.fullPath).catch(() => {});
      removed += 1;
    } else {
      survivors.push(file);
    }
  }

  const fileLimit = resolveSnapshotFileLimit();
  if (survivors.length > fileLimit) {
    survivors.sort((a, b) => a.mtimeMs - b.mtimeMs);
    const overflow = survivors.length - fileLimit;
    for (const file of survivors.slice(0, overflow)) {
      await unlink(file.fullPath).catch(() => {});
      removed += 1;
    }
    return { removed, kept: fileLimit };
  }

  return { removed, kept: survivors.length };
}

/**
 * 详情页数据装载：成功→ok（并落快照）、明确不存在→missing、其它→degraded（带/不带快照）。
 *
 * `load` 抛错表示网络/超时/解析失败；返回 `{ status, payload }` 时由这里判定状态码与业务码。
 */
export async function loadGameDetailWithFallback({
  pkg,
  load,
  persistSnapshot = true,
  logger = console,
  now = Date.now,
}: {
  pkg: string;
  load: () => Promise<{ status: number; payload?: unknown }>;
  persistSnapshot?: boolean;
  logger?: Pick<Console, 'error' | 'warn'>;
  now?: () => number;
}): Promise<GameDetailLoadResult> {
  let failure: { reason: GameDetailFailureReason; message?: string } | null = null;

  try {
    const response = await load();
    const status = Number(response?.status) || 0;
    if (status < 200 || status >= 300) {
      failure = { reason: 'status', message: `HTTP ${status}` };
    } else {
      const classified = classifyGameDetailPayload(response?.payload);
      if (classified.kind === 'ok') {
        if (persistSnapshot) {
          try {
            await saveGameDetailSnapshot(pkg, classified.data, { now });
          } catch (error) {
            logger.warn?.(`${SNAPSHOT_LOG_PREFIX} 快照保存异常（忽略）`, {
              pkg,
              error: errorMessage(error),
            });
          }
        }
        return { result: 'ok', data: classified.data };
      }
      if (classified.kind === 'missing') return { result: 'missing' };
      failure = { reason: classified.reason, message: classified.message };
    }
  } catch (error) {
    failure = { reason: classifyGameDetailError(error), message: errorMessage(error) };
  }

  const snapshot = await readGameDetailSnapshot(pkg, { now });
  const reason = failure?.reason || 'other';
  logger.error(`${SNAPSHOT_LOG_PREFIX} degraded`, {
    pkg,
    reason,
    message: failure?.message,
    snapshotAgeMs: snapshot ? snapshot.ageMs : null,
    savedAt: snapshot ? snapshot.savedAt : null,
    hasSnapshot: Boolean(snapshot),
  });

  if (snapshot) {
    return {
      result: 'degraded',
      reason,
      message: failure?.message,
      data: snapshot.data,
      savedAt: snapshot.savedAt,
    };
  }
  return { result: 'degraded', reason, message: failure?.message, data: null, savedAt: null };
}
