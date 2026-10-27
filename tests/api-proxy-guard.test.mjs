import assert from 'node:assert/strict';
import test from 'node:test';

import {
  ALLOWED_API_SEGMENT_PREFIXES,
  DENIED_API_SEGMENTS,
  isDeniedApiPath,
  normalizeApiPathSegments,
} from '../src/lib/api-proxy-guard.ts';

test('拒绝名单里的后端模块在任意层级都被拦下', () => {
  const denied = [
    '/api/admin',
    '/api/admin/users',
    '/api/ADMIN/users',
    '/API/Admin/users',
    '/api/internal',
    '/api/internal/resource-worker/v1/health',
    '/api/api-docs',
    '/api/mcp',
    '/api/mcp/sse',
    '/api/task-scheduler/admin',
    '/api/logs',
    '/api/logs/admin/abc',
    '/api/resource-update',
    '/api/resource-update/admin/apkeep/accounts',
    '/api/resource-worker-gateway',
    '/api/game/logs',
    '/api/x/internal/y',
  ];

  for (const pathname of denied) {
    assert.equal(isDeniedApiPath(pathname), true, `${pathname} 应被拒绝`);
  }
});

test('规范化覆盖百分号编码、重复斜杠、点段与反斜杠', () => {
  const denied = [
    '/api/%61dmin',
    '/api/%2561dmin',
    '/api//admin',
    '/api/x/../admin',
    '/api/x/./admin',
    '/api\\admin',
    '/api/x/%2e%2e/internal',
  ];

  for (const pathname of denied) {
    assert.equal(isDeniedApiPath(pathname), true, `${pathname} 应被拒绝`);
  }
});

test('社区版主的 content/admin 接口保持可用', () => {
  const allowed = [
    '/api/content/admin/68f0c2e4b7c3a1d2e3f4a5b6',
    '/api/content/admin/abc/status',
    '/API/content/admin/abc',
  ];

  for (const pathname of allowed) {
    assert.equal(isDeniedApiPath(pathname), false, `${pathname} 应放行`);
  }
});

test('正常业务接口与段边界不被误伤', () => {
  const allowed = [
    '/',
    '/api',
    '/api/',
    '/api/game/details',
    '/api/news/search',
    '/api/notifications/summary',
    '/api/content/my/posts',
    '/api/administer',
    '/api/internal-tools',
    '/api/mcpx',
    '/api/log-stream',
    '/app/admin',
    '/news/admin',
  ];

  for (const pathname of allowed) {
    assert.equal(isDeniedApiPath(pathname), false, `${pathname} 应放行`);
  }
});

test('畸形百分号编码按拒绝处理', () => {
  for (const pathname of ['/api/%E0%A4%A', '/api/admin%zz']) {
    assert.equal(isDeniedApiPath(pathname), true, `${pathname} 解码失败应拒绝`);
  }
  assert.equal(normalizeApiPathSegments('/api/%E0%A4%A'), null);
});

test('拒绝名单与豁免前缀保持与契约一致', () => {
  assert.deepEqual(
    [...DENIED_API_SEGMENTS].sort(),
    [
      'admin',
      'api-docs',
      'internal',
      'logs',
      'mcp',
      'resource-update',
      'resource-worker-gateway',
      'task-scheduler',
    ],
  );
  assert.deepEqual(ALLOWED_API_SEGMENT_PREFIXES, [['content', 'admin']]);
});
