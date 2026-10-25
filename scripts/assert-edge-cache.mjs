#!/usr/bin/env node
/**
 * 生产断言：详情页 HTML 是否真的被 Cloudflare 边缘缓存。
 *
 * 同一 URL 连打两次（普通 HTML 请求，不带 RSC 头），断言第二次 `cf-cache-status: HIT`
 * 且 TTFB 低于阈值，并对 HTML 里的游戏名/首屏图做前后一致性比对。
 *
 * 退出码：
 *   0  通过（第二次命中边缘缓存且内容一致）
 *   1  请求失败 / 页面本身不是 200
 *   5  Cache Rule 未生效（响应根本没被 Cloudflare 缓存）
 *
 * 这条断言只读，不写生产。
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { diffFingerprints, extractDetailFingerprint } from './lib/edge-cache-policy.mjs';

const DEFAULT_URL = 'https://apks.cc/app/com.tencent.ig';
const DEFAULT_MAX_TTFB_MS = 80;

function parseArgs(argv) {
  const options = { url: process.env.EDGE_CACHE_URL || DEFAULT_URL, maxTtfbMs: DEFAULT_MAX_TTFB_MS, runs: 2 };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--url') options.url = argv[++index];
    else if (arg === '--max-ttfb-ms') options.maxTtfbMs = Number(argv[++index]);
    else if (arg === '--runs') options.runs = Math.max(2, Number(argv[++index]) || 2);
    else if (arg === '--help' || arg === '-h') options.help = true;
    else {
      console.error(`未知参数: ${arg}`);
      process.exit(1);
    }
  }
  return options;
}

async function probe(url) {
  const startedAt = performance.now();
  const response = await fetch(url, {
    headers: {
      accept: 'text/html,application/xhtml+xml',
      'accept-encoding': 'gzip, br',
      // 不带 cache-control / pragma：避免把 Cloudflare 的缓存强行绕过。
      'user-agent': 'apkscc-edge-cache-assert/1.0',
    },
    redirect: 'follow',
  });
  const ttfbMs = Math.round((performance.now() - startedAt) * 10) / 10;
  const html = await response.text();
  return {
    status: response.status,
    ttfbMs,
    headers: {
      cfCacheStatus: response.headers.get('cf-cache-status') || '',
      age: response.headers.get('age') || '',
      cacheControl: response.headers.get('cache-control') || '',
      vary: response.headers.get('vary') || '',
      nextCache: response.headers.get('x-nextjs-cache') || '',
      server: response.headers.get('server') || '',
    },
    fingerprint: extractDetailFingerprint(html),
  };
}

function printProbe(label, probeResult) {
  const { headers } = probeResult;
  console.log(`${label}: status=${probeResult.status} ttfb=${probeResult.ttfbMs}ms`);
  console.log(`  cf-cache-status=${headers.cfCacheStatus || '(无)'} age=${headers.age || '-'} x-nextjs-cache=${headers.nextCache || '-'}`);
  console.log(`  cache-control=${headers.cacheControl || '-'}`);
  console.log(`  vary=${headers.vary || '-'}`);
  const { fingerprint } = probeResult;
  console.log(
    `  fingerprint: title=${JSON.stringify(fingerprint.title)} og:image=${fingerprint.ogImage ? 'yes' : 'no'} detail_images=${fingerprint.firstDetailImage ? 'yes' : 'no'} screenshot=${fingerprint.firstScreenshot ? 'yes' : 'no'}`,
  );
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    console.log(`用法: node scripts/assert-edge-cache.mjs [--url <详情页 URL>] [--max-ttfb-ms 80]

退出码: 0 通过 · 1 请求失败 · 5 Cache Rule 未生效`);
    return 0;
  }

  console.log(`[edge-cache-assert] url=${options.url} maxTtfb=${options.maxTtfbMs}ms`);

  const probes = [];
  for (let index = 0; index < options.runs; index += 1) {
    const result = await probe(options.url);
    probes.push(result);
    printProbe(`第 ${index + 1} 次请求`, result);
    if (result.status !== 200) {
      console.error(`[edge-cache-assert] 失败：页面本身不是 200（status=${result.status}），先确认页面可用再断言缓存。`);
      return 1;
    }
  }

  const first = probes[0];
  const last = probes[probes.length - 1];
  const hit = last.headers.cfCacheStatus.toUpperCase() === 'HIT';
  const changed = diffFingerprints(first.fingerprint, last.fingerprint);
  const fieldsPresent = Boolean(last.fingerprint.title) || Boolean(last.fingerprint.ogImage) || Boolean(last.fingerprint.firstScreenshot);
  const rscTokens = /(^|,)\s*(RSC|Next-Router-State-Tree|Next-Router-Prefetch|Next-Router-Segment-Prefetch)\s*(,|$)/i.test(
    last.headers.vary,
  );

  console.log('');
  console.log('[edge-cache-assert] 结论');
  if (!last.headers.cfCacheStatus && /cloudflare/i.test(first.headers.server) === false) {
    console.error('  ✗ 响应里没有 cf-cache-status，也不是 Cloudflare 代理：这条断言只对 Cloudflare 前置的域名有效。');
    return 5;
  }
  if (!hit) {
    console.error(`  ✗ 第二次请求仍是 cf-cache-status=${last.headers.cfCacheStatus || '(无)'}：Cache Rule 未生效或未命中。`);
    console.error(`    源站缓存状态 x-nextjs-cache=${last.headers.nextCache || '-'}；cache-control=${last.headers.cacheControl || '-'}`);
    console.error('    排查顺序：1) Rules → Cache Rules 是否有 /app/* 的 Eligible for cache 规则');
    console.error('              2) 规则表达式是否覆盖该路径、是否被更靠前的规则拦截');
    console.error('              3) 响应是否带 Set-Cookie / 私有 Cache-Control（会导致不缓存）');
    console.error('              4) 见 docs/EDGE_CACHE_POLICY.md 与 node scripts/cloudflare-edge-cache.mjs');
    return 5;
  }
  if (rscTokens) {
    console.error(`  ✗ 已命中缓存，但 Vary 仍带 RSC token（${last.headers.vary}）：缓存键会被切碎，先确认源站 Vary 收口已发布。`);
    return 5;
  }

  console.log(`  ✓ cf-cache-status=HIT，第二次 TTFB=${last.ttfbMs}ms（阈值 ${options.maxTtfbMs}ms）`);
  if (last.ttfbMs >= options.maxTtfbMs) {
    console.error(`  ✗ TTFB 超过阈值：${last.ttfbMs}ms >= ${options.maxTtfbMs}ms（命中但边缘节点/网络仍慢）`);
    return 5;
  }
  if (!fieldsPresent) {
    console.error('  ✗ HTML 里没取到游戏名/首屏图字段，无法做一致性比对（可能拿到的不是详情页 HTML）。');
    return 1;
  }
  if (changed.length > 0) {
    console.error(`  ✗ 两次响应内容不一致，字段变化：${changed.join(', ')}`);
    return 1;
  }
  console.log('  ✓ 两次响应的游戏名/首屏图字段一致');
  console.log('  ✓ 通过：详情页 HTML 已在 Cloudflare 边缘缓存');
  return 0;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  main()
    .then((code) => process.exit(code))
    .catch((error) => {
      console.error(`[edge-cache-assert] 请求失败: ${error instanceof Error ? error.message : String(error)}`);
      process.exit(1);
    });
}
