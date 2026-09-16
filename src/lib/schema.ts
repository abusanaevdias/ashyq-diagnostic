import type { CourseDetail } from '@/data/courses';
import { FAQ } from '@/data/faq';
import { WHATSAPP_NUMBER } from '@/lib/config';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL, SOCIAL_LINKS } from '@/lib/site';

/**
 * Schema.org для поисковиков (SEO-SCHEMA-001): только подтверждённые факты —
 * контакты из src/lib/site.ts и config, без цен и рейтингов, которых пока нет.
 */

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION_ID,
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo-icon.png`,
  description: SITE_DESCRIPTION,
  address: { '@type': 'PostalAddress', addressLocality: 'Астана', addressCountry: 'KZ' },
  sameAs: SOCIAL_LINKS.map((social) => social.href),
  contactPoint: { '@type': 'ContactPoint', telephone: `+${WHATSAPP_NUMBER}`, contactType: 'customer service', availableLanguage: ['ru'] },
};

export function courseSchema(course: CourseDetail) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Course',
    name: course.title,
    description: course.lead,
    url: `${SITE_URL}/courses/${course.slug}`,
    inLanguage: 'ru',
    provider: { '@type': 'EducationalOrganization', '@id': ORGANIZATION_ID, name: SITE_NAME, url: SITE_URL },
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: ['online', 'onsite'], location: 'Астана' },
  };
}

export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
};
