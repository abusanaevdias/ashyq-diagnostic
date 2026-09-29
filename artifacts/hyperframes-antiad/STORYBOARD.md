---
format: 1080x1920
duration: 30s
message: "Мы честно говорим, кому НЕ подходим — и поэтому тебе стоит начать с бесплатной диагностики"
arc: Анти-хук → 4 «не приходи, если…» (каждое разворачивается в правду) → разворот → CTA
audience: школьники 15–18, Казахстан, IELTS/SAT
mode: collaborative
---

## Sketch sheet

`storyboard.html` v1 (2026-09-29): статичные эскизы 7 кадров, пунктир — safe zone Reels.
Озвучка уже сгенерирована (`assets/voice/*.mp3`), тайминги слов — `assets/voice/*.words.json`.

## Frame 1 — Анти-хук

- scene: На кремовом фоне огромное «НЕ ЗАПИСЫВАЙСЯ В ASHYQ.», «НЕ» красным; слова бьют в такт голосу
- duration: 2.5s
- transition_in: cut
- status: built
- voiceover: "Не записывайся в Ашык."
- src: compositions/01-hook.html
- blueprint: kinetic-type-beats (rules: kinetic-beat-slam, asr-keyword-glow)

Первая секунда ломает ожидание рекламы: бренд сам отговаривает. Эта же фраза
вернётся в кадре 6, и там «НЕ» зачеркнут.

## Frame 2 — «Если ждёшь обещания восьмёрки»

- scene: Шапка «НЕ ПРИХОДИ, ЕСЛИ…» (постоянный якорь, счётчик 1/4); ниже стикер «8.0 гарантия!», его перечёркивает красная линия; рукописный ответ Caveat «баллы мы не обещаем»
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "Не приходи, если тебе нужно обещание восьмёрки. Баллы мы не обещаем."
- src: compositions/02-promise.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Правда из контракта честности: гарантий балла нет. Это и есть первое «доказательство честности».

## Frame 3 — «Если любишь угадывать в Listening»

- scene: Якорь «НЕ ПРИХОДИ, ЕСЛИ…» 2/4; бланк ответов, кружочки A/B/C заполняются наугад (кубик), затем Caveat «на занятиях разбираем ловушки»
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "Если любишь угадывать ответы в листенинге. На занятиях мы разбираем ловушки."
- src: compositions/03-guess.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Связь с роликом «Диктовка IELTS» — те же ловушки-поправки.

## Frame 4 — «Если по вечерам занят»

- scene: Якорь 3/4; циферблат, дуга 19:00–23:00 заливается красным; «пн–сб · по Астане»; Caveat «как раз после школы»
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "Если вечером ты занят. Занятия с семи до одиннадцати — как раз после школы."
- src: compositions/04-evening.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Факт из `club-offer.ts`: пн–сб, 19:00–23:00 (Астана, UTC+5).

## Frame 5 — «Если не хочешь знать свой уровень»

- scene: Якорь 4/4; шкала уровня с «?» вместо стрелки; плашка «бесплатно · ~20 минут»
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "Если не хочешь знать свой уровень. Диагностика у нас бесплатная, двадцать минут."
- src: compositions/05-level.html
- blueprint: fixed-anchor-cycle (rules: svg-path-draw, asr-keyword-glow)

Подводит к CTA: самый низкий порог входа.

## Frame 6 — Разворот

- scene: Возвращается «НЕ ЗАПИСЫВАЙСЯ В ASHYQ.»; рукописная красная линия зачёркивает «НЕ» → «ЗАПИСЫВАЙСЯ В ASHYQ.»
- duration: 3s
- transition_in: cut
- status: built
- voiceover: "Всё ещё смотришь? Похоже, тебе к нам."
- src: compositions/06-turn.html
- blueprint: kinetic-type-beats (rules: svg-path-draw)

Визуальная развязка всей конструкции — один жест переворачивает смысл.

## Frame 7 — CTA

- scene: Вордмарк ashyq, Искра выпрыгивает и машет; «Начни с бесплатной диагностики»; «ссылка в профиле»; мелко «Голос в ролике создан ИИ»
- duration: 4.5s
- transition_in: cut
- status: built
- voiceover: "Начни с бесплатной диагностики — ссылка в профиле."
- src: compositions/07-cta.html
- blueprint: logo-assemble-lockup

Одно действие, без цены (период цены ещё не подтверждён владельцем).
