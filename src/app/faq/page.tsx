import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialLabel } from '@/components/ui/Brand';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';

export const metadata: Metadata = {
  title: 'Вопросы и ответы — ASHYQ',
  description: 'Ответы о диагностике IELTS и SAT, сезонах, прогрессе, формате и заявках ASHYQ.',
};

const FAQ = [
  ['Что такое Quick Diagnostic?', 'Короткая предварительная диагностика: 12 вопросов IELTS или 16 вопросов SAT. Она показывает текущий диапазон, сильные стороны и ближайший фокус, но не заменяет официальный экзамен.'],
  ['Нужна ли регистрация?', 'Нет. Для прохождения диагностики имя, телефон и почта не нужны. Контакт запрашивается только если вы сами хотите получить разбор или узнать о сезоне.'],
  ['Какие навыки проверяет IELTS-диагностика?', 'Reading и Listening. Writing и Speaking требуют отдельной проверки с тренером и не входят в автоматический результат.'],
  ['Как отслеживается прогресс?', 'Через повторные диагностики, пробные тесты, задания, Missions, Match Days и отчёты. На этом сайте история диагностик хранится локально на вашем устройстве.'],
  ['Что такое Match Day?', 'Практика под давлением: Speaking Battle, Reading Sprint, SAT Math Race и командные задачи. Участие и рост влияют на рейтинг.'],
  ['Как устроен сезон?', 'В году заявлено четыре сезона. Путь проходит от занятий и Match Days через рейтинг к Championship; лучшие участники могут попасть в ASHYQ Super Game.'],
  ['Сколько стоит обучение и когда старт?', 'Стоимость, расписание и даты зависят от конкретного набора. Оставьте заявку на странице сезона — команда сообщит подтверждённые условия без догадок и устаревших обещаний.'],
  ['Что происходит с моим телефоном?', 'Телефон используется только для ответа по вашей заявке. Перед отправкой вы отдельно подтверждаете согласие; подробнее — в политике конфиденциальности.'],
] as const;

export default function FaqPage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main className="shell-wide py-8 sm:py-12">
        <EditorialLabel num="01">FAQ</EditorialLabel>
        <h1 className="display mt-5 max-w-[13ch] text-display text-red">Коротко и по делу</h1>
        <div className="mt-9 divide-y divide-line border-y border-line-strong">
          {FAQ.map(([question, answer], index) => (
            <details key={question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-5">
                <span className="display text-h3"><span className="mr-3 font-mono text-[0.7rem] text-red">{String(index + 1).padStart(2, '0')}</span>{question}</span>
                <span aria-hidden="true" className="text-2xl leading-none text-red transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-4 max-w-3xl pl-9 text-[0.98rem] leading-relaxed text-ink-soft">{answer}</p>
            </details>
          ))}
        </div>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link href="/season" className="btn btn-primary">Узнать о сезоне</Link>
          <Link href="/?start=ielts" className="btn btn-outline">Пройти диагностику</Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
