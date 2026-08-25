import assert from 'node:assert/strict';
import test from 'node:test';

import { evaluateWriteOutcome, normalizeSeo } from '../scripts/seo-write-game.mjs';

const matchingInput = {
  updateStatus: 200,
  afterPageStatus: 200,
  afterInfoStatus: 200,
  seoMismatchFields: [],
  businessChangedFields: [],
  ssrMatches: {
    status: true,
    title: true,
    description: true,
    canonical: true,
    robots: true,
  },
};

test('API 回读和静态 SSR 一致时只标记为 implemented', () => {
  const outcome = evaluateWriteOutcome(matchingInput);

  assert.equal(outcome.status, 'implemented');
  assert.equal(outcome.lifecycle.implemented, true);
  assert.equal(outcome.lifecycle.staticSsrObservable, true);
  assert.equal(outcome.lifecycle.browserDom, 'missing evidence');
  assert.equal(outcome.lifecycle.searchPlatform, 'not submitted');
});

test('静态 SSR 尚未反映写入时不会标记为已处理', () => {
  const outcome = evaluateWriteOutcome({
    ...matchingInput,
    ssrMatches: { ...matchingInput.ssrMatches, title: false },
  });

  assert.equal(outcome.status, 'implemented but not observable');
  assert.equal(outcome.lifecycle.implemented, true);
  assert.equal(outcome.lifecycle.staticSsrObservable, false);
});

test('Interface 回读 5xx 时写入闭环失败', () => {
  const outcome = evaluateWriteOutcome({ ...matchingInput, afterPageStatus: 500 });

  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.lifecycle.implemented, false);
  assert.equal(outcome.lifecycle.interfaceReadback, false);
});

test('业务字段发生变化时写入闭环失败', () => {
  const outcome = evaluateWriteOutcome({
    ...matchingInput,
    businessChangedFields: ['version'],
  });

  assert.equal(outcome.status, 'failed');
  assert.equal(outcome.lifecycle.implemented, false);
});

test('研究产物 candidateSeo 可直接作为写入输入', () => {
  const seo = normalizeSeo({
    packageName: 'com.example.game',
    sources: [],
    candidateSeo: {
      title: 'Example Game APK',
      description: 'Example Game for Android.',
      keywords: ['Example Game APK'],
      highlights: ['Offline play'],
    },
  });

  assert.deepEqual(seo, {
    title: 'Example Game APK',
    description: 'Example Game for Android.',
    keywords: ['Example Game APK'],
    highlights: ['Offline play'],
  });
});

test('既有写入记录 requested.seo 可用于安全重放校验', () => {
  const seo = normalizeSeo({ requested: { seo: { title: 'Example Game APK' } } });

  assert.deepEqual(seo, { title: 'Example Game APK' });
});
