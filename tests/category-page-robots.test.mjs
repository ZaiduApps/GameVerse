import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

import { register } from 'node:module';
import test from 'node:test';
import ts from 'typescript';

register('./helpers/react-cache-stub-loader.mjs', import.meta.url);
register('./helpers/src-resolve-hook.mjs', import.meta.url);

import { trackedApiFetch } from '@/lib/api';
import { absoluteUrl, buildSeoDescription } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';
import {
  CATEGORY_PAGES,
  buildCategoryPath,
  categoryDisplayName,
  resolveCategoryBySlug,
} from '@/lib/category-pages';
import {
  CATEGORY_PAGE_API_TIMEOUT_MS,
  CATEGORY_PAGE_RETRY_TIMEOUT_MS,
  emptyCategoryPayload,
  loadCategoryPageWithRetry,
} from '@/lib/category-page-resilience';
import { resolveGameName } from '@/lib/game-display-name';
import { buildGameCardMeta } from '@/lib/game-card-meta';
import { getPreviewImageUrl } from '@/lib/image-preview';
import { BREADCRUMB_ROOT } from '@/lib/breadcrumbs';

const here = path.dirname(fileURLToPath(import.meta.url));

// 派发单 #C 验收：降级空态（接口两次失败渲染的 200 空页）的第 1 页必须 noindex,follow；
// 正常第 1 页仍然 index。直接调用 page.tsx 的 generateMetadata 断言 robots 判据，
// 链路里的 trackedApiFetch 用注入替换：健康 = 真实实现，降级 = 必抛桩。

/** 只给 page.tsx 当占位依赖：generateMetadata 不渲染组件，占位永远不会被调用。 */
function stubModule(name) {
  const Stub = () => null;
  return { default: Stub, __esModule: true };
}

/** 把 page.tsx 编译成 CJS，注入指定实现的依赖后取出 generateMetadata。 */
async function loadPageMetadata({ apiImpl }) {
  const source = await readFile(path.join(here, '../src/app/category/[slug]/page.tsx'), 'utf8');
  const compiled = ts.transpileModule(source, {
    fileName: 'page.tsx',
    compilerOptions: {
      jsx: ts.JsxEmit.ReactJSX,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
  }).outputText;

  const modules = {
    // react 18.3.1 没有 cache：react-cache-stub-loader 已把 'react' 换成只导出 cache 的桩，
    // 这里直接透传同一份给 page.tsx。
    react: await import('react'),
    'react/jsx-runtime': { jsx: () => null, jsxs: () => null, Fragment: 'Fragment', __esModule: true },
    'next/image': stubModule('next/image'),
    'next/navigation': { notFound: () => { throw new Error('notFound'); }, __esModule: true },
    'next/link': stubModule('next/link'),
    'lucide-react': stubModule('lucide-react'),
    '@/components/layout/Breadcrumbs': stubModule('Breadcrumbs'),
    '@/lib/api': { trackedApiFetch: apiImpl, __esModule: true },
    '@/lib/breadcrumbs': { BREADCRUMB_ROOT, __esModule: true },
    '@/lib/seo': { absoluteUrl, buildSeoDescription, __esModule: true },
    '@/lib/site-config': { getPublicSiteConfig, __esModule: true },
    '@/lib/category-pages': {
      CATEGORY_PAGES,
      buildCategoryPath,
      categoryDisplayName,
      resolveCategoryBySlug,
      __esModule: true,
    },
    '@/lib/category-page-resilience': {
      CATEGORY_PAGE_API_TIMEOUT_MS,
      CATEGORY_PAGE_RETRY_TIMEOUT_MS,
      emptyCategoryPayload,
      loadCategoryPageWithRetry,
      __esModule: true,
    },
    '@/lib/game-display-name': { resolveGameName, __esModule: true },
    '@/lib/game-card-meta': { buildGameCardMeta, __esModule: true },
    '@/lib/image-preview': { getPreviewImageUrl, __esModule: true },
  };

  const module_ = { exports: {} };
  const context = {
    require: (id) => {
      if (Object.prototype.hasOwnProperty.call(modules, id)) return modules[id];
      throw new Error(`page.tsx 引入了未注入的模块: ${id}`);
    },
    module: module_,
    exports: module_.exports,
    process,
    console,
    URL,
    URLSearchParams,
    setTimeout,
    clearTimeout,
  };
  vm.runInNewContext(compiled, context, { filename: 'page.tsx' });
  return module_.exports.generateMetadata;
}

async function metadataFor(generateMetadata, { slug = 'rpg', page } = {}) {
  return generateMetadata({
    params: Promise.resolve({ slug }),
    searchParams: Promise.resolve(page ? { page: String(page) } : {}),
  });
}

test('正常分类第 1 页：index,follow', async () => {
  const generateMetadata = await loadPageMetadata({ apiImpl: trackedApiFetch });
  const metadata = await metadataFor(generateMetadata);
  // robots 对象产自 vm 上下文，跨 realm 的 deepEqual 会误报原型差异，逐字段断言。
  assert.equal(metadata.robots.index, true);
  assert.equal(metadata.robots.follow, true);
}, { timeout: 30000 });

test('正常分类第 2 页：noindex,follow', async () => {
  const generateMetadata = await loadPageMetadata({ apiImpl: trackedApiFetch });
  const metadata = await metadataFor(generateMetadata, { page: 2 });
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, true);
}, { timeout: 30000 });

test('降级空态第 1 页：noindex,follow（不进索引）', async () => {
  const deadApi = async () => {
    throw new Error('stub api unavailable');
  };
  const generateMetadata = await loadPageMetadata({ apiImpl: deadApi });
  const metadata = await metadataFor(generateMetadata);
  assert.equal(metadata.robots.index, false);
  assert.equal(metadata.robots.follow, true);
  // 空态标题不带假计数，证明这条链路确实走到了 degraded 分支。
  assert.match(metadata.title.absolute, /推荐 - APKScc$/);
}, { timeout: 30000 });
