import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '用户协议 | APKScc' },
  description:
    '查看 APKScc 用户协议与站点使用说明，了解安卓游戏与应用下载信息、社区内容、账号互动、资源反馈、外部链接、数据更新、使用前核对责任、违规处理方式和服务边界，帮助用户在浏览、下载、提交反馈、发布评论和参与讨论前确认基本规则、注意事项、内容处理流程、资源核对要求、反馈工单处理方式和站内通知记录。',
  alternates: { canonical: '/terms' },
};

export default function TermsPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">用户协议</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>使用 APKScc 代表你同意按照站点规则浏览内容、提交反馈并合理使用公开功能，不得滥用站点服务或发布违法违规内容。</p>
        <p>站点展示的下载、资讯和社区信息可能因数据源更新而变化，使用前请自行核对版本、来源与设备兼容性。</p>
      </div>
    </section>
  );
}
