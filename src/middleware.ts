import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = (
  process.env.API_BASE_URL ||
  (process.env.NODE_ENV === 'production' ||
  (process.env.APP_ENV || '').toLowerCase() === 'production'
    ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
    : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
).replace(/\/+$/, '');

function getGameId(pathname: string) {
  const match = pathname.match(/^\/app\/([^/]+)\/?$/);
  return match?.[1] ? decodeURIComponent(match[1]) : '';
}

function buildGameDetailsUrl(request: NextRequest, id: string) {
  const query = new URLSearchParams();
  query.set('param', id);

  const platform =
    request.nextUrl.searchParams.get('platform') ||
    process.env.NEXT_PUBLIC_CLIENT_PLATFORM ||
    'android';
  const region =
    request.nextUrl.searchParams.get('region') ||
    process.env.NEXT_PUBLIC_CLIENT_REGION ||
    '';
  const clientVersion =
    request.nextUrl.searchParams.get('client_version') ||
    process.env.NEXT_PUBLIC_CLIENT_VERSION ||
    '';

  if (platform) query.set('platform', platform);
  if (region) query.set('region', region);
  if (clientVersion) query.set('client_version', clientVersion);

  return `${API_BASE_URL}/game/details?${query.toString()}`;
}

export async function middleware(request: NextRequest) {
  const id = getGameId(request.nextUrl.pathname);
  if (!id) return NextResponse.next();

  try {
    const response = await fetch(buildGameDetailsUrl(request, id), {
      cache: 'no-store',
      headers: {
        'x-tracking-skip': '1',
        'x-client-platform': 'web',
      },
    });

    if (!response.ok && response.status < 500) {
      return new NextResponse('Not Found', {
        status: 404,
        headers: {
          'Cache-Control': 'public, max-age=60',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      });
    }

    if (response.ok) {
      const payload = await response.json().catch(() => null);
      if (payload?.code !== 0 || !payload?.data?.app) {
        return new NextResponse('Not Found', {
          status: 404,
          headers: {
            'Cache-Control': 'public, max-age=60',
            'X-Robots-Tag': 'noindex, nofollow',
          },
        });
      }
    }
  } catch {
    // 后端暂时不可用时继续渲染页面，避免把临时故障标记为资源下线。
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/app/:path*'],
};
