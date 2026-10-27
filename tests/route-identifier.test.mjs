import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import { getAlbumDetail } from '../src/lib/albums.ts';
import { getCommunityPostById, getCommunityTopicDetailOrThrow } from '../src/lib/community-api.ts';
import { getPublicProfileOrThrow } from '../src/lib/public-profile-api.ts';
import {
  decodeRouteSegment,
  isAlbumIdentifier,
  isCommunityPostId,
  isCommunityTopicIdentifier,
  isPublicProfileIdentifier,
} from '../src/lib/route-identifier.ts';

const realFetch = globalThis.fetch;
const realConsole = { error: console.error, warn: console.warn };
let calls = [];

function installFetch(handler) {
  calls = [];
  globalThis.fetch = async (path, init) => {
    calls.push({ path: String(path), init: init || {} });
    return handler(path, init);
  };
  globalThis.__GAME_REVIEW_API_STUB__ = {
    fetch: (path, init) => globalThis.fetch(path, init),
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  console.error = () => {};
  console.warn = () => {};
  installFetch(() => jsonResponse({ code: 0, message: 'ok', data: null }));
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
  console.error = realConsole.error;
  console.warn = realConsole.warn;
});

test('形状校验放行线上真实形态（含中文/纯数字话题 slug、邮箱用户名）', () => {
  assert.equal(isCommunityPostId('6ae01ad7d206ebb734ce7488'), true);
  assert.equal(isCommunityPostId('not-an-object-id'), false);
  assert.equal(isCommunityPostId('6ae01ad7d206ebb734ce748'), false);

  assert.equal(isCommunityTopicIdentifier('互联网精神'), true);
  assert.equal(isCommunityTopicIdentifier('21937'), true);
  assert.equal(isCommunityTopicIdentifier('game-com-neowizgames-game-browndust2'), true);
  assert.equal(isCommunityTopicIdentifier('6ae01ad7d206ebb734ce7488'), true);
  assert.equal(isCommunityTopicIdentifier('../etc/passwd'), false);
  assert.equal(isCommunityTopicIdentifier('a b'), false);

  assert.equal(isPublicProfileIdentifier('zaidu'), true);
  assert.equal(isPublicProfileIdentifier('zaidu9528@gmail.com'), true);
  assert.equal(isPublicProfileIdentifier('6a2ea3e26c64ce21cc626e2a'), true);
  assert.equal(isPublicProfileIdentifier('bad/user'), false);
  assert.equal(isPublicProfileIdentifier('bad user'), false);

  assert.equal(isAlbumIdentifier('67f000000000000000000031'), true);
  assert.equal(isAlbumIdentifier('67f00000000000000000003'), false);

  assert.equal(decodeRouteSegment('%E4%BA%92%E8%81%94%E7%BD%91%E7%B2%BE%E7%A5%9E'), '互联网精神');
  assert.equal(decodeRouteSegment('zaidu9528%40gmail.com'), 'zaidu9528@gmail.com');
  // 非法转义不抛 URIError，交给调用方 404。
  assert.equal(decodeRouteSegment('%E0%A4%A'), null);
});

test('非法形状不发上游请求：社区帖子返回 null（页面据此 notFound）', async () => {
  assert.equal(await getCommunityPostById('not-an-object-id'), null);
  assert.equal(calls.length, 0);
});

test('非法形状不发上游请求：话题返回 notFound', async () => {
  assert.equal(await getCommunityTopicDetailOrThrow('../secret'), null);
  assert.equal(calls.length, 0);
});

test('非法形状不发上游请求：用户主页返回 null（页面据此 notFound）', async () => {
  assert.equal(await getPublicProfileOrThrow('bad user name'), null);
  assert.equal(calls.length, 0);
});

test('非法形状不发上游请求：专辑返回 null（页面据此 notFound）', async () => {
  assert.equal(await getAlbumDetail('not-an-album'), null);
  assert.equal(calls.length, 0);
});

test('合法形状照常请求：帖子 id 走 encodeURIComponent 后的 detail 接口', async () => {
  installFetch(() =>
    jsonResponse({
      code: 0,
      message: 'ok',
      data: { _id: '6ae01ad7d206ebb734ce7488', title: '标题', content: '正文' },
    }),
  );

  const post = await getCommunityPostById('6ae01ad7d206ebb734ce7488');
  assert.equal(post?.id, '6ae01ad7d206ebb734ce7488');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].path, '/content/public/6ae01ad7d206ebb734ce7488');
});
