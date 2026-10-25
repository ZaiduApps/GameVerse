import Image from 'next/image';
import Link from 'next/link';

import type { ApiArticle } from '@/types';

interface HomeNewsListReplicaProps {
  title?: string;
  subtitle?: string;
  moreHref?: string;
  articles: ApiArticle[];
  fallbackImage: string;
}

// 日期固定按 Asia/Shanghai 显示：这个列表是服务端渲染的，
// 用运行环境本地时区格式化会让 00:00–08:00 之间的文章在 SSR 与客户端显示不同的日期。
const NEWS_DATE_FORMATTER = new Intl.DateTimeFormat('zh-CN', {
  timeZone: 'Asia/Shanghai',
  month: '2-digit',
  day: '2-digit',
});

function formatDate(dateStr?: string): string {
  if (!dateStr) return '未知时间';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '未知时间';
  const parts = NEWS_DATE_FORMATTER.formatToParts(d);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value || '';
  return `${pick('month')}/${pick('day')}`;
}

function normalizeCover(value: string | undefined, fallbackImage: string): string {
  const normalized = String(value || '').trim();
  if (!normalized) return fallbackImage;
  return normalized;
}

function isTruthyFlag(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  if (typeof value === 'string') return value === '1' || value.toLowerCase() === 'true';
  return false;
}

function toTime(input?: string): number {
  const ms = new Date(String(input || '')).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

// publish_at 目前接口未返回（字段不在 ApiArticle 里），保留读取以便后端补齐后自动生效。
function articleTime(article: ApiArticle): number {
  const publishAt = (article as { publish_at?: string }).publish_at;
  return toTime(publishAt || article.updated_at || article.latest_at || article.release_at);
}

export default function HomeNewsListReplica({
  title = '社区动态',
  subtitle = '最新讨论、活动反馈与玩家内容',
  moreHref = '/community',
  articles,
  fallbackImage,
}: HomeNewsListReplicaProps) {
  // 纯时间倒序：is_top / is_recommended 会把 5 月的推荐文章顶到 10 月的新闻前面，
  // 这块是「最新资讯」，排序只认时间。
  const items = [...articles]
    .sort((a, b) => articleTime(b) - articleTime(a))
    .slice(0, 9);

  return (
    <section className="rounded-2xl border border-border/70 bg-white p-4 shadow-sm dark:border-[#2a3442] dark:bg-[#111824] sm:p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[#1f2428] dark:text-[#edf2fb] sm:text-2xl">{title}</h3>
          <p className="mt-1 text-sm font-medium text-[#687076] dark:text-[#9ca6b8]">{subtitle}</p>
        </div>
        <Link
          href={moreHref}
          prefetch={false}
          className="relative text-sm font-bold text-[#005e9f] hover:underline after:absolute after:-inset-x-2 after:-inset-y-2.5 after:content-[''] dark:text-[#7fc1ff] dark:hover:text-[#a9d6ff]"
          aria-label={`查看更多${title}`}
        >
          更多
          <span className="sr-only">{title}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
        {items.map((article) => {
          const articleId = String(article._id || '').trim();
          const articleHref = articleId ? `/community/post/${articleId}` : '/community';
          const cover = normalizeCover(article.image_cover, fallbackImage);
          const author = String(article.author || article.source || '编辑部').trim() || '编辑部';
          const summary = String(article.summary || '').trim() || '点击查看完整社区内容。';
          const views = Number(article.view_counts || 0);
          const likes = Number(article.like_counts || 0);
          const isTop = isTruthyFlag(article.is_top);
          const isRecommended = isTruthyFlag(article.is_recommended);

          return (
            <article
              key={article._id || article.gid || article.name}
              className="group relative flex gap-3 overflow-hidden rounded-xl border border-[#edf0f2] bg-white p-2 transition-all duration-200 hover:border-border hover:shadow-md dark:border-[#2a3442] dark:bg-[#0f1723] dark:hover:border-border dark:hover:shadow-lg sm:flex-col sm:gap-0 sm:p-0"
            >
              <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#e6e8ea] dark:bg-[#1a2433] sm:h-auto sm:w-full sm:rounded-none sm:aspect-video">
                <Image
                  src={cover}
                  alt={article.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 96px, (max-width: 1280px) 50vw, 33vw"
                />
                {(isTop || isRecommended) && (
                  <div className="absolute left-1 top-1 z-10 flex gap-1 sm:left-2 sm:top-2 sm:gap-1.5">
                    {isTop && (
                      <span className="rounded-md bg-[#ffe9e7] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#b71211] shadow-sm dark:bg-[#5a2025] dark:text-[#ffb4aa]">
                        置顶
                      </span>
                    )}
                    {isRecommended && (
                      <span className="rounded-md bg-[#eaf3ff] px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-[#005e9f] shadow-sm dark:bg-[#1e3550] dark:text-[#a9d6ff]">
                        推荐
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1 sm:gap-1.5 sm:p-3">
                <h4 className="line-clamp-2 text-[14px] font-bold leading-5 text-[#1f2428] transition-colors group-hover:text-[#005e9f] dark:text-[#edf2fb] dark:group-hover:text-[#7fc1ff] sm:text-[15px]">
                  {article.name}
                </h4>
                <p className="hidden text-[12px] leading-4 text-[#687076] dark:text-[#9ca6b8] sm:line-clamp-1">{summary}</p>
                <div className="mt-auto flex min-w-0 items-center gap-x-2 overflow-hidden whitespace-nowrap text-[11px] text-[#8a939e] dark:text-[#7f8da3] sm:flex-wrap sm:whitespace-normal">
                  <span className="truncate">{author}</span>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{formatDate(article.release_at)}</span>
                  {views > 0 && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="shrink-0">{views} 阅读</span>
                    </>
                  )}
                  {likes > 0 && (
                    <>
                      <span aria-hidden="true" className="hidden sm:inline">·</span>
                      <span className="hidden shrink-0 sm:inline">{likes} 点赞</span>
                    </>
                  )}
                </div>
              </div>
              <Link
                href={articleHref}
                prefetch={false}
                className="absolute inset-0 z-30 rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#005e9f]"
                aria-label={`查看${title}：${article.name}`}
              >
                <span className="sr-only">查看{title}：{article.name}</span>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
