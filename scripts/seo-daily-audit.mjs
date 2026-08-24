import { writeFile, mkdtemp, readFile, rm } from 'node:fs/promises';
import { closeSync, openSync, readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';

const siteUrl = (process.env.SITE_URL || 'https://apks.cc').replace(/\/$/, '');
const apiUrl = (process.env.API_BASE_URL || 'https://api.hk.apks.cc').replace(/\/$/, '');
const auditTimezone = process.env.SEO_TIMEZONE || 'Asia/Shanghai';
function localDateStamp(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: auditTimezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}
const dateStamp = localDateStamp();
const output = process.env.SEO_AUDIT_OUTPUT || `seo-audit-${dateStamp}.json`;
const runId = process.env.SEO_RUN_ID || `${dateStamp}-${new Date().toISOString().replace(/[:.]/g, '-')}`;
const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'socks5h://127.0.0.1:7897';
const proxy = new URL(proxyUrl);
if (proxy.protocol !== 'socks5:' && proxy.protocol !== 'socks5h:') {
  throw new Error(`SEO 审计只支持 SOCKS5 VPN 代理: ${proxyUrl}`);
}
const execFileAsync = promisify(execFile);
const lockPath = resolve(process.env.SEO_AUDIT_LOCK || `.seo-audit-${dateStamp}.lock`);
let lockFd;

try {
  lockFd = openSync(lockPath, 'wx');
  writeFileSync(lockFd, `${JSON.stringify({ runId, startedAt: new Date().toISOString(), pid: process.pid })}\n`, 'utf8');
} catch {
  let activeRun = '';
  try {
    activeRun = readFileSync(lockPath, 'utf8').trim();
  } catch {
    activeRun = '锁文件不可读';
  }
  throw new Error(`已有 SEO 审计运行，拒绝并发执行: ${activeRun}`);
}

const releaseLock = () => {
  if (lockFd === undefined) return;
  try {
    closeSync(lockFd);
  } finally {
    lockFd = undefined;
    try {
      unlinkSync(lockPath);
    } catch {
      // 进程退出时锁可能已由运维清理。
    }
  }
};

process.once('exit', releaseLock);
process.once('SIGINT', () => { releaseLock(); process.exit(130); });
process.once('SIGTERM', () => { releaseLock(); process.exit(143); });

const userAgents = {
  browser: 'Mozilla/5.0 GameVerseSeoAudit/1.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
};

async function fetchCheck(url, userAgent) {
  const started = performance.now();
  const response = await proxiedRequest(url, userAgent);
  const body = response.body;
  return {
    url,
    status: response.status,
    location: response.headers.location || null,
    cacheControl: response.headers['cache-control'] || null,
    cfCacheStatus: response.headers['cf-cache-status'] || null,
    ttfbMs: Math.round(performance.now() - started),
    bytes: Buffer.byteLength(body),
    h1Count: (body.match(/<h1\b/gi) || []).length,
    canonicalCount: (body.match(/rel="canonical"/gi) || []).length,
    jsonLdCount: (body.match(/application\/ld\+json/gi) || []).length,
    noindex: /name="robots"[^>]+noindex|noindex[^>]+name="robots"/i.test(body),
  };
}

async function proxiedRequest(url, userAgent) {
  const temp = await mkdtemp(resolve(tmpdir(), 'gameverse-seo-'));
  const headersPath = resolve(temp, 'headers.txt');
  const bodyPath = resolve(temp, 'body.txt');
  const proxyHost = `${proxy.hostname}:${proxy.port || '7897'}`;
  const args = [
    '--socks5-hostname', proxyHost,
    '--silent', '--show-error', '--max-time', '30',
    '--user-agent', userAgent,
    '--dump-header', headersPath, '--output', bodyPath,
    '--write-out', '%{http_code}', url,
  ];
  if (process.platform === 'win32') args.unshift('--ssl-no-revoke');
  try {
    const { stdout } = await execFileAsync(process.platform === 'win32' ? 'curl.exe' : 'curl', args, {
      maxBuffer: 8 * 1024 * 1024,
    });
    const rawHeaders = await readFile(headersPath, 'utf8');
    const body = await readFile(bodyPath, 'utf8');
    const blocks = rawHeaders.split(/\r?\n\r?\n/).filter(Boolean);
    const last = blocks.at(-1) || '';
    const lines = last.split(/\r?\n/);
    const headers = {};
    for (const line of lines.slice(1)) {
      const separator = line.indexOf(':');
      if (separator <= 0) continue;
      headers[line.slice(0, separator).toLowerCase()] = line.slice(separator + 1).trim();
    }
    return { status: Number(stdout.trim()), headers, body };
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
}

async function getAuditPage(page) {
  const response = await proxiedRequest(`${apiUrl}/seo/audit/games?page=${page}&pageSize=500`, userAgents.browser);
  if (response.status < 200 || response.status >= 300) throw new Error(`SEO 审计接口失败: ${response.status}`);
  const payload = JSON.parse(response.body);
  return payload.data || payload;
}

const auditRows = [];
let auditTotal = 0;
for (let page = 1; page <= 200; page += 1) {
  const data = await getAuditPage(page);
  const list = Array.isArray(data.list) ? data.list : [];
  auditRows.push(...list);
  auditTotal = Number(data.total || auditTotal);
  if (list.length === 0 || auditRows.length >= auditTotal) break;
}
const samples = auditRows
  .sort((a, b) => Number(a.quality?.score || 0) - Number(b.quality?.score || 0))
  .filter((item, index, list) => index < 3 || index >= list.length - 3);
const urls = [
  `${siteUrl}/robots.txt`,
  `${siteUrl}/sitemap.xml`,
  `${siteUrl}/llms.txt`,
  ...samples.map((item) => `${siteUrl}/app/${encodeURIComponent(item.pkg)}`),
  `${siteUrl}/app/invalid.pkg.zz`,
];
const checks = [];
for (const url of urls) {
  for (const userAgent of Object.values(userAgents)) checks.push(await fetchCheck(url, userAgent));
}

const report = {
  runId,
  generatedAt: new Date().toISOString(),
  timezone: auditTimezone,
  evidenceLevel: 'observed',
  proxy: proxyUrl.replace(/:\/\/.*@/, '://<redacted>@'),
  lockPath,
  inventory: {
    total: auditTotal,
    indexable: auditRows.filter((item) => item.quality?.indexable === true).length,
    thinPages: auditRows.filter((item) => item.quality?.thin_page === true).length,
    manualSeo: auditRows.filter((item) =>
      item.seo?.has_title || item.seo?.has_description || Number(item.seo?.highlight_count || 0) > 0,
    ).length,
  },
  checks,
  missingEvidence: ['Google Search Console', 'Bing Webmaster Tools', 'CrUX/RUM'],
};
await writeFile(output, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`SEO 日报已写入 ${output}`);
