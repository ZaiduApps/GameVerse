import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveRouteTemplate } from '../src/lib/route-template.ts';

test('静态路由原样返回', () => {
  const staticRoutes = [
    '/',
    '/app',
    '/albums',
    '/community',
    '/community/topics',
    '/news',
    '/rankings',
    '/download',
    '/download/app',
    '/messages',
    '/profile',
    '/profile/api-keys',
    '/profile/center',
    '/profile/center/downloads',
    '/profile/center/games',
    '/profile/center/posts',
    '/profile/center/reservations',
    '/profile/center/topics',
    '/submit-resource',
    '/about',
    '/contact',
    '/terms',
    '/privacy-policy',
  ];
  for (const route of staticRoutes) {
    assert.equal(resolveRouteTemplate(route), route);
  }
});

test('单段动态路由收敛成模板', () => {
  assert.equal(resolveRouteTemplate('/app/com.tencent.tmgp.sgame'), '/app/[id]');
  assert.equal(resolveRouteTemplate('/albums/6712ab'), '/albums/[id]');
  assert.equal(resolveRouteTemplate('/community/post/abc123'), '/community/post/[id]');
  assert.equal(resolveRouteTemplate('/community/topic/abc'), '/community/topic/[idOrSlug]');
  assert.equal(resolveRouteTemplate('/news/42'), '/news/[id]');
  assert.equal(resolveRouteTemplate('/u/alice'), '/u/[idOrUsername]');
});

test('尾斜杠与查询串先归一化', () => {
  assert.equal(resolveRouteTemplate('/'), '/');
  assert.equal(resolveRouteTemplate('/app/'), '/app');
  assert.equal(resolveRouteTemplate('/community/topics/'), '/community/topics');
  assert.equal(resolveRouteTemplate('/app/com.tencent.tmgp.sgame/'), '/app/[id]');
  assert.equal(resolveRouteTemplate('/app?category=%E5%B0%84%E5%87%BB'), '/app');
  assert.equal(resolveRouteTemplate('/app/com.tencent.tmgp.sgame?from=push#top'), '/app/[id]');
});

test('未知路径不猜模板，原样返回', () => {
  assert.equal(resolveRouteTemplate('/internal/gameverse/rebuild'), '/internal/gameverse/rebuild');
  assert.equal(resolveRouteTemplate('/internal'), '/internal');
  assert.equal(resolveRouteTemplate('/app/a/b'), '/app/a/b');
  assert.equal(resolveRouteTemplate('/community/post/abc/extra'), '/community/post/abc/extra');
  assert.equal(resolveRouteTemplate('/not-a-route'), '/not-a-route');
  assert.equal(resolveRouteTemplate('/appx/com.foo'), '/appx/com.foo');
});
