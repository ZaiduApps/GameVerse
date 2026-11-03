/**
 * 搜索浮层结果区的空态判定（纯函数，便于单测与复用）。
 *
 * 关键区分：请求失败（限流 429 / 断网 / 超时）必须显示「服务繁忙 + 重试」，
 * 不能退化成一屏「未找到相关结果」——否则用户会以为站里确实没有这个游戏。
 */
export type SearchEmptyStateKey = 'loading' | 'error' | 'filter-empty' | 'empty';

export function resolveSearchEmptyState(input: {
  isLoading: boolean;
  error: unknown;
  totalResultCount: number;
}): SearchEmptyStateKey {
  if (input.isLoading) return 'loading';
  if (input.error) return 'error';
  return input.totalResultCount > 0 ? 'filter-empty' : 'empty';
}
