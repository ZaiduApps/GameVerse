#!/usr/bin/env node
/**
 * 构建期静态 sitemap 生成器（prebuild），以及构建后把产物搬进 .next 的搬运步骤（postbuild）。
 *
 * 为什么需要它：运行时 /sitemap.xml 要串行/并发打几十个站点 API、拼 1.5 MB XML，接口一抖
 * 就只剩静态入口。构建期抓一遍落成静态文件，运行时优先直出，失败再回落实时生成。
 *
 * sitemap 分层（#126）：一次抓取产出两份文件——
 *   public/sitemap.xml           主 sitemap：详情页 + 分类/榜单/静态入口 + /search?q=
 *   public/sitemap-community.xml 社区 sitemap：社区静态入口 + albums/topics/posts
 * main 与 community 的完整性各自判定：一份残缺只跳过那一份，另一份照常落盘。
 *
 * 用法：
 *   node scripts/generate-sitemap.mjs   # 抓全量数据 → public/ 两份 sitemap（写入 buildTime/urlCount 注释头）
 *   node scripts/generate-sitemap.mjs --stage-next
 *                                        # postbuild：把 public/ 两份复制到 <distDir>/server/
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
const PUBLIC_DIR = path.join(repoRoot, 'public');
// 与运行时路由的候选一一对应：main → /sitemap.xml，community → /sitemap-community.xml。
const SITEMAP_FILES = [
  { key: 'main', fileName: 'sitemap.xml' },
  { key: 'community', fileName: 'sitemap-community.xml' },
];
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
  const { sections, apiReachable, complete, stats } = await builder.buildEntries();

  if (!apiReachable) {
    warn('游戏目录接口无数据（API 不可达），本次不写静态 sitemap；运行时将回落实时生成');
    return 0;
  }

  const buildTime = new Date().toISOString();
  let written = 0;
  for (const { key, fileName } of SITEMAP_FILES) {
    const entries = sections[key];
    // 分页/接口有失败时只放弃该份：残缺快照会把 URL 静默删掉，比没有静态文件更糟。
    if (!complete[key]) {
      warn(`${fileName} 有分页接口抓取失败，本次不写（避免生成残缺快照）；运行时将回落实时生成`);
      continue;
    }
    const xml = serializeSitemapXml(entries, { buildTime });
    // 落盘前自检：写出去的文件必须能被运行时校验逻辑原样接受。
    const locCount = (xml.match(/<loc>/g) || []).length;
    if (locCount !== entries.length || (key === 'main' && locCount <= stats.staticMain)) {
      warn(`${fileName} 自检失败：序列化条目数 ${locCount} 与预期 ${entries.length} 不符，本次不写文件`);
      continue;
    }
    await fs.mkdir(PUBLIC_DIR, { recursive: true });
    await fs.writeFile(path.join(PUBLIC_DIR, fileName), xml, 'utf8');
    written += 1;
    log(`已写出 public/${fileName}（urlCount=${entries.length}）`);
  }

  if (written > 0) {
    // 机器可读自报，验收时与 `grep -c "<loc>"` 对比。
    log(
      `urlCount main=${sections.main.length} community=${sections.community.length} buildTime=${buildTime}；` +
        `games=${stats.games}（未发布剔除 ${stats.gamesSkippedUnpublished}、质量审计过滤 ${stats.gamesSkippedByIndexable}） ` +
        `posts=${stats.posts} topics=${stats.topics} albums=${stats.albums} search=${stats.search}；${Date.now() - startedAt} ms`,
    );
  }
  return 0;
}

async function stageToNext() {
  const distDir = resolveBuildDistDir();
  const missing = [];
  const present = SITEMAP_FILES.filter(({ fileName }) => existsSync(path.join(PUBLIC_DIR, fileName)));

  if (present.length === 0) {
    warn('public/ 里没有任何静态 sitemap（本次构建未生成），跳过搬运；运行时将实时生成');
    return 0;
  }

  await fs.mkdir(path.join(distDir, 'server'), { recursive: true });
  for (const { fileName } of present) {
    const target = path.join(distDir, 'server', fileName);
    await fs.copyFile(path.join(PUBLIC_DIR, fileName), target);
    // public/ 下的同名文件会被 Next 直接当静态资源返回，绕过路由里的校验与降级逻辑；
    // 同时 dev 模式遇到 public 文件与路由同名会直接 500。所以搬完就移出 public 副本。
    await fs.rm(path.join(PUBLIC_DIR, fileName), { force: true });
    missing.push(path.relative(repoRoot, target));
  }
  log(`已复制静态 sitemap 到 ${missing.join('、')}，并移出 public 副本（避免绕过运行时校验）`);
  return 0;
}

/** dev 前置清理：public 里的同名文件与 sitemap 路由冲突时，next dev 会直接 500。 */
async function prunePublicSitemap() {
  for (const { fileName } of SITEMAP_FILES) {
    const absolute = path.join(PUBLIC_DIR, fileName);
    if (!existsSync(absolute)) continue;
    await fs.rm(absolute, { force: true });
    log(`已移除上次构建留在 public/${fileName} 的静态产物（与 sitemap 路由同名时 next dev 会 500）`);
  }
  return 0;
}

const args = new Set(process.argv.slice(2));
const exitCode = args.has('--stage-next')
  ? await stageToNext()
  : args.has('--prune-public')
    ? await prunePublicSitemap()
    : await generate();
process.exit(exitCode);
