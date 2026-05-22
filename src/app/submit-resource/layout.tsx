import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '资源投稿 | APKScc',
  description: '向 APKScc 提交应用、游戏和下载资源。',
  robots: {
    index: false,
    follow: false,
  },
};

export default function SubmitResourceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
