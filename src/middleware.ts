import { NextResponse, type NextRequest } from 'next/server';

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  ((process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase() === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
).replace(/\/+$/, '');

export async function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(/^\/app\/([a-f\d]{24})\/?$/i);
  if (!match) {
    // 规范包名详情由静态参数清单控制，避免每次访问重复请求详情接口。
    return NextResponse.next();
  }

  try {
    const response = await fetch(`${API_BASE_URL}/game/details?param=${encodeURIComponent(match[1])}`, {
      cache: 'force-cache',
      headers: { 'x-tracking-skip': '1', 'x-client-platform': 'web' },
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

export const config = {
  matcher: ['/app/:path*'],
};
