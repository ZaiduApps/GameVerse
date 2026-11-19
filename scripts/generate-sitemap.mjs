#!/usr/bin/env node
/**
 * 构建期静态 sitemap 生成器（prebuild），以及构建后把产物搬进 .next 的搬运步骤（postbuild）。
 *
 * 为什么需要它：运行时 /sitemap.xml 要串行/并发打几十个站点 API、拼 1.5 MB XML，接口一抖
 * 就只剩静态入口。构建期抓一遍落成静态文件，运行时优先直出，失败再回落实时生成。
 *
 * sitemap 分层（#126 按内容拆，#269 再按抓取预算拆）：
 *   public/sitemap-priority.xml    静态入口 + 分类页 + 最近更新的前 300 个详情页（每次整体提交）
 *   public/sitemap-tail-<N>.xml    余下长尾详情页，按 pkg 稳定哈希分片，每片约 2000 条
 *   public/sitemap.xml             sitemapindex：指向 priority、每个长尾片、社区片
 *   public/sitemap-community.xml   社区 sitemap：社区静态入口 + albums/topics/posts（本轮不拆）
 *
 * 线上 URL 与文件名不是一一同名：长尾片线上是 `/sitemap-tail/<N>`（Next 的动态段不能带 .xml 后缀），
 * 映射只有 src/lib/sitemap-core.mjs 的 sitemapShardFileName / sitemapShardPath 两处。
 *
 * 用法：
 *   node scripts/generate-sitemap.mjs   # 抓全量数据 → public/ 产物（写入 buildTime/urlCount 注释头）
 *   node scripts/generate-sitemap.mjs --stage-next
 *                                        # postbuild：把 public/ 产物复制到 <distDir>/server/
 *                                        #（发布流程只上传 .next），随后移出 public 副本
 *   node scripts/generate-sitemap.mjs --prune-public
 *                                        # dev 前置：清掉 public/ 里与路由同名的产物
 *
 * 失败策略：接口不可用 / 抓不到游戏目录时不写文件、不删除已有产物，退出码仍为 0——
 * 静态 sitemap 是加速与稳定性的优化，不能因为上游抖动把整条发布流水线卡死；运行时路由会自动降级。
 * 任一份产物自检失败则整批不落盘：半份新产物比没有更糟（索引列出的分片会 404）。
 */
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';

import {
  SITEMAP_COMMUNITY_FILE_NAME,
  SITEMAP_PRIORITY_FILE_NAME,
  SITEMAP_SHARD_SIZE,
  buildShards,
  createSitemapBuilder,
  getServerApiBaseUrl,
  getSiteUrlFromEnv,
  serializeSitemapIndexXml,
  serializeSitemapXml,
  sitemapShardFileName,
  sitemapShardPath,
} from '../src/lib/sitemap-core.mjs';

const TAG = '[generate-sitemap]';
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC_DIR = path.join(repoRoot, 'public');
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

/** public/ 下现存的长尾分片文件名（升级前后重建时用来清理旧片）。 */
async function listExistingShardFiles() {
  try {
    const files = await fs.readdir(PUBLIC_DIR);
    return files.filter((name) => /^sitemap-tail-\d+\.xml$/.test(name));
  } catch {
    return [];
  }
}

/** 自检：注释头 urlCount 必须等于 `<loc>` 条数，且不能是空片。 */
function selfCheckUrlset(xml, expectedCount, label) {
  const locCount = (xml.match(/<loc>/g) || []).length;
  const header = /<!--\s*buildTime:\s*\S+\s+urlCount:\s*(\d+)\s*-->/.exec(xml);
  if (!header) return `${label} 缺少 buildTime/urlCount 注释头`;
  if (Number(header[1]) !== locCount) return `${label} 注释 urlCount=${header[1]} 与条目数 ${locCount} 不一致`;
  if (expectedCount !== undefined && locCount !== expectedCount) {
    return `${label} 序列化条目数 ${locCount} 与预期 ${expectedCount} 不符`;
  }
  if (locCount === 0) return `${label} 是空片（validateStaticSitemap 会拒绝）`;
  return null;
}

/** 自检索引：注释头 urlCount 必须等于 `<sitemap>` 条数。 */
function selfCheckIndex(xml, expectedCount) {
  const sitemapCount = (xml.match(/<sitemap>\s*<loc>/g) || []).length;
  const header = /<!--\s*buildTime:\s*\S+\s+urlCount:\s*(\d+)\s*-->/.exec(xml);
  if (!header) return '索引缺少 buildTime/urlCount 注释头';
  if (Number(header[1]) !== sitemapCount) return `索引注释 urlCount=${header[1]} 与分片数 ${sitemapCount} 不一致`;
  if (sitemapCount !== expectedCount) return `索引分片数 ${sitemapCount} 与预期 ${expectedCount} 不符`;
  return null;
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

  // 1) 先把每份产物在内存里算好并逐份自检；任何一份失败都整批不落盘。
  //    半份新产物比没有更糟：新索引会列出尚未写出的分片，线上直接 404。
  const outputs = new Map(); // fileName -> xml
  const failures = [];

  if (!complete.main) {
    failures.push(`${SITEMAP_PRIORITY_FILE_NAME} 有分页接口抓取失败（main 残缺）`);
  } else {
    // shortcut: priority 本轮按 updated_at 倒序取前 300（buildShards 内部排序）。
    // 后继换成 growth-daily 的 top_games + matrix 需求包名（/root/state/growth-daily/<date>.json），
    // 「有需求的 URL 先被抓」才是这一版真正的收益指标；换之前 priority 片的排序口径只是「最近更新」。
    const { priority, tails } = buildShards(sections.main, { shardSize: SITEMAP_SHARD_SIZE });
    if (priority.length === 0) {
      failures.push(`${SITEMAP_PRIORITY_FILE_NAME} 为空`);
    } else {
      const xml = serializeSitemapXml(priority, { buildTime });
      const problem = selfCheckUrlset(xml, priority.length, SITEMAP_PRIORITY_FILE_NAME);
      if (problem) failures.push(problem);
      else outputs.set(SITEMAP_PRIORITY_FILE_NAME, xml);
    }

    for (const [shard, entries] of tails) {
      const fileName = sitemapShardFileName(shard);
      const xml = serializeSitemapXml(entries, { buildTime });
      const problem = selfCheckUrlset(xml, entries.length, fileName);
      if (problem) {
        failures.push(problem);
        break; // 一片坏，整批不写；不必继续自检
      }
      outputs.set(fileName, xml);
    }

    // 索引放在最后：它列的片必须已经进了 outputs。
    const indexEntries = [
      { url: `${siteUrl}/${SITEMAP_PRIORITY_FILE_NAME}` },
      ...[...tails.keys()].map((shard) => ({ url: `${siteUrl}${sitemapShardPath(shard)}` })),
      { url: `${siteUrl}/${SITEMAP_COMMUNITY_FILE_NAME}` },
    ];
    const indexXml = serializeSitemapIndexXml(indexEntries, { buildTime });
    const indexProblem = selfCheckIndex(indexXml, indexEntries.length);
    if (indexProblem) failures.push(indexProblem);
    else outputs.set('sitemap.xml', indexXml);
  }

  // 社区片本轮不拆：完整性判据与写盘逻辑保持原样。
  if (!complete.community) {
    failures.push(`${SITEMAP_COMMUNITY_FILE_NAME} 有分页接口抓取失败（community 残缺）`);
  } else {
    const xml = serializeSitemapXml(sections.community, { buildTime });
    const problem = selfCheckUrlset(xml, sections.community.length, SITEMAP_COMMUNITY_FILE_NAME);
    if (problem) failures.push(problem);
    else outputs.set(SITEMAP_COMMUNITY_FILE_NAME, xml);
  }

  if (failures.length > 0) {
    warn(`自检失败，本次整批不落盘（避免索引指向不存在的分片）：\n  - ${failures.join('\n  - ')}`);
    warn('运行时将回落实时生成；已有静态产物保持不动');
    return 0;
  }

  await fs.mkdir(PUBLIC_DIR, { recursive: true });

  // 2) 清理上一版的旧分片：分片数量随数据量变化，残留旧片会被索引覆盖不到却仍可访问。
  const existingShards = await listExistingShardFiles();
  const removed = existingShards.filter((name) => !outputs.has(name));
  for (const name of removed) await fs.rm(path.join(PUBLIC_DIR, name), { force: true });
  if (removed.length > 0) log(`已移除 ${removed.length} 个上一版残留分片：${removed.join('、')}`);

  // 3) 统一落盘：先写分片，最后写索引（索引存在即代表它列出的片都已就位）。
  const writeOrder = [...outputs.keys()].filter((name) => name !== 'sitemap.xml');
  if (outputs.has('sitemap.xml')) writeOrder.push('sitemap.xml');
  for (const fileName of writeOrder) {
    await fs.writeFile(path.join(PUBLIC_DIR, fileName), outputs.get(fileName), 'utf8');
  }

  const shardNames = [...outputs.keys()].filter((name) => name.startsWith('sitemap-tail-'));
  log(
    `${outputs.size} 份产物已写到 public/（priority=${(outputs.get(SITEMAP_PRIORITY_FILE_NAME).match(/<loc>/g) || []).length} 条，` +
      `长尾 ${shardNames.length} 片 ${shardNames.reduce((sum, name) => sum + (outputs.get(name).match(/<loc>/g) || []).length, 0)} 条，` +
      `社区=${sections.community.length} 条）`,
  );
  log(
    `urlCount main=${sections.main.length} community=${sections.community.length} buildTime=${buildTime}；` +
      `games=${stats.games}（未发布剔除 ${stats.gamesSkippedUnpublished}、质量审计过滤 ${stats.gamesSkippedByIndexable}） ` +
      `posts=${stats.posts} topics=${stats.topics} albums=${stats.albums}；${Date.now() - startedAt} ms`,
  );
  return 0;
}

/**
 * public/ 下当前存在的全部 sitemap 静态产物（唯一来源）。
 *
 * `stage-next` 搬运、`prune-public` 清理、搬完后的漏网自检都必须调这一个函数——
 * 之前三处各写了一份文件名清单，`stageToNext` 漏了 `SITEMAP_PRIORITY_FILE_NAME`，
 * 结果 priority 片留在 public：索引里指向的分片线上 404，而 public 残留副本还会绕过运行时校验。
 */
async function listPublicSitemapFiles() {
  const candidates = [
    'sitemap.xml',
    SITEMAP_PRIORITY_FILE_NAME,
    SITEMAP_COMMUNITY_FILE_NAME,
    ...(await listExistingShardFiles()),
  ];
  return candidates.filter((fileName) => existsSync(path.join(PUBLIC_DIR, fileName)));
}

async function stageToNext() {
  const distDir = resolveBuildDistDir();
  const indexFile = 'sitemap.xml';
  const present = await listPublicSitemapFiles();

  if (present.length === 0) {
    warn('public/ 里没有任何静态 sitemap（本次构建未生成），跳过搬运；运行时将实时生成');
    return 0;
  }

  // 索引最后搬运：中途失败时宁可线上索引指回旧片，也不要指到还没搬完的新片。
  const order = [...present].sort((a, b) => (a === indexFile ? 1 : b === indexFile ? -1 : a.localeCompare(b)));
  await fs.mkdir(path.join(distDir, 'server'), { recursive: true });
  const staged = [];
  for (const fileName of order) {
    const target = path.join(distDir, 'server', fileName);
    await fs.copyFile(path.join(PUBLIC_DIR, fileName), target);
    // public/ 下的同名文件会被 Next 直接当静态资源返回，绕过路由里的校验与降级逻辑；
    // 同时 dev 模式遇到 public 文件与路由同名会直接 500。所以搬完就移出 public 副本。
    await fs.rm(path.join(PUBLIC_DIR, fileName), { force: true });
    staged.push(path.relative(repoRoot, target));
  }

  // 漏网自检：搬完还有 sitemap*.xml 留在 public，说明清单与产物又漂移了（构建立刻可见）。
  const leftovers = (await fs.readdir(PUBLIC_DIR).catch(() => [])).filter((file) => /^sitemap.*\.xml$/.test(file));
  if (leftovers.length > 0) {
    warn(
      `public/ 里仍有未搬运的 sitemap 产物：${leftovers.join('、')}；` +
        '这些文件会绕过运行时校验，且不在 .next 里（线上取不到），请检查 listPublicSitemapFiles 的清单',
    );
  }

  log(`已复制 ${staged.length} 份静态 sitemap 到 .next（${staged.join('、')}），并移出 public 副本（避免绕过运行时校验）`);
  return 0;
}

/** dev 前置清理：public 里的同名文件与 sitemap 路由冲突时，next dev 会直接 500。 */
async function prunePublicSitemap() {
  let removed = 0;
  for (const fileName of await listPublicSitemapFiles()) {
    await fs.rm(path.join(PUBLIC_DIR, fileName), { force: true });
    removed += 1;
    log(`已移除上次构建留在 public/${fileName} 的静态产物（与 sitemap 路由同名时 next dev 会 500）`);
  }
  if (removed === 0) log('public/ 里没有 sitemap 静态产物，无需清理');
  return 0;
}

const args = new Set(process.argv.slice(2));
const exitCode = args.has('--stage-next')
  ? await stageToNext()
  : args.has('--prune-public')
    ? await prunePublicSitemap()
    : await generate();
process.exit(exitCode);
