/**
 * 下载点击的来源维度（待决策 #145）。
 *
 * 与 `surface`（detail_open / detail_dialog / detail_ssr / list_card …）分开：
 * `surface` 记录具体入口，`click_source` 只保留增长侧要的粗粒度归因——列表卡片
 * 还是详情页，免得每新增一个 surface 就重写一次报表口径。
 *
 * 只接受固定枚举，由调用点显式传，不按页面 URL 猜；缺省或脏值一律归 `other`，
 * 老调用点不传也能得到完整维度。interface 的 `download-request-classifier.ts`
 * 用同一套取值校验 `x-ac-click-source` 头。
 */
export const DOWNLOAD_CLICK_SOURCES = ['list', 'detail', 'other'] as const;

export type DownloadClickSource = (typeof DOWNLOAD_CLICK_SOURCES)[number];

/** 纯函数：把任意输入收敛到固定枚举；未知值按「来源不明」处理。 */
export function normalizeDownloadClickSource(input: unknown): DownloadClickSource {
  const value = String(input ?? '')
    .trim()
    .toLowerCase();
  return (DOWNLOAD_CLICK_SOURCES as readonly string[]).includes(value)
    ? (value as DownloadClickSource)
    : 'other';
}
