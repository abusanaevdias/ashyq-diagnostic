import type { CourseDetail } from '@/data/courses';
import { FAQ } from '@/data/faq';
import { WHATSAPP_NUMBER } from '@/lib/config';
import { CONTACT_EMAIL, SITE_DESCRIPTION, SITE_FULL_NAME, SITE_NAME, SITE_URL, SOCIAL_LINKS } from '@/lib/site';

/**
 * Schema.org для поисковиков (SEO-SCHEMA-001): только подтверждённые факты —
 * контакты из src/lib/site.ts и config, без цен и рейтингов, которых пока нет.
 */

const ORGANIZATION_ID = `${SITE_URL}/#organization`;

/** Google site-name preference, not a promise of ranking or endorsement. */
export const WEBSITE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}/#website`,
  name: SITE_NAME,
  alternateName: SITE_FULL_NAME,
  url: SITE_URL,
  inLanguage: 'ru',
  publisher: { '@id': ORGANIZATION_ID },
};

export const ORGANIZATION = {
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  '@id': ORGANIZATION_ID,
  name: SITE_NAME,
  alternateName: SITE_FULL_NAME,
  email: CONTACT_EMAIL,
  url: SITE_URL,
  logo: `${SITE_URL}/brand/logo-icon.png`,
  description: SITE_DESCRIPTION,
  areaServed: [
    { '@type': 'City', name: 'Астана' },
    { '@type': 'Country', name: 'Казахстан' },
  ],
  sameAs: SOCIAL_LINKS.map((social) => social.href),
  contactPoint: { '@type': 'ContactPoint', telephone: `+${WHATSAPP_NUMBER}`, email: CONTACT_EMAIL, url: `${SITE_URL}/contacts`, contactType: 'customer service' },
};

export const ABOUT_PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  '@id': `${SITE_URL}/about#page`,
  url: `${SITE_URL}/about`,
  name: `О клубе ${SITE_FULL_NAME}`,
  description: SITE_DESCRIPTION,
  inLanguage: 'ru',
  mainEntity: { '@id': ORGANIZATION_ID },
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
    hasCourseInstance: { '@type': 'CourseInstance', courseMode: 'online' },
  };
}

export const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ.map(([question, answer]) => ({ '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer } })),
};
