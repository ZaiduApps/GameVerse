import type { Metadata } from 'next';

import {
  generateStaticPageMetadata,
  StaticConfigPage,
} from '../(static-pages)/static-page-config';

export function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('privacy_policy');
}

export default function PrivacyPolicyPage() {
  return <StaticConfigPage pageKey="privacy_policy" />;
}
