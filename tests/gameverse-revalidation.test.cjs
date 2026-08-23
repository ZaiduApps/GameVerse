const test = require('node:test');
const assert = require('node:assert/strict');

async function loadModule() {
  return import('../src/lib/gameverse-revalidation.ts');
}

test('accepts a valid signature and rejects tampered input', async () => {
  const { verifyGameVerseSignature } = await loadModule();
  const body = JSON.stringify({ packages: ['com.tencent.rmos'], reason: 'game-seo-updated' });
  const { createHmac } = require('node:crypto');
  const signature = createHmac('sha256', 'test-secret').update(body).digest('hex');

  assert.equal(verifyGameVerseSignature(body, signature, 'test-secret'), true);
  assert.equal(verifyGameVerseSignature(`${body} `, signature, 'test-secret'), false);
  assert.equal(verifyGameVerseSignature(body, signature.slice(0, -1), 'test-secret'), false);
});

test('parses only canonical package names and deduplicates them', async () => {
  const { parseGameVerseRebuildPayload } = await loadModule();
  const payload = parseGameVerseRebuildPayload(JSON.stringify({
    packages: ['com.tencent.rmos', 'com.tencent.rmos'],
    reason: ' game-seo-updated ',
  }));

  assert.deepEqual(payload, {
    packages: ['com.tencent.rmos'],
    reason: 'game-seo-updated',
  });
  assert.equal(parseGameVerseRebuildPayload(JSON.stringify({ packages: ['../etc/passwd'] })), null);
  assert.equal(parseGameVerseRebuildPayload(JSON.stringify({ packages: ['invalid'] })), null);
});

test('rejects empty, oversized, and over-limit payloads', async () => {
  const { parseGameVerseRebuildPayload, MAX_REVALIDATION_PACKAGES, MAX_REVALIDATION_BODY_BYTES } = await loadModule();
  assert.equal(parseGameVerseRebuildPayload('{}'), null);
  assert.equal(parseGameVerseRebuildPayload(JSON.stringify({ packages: Array.from({ length: MAX_REVALIDATION_PACKAGES + 1 }, (_, i) => `com.example.game${i}`) })), null);
  assert.equal(parseGameVerseRebuildPayload('x'.repeat(MAX_REVALIDATION_BODY_BYTES + 1)), null);
});
