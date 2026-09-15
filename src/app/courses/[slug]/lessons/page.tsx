import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseLessonsV3 from '@/components/CourseLessonsV3';
import { COURSE_DETAILS, COURSE_SLUGS, isCourseSlug } from '@/data/courses';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return COURSE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isCourseSlug(slug)) return {};
  const course = COURSE_DETAILS[slug];
  return {
    title: `Уроки курса ${course.exam} — ASHYQ`,
    description: `Программа подготовки к ${course.exam}: модули и уроки. Вступительные уроки открыты бесплатно.`,
    alternates: { canonical: `/courses/${course.slug}/lessons` },
  };
}

export default async function CourseLessonsPage({ params }: Props) {
  const { slug } = await params;
  if (!isCourseSlug(slug)) notFound();
  return <CourseLessonsV3 course={COURSE_DETAILS[slug]} />;
}
