/**
 * 单游戏页面使用稳定、可预测的缓存标签，供 SEO 写入后的签名失效请求使用。
 */
export function gamePageCacheTag(pkg: string): string {
  return `game-page:${String(pkg || '').trim()}`;
}
