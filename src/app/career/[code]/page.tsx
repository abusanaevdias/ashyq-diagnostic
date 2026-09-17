import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CareerResultView from '@/components/career/CareerResultView';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';
import { CAREER_CODES } from '@/data/career/profiles';
import { getCareerProfile, matchProfessions } from '@/lib/career';
import home from '@/components/HomeV3.module.css';

/**
 * /career/<код> — статическая страница одного из 16 профилей «Компаса».
 *
 * Зачем отдельный маршрут, а не `?type=` на /career: ссылкой на результат
 * делятся, поэтому он должен открываться сразу и без JS. Плюс 16 честных
 * индексируемых страниц вместо одного клиентского экрана.
 */

export const dynamicParams = false;

export function generateStaticParams() {
  return CAREER_CODES.map((code) => ({ code: code.toLowerCase() }));
}

function profileFor(code: string) {
  return getCareerProfile(code.toUpperCase());
}

export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  const { code } = await params;
  const profile = profileFor(code);
  if (!profile) return {};

  const top = matchProfessions(profile.code).top.map((profession) => profession.title);
  return {
    title: `${profile.code} «${profile.name}» — профиль Компаса`,
    description: `${profile.summary} Подходящие направления: ${top.join(', ')}. Что это значит для IELTS и SAT — в разборе профиля.`,
    alternates: { canonical: `/career/${code.toLowerCase()}` },
  };
}

export default async function CareerProfilePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = profileFor(code);
  if (!profile) notFound();

  return (
    <div className={home.page}>
      <SiteHeader />
      <CareerResultView profile={profile} matches={matchProfessions(profile.code)} variant="profile" />
      <SiteFooter />
    </div>
  );
}
