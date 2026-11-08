import type { Metadata } from 'next';
import Link from 'next/link';

import Breadcrumbs from '@/components/layout/Breadcrumbs';
import { BREADCRUMB_ROOT } from '@/lib/breadcrumbs';

/**
 * 安装排障静态页（待决策 #153）。
 *
 * 客服给用户的排障入口就是 /help/install；内容只收口已经过客服 FAQ 011 / 023 / 024
 * 与线上验证的四类症状，不写死机型与系统版本号。每类给固定锚点，详情页的
 * 「无法安装？」弹窗按同一套 id 跳转，避免两边各编一套文案。
 */
const SYMPTOMS = [
  {
    id: 'parse_error',
    title: '解析包错误',
    aliases: ['下载失败'],
    judge: '安装时提示「解析包出错」「安装包已损坏」，或者点安装后没有任何反应。',
    handle:
      '删掉已经下载的文件，回到游戏详情页重新下载一次；下载过程尽量保持网络稳定，不要中途切换网络。如果浏览器装了广告拦截插件，先关掉再试。',
    escalation:
      '重新下载后仍报同样的错，说明文件本身可能有问题。提交游戏页面链接与下载来源给我们，我们会核对文件完整性和 CDN 状态。',
  },
  {
    id: 'install_failed',
    title: '应用未安装 / 签名冲突',
    aliases: [],
    judge: '安装时提示「应用未安装」「与已安装的应用签名冲突」，或安装进度到一半失败。',
    handle:
      '先确认设备上是否装过同一款游戏的其它渠道版本（渠道包、修改版或旧版本）；同包名但签名不同的应用不能直接覆盖安装。卸载旧版本后再安装当前资源，并避免同时保留多个来源的同名安装包。',
    escalation:
      '卸载旧版本后仍然装不上，请提供游戏页面链接和报错截图，转人工核对资源签名与包名。',
  },
  {
    id: 'storage_full',
    title: '存储不足',
    aliases: [],
    judge: '安装时提示「存储空间不足」「insufficient storage」，或安装到一半提示写入失败。',
    handle:
      '清理不需要的文件和应用，确认剩余空间明显大于安装包体积；分卷格式（APKS）需要预留解压与安装的额外空间，空间刚好够时也容易失败。',
    escalation:
      '清理后空间充足仍安装失败，提交游戏页面链接给我们，我们会核对资源体积与分卷是否完整。',
  },
  {
    id: 'incompatible',
    title: '系统版本不兼容',
    aliases: ['装上了打不开'],
    judge:
      '安装时提示「应用与当前系统版本不兼容」，或者安装成功后打不开、闪退、黑屏。',
    handle:
      '先对照游戏详情页说明的运行要求，确认设备系统版本是否满足；再尝试清除应用数据后重新打开。仍然打不开时，换一台满足要求的设备验证，排除单机环境问题。',
    escalation:
      '确认设备满足运行要求仍然打不开，请带上设备型号与系统版本反馈给我们，转人工核对是否属于资源或适配问题。',
  },
] as const;

const HELP_PATH = '/help/install';

export const metadata: Metadata = {
  title: '安装排障指南',
  description:
    '安卓游戏安装失败怎么办：解析包错误、应用未安装或签名冲突、存储不足、系统版本不兼容的排查步骤，以及仍然无法解决时的反馈入口。',
  alternates: { canonical: HELP_PATH },
  robots: { index: true, follow: true },
};

export default function InstallHelpPage() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-10">
      <Breadcrumbs
        items={[BREADCRUMB_ROOT, { name: '安装排障指南', href: HELP_PATH }]}
        className="mb-5"
      />
      <h1 className="text-3xl font-semibold">安装排障指南</h1>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground">
        游戏装不上、打不开或下载失败时，先对照下面的症状找到最接近的一类，按「怎么处理」操作。仍然解决不了，再到资源投稿页提交游戏页面链接，我们会核对资源本身。
      </p>

      <nav aria-label="排障目录" className="mt-6">
        <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
          {SYMPTOMS.map((symptom) => (
            <li key={symptom.id}>
              <a
                className="text-primary underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [@media(hover:hover)]:hover:decoration-solid"
                href={`#${symptom.id}`}
              >
                {symptom.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="mt-8 grid gap-4">
        {SYMPTOMS.map((symptom) => (
          <section
            key={symptom.id}
            id={symptom.id}
            aria-labelledby={`${symptom.id}-title`}
            className="scroll-mt-24 rounded-xl border border-border/60 bg-card p-5 shadow-sm"
          >
            <h2 id={`${symptom.id}-title`} className="text-lg font-semibold">
              {symptom.title}
            </h2>
            {symptom.aliases.length > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                也包括：{symptom.aliases.join('、')}
              </p>
            ) : null}
            <dl className="mt-4 grid gap-3 text-sm leading-7">
              <div>
                <dt className="font-semibold text-foreground">怎么判断</dt>
                <dd className="mt-0.5 text-muted-foreground">{symptom.judge}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">怎么处理</dt>
                <dd className="mt-0.5 text-muted-foreground">{symptom.handle}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">还不行怎么办</dt>
                <dd className="mt-0.5 text-muted-foreground">
                  {symptom.escalation}{' '}
                  <Link
                    href="/submit-resource"
                    className="text-primary underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [@media(hover:hover)]:hover:decoration-solid"
                  >
                    提交资源链接
                  </Link>
                </dd>
              </div>
            </dl>
          </section>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border/60 bg-muted/40 p-5 text-sm leading-7 text-muted-foreground">
        <p className="font-semibold text-foreground">仍然无法解决？</p>
        <p className="mt-1">
          到{' '}
          <Link
            href="/submit-resource"
            className="text-primary underline decoration-dotted underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary [@media(hover:hover)]:hover:decoration-solid"
          >
            资源投稿
          </Link>{' '}
          提交游戏页面链接、报错提示和截图，我们会核对资源并反馈处理结果。
        </p>
      </div>
    </section>
  );
}
