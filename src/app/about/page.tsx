import type { Metadata } from 'next';
import AboutV3 from '@/components/AboutV3';
import JsonLd from '@/components/JsonLd';
import { ABOUT_PAGE_SCHEMA } from '@/lib/schema';
import { SITE_DESCRIPTION } from '@/lib/site';

export const metadata: Metadata = {
  title: 'ASHYQ — образовательный клуб IELTS и SAT в Казахстане',
  description: SITE_DESCRIPTION,
  alternates: { canonical: '/about' },
};

export default function AboutPage() {
  return <><JsonLd data={ABOUT_PAGE_SCHEMA} /><AboutV3 /></>;
}
