---
format: 1080x1920
duration: 35.4s
message: "Мы честно говорим, кому НЕ подходим — и поэтому тебе стоит начать с бесплатной диагностики"
arc: Анти-хук → 4 «не приходи, если…» (каждое разворачивается в правду) → разворот → CTA
audience: школьники 15–18, Казахстан, IELTS/SAT
mode: collaborative
---

## Locked

- Эскизы v1 подтверждены владельцем 2026-09-29 («Делай»); сборка повторяет их раскладку.

## Build (фактические тайминги, `index.html`)

| Кадр | Слот | Голос | Файл |
|---|---|---|---|
| 01 | 0.0–2.3 | 0.10 + 1.62 с | compositions/s01.html |
| 02 | 2.3–8.5 | 2.45 + 5.59 с | compositions/s02.html |
| 03 | 8.5–14.4 | 8.65 + 5.28 с | compositions/s03.html |
| 04 | 14.4–20.4 | 14.55 + 5.41 с | compositions/s04.html |
| 05 | 20.4–26.7 | 20.55 + 5.69 с | compositions/s05.html |
| 06 | 26.7–30.4 | 26.85 + 2.80 с | compositions/s06.html |
| 07 | 30.4–35.4 | 30.60 + 3.27 с | compositions/s07.html |

Шапка «НЕ ПРИХОДИ, ЕСЛИ…» — отдельный слот `compositions/anchor.html` (2.3–26.7), фон — `compositions/bg.html`.
Итог: 35.4 с (план ~30–33 с; длиннее из-за реальной длины реплик). `npx hyperframes check` — passed.

## Sketch sheet

`storyboard.html` v1 (2026-09-29): статичные эскизы 7 кадров, пунктир — safe zone Reels.
Озвучка уже сгенерирована (`assets/voice/*.mp3`), тайминги слов — `assets/voice/*.words.json`.

## Frame 1 — Анти-хук

- scene: На кремовом фоне огромное «НЕ ЗАПИСЫВАЙСЯ В ASHYQ.», «НЕ» красным; слова бьют в такт голосу
- duration: 2.5s
- transition_in: cut
- status: animated
- voiceover: "Не записывайся в Ашык."
- src: compositions/s01.html
- blueprint: kinetic-type-beats (rules: kinetic-beat-slam, asr-keyword-glow)

Первая секунда ломает ожидание рекламы: бренд сам отговаривает. Эта же фраза
вернётся в кадре 6, и там «НЕ» зачеркнут.

## Frame 2 — «Если ждёшь обещания восьмёрки»

- scene: Шапка «НЕ ПРИХОДИ, ЕСЛИ…» (постоянный якорь, счётчик 1/4); ниже стикер «8.0 гарантия!», его перечёркивает красная линия; рукописный ответ Caveat «баллы мы не обещаем»
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "Не приходи, если тебе нужно обещание восьмёрки. Баллы мы не обещаем."
- src: compositions/s02.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Правда из контракта честности: гарантий балла нет. Это и есть первое «доказательство честности».

## Frame 3 — «Если любишь угадывать в Listening»

- scene: Якорь «НЕ ПРИХОДИ, ЕСЛИ…» 2/4; бланк ответов, кружочки A/B/C заполняются наугад (кубик), затем Caveat «на занятиях разбираем ловушки»
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "Если любишь угадывать ответы в листенинге. На занятиях мы разбираем ловушки."
- src: compositions/s03.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Связь с роликом «Диктовка IELTS» — те же ловушки-поправки.

## Frame 4 — «Если по вечерам занят»

- scene: Якорь 3/4; циферблат, дуга 19:00–23:00 заливается красным; «пн–сб · по Астане»; Caveat «как раз после школы»
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "Если вечером ты занят. Занятия с семи до одиннадцати — как раз после школы."
- src: compositions/s04.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Факт из `club-offer.ts`: пн–сб, 19:00–23:00 (Астана, UTC+5).

## Frame 5 — «Если не хочешь знать свой уровень»

- scene: Якорь 4/4; шкала уровня с «?» вместо стрелки; плашка «бесплатно · ~20 минут»
- duration: 5s
- transition_in: cut
- status: animated
- voiceover: "Если не хочешь знать свой уровень. Диагностика у нас бесплатная, двадцать минут."
- src: compositions/s05.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Подводит к CTA: самый низкий порог входа.

## Frame 6 — Разворот

- scene: Возвращается «НЕ ЗАПИСЫВАЙСЯ В ASHYQ.»; рукописная красная линия зачёркивает «НЕ» → «ЗАПИСЫВАЙСЯ В ASHYQ.»
- duration: 3s
- transition_in: cut
- status: animated
- voiceover: "Всё ещё смотришь? Похоже, тебе к нам."
- src: compositions/s06.html
- blueprint: kinetic-type-beats (rules: svg-path-draw)

Визуальная развязка всей конструкции — один жест переворачивает смысл.

## Frame 7 — CTA

- scene: Вордмарк ashyq, Искра выпрыгивает и машет; «Начни с бесплатной диагностики»; «ссылка в профиле»; мелко «Голос в ролике создан ИИ»
- duration: 4.5s
- transition_in: cut
- status: animated
- voiceover: "Начни с бесплатной диагностики — ссылка в профиле."
- src: compositions/s07.html
- blueprint: logo-assemble-lockup

Одно действие, без цены (период цены ещё не подтверждён владельцем).
