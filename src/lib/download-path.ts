/**
 * 下载事件的页面路径维度（待决策 #140）。
 *
 * 口径：只取 **pathname**，去掉查询串与哈希，最多 200 字符；不把完整的
 * `location.href` 上报出去（里面可能有来源参数、跟踪串，甚至用户输入）。
 * 目的只是让「失败发生在哪一类页面」可归因（详情页 / 搜索 / 榜单 / 分类页），
 * 不做用户身份识别，也不与 #145 的点击来源位混用。
 */
const DOWNLOAD_PATH_MAX_LENGTH = 200;

/** 纯函数：把任意输入归一成安全的 pathname；不合法时返回空串。 */
export function normalizeDownloadPagePath(input: unknown): string {
  const raw = String(input ?? '').trim();
  if (!raw) return '';
  const pathname = raw.split(/[?#]/, 1)[0].trim();
  if (!pathname.startsWith('/')) return '';
  if (/[\s\\]/.test(pathname)) return '';
  return pathname.slice(0, DOWNLOAD_PATH_MAX_LENGTH);
}

/** 浏览器里取当前页面 pathname；SSR / 测试环境返回空串，由调用方决定是否省略。 */
export function currentDownloadPagePath(): string {
  if (typeof window === 'undefined') return '';
  try {
    return normalizeDownloadPagePath(window.location?.pathname);
  } catch {
    return '';
  }
}
