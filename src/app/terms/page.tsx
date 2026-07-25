import type { Metadata } from 'next';

import {
  generateStaticPageMetadata,
  StaticConfigPage,
} from '../(static-pages)/static-page-config';

export function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('terms');
}

export default function TermsPage() {
  return <StaticConfigPage pageKey="terms" />;
}
