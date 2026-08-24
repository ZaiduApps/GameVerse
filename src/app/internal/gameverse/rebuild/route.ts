import { revalidatePath, revalidateTag } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

import {
  MAX_REVALIDATION_BODY_BYTES,
  parseGameVerseRebuildPayload,
  verifyGameVerseSignature,
} from '@/lib/gameverse-revalidation';
import { gamePageCacheTag } from '@/lib/game-page-cache';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const secret = String(process.env.GAMEVERSE_REBUILD_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    return NextResponse.json({ error: 'revalidation_not_configured' }, { status: 503 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REVALIDATION_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  const body = await request.text();
  if (Buffer.byteLength(body, 'utf8') > MAX_REVALIDATION_BODY_BYTES) {
    return NextResponse.json({ error: 'payload_too_large' }, { status: 413 });
  }

  if (!verifyGameVerseSignature(body, request.headers.get('x-gameverse-signature'), secret)) {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 401 });
  }

  const payload = parseGameVerseRebuildPayload(body);
  if (!payload) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  for (const pkg of payload.packages) {
    // 只失效规范包名详情页，避免 webhook 被利用来清空任意 Next 路由缓存。
    revalidatePath(`/app/${pkg}`, 'page');
    revalidateTag(gamePageCacheTag(pkg));
  }

  return NextResponse.json({
    ok: true,
    packages: payload.packages,
    reason: payload.reason,
  });
}
