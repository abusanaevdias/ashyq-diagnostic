---
format: 1080x1920
duration: 37.5s
message: "Ты думаешь по-русски — и это слышно в английском; такие ошибки разбирают на занятиях ASHYQ"
arc: Хук-калька → 4 исправления (одна строка, неверное слово меняется на месте) → вывод → CTA
audience: школьники 15–18, Казахстан, IELTS/SAT
mode: collaborative
---

## Locked

- Эскизы v1 подтверждены владельцем 2026-09-29 («Делай»).

## Build (фактические тайминги, `index.html`, генерирует `scripts/build.py`)

| Сцена | Кадры | Слот | Голоса |
|---|---|---|---|
| c1 | 01+02 (одна строка, правка без склейки) | 0.00–8.71 | s01-en, s01-ru, s02-ru, s02-en |
| c2 | 03 agree | 8.71–15.68 | s03-en1, s03-ru, s03-en2 |
| c3 | 04 depends | 15.68–21.04 | s04-en1, s04-ru, s04-en2 |
| c4 | 05 discuss | 21.04–26.37 | s05-en1, s05-ru, s05-en2 |
| c5 | 06 шпаргалка | 26.37–30.27 | s06-ru |
| c6 | 07 призыв | 30.27–37.52 | s07-ru |

Сквозные слоты: `anchor` (ДУМАЕШЬ/ГОВОРИШЬ + счётчик, 0–26.37), `spark` (Искра в углу, 0–30.27), `bg` (тетрадная клетка).
Итог 37.5 с (план ~30 с: реплики длиннее расчётных; RU диктор ускорен ×1.08). `npx hyperframes check` — passed.
Ширина слов для правок меряется через `window.__hyperframes.pretext` (сцена может быть скрыта при сборке таймлайна — `offsetWidth` тогда 0).

## Sketch sheet

`storyboard.html` v1 (2026-09-29), превью `storyboard-v1.png`. Озвучка готова: `assets/voice/*.mp3`, тайминги слов `*.words.json`;
русские реплики без английских слов (RU голос их искажает), английское — только на экране и у EN «ученика».

## Spine

Постоянный «подстрочник»: сверху мелко «ДУМАЕШЬ» + русская фраза, ниже
крупно «ГОВОРИШЬ» + английская строка. Строка не уезжает — неверные слова
зачёркиваются красным и на их месте встают верные (зелёный «верно»).
Счётчик 1/4…4/4. Held frame — вывод перед CTA.

## Frame 1 — Хук

- scene: Сразу крупно «I have 17 years.» — голос «ученика»; над ней мелко «ДУМАЕШЬ: Мне 17 лет»
- duration: 4s
- transition_in: cut
- status: animated
- voiceover: "[EN] I have seventeen years. [RU] Звучит знакомо? Это калька с русского."
- src: compositions/s01.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, asr-keyword-glow)

## Frame 2 — Исправление 1: возраст

- scene: «have» и «years» зачёркиваются, встаёт «I'm 17.»; подпись «возраст — через to be»; счётчик 1/4
- duration: 4.5s
- transition_in: cut
- status: animated
- voiceover: "[RU] Возраст — через глагол «быть». [EN] I'm seventeen."
- src: compositions/s02.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 3 — Исправление 2: agree

- scene: ДУМАЕШЬ «Я согласен» → «I am agree.» → «am» зачёркнут → «I agree.»; подпись «agree — уже глагол»; 2/4
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "[EN] I am agree. [RU] В английском «согласен» — уже глагол. Лишнее слово убираем. [EN] I agree."
- src: compositions/s03.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 4 — Исправление 3: depends on

- scene: «Это зависит от тебя» → «It depends from you.» → «from» → «on»; подпись «depends — всегда on»; 3/4
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "[EN] It depends from you. [RU] После «дипендс» — всегда «он». [EN] It depends on you."
- src: compositions/s04.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 5 — Исправление 4: discuss

- scene: «Давай обсудим это» → «Let's discuss about it.» → «about» вычёркивается и строка схлопывается → «Let's discuss it.»; 4/4
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "[EN] Let's discuss about it. [RU] Обсуждать — без предлога. [EN] Let's discuss it."
- src: compositions/s05.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 6 — Вывод (held frame)

- scene: Четыре исправленные строки стопкой, мелко зачёркнутые кальки рядом; рукописно «экзаменатор это слышит»
- duration: 3.5s
- transition_in: cut
- status: animated
- voiceover: "[RU] На экзамене это слышно сразу."
- src: compositions/s06.html
- blueprint: grid-card-assemble

## Frame 7 — CTA

- scene: Вордмарк, Искра; «Разбираем такие ошибки на занятиях»; «Начни с бесплатной диагностики · ссылка в профиле»; «Голоса в ролике созданы ИИ»
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "[RU] Такие ошибки мы разбираем на занятиях Ашык. Начни с бесплатной диагностики — ссылка в профиле."
- src: compositions/s07.html
- blueprint: logo-assemble-lockup
