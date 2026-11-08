import { resolveDisplayVersion } from '@/lib/game-version';

import { cleanText } from './game-detail-presenter';

/**
 * 「游戏特色」里以版本号结尾的条目，例如：
 * - `当前版本 v0.30.25.0.2828873`
 * - `当前版本：1.2.3`（interface 兜底文案用全角冒号、不带 v）
 * - `最新版本 v2.0.1-beta`
 *
 * 这些是后台 `seo.highlights` 里的静态文案，版本推进后不会自动改写；
 * 详情页在渲染时用实时 `app.version` 覆盖版本号，数据里不再需要存具体版本字符串。
 */
const VERSION_HIGHLIGHT_PATTERN =
  /^(.*?(?:当前|最新)?版本)\s*([:：])?\s*(v?(?:\d[0-9A-Za-z._+\-]*|VARY(?:@\S+)?))\s*$/i;

/** 实时版本缺失（含 VARY 分轨包）时的中性文案，不猜版本、不渲染 vVARY。 */
export const HIGHLIGHT_FALLBACK_VERSION_TEXT = '查看最新版本';

function formatVersionLabel(liveVersion: string, originalToken: string): string {
  const body = liveVersion.replace(/^v/i, '');
  // 保留原条目自己的写法：原来带 v 就继续带 v，原来不带就不硬加。
  return /^v/i.test(originalToken) ? `v${body}` : body;
}

/**
 * 把 highlights 里「版本 vX」类条目的版本号替换成实时版本。
 * 非版本类条目原样返回；实时版本为空或占位符时整条回落为中性文案。
 */
export function applyLiveVersionHighlights(
  highlights: unknown,
  liveVersion: unknown,
): string[] {
  if (!Array.isArray(highlights)) return [];
  const live = resolveDisplayVersion(liveVersion);
  const result: string[] = [];

  for (const item of highlights) {
    const text = cleanText(String(item ?? ''));
    if (!text) continue;

    const match = text.match(VERSION_HIGHLIGHT_PATTERN);
    if (!match || !match[3]) {
      result.push(text);
      continue;
    }

    if (!live) {
      result.push(HIGHLIGHT_FALLBACK_VERSION_TEXT);
      continue;
    }

    const sep = match[2] ? match[2] : ' ';
    result.push(`${match[1]}${sep}${formatVersionLabel(live, match[3])}`);
  }

  return result;
}
