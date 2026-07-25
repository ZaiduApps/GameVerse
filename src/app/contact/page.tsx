import type { Metadata } from 'next';

import {
  generateStaticPageMetadata,
  StaticConfigPage,
} from '../(static-pages)/static-page-config';

export function generateMetadata(): Promise<Metadata> {
  return generateStaticPageMetadata('contact');
}

export default function ContactPage() {
  return <StaticConfigPage pageKey="contact" />;
}
