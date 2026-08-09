import { writeFile } from 'node:fs/promises';

const siteUrl = (process.env.SITE_URL || 'https://apks.cc').replace(/\/$/, '');
const apiUrl = (process.env.API_BASE_URL || 'https://api.hk.apks.cc').replace(/\/$/, '');
const output = process.env.SEO_AUDIT_OUTPUT || `seo-audit-${new Date().toISOString().slice(0, 10)}.json`;
const userAgents = {
  browser: 'Mozilla/5.0 GameVerseSeoAudit/1.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  bingbot: 'Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)',
};

async function fetchCheck(url, userAgent) {
  const started = performance.now();
  const response = await fetch(url, { headers: { 'user-agent': userAgent }, redirect: 'manual' });
  const body = await response.text();
  return {
    url,
    status: response.status,
    location: response.headers.get('location'),
    cacheControl: response.headers.get('cache-control'),
    cfCacheStatus: response.headers.get('cf-cache-status'),
    ttfbMs: Math.round(performance.now() - started),
    bytes: Buffer.byteLength(body),
    h1Count: (body.match(/<h1\b/gi) || []).length,
    canonicalCount: (body.match(/rel="canonical"/gi) || []).length,
    jsonLdCount: (body.match(/application\/ld\+json/gi) || []).length,
    noindex: /name="robots"[^>]+noindex|noindex[^>]+name="robots"/i.test(body),
  };
}

async function getAuditPage(page) {
  const response = await fetch(`${apiUrl}/seo/audit/games?page=${page}&pageSize=500`);
  if (!response.ok) throw new Error(`SEO 审计接口失败: ${response.status}`);
  const payload = await response.json();
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
  generatedAt: new Date().toISOString(),
  evidenceLevel: 'observed',
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
