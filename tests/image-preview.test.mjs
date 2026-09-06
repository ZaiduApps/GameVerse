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
const { getPreviewImageUrl } = await import(
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
