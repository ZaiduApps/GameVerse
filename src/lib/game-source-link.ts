/**
 * 详情页 / 下载弹窗的来源标注。
 *
 * 目前只有 GitHub Release 分发的开源应用需要单独标注：source_type 由后台归一为
 * GITHUB（见 interface admin.service canonicalImportSourceType），仓库地址复用
 * metadata.android_url（导入时写入 release 所在仓库），不新增接口契约字段。
 */
export interface GameSourceInfo {
  label: string;
  repoUrl: string | null;
  license: string;
}

const GITHUB_SOURCE_LABEL = 'GitHub 官方源';
// GitHub 分发当前只用于 GPL-3.0 开源版（DroidDeck）。换项目时先改这里，
// 不要在页面里按包名硬编码。
const GITHUB_SOURCE_LICENSE = 'GPL-3.0';

export function resolveGameSourceInfo(app: {
  metadata?: { android_url?: string } | null;
  source_type?: unknown;
} | null | undefined): GameSourceInfo | null {
  const sourceType = String(app?.source_type ?? '')
    .trim()
    .toLowerCase();
  if (sourceType !== 'github') return null;

  return {
    label: GITHUB_SOURCE_LABEL,
    license: GITHUB_SOURCE_LICENSE,
    repoUrl: resolveGithubRepoUrl(app?.metadata?.android_url),
  };
}

/** 只认 github.com 的 owner/repo，其它地址一律不当作仓库链接输出。 */
function resolveGithubRepoUrl(value: unknown): string | null {
  const text = String(value ?? '').trim();
  if (!text) return null;
  try {
    const url = new URL(text);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
    const hostname = url.hostname.toLowerCase();
    if (hostname !== 'github.com' && hostname !== 'www.github.com') return null;
    const [owner, repo] = url.pathname.split('/').filter(Boolean);
    if (!owner || !repo) return null;
    return `https://github.com/${owner}/${repo}`;
  } catch {
    return null;
  }
}
