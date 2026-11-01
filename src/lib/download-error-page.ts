/**
 * 下载直达入口（`/app/[id]/download/[channelId]`）失败时给爬虫和用户的**显式错误页**。
 *
 * 背景（待决策 #74）：这个端点是 302 中转，任何一环失败都会被搜索引擎当成裸错误——
 * - 之前参数非法直接回 `text/plain` 400，游戏不存在则 302 到详情页再由详情页回 404，
 *   抓取链路最终仍是 404，且用户/Monitor 看到的是没有出路的纯文本；
 * - 现在 400 / 404 一律返回带品牌壳的 HTML 页面：说明发生了什么、给出 3 条出路
 *   （回游戏页、去首页、站内搜索），并声明 `noindex`——下载中转页不该进索引。
 *
 * 纯函数：输入判定结果，输出 HTML 字符串。route.ts 只负责设状态码与响应头，
 * 这样文案、转义与结构都能被单测直接覆盖。
 */

import type { DownloadFailureKind } from '@/lib/game-download-redirect';

export interface DownloadErrorPageInput {
    /** HTTP 状态：400 请求本身不合法，404 目标不存在。 */
    status: 400 | 404;
    /** 页面主标题，例如「这个下载链接已失效」。 */
    title: string;
    /** 一句人话解释，说明为什么会到这里、下一步怎么做。 */
    message: string;
    /** 请求里的游戏标识（包名或 24 位 id），合法时给「返回游戏页」出口。 */
    appId?: string;
    /** 用于把用户反馈和日志对上的请求号。 */
    requestId?: string;
}

/**
 * 停在原地给错误页的两条失败对应的文案。
 *
 * 其余失败（资源/渠道/上游）仍走「回详情页 + download_error 提示」，
 * 那边有换渠道、看其它版本、反馈失效三条出口，比一张静态错误页更有用。
 */
export function describeDownloadErrorPage(failure: DownloadFailureKind): {
    status: 400 | 404;
    title: string;
    message: string;
} {
    if (failure === 'app_missing') {
        return {
            status: 404,
            title: '这个下载地址对应的游戏已不存在',
            message:
                '游戏可能已经下架、改名或换过包名，所以这份下载链接失效了。回到首页看看别的游戏，或者用搜索找它现在的页面。',
        };
    }
    return {
        status: 400,
        title: '这个下载地址不完整',
        message:
            '链接里的游戏标识或渠道标识不合法，通常是复制时被截断。回到游戏页重新点一次下载即可；如果一直这样，把当前地址反馈给我们。',
    };
}

const HTML_ESCAPE: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
};

export function escapeHtml(value: unknown): string {
    return String(value ?? '').replace(/[&<>"']/g, (char) => HTML_ESCAPE[char] || char);
}

/**
 * 游戏页出口只在标识看起来是包名或 ObjectId 时才给：脏输入直接拼进 href
 * 会把错误页变成开放重定向的跳板。
 */
export function resolveDownloadErrorAppPath(appId: unknown): string | null {
    const value = String(appId ?? '').trim();
    if (!value || value.length > 160) return null;
    if (/[/\\?#\s]/.test(value)) return null;
    return `/app/${encodeURIComponent(value)}`;
}

export function renderDownloadErrorPage(input: DownloadErrorPageInput): string {
    const title = escapeHtml(input.title);
    const message = escapeHtml(input.message);
    const appPath = resolveDownloadErrorAppPath(input.appId);
    const requestId = String(input.requestId ?? '').trim();

    const actions = [
        appPath
            ? `<a class="btn btn-primary" href="${escapeHtml(appPath)}">返回游戏页</a>`
            : '',
        '<a class="btn" href="/">回到首页</a>',
        '<a class="btn" href="/search">站内搜索</a>',
    ]
        .filter(Boolean)
        .join('');

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, follow">
<title>${title} | APKScc</title>
<style>
:root{color-scheme:light dark}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
background:#f6f7f8;color:#2c2f30;font:15px/1.7 -apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif}
.card{width:100%;max-width:520px;background:#fff;border:1px solid rgba(171,173,174,.25);border-radius:16px;padding:28px}
.brand{font-size:13px;font-weight:600;color:#757778;letter-spacing:.04em;text-transform:uppercase}
h1{margin:10px 0 8px;font-size:22px;line-height:1.35}
p{margin:0 0 20px;color:#4a4d4e}
.actions{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-flex;align-items:center;padding:9px 16px;border-radius:10px;border:1px solid rgba(171,173,174,.45);
color:#2c2f30;text-decoration:none;font-size:14px;font-weight:600}
.btn:hover{background:#eff1f2}
.btn-primary{background:#2c2f30;border-color:#2c2f30;color:#fff}
.btn-primary:hover{background:#17191a}
.meta{margin-top:18px;font-size:12px;color:#757778;word-break:break-all}
@media (prefers-color-scheme:dark){
body{background:#17191a;color:#eff1f2}
.card{background:#1f2223;border-color:rgba(171,173,174,.2)}
p{color:#c9cccd}
.btn{color:#eff1f2;border-color:rgba(171,173,174,.3)}
.btn:hover{background:#2c2f30}
.btn-primary{background:#eff1f2;border-color:#eff1f2;color:#17191a}
.btn-primary:hover{background:#dfe2e3}
.meta{color:#9a9d9e}
}
</style>
</head>
<body>
<main class="card">
<div class="brand">APKScc</div>
<h1>${title}</h1>
<p>${message}</p>
<div class="actions">${actions}</div>
${requestId ? `<p class="meta">请求号：${escapeHtml(requestId)}</p>` : ''}
</main>
</body>
</html>`;
}
