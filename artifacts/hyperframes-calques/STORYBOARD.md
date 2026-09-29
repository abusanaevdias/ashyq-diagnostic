---
format: 1080x1920
duration: 30s
message: "Ты думаешь по-русски — и это слышно в английском; такие ошибки разбирают на занятиях ASHYQ"
arc: Хук-калька → 4 исправления (одна строка, неверное слово меняется на месте) → вывод → CTA
audience: школьники 15–18, Казахстан, IELTS/SAT
mode: collaborative
---

## Spine

Постоянный «подстрочник»: сверху мелко «ДУМАЕШЬ» + русская фраза, ниже
крупно «ГОВОРИШЬ» + английская строка. Строка не уезжает — неверные слова
зачёркиваются красным и на их месте встают верные (зелёный «верно»).
Счётчик 1/4…4/4. Held frame — вывод перед CTA.

## Frame 1 — Хук

- scene: Сразу крупно «I have 17 years.» — голос «ученика»; над ней мелко «ДУМАЕШЬ: Мне 17 лет»
- duration: 4s
- transition_in: cut
- status: built
- voiceover: "[EN] I have seventeen years. [RU] Звучит знакомо? Это калька с русского."
- src: compositions/s01.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, asr-keyword-glow)

## Frame 2 — Исправление 1: возраст

- scene: «have» и «years» зачёркиваются, встаёт «I'm 17.»; подпись «возраст — через to be»; счётчик 1/4
- duration: 4.5s
- transition_in: cut
- status: built
- voiceover: "[RU] Возраст — через to be. [EN] I'm seventeen."
- src: compositions/s02.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 3 — Исправление 2: agree

- scene: ДУМАЕШЬ «Я согласен» → «I am agree.» → «am» зачёркнут → «I agree.»; подпись «agree — уже глагол»; 2/4
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "[EN] I am agree. [RU] Agree — уже глагол, am не нужен. [EN] I agree."
- src: compositions/s03.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 4 — Исправление 3: depends on

- scene: «Это зависит от тебя» → «It depends from you.» → «from» → «on»; подпись «depends — всегда on»; 3/4
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "[EN] It depends from you. [RU] После depends — всегда on. [EN] It depends on you."
- src: compositions/s04.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 5 — Исправление 4: discuss

- scene: «Давай обсудим это» → «Let's discuss about it.» → «about» вычёркивается и строка схлопывается → «Let's discuss it.»; 4/4
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "[EN] Let's discuss about it. [RU] Discuss — без about. [EN] Let's discuss it."
- src: compositions/s05.html
- blueprint: kinetic-type-beats (rules: discrete-text-sequence, svg-path-draw)

## Frame 6 — Вывод (held frame)

- scene: Четыре исправленные строки стопкой, мелко зачёркнутые кальки рядом; рукописно «экзаменатор это слышит»
- duration: 3.5s
- transition_in: cut
- status: built
- voiceover: "[RU] На экзамене это слышно сразу."
- src: compositions/s06.html
- blueprint: grid-card-assemble

## Frame 7 — CTA

- scene: Вордмарк, Искра; «Разбираем такие ошибки на занятиях»; «Начни с бесплатной диагностики · ссылка в профиле»; «Голоса в ролике созданы ИИ»
- duration: 5s
- transition_in: cut
- status: built
- voiceover: "[RU] Такие ошибки мы разбираем на занятиях Ашык. Начни с бесплатной диагностики — ссылка в профиле."
- src: compositions/s07.html
- blueprint: logo-assemble-lockup
