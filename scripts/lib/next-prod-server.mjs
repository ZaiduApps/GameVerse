/**
 * `pnpm start` 的自定义生产 server。
 *
 * 为什么要自己起 server：`next start` 的 router-server 把 Vary 的四个 RSC token
 * 写在每一个页面响应上，并且不肯让外部改写。要按 URL 收口 Vary（为 Cloudflare
 * Cache Rule 服务），只能在响应写出前自己接管 request handler。
 *
 * 代价与补偿：
 * - Next 自带的 compression 中间件没了 → 这里用 Node 内置 zlib 对 HTML 做流式 gzip；
 * - `next start` 的优雅退出没了 → 这里自己接 SIGINT/SIGTERM；
 * - ISR / 静态资源 / rewrites / 404 / 500 都由 NextNodeServer 自己处理，不受影响。
 *   （自定义 server 唯一少掉的是 Vercel 式的 serverless 部署，本项目不用。）
 */
import http from 'node:http';
import zlib from 'node:zlib';

import {
  appendVaryToken,
  isGameDetailHtmlRoute,
  isRscRequest,
  sanitizeVaryHeader,
} from './html-vary.mjs';
import { decideHtmlCompression, isHtmlContentType } from './http-compress.mjs';

const NEVER_PATCHED_PREFIX = '/_next/';

/**
 * 改写单次响应：详情页 HTML 收口 Vary + HTML 响应补 gzip。
 *
 * 三条写出路径都覆盖：`res.setHeader` 之后由 `res.writeHead` 落盘（Next 走这条）、
 * `res.writeHead(status, headers)` 显式带 headers、以及 `res.flushHeaders()` /
 * `res.write()` 触发的隐式落盘。
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
export function patchResponse(req, res) {
  const method = req.method || 'GET';
  if (method !== 'GET' && method !== 'HEAD') return;

  const url = req.url || '/';
  const pathname = url.split('?')[0] || '/';
  if (pathname.startsWith(NEVER_PATCHED_PREFIX)) return;

  const isDetailHtmlResponse = isGameDetailHtmlRoute(pathname) && !isRscRequest({ headers: req.headers, url });

  const originalWriteHead = res.writeHead.bind(res);
  const originalWrite = res.write.bind(res);
  const originalEnd = res.end.bind(res);

  let prepared = null;
  let gzipStream = null;

  function prepare() {
    if (prepared) return prepared;
    prepared = { gzip: false };

    const headers = res.getHeaders();
    const isNotModified = res.statusCode === 304;
    // 304 是 Next 在 sendEtagResponse 里先发的（那时还没写 content-type），
    // 但它对应的一定是详情页 HTML 表示，Vary 必须与 200 保持一致。
    if (isDetailHtmlResponse && (isHtmlContentType(headers['content-type']) || isNotModified)) {
      const current = headers.vary;
      const next = sanitizeVaryHeader(current, {
        isHtmlDetailRoute: true,
        isRscRequest: false,
      });
      if (next !== current) {
        if (next === undefined) res.removeHeader('vary');
        else res.setHeader('vary', next);
      }
      if (isNotModified) {
        const vary = appendVaryToken(res.getHeader('vary'), 'Accept-Encoding');
        if (vary !== undefined && vary !== null) res.setHeader('vary', vary);
      }
    }

    const shouldGzip = decideHtmlCompression({
      method,
      requestHeaders: req.headers,
      statusCode: res.statusCode,
      responseHeaders: res.getHeaders(),
    });
    if (!shouldGzip) return prepared;

    // gzip 后长度未知；Content-Length 必须清掉，否则客户端会截断或等待。
    res.setHeader('content-encoding', 'gzip');
    res.removeHeader('content-length');
    const vary = appendVaryToken(res.getHeader('vary'), 'Accept-Encoding');
    if (vary !== undefined && vary !== null) res.setHeader('vary', vary);
    prepared.gzip = true;
    return prepared;
  }

  function ensureGzip() {
    if (!prepared || !prepared.gzip) return null;
    if (gzipStream) return gzipStream;
    gzipStream = zlib.createGzip();
    // 压缩后的分片直接写进原始 response；流结束时才真正结束 HTTP 响应。
    gzipStream.on('data', (chunk) => {
      originalWrite(chunk);
    });
    gzipStream.on('end', () => {
      originalEnd();
    });
    gzipStream.on('error', (error) => {
      console.error('[next-runner] html gzip stream failed', {
        path: pathname,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.writableEnded) originalEnd();
    });
    res.on('close', () => {
      if (gzipStream && !gzipStream.destroyed) gzipStream.destroy();
    });
    return gzipStream;
  }

  res.writeHead = function writeHead(statusCode, reasonOrHeaders, maybeHeaders) {
    let statusMessage;
    let headers;
    if (typeof reasonOrHeaders === 'string') {
      statusMessage = reasonOrHeaders;
      headers = maybeHeaders;
    } else {
      headers = reasonOrHeaders;
    }
    // Node 的 writeHead(status, headers) 内部就是逐个 setHeader；改成显式 setHeader
    // 后这里能在落盘前统一做 Vary / gzip 决策。
    if (headers && typeof headers === 'object') {
      for (const [key, value] of Object.entries(headers)) {
        if (value !== undefined) res.setHeader(key, value);
      }
    }
    prepare();
    return statusMessage ? originalWriteHead(statusCode, statusMessage) : originalWriteHead(statusCode);
  };

  res.write = function write(chunk, encoding, callback) {
    prepare();
    const stream = ensureGzip();
    if (!stream) return originalWrite(chunk, encoding, callback);
    if (typeof encoding === 'function') {
      return stream.write(chunk, encoding);
    }
    return stream.write(chunk, encoding, callback);
  };

  res.end = function end(chunk, encoding, callback) {
    prepare();
    const stream = ensureGzip();
    if (!stream) return originalEnd(chunk, encoding, callback);

    let finalChunk = chunk;
    let finalEncoding = encoding;
    let finalCallback = callback;
    if (typeof finalChunk === 'function') {
      finalCallback = finalChunk;
      finalChunk = undefined;
      finalEncoding = undefined;
    } else if (typeof finalEncoding === 'function') {
      finalCallback = finalEncoding;
      finalEncoding = undefined;
    }
    if (typeof finalCallback === 'function') res.once('finish', finalCallback);

    if (finalChunk === undefined || finalChunk === null) stream.end();
    else stream.end(finalChunk, typeof finalEncoding === 'string' ? finalEncoding : undefined);
    return res;
  };
}

/**
 * 起生产 server。
 *
 * @param {{ dir?: string, port?: number | string, hostname?: string }} [options]
 */
export async function startProductionServer({ dir = process.cwd(), port, hostname = '0.0.0.0' } = {}) {
  const listenPort = Number(port);
  if (!Number.isFinite(listenPort) || listenPort <= 0) {
    throw new Error(`[next-runner] invalid port: ${port}`);
  }

  // next({ dev: false }) 依赖这个值决定 React 的生产分支；PM2 会带，本地 `pnpm start` 不会。
  if (!process.env.NODE_ENV) process.env.NODE_ENV = 'production';

  const { default: createNext } = await import('next');
  const app = createNext({ dev: false, dir, hostname, port: listenPort });
  await app.prepare();
  const handle = app.getRequestHandler();

  const server = http.createServer((req, res) => {
    patchResponse(req, res);
    Promise.resolve(handle(req, res)).catch((error) => {
      console.error('[next-runner] request handler failed', {
        url: req.url,
        error: error instanceof Error ? error.message : String(error),
      });
      if (!res.headersSent) {
        res.statusCode = 500;
        res.setHeader('content-type', 'text/plain; charset=utf-8');
        res.end('Internal Server Error');
      } else if (!res.writableEnded) {
        res.end();
      }
    });
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(listenPort, hostname, () => {
      server.off('error', reject);
      resolve();
    });
  });

  console.log(`[next-runner] production server listening on http://${hostname}:${listenPort}`);

  let closing = false;
  const shutdown = (signal) => {
    if (closing) return;
    closing = true;
    console.log(`[next-runner] received ${signal}, closing server`);
    const force = setTimeout(() => process.exit(0), 5000);
    force.unref();
    server.close(() => {
      Promise.resolve(app.close?.()).finally(() => process.exit(0));
    });
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  return server;
}
