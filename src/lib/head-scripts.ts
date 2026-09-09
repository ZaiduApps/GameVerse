/**
 * 站点配置 head_scripts 的第三方脚本域 allowlist。
 * 配置内容为裸 JS 片段（动态创建 script 标签），因此提取片段中引用的全部
 * http(s) URL 做域名白名单校验：存在未知域则整段跳过并告警，全部命中则注入。
 */
const ALLOWED_SCRIPT_HOSTS = new Set([
  'apks.cc',
  'baidu.com',
  'clarity.ms',
  'google-analytics.com',
  'googletagmanager.com',
  'google.com',
  'bing.com',
  'microsoft.com',
  'tc-new.z.wiki',
  'img.pagehost.cn',
]);

function hostAllowed(host: string): boolean {
  const normalized = host.toLowerCase();
  if (ALLOWED_SCRIPT_HOSTS.has(normalized)) return true;
  return [...ALLOWED_SCRIPT_HOSTS].some(
    (allowed) => normalized.endsWith(`.${allowed}`),
  );
}

export function filterAllowedHeadScripts(html: string): string {
  const raw = String(html || '').trim();
  if (!raw) return '';

  const urlPattern = /https?:\/\/[^\s"'`<>()]+/gi;
  const blocked = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = urlPattern.exec(raw)) !== null) {
    try {
      const { hostname } = new URL(match[0]);
      if (!hostAllowed(hostname)) blocked.add(hostname);
    } catch {
      // 无法解析的引用按未知域处理，保守跳过整段。
      blocked.add(match[0]);
    }
  }

  if (blocked.size > 0) {
    console.warn(`[head-scripts] 跳过含未知域脚本的配置: ${[...blocked].join(', ')}`);
    return '';
  }
  return raw;
}
