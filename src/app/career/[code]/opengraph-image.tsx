import { CAREER_CODES } from '@/data/career/profiles';
import { getCareerProfile, matchProfessions } from '@/lib/career';
import { CAREER_OG_CONTENT_TYPE, CAREER_OG_SIZE, careerOgImage } from '@/lib/career-og';

/**
 * Превью профиля: результатом делятся ссылкой, поэтому в картинке должен
 * быть конкретный профиль, а не общий баннер сайта.
 */

export const size = CAREER_OG_SIZE;
export const contentType = CAREER_OG_CONTENT_TYPE;
export const alt = 'Профиль теста «Компас» — ASHYQ';

export function generateStaticParams() {
  return CAREER_CODES.map((code) => ({ code: code.toLowerCase() }));
}

export default async function CareerProfileOgImage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const profile = getCareerProfile(code.toUpperCase());
  if (!profile) {
    return careerOgImage({
      title: 'Компас',
      subtitle: 'Профориентационный тест ASHYQ',
      highlight: 'Профиль, направления и экзамен, который к ним ведёт',
    });
  }

  const top = matchProfessions(profile.code).top.map((profession) => profession.title);
  return careerOgImage({
    code: profile.code,
    title: profile.name,
    subtitle: profile.archetype,
    highlight: top.join('  ·  '),
  });
}
