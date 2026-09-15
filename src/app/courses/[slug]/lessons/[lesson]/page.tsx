import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseLessonV3 from '@/components/CourseLessonV3';
import { COURSE_DETAILS, COURSE_SLUGS, freeLessons, isCourseSlug } from '@/data/courses';

type Props = {
  params: Promise<{ slug: string; lesson: string }>;
};

// страницы есть только у бесплатных уроков: закрытый урок по прямой ссылке — 404
export const dynamicParams = false;

/**
 * Оба сегмента сразу («generate params from the bottom up»): родительский generateStaticParams
 * лежит в page.tsx, а не в layout.tsx, поэтому его params сюда не приходят.
 */
export function generateStaticParams() {
  return COURSE_SLUGS.flatMap((slug) => freeLessons(COURSE_DETAILS[slug]).map((lesson) => ({ slug, lesson: lesson.slug })));
}

function find(slug: string, lessonSlug: string) {
  if (!isCourseSlug(slug)) return null;
  const course = COURSE_DETAILS[slug];
  const lesson = freeLessons(course).find((item) => item.slug === lessonSlug);
  return lesson ? { course, lesson } : null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, lesson } = await params;
  const found = find(slug, lesson);
  if (!found) return {};
  return {
    title: `${found.lesson.title} — бесплатный урок ${found.course.exam} | ASHYQ`,
    description: found.lesson.summary,
    alternates: { canonical: `/courses/${slug}/lessons/${lesson}` },
  };
}

export default async function CourseLessonPage({ params }: Props) {
  const { slug, lesson } = await params;
  const found = find(slug, lesson);
  if (!found) notFound();
  return <CourseLessonV3 course={found.course} lesson={found.lesson} />;
}
