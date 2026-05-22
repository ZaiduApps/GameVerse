import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '关于我们 | APKScc' },
  description: '了解 APKScc 的站点定位、内容范围与服务方向。',
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">关于我们</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>APKScc 专注于整理安卓游戏与应用内容，提供版本信息、下载入口、资讯动态、排行榜和社区讨论等公开信息。</p>
        <p>我们会持续优化内容质量、页面体验与索引结构，帮助用户更高效地发现值得关注的游戏与应用资源。</p>
      </div>
    </section>
  );
}
