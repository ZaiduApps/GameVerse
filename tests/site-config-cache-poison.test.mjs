import assert from 'node:assert/strict';
import test, { afterEach, beforeEach } from 'node:test';

import { getPublicSiteConfig } from '../src/lib/site-config.ts';

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

const siteConfigPayload = {
  code: 0,
  message: 'ok',
  data: { basic: { site_name: 'APKScc' } },
};

beforeEach(() => {
  console.error = () => {};
  console.warn = () => {};
});

afterEach(() => {
  globalThis.fetch = realFetch;
  delete globalThis.__GAME_REVIEW_API_STUB__;
  console.error = realConsole.error;
  console.warn = realConsole.warn;
});

test('site-config：网络层抛错后毒化 cacheKey，本次与后续调用都改走 _poison 旁路', async () => {
  let firstAttempt = true;
  installFetch((path) => {
    if (firstAttempt) {
      firstAttempt = false;
      throw new Error('fetch failed');
    }
    return jsonResponse(siteConfigPayload);
  });

  const first = await getPublicSiteConfig(300, { retries: 0 });
  // 首次走正常 force-cache URL，报错后同一次调用里用旁路 URL 补一次，页面不至于空着。
  assert.equal(first?.basic?.site_name, 'APKScc');
  assert.equal(calls.length, 2);
  assert.match(calls[0].path, /\/config\/site\/public\?key=main$/);
  assert.equal(calls[0].init.cache, 'force-cache');
  assert.match(calls[1].path, /\/config\/site\/public\?key=main&_poison=\d+$/);
  assert.equal(calls[1].init.cache, 'no-store');
  // no-store 与 next 不能同时给，否则 Next 会直接报错。
  assert.equal(calls[1].init.next, undefined);

  const second = await getPublicSiteConfig(300);
  // 毒化窗口内不再碰被毒化的 cacheKey：直接走旁路 URL + no-store。
  assert.equal(second?.basic?.site_name, 'APKScc');
  assert.equal(calls.length, 3);
  assert.match(calls[2].path, /&_poison=\d+$/);
  assert.equal(calls[2].init.cache, 'no-store');
  assert.equal(calls[2].init.next, undefined);
});
