/**
 * `pnpm start` 换成自定义 Node server 之后，Next 自带的 compression 中间件
 * （只在 `next start` 的 router-server 里挂载）不再生效。这里用 Node 内置 zlib
 * 把 HTML 响应的 gzip 补回来，不引入新依赖。
 *
 * 判定与压缩实现分离：本文件只放纯函数，真正的流式 gzip 在
 * `scripts/lib/next-prod-server.mjs`。
 */

/** 小于该字节数的响应不值得压缩（与 Next 默认阈值一致）。 */
export const MIN_COMPRESS_BYTES = 1024;

/** `Accept-Encoding` 是否接受 gzip（支持 q 值与 `*`）。 */
export function acceptsGzip(headerValue) {
  if (headerValue === undefined || headerValue === null) return false;
  if (Array.isArray(headerValue)) return acceptsGzip(headerValue.join(','));

  let wildcard = null;
  for (const part of String(headerValue).split(',')) {
    const [rawName, ...params] = part.split(';');
    const name = rawName.trim().toLowerCase();
    if (!name) continue;
    let q = 1;
    for (const param of params) {
      const match = param.trim().match(/^q=([0-9.]+)$/i);
      if (match) {
        const parsed = Number.parseFloat(match[1]);
        q = Number.isFinite(parsed) ? parsed : 0;
      }
    }
    if (name === 'gzip') return q > 0;
    if (name === '*' && wildcard === null) wildcard = q;
  }
  return wildcard !== null && wildcard > 0;
}

export function isHtmlContentType(contentType) {
  if (contentType === undefined || contentType === null) return false;
  return /^text\/html\b/i.test(String(contentType));
}

/**
 * 是否对这次响应做 gzip。`responseHeaders` 用小写键（`res.getHeaders()` 的形状）。
 *
 * 不满足条件时返回 false，调用方原样输出，行为与未压缩一致。
 */
export function decideHtmlCompression({
  method = 'GET',
  requestHeaders = {},
  statusCode = 200,
  responseHeaders = {},
} = {}) {
  if (method !== 'GET' && method !== 'HEAD') return false;
  // 1xx/204/304 没有实体，不能带 Content-Encoding 对应的实体压缩。
  if (!Number.isFinite(statusCode) || statusCode < 200 || statusCode === 204 || statusCode === 304) {
    return false;
  }
  if (responseHeaders['content-encoding']) return false;
  if (!isHtmlContentType(responseHeaders['content-type'])) return false;
  if (requestHeaders.range) return false;
  if (!acceptsGzip(requestHeaders['accept-encoding'])) return false;

  const contentLength = Number(responseHeaders['content-length']);
  if (Number.isFinite(contentLength) && contentLength > 0 && contentLength < MIN_COMPRESS_BYTES) {
    return false;
  }

  return true;
}
