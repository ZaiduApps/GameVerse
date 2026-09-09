import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/lib/image-preview.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ES2022,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const { getPreviewImageUrl, getResponsiveImageAttributes } = await import(
  `data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`
);

test('Google Play 图片使用有界宽度变体并替换旧参数', () => {
  const base = 'https://play-lh.googleusercontent.com/example-image';
  assert.equal(getPreviewImageUrl(base, 112), `${base}=w112-rw`);
  assert.equal(
    getPreviewImageUrl(`${base}=w2560-h1440-rw`, 112),
    `${base}=w112-rw`,
  );
  assert.equal(getPreviewImageUrl(base, 12), `${base}=w32-rw`);
  assert.equal(getPreviewImageUrl(base, 9000), `${base}=w2560-rw`);
});

test('现有图床图片使用已支持的 WebP 路径且保留查询参数', () => {
  const sourceUrl = 'https://tc-new.z.wiki/autoupload/example/image.png?type=ha';
  assert.equal(
    getPreviewImageUrl(sourceUrl, 112),
    'https://tc-new.z.wiki/autoupload/example/image.png/webp?type=ha',
  );
  assert.equal(
    getPreviewImageUrl('https://img.pagehost.cn/example/image.jpg', 112),
    'https://img.pagehost.cn/example/image.jpg/webp',
  );
  assert.equal(
    getPreviewImageUrl('https://tc-new.z.wiki/example/image.png/webp', 112),
    'https://tc-new.z.wiki/example/image.png/webp',
  );
});

test('未知图源、相对地址和无效宽度保持原地址', () => {
  assert.equal(
    getPreviewImageUrl('https://cdn.apks.cc/uploads/example.png', 112),
    'https://cdn.apks.cc/uploads/example.png',
  );
  assert.equal(getPreviewImageUrl('/favicon.ico', 112), '/favicon.ico');
  assert.equal(
    getPreviewImageUrl('https://play-lh.googleusercontent.com/example-image', Number.NaN),
    'https://play-lh.googleusercontent.com/example-image',
  );
});

test('Google Play 响应式图片保留原始 src 并提供有界候选', () => {
  const sourceUrl = 'https://play-lh.googleusercontent.com/example-image=w2560-h1440-rw';
  const attributes = getResponsiveImageAttributes(sourceUrl);

  assert.equal(attributes.src, sourceUrl);
  assert.equal(
    attributes.srcSet,
    [320, 640, 960, 1280, 1920, 2560]
      .map((width) => `https://play-lh.googleusercontent.com/example-image=w${width}-rw ${width}w`)
      .join(', '),
  );
});

test('Google Play 响应式候选不超过源 URL 声明宽度', () => {
  const sourceUrl = 'https://play-lh.googleusercontent.com/example-image=w1280-rw';
  const attributes = getResponsiveImageAttributes(sourceUrl);

  assert.match(attributes.srcSet, /=w1280-rw 1280w$/);
  assert.doesNotMatch(attributes.srcSet, /1920w|2560w/);
});

test('无宽度参数的 Google Play 图片保持原请求', () => {
  const sourceUrl = 'https://play-lh.googleusercontent.com/example-image';
  assert.deepEqual(getResponsiveImageAttributes(sourceUrl), { src: sourceUrl });
});

test('非 Google Play 图源不生成响应式候选', () => {
  assert.deepEqual(
    getResponsiveImageAttributes('https://cdn.apks.cc/uploads/example.webp'),
    { src: 'https://cdn.apks.cc/uploads/example.webp' },
  );
  assert.deepEqual(getResponsiveImageAttributes('/fallback.webp'), { src: '/fallback.webp' });
  assert.deepEqual(getResponsiveImageAttributes(''), { src: '' });
});
