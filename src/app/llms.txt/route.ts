import { getSiteUrl } from '@/lib/seo';
import { getPublicSiteConfig } from '@/lib/site-config';

export const revalidate = 3600;

const LLMS_TIME_ZONE = process.env.SEO_TIMEZONE || 'Asia/Shanghai';
const FEATURED_GAME_COUNT = 10;
const FEATURED_FETCH_SECONDS = 3600;

function formatLocalDate(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: LLMS_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function getServerApiBaseUrl() {
  const appEnv = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
  const base = (
    process.env.API_BASE_URL ||
    (appEnv === 'production'
      ? process.env.API_BASE_URL_PROD || 'https://api.hk.apks.cc'
      : process.env.API_BASE_URL_DEV || 'http://127.0.0.1:9527')
  ).replace(/\/+$/, '');
  return base;
}

async function fetchFeaturedGames(): Promise<Array<{ name: string; pkg: string }>> {
  try {
    const res = await fetch(
      `${getServerApiBaseUrl()}/seo/sitemap/games?page=1&pageSize=${FEATURED_GAME_COUNT}`,
      {
        cache: 'force-cache',
        next: { revalidate: FEATURED_FETCH_SECONDS },
        headers: {
          'x-tracking-skip': '1',
          'x-client-platform': 'web',
        },
      },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const list: any[] = Array.isArray(json?.data?.list) ? json.data.list : [];
    return list
      .map((item) => ({
        name: String(item?.name || '').trim(),
        pkg: String(item?.pkg || '').trim(),
      }))
      .filter((item) => item.pkg && item.name)
      .slice(0, FEATURED_GAME_COUNT);
  } catch {
    return [];
  }
}

export async function GET() {
  const [config, featuredGames] = await Promise.all([
    getPublicSiteConfig(300),
    fetchFeaturedGames(),
  ]);
  const siteUrl = getSiteUrl();
  const siteName = String(config?.basic?.site_name || 'APKScc').trim();
  const description =
    String(config?.seo?.description || '').trim() ||
    `${siteName} 提供安卓游戏资源下载、游戏详情、版本更新、社区帖子和用户公开主页。`;

  const body = [
    `# ${siteName}`,
    '',
    `> ${description}`,
    '',
    '## 主要入口',
    `- [首页](${siteUrl}/)`,
    `- [游戏库](${siteUrl}/app)`,
    `- [社区](${siteUrl}/community)`,
    `- [排行榜](${siteUrl}/rankings)`,
    `- [Sitemap](${siteUrl}/sitemap.xml)`,
    '',
    '## 最近更新游戏',
    ...(featuredGames.length > 0
      ? featuredGames.map((game) => `- [${game.name}](${siteUrl}/app/${encodeURIComponent(game.pkg)})`)
      : ['- 暂无可列出的游戏。']),
    '',
    '## 内容类型',
    '- 游戏详情页包含下载渠道、版本、截图、结构化数据和关联社区内容。',
    '- 社区帖子页包含正文、Markdown 渲染、链接预览、评论、浏览量、点赞量和结构化数据。',
    '- 用户公开主页包含个性签名、公开动态、互动统计和 ProfilePage 结构化数据。',
    '',
    '## 抓取建议',
    '- 优先从 sitemap.xml 发现可索引页面。',
    '- 避免抓取 /api/、/profile、/messages、/submit-resource 等登录或提交页面。',
    '- 引用内容时保留页面 URL、标题与发布时间。',
    '',
    `更新时间: ${formatLocalDate(new Date())}`,
    '',
  ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
