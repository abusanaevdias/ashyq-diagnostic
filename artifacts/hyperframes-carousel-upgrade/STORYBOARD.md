---
format: 1080x1440
duration: 6s per slide × 7 (+ 200 ms poster)
arc: Хук → 5 × (было → замена маркером → стало + почему) → шпаргалка + призыв
mode: autonomous (владелец разрешил без согласований)
---

## Build

`scripts/build.py` → `compositions/s01…s07`; `scripts/export.sh` → `export/slide-01…07.mp4` (6-кадровый постер + 180 кадров) и PNG.
Раунд: 0,3 «было» → 1,1 красная волна под заменяемыми словами → 1,7 стрелка «прокачка» → 2,5 «стало» → 3,1 маркер под новыми
словами → 3,8 «почему». `npx hyperframes check` — passed (контраст 41/41).

## Spine

Раунд: чип «ЗАМЕНА n/5»; подпись «было» и серая карточка с простым предложением — заменяемые слова подчёркиваются красной
волной; стрелка «прокачка» рисуется вниз; подпись «стало» и белая карточка с новым предложением — новые слова закрашиваются
маркером; ниже строка «почему». Внизу пять точек.

## Slides
- 1 Хук: «Прокачай фразу» · «5 замен для эссе» · живой пример very important → essential · Искра
- 2 I think school uniforms are useful. → In my view, school uniforms are useful.
- 3 Sport is very important for teenagers. → Sport is essential for teenagers.
- 4 A lot of students use phones in class. → Many students use phones in class.
- 5 But this idea has problems. → However, this idea has problems.
- 6 Cars make the air dirty. → Cars pollute the air.
- 7 Шпаргалка пяти замен + «Проверь своё эссе в тренажёре Writing — бесплатно · ссылка в профиле»
- status: animated
