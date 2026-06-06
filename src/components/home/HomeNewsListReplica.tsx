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

function formatDate(dateStr?: string): string {
  if (!dateStr) return '未知时间';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '未知时间';
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' });
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

export default function HomeNewsListReplica({
  title = '社区动态',
  subtitle = '最新讨论、活动反馈与玩家内容',
  moreHref = '/community',
  articles,
  fallbackImage,
}: HomeNewsListReplicaProps) {
  const items = [...articles]
    .sort((a, b) => {
      const aTop = isTruthyFlag(a.is_top) ? 1 : 0;
      const bTop = isTruthyFlag(b.is_top) ? 1 : 0;
      if (aTop !== bTop) return bTop - aTop;

      const aRec = isTruthyFlag(a.is_recommended) ? 1 : 0;
      const bRec = isTruthyFlag(b.is_recommended) ? 1 : 0;
      if (aRec !== bRec) return bRec - aRec;

      return toTime(b.updated_at || b.latest_at || b.release_at) - toTime(a.updated_at || a.latest_at || a.release_at);
    })
    .slice(0, 9);

  return (
    <section className="rounded-[22px] border border-[#e0e3e4] bg-white p-4 shadow-[0_8px_22px_rgba(12,15,16,0.06)] dark:border-[#2a3442] dark:bg-[#111824] dark:shadow-[0_8px_22px_rgba(0,0,0,0.38)] sm:p-5">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <h3 className="text-xl font-black tracking-tight text-[#1f2428] dark:text-[#edf2fb] sm:text-2xl">{title}</h3>
          <p className="mt-1 text-sm font-medium text-[#687076] dark:text-[#9ca6b8]">{subtitle}</p>
        </div>
        <Link
          href={moreHref}
          className="text-sm font-bold text-[#005e9f] hover:underline dark:text-[#7fc1ff] dark:hover:text-[#a9d6ff]"
          aria-label={`查看更多${title}`}
        >
          更多
          <span className="sr-only">{title}</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <Link
              key={article._id || article.gid || article.name}
              href={articleHref}
              className="group flex flex-col overflow-hidden rounded-xl border border-[#edf0f2] bg-white transition-all duration-200 hover:border-[#c8dcee] hover:shadow-[0_8px_20px_rgba(0,94,159,0.08)] dark:border-[#2a3442] dark:bg-[#0f1723] dark:hover:border-[#3a5068] dark:hover:shadow-[0_8px_20px_rgba(0,0,0,0.42)]"
            >
              <div className="relative aspect-video overflow-hidden bg-[#e6e8ea] dark:bg-[#1a2433]">
                <Image
                  src={cover}
                  alt={article.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                  sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                />
                {(isTop || isRecommended) && (
                  <div className="absolute left-2 top-2 z-10 flex gap-1.5">
                    {isTop && (
                      <span className="rounded-md bg-[#ffe9e7] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#b71211] shadow-sm dark:bg-[#5a2025] dark:text-[#ffb4aa]">
                        置顶
                      </span>
                    )}
                    {isRecommended && (
                      <span className="rounded-md bg-[#eaf3ff] px-1.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-[#005e9f] shadow-sm dark:bg-[#1e3550] dark:text-[#a9d6ff]">
                        推荐
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <h4 className="line-clamp-2 text-[14px] font-bold leading-5 text-[#1f2428] transition-colors group-hover:text-[#005e9f] dark:text-[#edf2fb] dark:group-hover:text-[#7fc1ff] sm:text-[15px]">
                  {article.name}
                </h4>
                <p className="line-clamp-1 text-[12px] leading-4 text-[#687076] dark:text-[#9ca6b8]">{summary}</p>
                <div className="mt-auto flex flex-wrap items-center gap-x-2 text-[11px] text-[#8a939e] dark:text-[#7f8da3]">
                  <span className="truncate">{author}</span>
                  <span>·</span>
                  <span>{formatDate(article.release_at)}</span>
                  {(views > 0 || likes > 0) && <span>·</span>}
                  {views > 0 && <span>{views} 阅读</span>}
                  {likes > 0 && <span>{likes} 点赞</span>}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
