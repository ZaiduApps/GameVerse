/**
 * 边缘缓存规则与详情页指纹抽取的纯函数实现，供 CLI 脚本与 node test 共用。
 * 规则本体只在这里定义一次，`scripts/cloudflare-edge-cache.mjs` 只做参数解析与下发。
 */

export const CACHE_RULE_PHASE = 'http_request_cache_settings';
export const CACHE_RULE_DESCRIPTION = 'apkscc: 详情页 HTML 边缘缓存 (/app/*)';

/**
 * 只接管详情页宿主路由的普通 HTML 请求：
 * - `/app/*` 前缀限定范围；
 * - 排除带 `_rsc=` 的 RSC / 预取请求 —— Cloudflare 不把 RSC 相关请求头纳入缓存键，
 *   接管它们有把预取负载喂给完整导航的风险，而产1 的边界就是「RSC 数据路由不动」。
 */
export const CACHE_RULE_EXPRESSION =
  '(starts_with(http.request.uri.path, "/app/") and not http.request.uri.query contains "_rsc=")';

export const CACHE_RULE_BODY = Object.freeze({
  action: 'set_cache_settings',
  description: CACHE_RULE_DESCRIPTION,
  enabled: true,
  expression: CACHE_RULE_EXPRESSION,
  action_parameters: {
    // 详情页本身没有登录态/个性化分支；缓存资格交给规则，TTL 复用源站 s-maxage=300。
    cache: true,
    edge_ttl: { mode: 'respect_origin' },
    browser_ttl: { mode: 'respect_origin' },
  },
});

/** 校验表达式是否满足本仓约定的两条边界，供脚本与测试共用。 */
export function validateRuleExpression(expression = CACHE_RULE_EXPRESSION) {
  const problems = [];
  if (!/starts_with\(http\.request\.uri\.path,\s*"\/app\/"\)/.test(expression)) {
    problems.push('缺少 /app/ 路径前缀限定');
  }
  if (!/not http\.request\.uri\.query contains "_rsc="/.test(expression)) {
    problems.push('缺少 _rsc 查询串排除');
  }
  return problems;
}

function firstMatch(source, patterns) {
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match && match[1]) return match[1].trim();
  }
  return '';
}

/**
 * 从详情页 HTML 里取稳定性字段：游戏名、og:image、detail_images 首图、首屏截图。
 * detail_images 在 SSR 出来的 RSC payload 里既可能是普通 JSON，也可能是转义后的字符串；
 * 不是每个游戏的 detail_images 都非空，JSON-LD 的 screenshot 数组是同一批图的稳定落点。
 */
export function extractDetailFingerprint(html) {
  const source = String(html || '');
  return {
    title: firstMatch(source, [/<title[^>]*>([\s\S]*?)<\/title>/i]),
    ogTitle: firstMatch(source, [
      /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i,
    ]),
    ogImage: firstMatch(source, [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    ]),
    firstDetailImage: firstMatch(source, [
      /"detail_images"\s*:\s*\[\s*"([^"]+)"/,
      /\\"detail_images\\"\s*:\s*\[\s*\\"([^"\\]+)\\"/,
      /"detailImages"\s*:\s*\[\s*"([^"]+)"/,
    ]),
    firstScreenshot: firstMatch(source, [/"screenshot"\s*:\s*\[\s*"([^"]+)"/]),
  };
}

/** 两次响应之间哪些指纹字段发生了变化（空数组=一致）。 */
export function diffFingerprints(first, second) {
  const fields = ['title', 'ogTitle', 'ogImage', 'firstDetailImage', 'firstScreenshot'];
  return fields.filter((field) => (first?.[field] || '') !== (second?.[field] || ''));
}
