import type { Metadata } from 'next';
import Link from 'next/link';
import { EditorialLabel, RedStar } from '@/components/ui/Brand';
import { GlyphBadge, type GlyphName } from '@/components/ui/Glyphs';
import { SiteFooter, SiteHeader } from '@/components/ui/SiteChrome';

export const metadata: Metadata = {
  title: 'Сообщество ASHYQ',
  description: 'Среда ASHYQ: командная работа, Match Days, презентации и взаимная поддержка.',
  alternates: { canonical: '/community' },
};

const VALUES: Array<{ glyph: GlyphName; title: string; text: string }> = [
  { glyph: 'people', title: 'Команда', text: 'Задачи решаются вместе: вклад каждого виден в общем результате.' },
  { glyph: 'speech', title: 'Голос', text: 'Speaking Battles и презентации помогают ясно формулировать и защищать идеи.' },
  { glyph: 'bulb', title: 'Мышление', text: 'Missions и финальные задачи развивают стратегию и критическое мышление.' },
];

export default function CommunityPage() {
  return (
    <div className="v3 min-h-dvh">
      <SiteHeader />
      <main>
        <section className="shell-wide pb-14 pt-5 sm:pt-10">
          <EditorialLabel>People · Knowledge · A brighter tomorrow</EditorialLabel>
          <div className="mt-5 grid items-center gap-9 lg:grid-cols-12">
            <div className="lg:col-span-6">
              <h1 className="display max-w-[8.8em] text-display text-red">Люди делают знания живыми</h1>
              <p className="mt-6 max-w-lg text-[1.05rem] leading-relaxed text-ink-soft">ASHYQ — это не только уроки и баллы. Это среда, где ученики тренируются в команде, пробуют себя под давлением и учатся показывать прогресс.</p>
            </div>
            <img src="/brand/hero-students.jpg" alt="Студенты ASHYQ" width="1200" height="800" className="w-full rounded-md object-cover lg:col-span-6" />
          </div>
        </section>
        <section className="border-y border-line bg-paper-deep/50">
          <div className="shell-wide py-14 sm:py-18">
            <EditorialLabel>Что объединяет сообщество</EditorialLabel>
            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {VALUES.map((item) => (
                <article key={item.title} className="card p-5">
                  <GlyphBadge name={item.glyph} className="h-12 w-12" />
                  <h2 className="display mt-4 text-h3">{item.title}</h2>
                  <p className="mt-2 text-[0.94rem] leading-relaxed text-ink-soft">{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
        <section className="shell-wide py-14 sm:py-18">
          <div className="grid items-center gap-8 lg:grid-cols-12">
            <img src="/brand/lesson-grid.jpg" alt="Онлайн-занятие ASHYQ" width="1000" height="390" className="w-full rounded-md object-cover lg:col-span-7" />
            <div className="lg:col-span-5">
              <p className="label flex items-center gap-2 text-red"><RedStar className="h-2.5 w-2.5" />Онлайн и в Астане</p>
              <h2 className="display mt-4 text-h2">Начни со своей точки А</h2>
              <p className="mt-4 text-ink-soft">Пройди диагностику или оставь заявку на следующий сезон — команда расскажет об актуальном формате.</p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link href="/?start=ielts" className="btn btn-primary">Диагностика</Link>
                <Link href="/season" className="btn btn-outline">Следующий сезон</Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
