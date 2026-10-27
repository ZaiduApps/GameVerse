import { NextResponse, type NextRequest } from 'next/server';

import { isDeniedApiPath } from '@/lib/api-proxy-guard';

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  ((process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase() === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
).replace(/\/+$/, '');

const LEGACY_GAME_ID_LOOKUP_TIMEOUT_MS = 3000;

/** 24 位 ObjectId 形式的游戏详情地址 308 到规范包名地址（既有行为，保留）。 */
async function redirectLegacyGameId(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/app\/([a-f\d]{24})\/?$/i);
  if (!match) {
    // 规范包名详情由静态参数清单控制，避免每次访问重复请求详情接口。
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/game/details?param=${encodeURIComponent(match[1])}`, {
      cache: 'force-cache',
      headers: { 'x-tracking-skip': '1', 'x-client-platform': 'web' },
      // 中间件挂住会让该路径的每个请求一起挂住，因此这里用比业务默认值（15s）更短的 3s，
      // 且不走 trackedApiFetch：Edge 里不需要浏览器打点头，失败必须回落到原路由响应。
      signal: AbortSignal.timeout(LEGACY_GAME_ID_LOOKUP_TIMEOUT_MS),
    });
    const payload = response.ok ? await response.json() : null;
    const pkg = String(payload?.data?.app?.pkg || '').trim();
    if (payload?.code === 0 && pkg) {
      return NextResponse.redirect(new URL(`/app/${encodeURIComponent(pkg)}`, request.url), 308);
    }
  } catch {
    // 临时接口故障保留原路由响应，由静态路由返回明确状态。
  }

  return NextResponse.next();
}

/**
 * 1) `/api` 反代拒绝清单：放在 middleware 是因为 next.config.ts 的 rewrites 只能做
 *    纯路径匹配，无法先规范化（百分号编码 / 重复斜杠 / `..` / 大小写）再判断；
 *    命中统一 404，不向公网确认后端模块是否存在。口径见 src/lib/api-proxy-guard.ts。
 * 2) 非 /api 请求保持既有的游戏详情 ObjectId → 包名 308 跳转。
 */
export async function middleware(request: NextRequest) {
  if (isDeniedApiPath(request.nextUrl.pathname)) {
    return NextResponse.json(
      { code: 404, message: 'Not Found' },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return redirectLegacyGameId(request);
}

export const config = {
  // 匹配全路径：'/api/:path*' 这类静态前缀 matcher 未必大小写不敏感，而 Next 的
  // rewrite 默认忽略大小写，'/API/Admin' 仍会被 catch-all 代理出去。全路径匹配后由
  // isDeniedApiPath 做开销极小的首段判断，/app 的跳转逻辑也只多一次正则。
  matcher: '/:path*',
};
