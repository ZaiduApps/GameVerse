import type { Metadata } from 'next';

import {
  generateStaticPageMetadata,
  StaticConfigPage,
} from '../(static-pages)/static-page-config';

export function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('about');
}

export default function AboutPage() {
  return <StaticConfigPage pageKey="about" />;
}
