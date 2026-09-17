import { CAREER_PROFESSION_COUNT } from '@/data/career/professions';
import { CAREER_CODES } from '@/data/career/profiles';
import { CAREER_OG_CONTENT_TYPE, CAREER_OG_SIZE, careerOgImage } from '@/lib/career-og';

/** Превью самого теста; страницы профилей переопределяют его своим. */

export const size = CAREER_OG_SIZE;
export const contentType = CAREER_OG_CONTENT_TYPE;
export const alt = 'Компас — профориентационный тест ASHYQ';

export default function CareerOgImage() {
  return careerOgImage({
    title: 'Сначала «куда», потом «как»',
    subtitle: 'Профиль, подходящие направления и экзамен, который к ним ведёт',
    highlight: `${CAREER_CODES.length} профилей · ${CAREER_PROFESSION_COUNT} профессий · мост в диагностику IELTS и SAT`,
  });
}
