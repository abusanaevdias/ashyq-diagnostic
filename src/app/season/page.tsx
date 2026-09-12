import type { Metadata } from 'next';
import SeasonForm from '@/components/SeasonForm';
import { EditorialLabel } from '@/components/ui/Brand';
import { Glyph, type GlyphName } from '@/components/ui/Glyphs';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';

export const metadata: Metadata = {
  title: 'Следующий сезон ASHYQ',
  description: 'Оставьте заявку, чтобы получить подтверждённые даты, формат и стоимость следующего сезона ASHYQ.',
};

const JOURNEY: Array<{ glyph: GlyphName; title: string; text: string }> = [
  { glyph: 'calendar', title: 'Season', text: 'Занятия, развитие и работа в команде' },
  { glyph: 'people', title: 'Match Day', text: 'Практика, задачи и баллы' },
  { glyph: 'chart', title: 'Leaderboard', text: 'Рост и вклад в результат команды' },
  { glyph: 'trophy', title: 'Championship', text: 'Финальное соревнование сезона' },
];

export default function SeasonPage() {
  return (
    <div className="min-h-dvh">
      <SiteHeader />
      <main>
        <section className="shell-wide pb-10 pt-5 sm:pt-10">
          <EditorialLabel num="01">Набор в следующий сезон</EditorialLabel>
          <div className="mt-5 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h1 className="display max-w-[13ch] text-display text-red">От точки А — к чемпионату</h1>
              <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft">В течение года проходит четыре сезона. Каждый ведёт через занятия, Match Days и рейтинг к собственному Championship.</p>
              <p className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-faint">Даты, расписание и стоимость меняются от набора к набору. Оставьте заявку — команда сообщит только подтверждённые условия.</p>
            </div>
            <div className="lg:col-span-6"><SeasonForm /></div>
          </div>
        </section>
        <section className="border-y border-line bg-paper-deep/50">
          <div className="shell-wide py-14 sm:py-18">
            <EditorialLabel num="02">Путь сезона</EditorialLabel>
            <ol className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {JOURNEY.map((item, index) => (
                <li key={item.title} className="card relative p-5">
                  <Glyph name={item.glyph} className="h-8 w-8 text-red" />
                  <span className="label absolute right-4 top-4 text-ink-faint">0{index + 1}</span>
                  <h2 className="display mt-4 text-h3">{item.title}</h2>
                  <p className="mt-2 text-[0.9rem] text-ink-soft">{item.text}</p>
                </li>
              ))}
            </ol>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="card p-5"><p className="label text-ink-faint">Season Champion</p><p className="display mt-2 text-[2rem] text-red">100 000 ₸</p></div>
              <div className="card p-5"><p className="label text-ink-faint">ASHYQ Super Game</p><p className="display mt-2 text-[2rem] text-red">500 000 ₸</p></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
