import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: '隐私政策 | APKScc' },
  description: '查看 APKScc 的隐私政策与基础数据处理说明。',
  alternates: { canonical: '/privacy-policy' },
};

export default function PrivacyPolicyPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-black">隐私政策</h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-muted-foreground">
        <p>APKScc 会在必要范围内处理站点访问、登录、反馈和基础统计相关信息，用于维护站点稳定运行与内容服务。</p>
        <p>我们不会在未经说明的情况下将你的个人信息用于与站点服务无关的用途。具体的数据收集、存储和使用方式以实际业务流程为准。</p>
      </div>
    </section>
  );
}
