import type { Metadata } from 'next';

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
