import 'server-only';
import raw from '@/data/free-library-content.json';
import { LIBRARY_CHAPTERS } from '@/data/free-library';

export type LibraryBlock = { kind: string; text?: string; rows?: string[][]; href?: string; id?: string };
export type LibrarySection = { code: string; title: string; subtitle: string; source: string; page: number; answer: boolean; exercise: boolean; blocks: LibraryBlock[] };
export const LIBRARY_SECTIONS = raw.sections as LibrarySection[];
export function libraryChapter(slug: string) { return LIBRARY_CHAPTERS.find((chapter) => chapter.slug === slug); }
export function chapterSections(slug: string) {
  const chapter = libraryChapter(slug);
  return chapter ? LIBRARY_SECTIONS.filter((section) => section.source === chapter.source && section.page >= chapter.start && section.page <= chapter.end) : [];
}
