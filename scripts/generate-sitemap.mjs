#!/usr/bin/env node
/**
 * 构建期静态 sitemap 生成器（prebuild），以及构建后把产物搬进 .next 的搬运步骤（postbuild）。
 *
 * 为什么需要它：运行时 /sitemap.xml 要串行/并发打几十个站点 API、拼 1.5 MB XML，接口一抖
 * 就只剩静态入口。构建期抓一遍落成静态文件，运行时优先直出，失败再回落实时生成。
 *
 * 用法：
 *   node scripts/generate-sitemap.mjs   # 抓全量数据 → public/sitemap.xml（写入 buildTime/urlCount 注释头）
 *   node scripts/generate-sitemap.mjs --stage-next
 *                                        # postbuild：把 public/sitemap.xml 复制到 <distDir>/server/sitemap.xml
 *                                        #（发布流程只上传 .next），随后移出 public 副本
 *
 * 失败策略：接口不可用 / 抓不到游戏目录时不写文件、不删除已有产物，退出码仍为 0——
 * 静态 sitemap 是加速与稳定性的优化，不能因为上游抖动把整条发布流水线卡死；运行时路由会自动降级。
 */
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

import { createSitemapBuilder, getServerApiBaseUrl, getSiteUrlFromEnv, serializeSitemapXml } from '../src/lib/sitemap-core.mjs';

const TAG = '[generate-sitemap]';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_SITEMAP = path.join(repoRoot, 'public', 'sitemap.xml');
const REQUEST_TIMEOUT_MS = 60_000;

function log(message) {
  console.log(`${TAG} ${message}`);
}

function warn(message) {
  console.warn(`${TAG} ${message}`);
}

/** 按 next build 的优先级加载 .env（先加载者优先，已存在的环境变量不被覆盖）。 */
function loadBuildEnv() {
  for (const file of ['.env.production.local', '.env.local', '.env.production', '.env']) {
    const absolute = path.join(repoRoot, file);
    if (existsSync(absolute)) {
      dotenv.config({ path: absolute });
      log(`加载环境文件 ${file}`);
    }
  }
}

/**
 * postbuild 阶段进程里 NODE_ENV 并没有被设为 production（那是 next build 内部行为），
 * 不能照抄代码里的 .next/.next-dev 二选一，否则产物会被搬进 .next-dev。
 * 以「目录里有 BUILD_ID」为准，优先 .next，其次 .next-dev。
 */
function resolveBuildDistDir() {
  const configured = String(process.env.NEXT_DIST_DIR || '').trim();
  const candidates = configured ? [configured] : ['.next', '.next-dev'];
  for (const candidate of candidates) {
    const absolute = path.isAbsolute(candidate) ? candidate : path.join(repoRoot, candidate);
    if (existsSync(path.join(absolute, 'BUILD_ID'))) return absolute;
  }
  return path.join(repoRoot, candidates[0]);
}

async function generate() {
  loadBuildEnv();

  const apiBaseUrl = getServerApiBaseUrl();
  const siteUrl = getSiteUrlFromEnv();
  const builder = createSitemapBuilder({ apiBaseUrl, siteUrl, requestTimeoutMs: REQUEST_TIMEOUT_MS });

  log(`数据源 ${apiBaseUrl}，站点 ${siteUrl}`);
  const startedAt = Date.now();
  const { entries, apiReachable, complete, stats } = await builder.buildEntries();

  if (!apiReachable) {
    warn('游戏目录接口无数据（API 不可达），本次不写静态 sitemap；运行时将回落实时生成');
    return 0;
  }

  // 分页/接口有失败时整体放弃：残缺快照会把 URL 静默删掉，比没有静态文件更糟。
  if (!complete) {
    warn('有分页接口抓取失败，本次不写静态 sitemap（避免生成残缺快照）；运行时将回落实时生成');
    return 0;
  }

  const buildTime = new Date().toISOString();
  const xml = serializeSitemapXml(entries, { buildTime });

  // 落盘前自检：写出去的文件必须能被运行时校验逻辑原样接受。
  const locCount = (xml.match(/<loc>/g) || []).length;
  if (locCount !== entries.length || locCount <= stats.staticPaths) {
    warn(`自检失败：序列化条目数 ${locCount} 与预期 ${entries.length} 不符，本次不写文件`);
    return 0;
  }

  await fs.mkdir(path.dirname(PUBLIC_SITEMAP), { recursive: true });
  await fs.writeFile(PUBLIC_SITEMAP, xml, 'utf8');

  log(
    `已写出 public/sitemap.xml（urlCount=${entries.length}；games=${stats.games}（质量审计过滤 ${stats.gamesSkippedByIndexable}） ` +
      `posts=${stats.posts} topics=${stats.topics} albums=${stats.albums} users=${stats.users}；${Date.now() - startedAt} ms）`,
  );
  // 机器可读自报，验收时与 `grep -c "<loc>"` 对比。
  log(`urlCount=${entries.length} buildTime=${buildTime}`);
  return 0;
}

async function stageToNext() {
  const distDir = resolveBuildDistDir();
  const target = path.join(distDir, 'server', 'sitemap.xml');

  if (!existsSync(PUBLIC_SITEMAP)) {
    warn('public/sitemap.xml 不存在（本次构建未生成静态 sitemap），跳过搬运；运行时将实时生成');
    return 0;
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.copyFile(PUBLIC_SITEMAP, target);
  // public/ 下的同名文件会被 Next 直接当静态资源返回，绕过路由里的校验与降级逻辑；
  // 同时 dev 模式遇到 public 文件与路由同名会直接 500。所以搬完就移出 public 副本。
  await fs.rm(PUBLIC_SITEMAP, { force: true });
  log(`已复制静态 sitemap 到 ${path.relative(repoRoot, target)}，并移出 public 副本（避免绕过运行时校验）`);
  return 0;
}

/** dev 前置清理：public 里的同名文件与 /sitemap.xml 路由冲突时，next dev 会直接 500。 */
async function prunePublicSitemap() {
  if (!existsSync(PUBLIC_SITEMAP)) return 0;
  await fs.rm(PUBLIC_SITEMAP, { force: true });
  log('已移除上次构建留在 public/sitemap.xml 的静态产物（与 /sitemap.xml 路由同名时 next dev 会 500）');
  return 0;
}

const args = new Set(process.argv.slice(2));
const exitCode = args.has('--stage-next')
  ? await stageToNext()
  : args.has('--prune-public')
    ? await prunePublicSitemap()
    : await generate();
process.exit(exitCode);
