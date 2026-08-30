import type { Metadata } from 'next';

import { getPublicSiteConfig } from '@/lib/site-config';
import { renderMarkdown, cn } from '@/lib/utils';
import { buildSeoDescription } from '@/lib/seo';

type StaticPageKey = 'about' | 'contact' | 'privacy_policy' | 'terms';

interface StaticPageDefaults {
  canonical: string;
  contentMarkdown: string;
  description: string;
  key: StaticPageKey;
  seoTitle: string;
  title: string;
}

const SITE_NAME = 'APKScc';

export const STATIC_PAGE_DEFAULTS: Record<StaticPageKey, StaticPageDefaults> = {
  about: {
    canonical: '/about',
    key: 'about',
    title: '关于我们',
    seoTitle: `关于我们 | ${SITE_NAME}`,
    description: '了解 APKScc 的站点定位、内容范围与服务方向。',
    contentMarkdown:
      'APKScc 专注于整理安卓游戏与应用内容，提供版本信息、下载入口、资讯动态、排行榜和社区讨论等公开信息。\n\n我们会持续优化内容质量、页面体验与索引结构，帮助用户更高效地发现值得关注的游戏与应用资源。',
  },
  contact: {
    canonical: '/contact',
    key: 'contact',
    title: '联系我们',
    seoTitle: `联系我们 | ${SITE_NAME}`,
    description: '联系 APKScc，反馈内容问题、合作需求或站点建议。',
    contentMarkdown:
      '如果你需要反馈页面问题、资源错误、版权投诉或商务合作，可以通过站内投稿与反馈渠道联系我们。\n\n我们建议在反馈中尽量提供页面链接、应用包名、问题描述和截图，以便更快定位问题。',
  },
  privacy_policy: {
    canonical: '/privacy-policy',
    key: 'privacy_policy',
    title: '隐私政策',
    seoTitle: `隐私政策 | ${SITE_NAME}`,
    description: '查看 APKScc 的隐私政策与基础数据处理说明。',
    contentMarkdown:
      'APKScc 会在必要范围内处理站点访问、登录、反馈和基础统计相关信息，用于维护站点稳定运行与内容服务。\n\n我们不会在未经说明的情况下将你的个人信息用于与站点服务无关的用途。具体的数据收集、存储和使用方式以实际业务流程为准。',
  },
  terms: {
    canonical: '/terms',
    key: 'terms',
    title: '用户协议',
    seoTitle: `用户协议 | ${SITE_NAME}`,
    description:
      '查看 APKScc 用户协议与站点使用说明，了解安卓游戏与应用下载信息、社区内容、账号互动、资源反馈、外部链接、数据更新、使用前核对责任、违规处理方式和服务边界，帮助用户在浏览、下载、提交反馈、发布评论和参与讨论前确认基本规则、注意事项、内容处理流程、资源核对要求、反馈工单处理方式和站内通知记录。',
    contentMarkdown:
      '使用 APKScc 代表你同意按照站点规则浏览内容、提交反馈并合理使用公开功能，不得滥用站点服务或发布违法违规内容。\n\n站点展示的下载、资讯和社区信息可能因数据源更新而变化，使用前请自行核对版本、来源与设备兼容性。',
  },
};

function textOrFallback(value: unknown, fallback: string) {
  const text = String(value || '').trim();
  return text || fallback;
}

export async function generateStaticPageMetadata(
  key: StaticPageKey,
): Promise<Metadata> {
  const defaults = STATIC_PAGE_DEFAULTS[key];
  const config = await getPublicSiteConfig(300).catch(() => null);
  const page = config?.static_pages?.[key];

  return {
    title: { absolute: textOrFallback(page?.seo_title, defaults.seoTitle) },
    description: buildSeoDescription(
      textOrFallback(page?.seo_description, defaults.description),
        [
        key === 'contact'
          ? '可提交页面链接、应用包名、问题描述和截图，便于快速定位内容与资源问题；反馈内容会由运营人员核对后处理，并尽量同步处理进展'
          : '',
        key === 'privacy_policy'
          ? '说明信息收集、使用、存储和用户权利等站点数据处理范围；同时介绍账号、反馈、访问统计和外部服务相关的数据使用边界'
          : '',
        key === 'about'
          ? '了解站点内容来源、服务边界、版本信息和社区互动方向；我们持续整理安卓游戏与应用资料，帮助用户核对资源和更新信息'
          : '',
        key === 'terms' ? '浏览、下载、投稿、评论和反馈前请先确认适用规则与使用边界' : '',
      ],
      { min: 120, max: 160 },
    ),
    alternates: { canonical: defaults.canonical },
  };
}

export async function StaticConfigPage({ pageKey }: { pageKey: StaticPageKey }) {
  const defaults = STATIC_PAGE_DEFAULTS[pageKey];
  const config = await getPublicSiteConfig(300).catch(() => null);
  const page = config?.static_pages?.[pageKey];
  const title = textOrFallback(page?.title, defaults.title);
  const contentMarkdown = textOrFallback(
    page?.content_markdown,
    defaults.contentMarkdown,
  );

  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">{title}</h1>
      <div
        className={cn(
          'mt-6 text-sm leading-7 text-muted-foreground',
          '[&_a]:break-words [&_ol]:pl-5 [&_p:first-child]:mt-0 [&_ul]:pl-5',
        )}
        dangerouslySetInnerHTML={renderMarkdown(contentMarkdown)}
      />
    </section>
  );
}
