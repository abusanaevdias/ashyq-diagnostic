import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CourseDetailsV3 from '@/components/CourseDetailsV3';
import JsonLd from '@/components/JsonLd';
import { COURSE_DETAILS, COURSE_SLUGS, isCourseSlug } from '@/data/courses';
import { courseSchema } from '@/lib/schema';

type Props = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export function generateStaticParams() {
  return COURSE_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  if (!isCourseSlug(slug)) {
    return {};
  }

  const course = COURSE_DETAILS[slug];

  return {
    title: `${course.title} — ASHYQ`,
    description: course.lead,
    alternates: { canonical: `/courses/${course.slug}` },
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;

  if (!isCourseSlug(slug)) {
    notFound();
  }

  return (
    <>
      <JsonLd data={courseSchema(COURSE_DETAILS[slug])} />
      <CourseDetailsV3 course={COURSE_DETAILS[slug]} />
    </>
  );
}
