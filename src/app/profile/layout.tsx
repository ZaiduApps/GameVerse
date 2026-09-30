import type { Metadata } from 'next';

// 用户中心整棵子树都是登录态页面：center 下的四个页面读 useSearchParams() 做筛选状态，
// 而预渲染阶段拿不到查询参数，next build 会以 missing-suspense-with-csr-bailout 直接失败。
// 这些页面本来就不入索引（见下方 metadata.robots），静态预渲染没有收益，
// 因此在布局层统一豁免，而不是给每个页面各包一层 Suspense。
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '用户中心 | APKScc',
  description: 'APKScc 用户中心。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return children;
}
