---
workflow: general-video
flow: automation
storyboard: yes
message: "Пять мифов об IELTS, которые легко проверить: каждый разбирается по официальным правилам, а свой уровень можно узнать бесплатно"
destination: instagram-carousel
aspect: 1080x1440
language: ru
audience: школьники 15–18, Казахстан, готовятся к IELTS/SAT
length: 7 слайдов × 6 с
angle: миф → факт
deliverables: 7 анимированных MP4-слайдов + 7 статичных PNG (собранные кадры)
---

## Intent

Карусель для Instagram (3:4, 1080×1440), выбрана владельцем 2026-09-29: концепция
«Миф → факт». Слайд 1 — хук «Сколько из 5 ты знал?», слайды 2–6 — по одному
мифу: красная печать «МИФ» → миф зачёркивается → зелёная печать «ФАКТ» и
проверяемое правило IELTS; слайд 7 — призыв на бесплатную диагностику.
Слайды листают без звука: весь смысл в тексте и анимации; каждый слайд
заканчивается собранным кадром (PNG = последний кадр).

## Assets

- assets/fonts, assets/brand/wordmark-ink.png — из `../hyperframes-antiad`
- assets/spark.js — маскот «Искра» (вариант A)

## Customizations

- Сквозной прогресс-бар из 7 сегментов внизу слайда (нить, которая связывает слайды при листании).
- Числа считаются анимацией (счётчики), печати «МИФ»/«ФАКТ» шлёпаются со звуком «нет», но звука в MP4 нет.

## Notes

- **Каждый факт — официальный, со ссылкой на источник** (проверено 2026-09-29):
  1. Нет «сдал / не сдал»; вуз или организация сами задают нужный балл — IDP IELTS: "There is no pass or fail in IELTS." / "Each educational institution or organisation sets its own level of IELTS scores".
  2. "Task 2 contributes twice as much as Task 1 to the Writing score" — ielts.org (Academic Writing); ≥150 слов и ≥250 слов.
  3. "You will hear the recordings once only" — ielts.org (Academic Listening); 4 части, 40 вопросов, ~30 минут.
  4. Среднее четырёх секций округляют до ближайшей половины: .25 → вверх до .5, .75 → вверх до целого — ielts.org (IELTS scoring in detail).
  5. "We recommend that IELTS test results are considered valid for two years" — ielts.org (IELTS scoring in detail).
- Без гарантий балла, без выдуманной статистики («большинство ошибаются» и т. п.), без других школ.
- Диагностику называем «предварительной оценкой»: ~20 минут, бесплатно, ссылка в профиле; цену не показываем (период 68 000 ₸ не подтверждён).
- Дизайн v3 (как в `../hyperframes-calques`): bg #f8f7f3, ink #161311, red #de0b1b (≤15% кадра), «верно» — success #2e5e3a / #e8efe2; Manrope 800, Inter 500/600, Caveat 700 (цифры с «0» не в Caveat).
- Поля для Instagram 3:4: ключевой текст ≥ 90 px от краёв.
