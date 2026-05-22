import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '联系我们 | APKScc' },
  description: '联系 APKScc，反馈内容问题、合作需求或站点建议。',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">联系我们</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>如果你需要反馈页面问题、资源错误、版权投诉或商务合作，可以通过站内投稿与反馈渠道联系我们。</p>
        <p>我们建议在反馈中尽量提供页面链接、应用包名、问题描述和截图，以便更快定位问题。</p>
      </div>
    </section>
  );
}
