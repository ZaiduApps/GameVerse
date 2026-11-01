/**
 * 分类落地页接口故障降级。
 *
 * 目标是把「分类真的不存在」和「上游此刻坏了」分开：
 * - `missing`：未知 slug / 接口明确说分类不存在或页码越界 → 上层 404；
 * - `ok`：拿到可用数据；
 * - `unavailable`：首次请求失败，且 no-store 重取一次仍失败 → 上层渲染 200 空态页。
 *
 * 为什么不直接抛错：分类深页是爬虫与用户都会访问的入口，接口超时是偶发的，
 * 让整页进 error boundary（5xx）会把一次抖动变成一整段时间的坏结果。
 * 为什么重取要用 `no-store`：5xx 说明上游此刻不可用，这次结果既不能读旧缓存，
 * 也不能写进 Next 数据缓存，否则一次瞬时超时会被钉住 15 分钟。
 * 为什么不缩小 pageSize：翻页语义由 `?page=N` 决定，换 pageSize 会让同一 URL
 * 展示另一批游戏，比空态更糟。
 */
import { isCategoryQualified, type CategoryPagePayload } from './category-pages';

/** 首次请求的接口超时（沿用改动前的 6000ms）。 */
export const CATEGORY_PAGE_API_TIMEOUT_MS = 6000;
/** 降级重取的接口超时：短一点，避免整页等两次 6 秒。 */
export const CATEGORY_PAGE_RETRY_TIMEOUT_MS = 5000;

export type CategoryPageData = {
  /** 接口原样返回的分页体。 */
  payload: CategoryPagePayload;
  /** 有资源条数决定翻页范围。 */
  totalPages: number;
};

export type CategoryPageAttempt =
  | { kind: 'ok'; data: CategoryPageData }
  | { kind: 'missing' }
  | { kind: 'failed'; reason: string };

export type CategoryPageLoadResult =
  | { kind: 'ok'; data: CategoryPageData }
  | { kind: 'missing' }
  | { kind: 'unavailable' };

/** 两次请求都失败时的空态数据：页码保留在 URL 上，但不再对外声明有更多内容。 */
export function emptyCategoryPayload(page: number, pageSize: number): CategoryPagePayload {
  return { list: [], total: 0, page, pageSize, publishedTotal: 0 };
}

function describeError(error: unknown): string {
  return error instanceof Error ? `${error.name}: ${error.message}` : String(error);
}

/**
 * 判定一次接口响应：
 * - HTTP 400 / 业务码 400 → `missing`（确定性结论，不该重取）；
 * - 非 2xx、业务码非 0（旧版「200 + code」）、结构异常 → `failed`（值得重取一次）；
 * - 未达收录阈值 / 页码越界 / 非首页空列表 → `missing`。
 */
export function classifyCategoryPageResponse(
  response: { status?: number; payload?: unknown } | null,
  page: number,
  pageSize: number,
): CategoryPageAttempt {
  const status = Number(response?.status) || 0;
  if (status === 400) return { kind: 'missing' };
  if (status < 200 || status >= 300) {
    return { kind: 'failed', reason: `status=${status || 'unknown'}` };
  }

  const payload = response?.payload as
    | { code?: number; message?: string; data?: Partial<CategoryPagePayload> }
    | null
    | undefined;
  const code = payload?.code;
  if (code === 400) return { kind: 'missing' };
  if (code !== undefined && code !== 0) {
    return { kind: 'failed', reason: `code=${code} message=${payload?.message || ''}` };
  }

  const raw = payload?.data;
  if (!raw || typeof raw !== 'object') {
    return { kind: 'failed', reason: 'payload.data missing' };
  }

  const list = Array.isArray(raw.list) ? raw.list : [];
  const withResources = Number(raw.total ?? list.length);
  const publishedTotal = Number(raw.publishedTotal ?? 0);
  const responsePage = Math.max(1, Number(raw.page ?? page));
  const resolvedPageSize = Math.max(1, Number(raw.pageSize ?? pageSize));

  // 阈值判定只认这一份规则（与 sitemap 共用），不在这里另写数字。
  if (!isCategoryQualified({ published: publishedTotal, withResources })) {
    return { kind: 'missing' };
  }

  const totalPages = Math.max(1, Math.ceil(withResources / resolvedPageSize));
  if (responsePage > totalPages) return { kind: 'missing' };
  // 空页在阈值达标时只可能是越界（后端已按 page 返回），同样 404 而不是渲染空网格。
  if (list.length === 0 && responsePage > 1) return { kind: 'missing' };

  return {
    kind: 'ok',
    data: {
      payload: {
        list,
        total: withResources,
        page: responsePage,
        pageSize: resolvedPageSize,
        publishedTotal,
      },
      totalPages,
    },
  };
}

/**
 * 分类页数据装载：首次请求失败时用 no-store 再取一次，仍失败则返回 `unavailable`。
 *
 * `load(attempt)` 抛错表示网络/超时/解析失败；返回 `{ status, payload }` 时由这里判定。
 */
export async function loadCategoryPageWithRetry({
  categoryName,
  page,
  pageSize,
  load,
  logger = console,
}: {
  categoryName: string;
  page: number;
  pageSize: number;
  load: (attempt: 'primary' | 'retry') => Promise<{ status: number; payload?: unknown }>;
  logger?: Pick<Console, 'warn' | 'error'>;
}): Promise<CategoryPageLoadResult> {
  const runAttempt = async (attempt: 'primary' | 'retry'): Promise<CategoryPageAttempt> => {
    try {
      return classifyCategoryPageResponse(await load(attempt), page, pageSize);
    } catch (error) {
      return { kind: 'failed', reason: `request ${describeError(error)}` };
    }
  };

  const primary = await runAttempt('primary');
  if (primary.kind !== 'failed') return primary;

  logger.warn('[category-page] 分类列表首次请求失败，改用 no-store 再取一次', {
    name: categoryName,
    page,
    reason: primary.reason,
  });

  const retried = await runAttempt('retry');
  if (retried.kind !== 'failed') return retried;

  logger.error('[category-page] 分类列表降级重取仍失败，返回 200 空态页', {
    name: categoryName,
    page,
    primary: primary.reason,
    retry: retried.reason,
  });
  return { kind: 'unavailable' };
}
