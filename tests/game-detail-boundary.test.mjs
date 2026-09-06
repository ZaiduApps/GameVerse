import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const readSource = (relativePath) => readFile(new URL(relativePath, import.meta.url), 'utf8');

const [
  pageSource,
  viewSource,
  actionsSource,
  gallerySource,
  lightboxSource,
  presenterSource,
  communitySource,
  communityFeedSource,
  reviewSource,
  downloadDialogSource,
  headerSource,
  nextConfigSource,
  layoutSource,
  globalsSource,
] = await Promise.all([
  readSource('../src/app/app/[id]/page.tsx'),
  readSource('../src/app/app/[id]/GameDetailView.tsx'),
  readSource('../src/app/app/[id]/GameDetailActions.client.tsx'),
  readSource('../src/app/app/[id]/GameScreenshotGallery.client.tsx'),
  readSource('../src/app/app/[id]/GameScreenshotLightbox.client.tsx'),
  readSource('../src/app/app/[id]/game-detail-presenter.ts'),
  readSource('../src/app/app/[id]/GameCommunitySection.tsx'),
  readSource('../src/app/app/[id]/GameCommunityFeed.client.tsx'),
  readSource('../src/app/app/[id]/DeferredGameReviewPanel.client.tsx'),
  readSource('../src/components/game-download-dialog.tsx'),
  readSource('../src/components/layout/header.tsx'),
  readSource('../next.config.ts'),
  readSource('../src/app/layout.tsx'),
  readSource('../src/app/globals.css'),
]);

test('详情路由允许新包名按需生成并兼容页游 ObjectId', () => {
  assert.match(pageSource, /export const dynamicParams = true/);
  assert.match(pageSource, /isCanonicalPackageName\(input\) \|\| \/\^\[a-fA-F0-9\]\{24\}\$\//);
  assert.match(pageSource, /if \(!isValidGameIdentifier\(id\)\) \{\s*notFound\(\)/);
  assert.match(pageSource, /<GameDetailView\s+gameData=\{initialGameData\}/);
});

test('静态构建只预生成最近的高质量游戏并保留完整动态覆盖', () => {
  assert.match(pageSource, /const STATIC_PARAMS_DEFAULT_LIMIT = 100/);
  assert.match(pageSource, /const STATIC_PARAMS_HARD_LIMIT = 500/);
  assert.match(pageSource, /process\.env\.GAME_DETAIL_PREBUILD_LIMIT/);
  assert.match(pageSource, /\/seo\/audit\/games\?page=1&pageSize=\$\{STATIC_PARAMS_LIMIT\}/);
  assert.match(pageSource, /item\?\.quality\?\.indexable !== true/);
  assert.doesNotMatch(pageSource, /STATIC_PARAMS_MAX_PAGES|\/seo\/sitemap\/games\?page=/);
  assert.match(pageSource, /export const dynamicParams = true/);
});

test('详情页缓存只由 Next ISR 管理', () => {
  assert.match(pageSource, /export const revalidate = 900/);
  assert.match(nextConfigSource, /staticGenerationMaxConcurrency: 2/);
  assert.doesNotMatch(nextConfigSource, /s-maxage=900|source:\s*['"]\/app\/:path\*['"]/);
});

test('详情主体是无客户端取数的 Server Component 且只维护一套响应式 DOM', () => {
  assert.doesNotMatch(viewSource, /^['"]use client['"]/);
  assert.doesNotMatch(viewSource, /trackedApiFetch|useEffect|useState|isDesktopViewport|initialDataMode/);
  assert.equal((viewSource.match(/<h1\b/g) || []).length, 1);
  assert.match(viewSource, /<GameDetailActions/);
  assert.match(viewSource, /lg:grid-cols-\[minmax\(0,2fr\)_minmax\(340px,1fr\)\]/);
});

test('完整介绍由服务端一次输出并仅通过 CSS 改变可见高度', () => {
  assert.match(viewSource, /const fullDescriptionHtml = formatDescriptionHtml/);
  assert.match(viewSource, /dangerouslySetInnerHTML=\{\{ __html: fullDescriptionHtml \}\}/);
  assert.match(viewSource, /peer-checked:max-h-\[9999px\]/);
  assert.doesNotMatch(viewSource, /shortDescription|showFullDescription|\.slice\(0, 1200\)/);
  assert.match(presenterSource, /export function formatDescriptionHtml/);
});

test('首屏样式确定且非首屏截图不声明高优先级', () => {
  assert.match(viewSource, /TAG_STYLE_PALETTES\[index % TAG_STYLE_PALETTES\.length\]/);
  assert.doesNotMatch(presenterSource, /Math\.random|shuffleArray/);
  assert.doesNotMatch(gallerySource, /\bpriority\b|fetchPriority/);
  assert.match(viewSource, /getPreviewImageUrl\(game\.icon, 320\)/);
  assert.match(viewSource, /getPreviewImageUrl\(item\.icon, 112\)/);
  assert.match(gallerySource, /getPreviewImageUrl\(url, previewImageWidth\(aspect\)\)/);
  assert.match(communityFeedSource, /getPreviewImageUrl\(post\.userAvatarUrl, 80\)/);
  assert.match(communityFeedSource, /loading="lazy"/);
});

test('中文正文使用系统字体栈且不加载站点级中文 WebFont', () => {
  assert.doesNotMatch(layoutSource, /noto-sans-sc\.css|\/fonts\/NotoSansSC-/);
  assert.doesNotMatch(globalsSource, /["']NotoSansSC["']/);
  assert.match(
    globalsSource,
    /--font-body:\s*"Noto Sans SC",\s*"PingFang SC",\s*"Microsoft YaHei"/,
  );
});

test('重型弹窗和截图灯箱只在交互后挂载', () => {
  assert.match(actionsSource, /dynamic\(\(\) => import\('@\/components\/auth\/auth-modal'\)/);
  assert.match(actionsSource, /dynamic\(\(\) => import\('@\/components\/game-download-dialog'\)/);
  assert.match(actionsSource, /downloadOpen \? <GameDownloadDialog/);
  assert.match(actionsSource, /authModalOpen \? <AuthModal/);
  assert.match(gallerySource, /dynamic\(\(\) => import\('\.\/GameScreenshotLightbox\.client'\)/);
  assert.match(gallerySource, /previewIndex !== null \? \(/);
  assert.match(lightboxSource, /event\.key === 'Tab'/);
  assert.match(lightboxSource, /closeButtonRef\.current\?\.focus\(\)/);
  assert.match(downloadDialogSource, /hideTrigger\?: boolean/);
  assert.match(downloadDialogSource, /open=\{open\}/);
  assert.match(headerSource, /dynamic\(\(\) => import\('@\/components\/layout\/SearchOverlay'\), \{ ssr: false \}\)/);
  assert.match(headerSource, /dynamic\(\(\) => import\('@\/components\/auth\/auth-modal'\), \{ ssr: false \}\)/);
  assert.match(headerSource, /searchOverlayOpen \? \(/);
  assert.match(headerSource, /authModalOpen \? <AuthModal/);
});

test('详情页顶部导航仅在用户表达意图后预取', () => {
  assert.match(headerSource, /const deferNavigationPrefetch = pathname\.startsWith\('\/app\/'\)/);
  assert.match(headerSource, /const navigationPrefetch = deferNavigationPrefetch \? false : null/);
  assert.match(headerSource, /if \(deferNavigationPrefetch\) router\.prefetch\(href\)/);
  assert.ok((headerSource.match(/prefetch=\{navigationPrefetch\}/g) || []).length >= 4);
  assert.match(headerSource, /onMouseEnter=\{\(\) => prefetchOnIntent\(item\.href\)\}/);
  assert.match(headerSource, /onFocus=\{\(\) => prefetchOnIntent\(item\.href\)\}/);
  assert.match(actionsSource, /href="\/community"\s+prefetch=\{false\}/);
  assert.match(actionsSource, /onMouseEnter=\{\(\) => router\.prefetch\('\/community'\)\}/);
  assert.match(actionsSource, /onFocus=\{\(\) => router\.prefetch\('\/community'\)\}/);
});

test('社区内容通过服务端 Suspense 区块获取，客户端岛只负责排序', () => {
  assert.match(viewSource, /<Suspense fallback=\{<GameCommunitySkeleton \/>\}>/);
  assert.match(communitySource, /Promise\.allSettled/);
  assert.match(communitySource, /getCommunityPostsByGame/);
  assert.match(communitySource, /maxQueryCandidates: 2/);
  assert.match(communitySource, /warnOnFailure: true/);
  assert.match(communitySource, /COMMUNITY_FEED_REVALIDATE_SECONDS = 300/);
  assert.match(communitySource, /process\.env\.NEXT_PHASE !== 'phase-production-build'/);
  assert.doesNotMatch(communityFeedSource, /getCommunityPostsByGame|trackedApiFetch|useEffect/);
});

test('评价模块与整页状态解耦并按视口延迟加载', () => {
  assert.match(reviewSource, /dynamic\(\(\) => import\('@\/components\/game-detail\/GameReviewPanel'\)/);
  assert.match(reviewSource, /ssr: false/);
  assert.match(reviewSource, /new IntersectionObserver/);
  assert.match(reviewSource, /rootMargin: '600px 0px'/);
  assert.match(reviewSource, /isNearViewport && compact !== null/);
  assert.match(reviewSource, /min-h-\[31rem\]/);
  assert.match(reviewSource, /window\.matchMedia\('\(max-width: 1023px\)'\)/);
  assert.match(viewSource, /summary=\{gameData\.reviewSummary\}/);
});
