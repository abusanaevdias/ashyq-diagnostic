import type { Metadata } from 'next';
import CareerV3 from '@/components/CareerV3';

export const metadata: Metadata = {
  title: 'Компас — профориентационный тест',
  description:
    'Бесплатный тест на 40 утверждений: профиль, подходящие профессии и экзамен, который к ним ведёт. Шесть минут, без регистрации, результат сразу.',
  alternates: { canonical: '/career' },
};

/**
 * /career — «Компас», вход в воронку на шаг раньше диагностики: сначала
 * «куда поступать», потом «какой у меня уровень». Интро рендерится на
 * сервере, поэтому страница индексируется без JS.
 */
export default function CareerPage() {
  return <CareerV3 />;
}
