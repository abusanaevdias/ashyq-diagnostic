---
workflow: general-video
flow: automation
storyboard: yes
message: "Ты думаешь по-русски — и это слышно в английском; такие ошибки разбирают на занятиях ASHYQ"
destination: instagram-reels
aspect: 1080x1920
language: ru
audience: школьники 15–18, Казахстан, готовятся к IELTS/SAT
length: 30s
angle: разбор ошибок (кальки с русского)
voice: fish-audio (s2.1-pro-free) — RU диктор + EN «ученик»
---

## Intent

Концепция №2 «Кальки», выбрана владельцем 2026-09-29. Русская мысль и то, что
«вылетает» по-английски: дословный перевод звучит в голосе, неправильное слово
зачёркивается прямо в строке и заменяется верным (fixed-line token swap).
Полезно само по себе — сохраняют и пересылают.

## Customizations

- Два голоса Fish Audio: RU диктор (как в «Антирекламе») и EN «ученик».
- Слова синхронизированы с голосом по таймингам транскрипции.
- Сторибоард: план в чате → эскизы `storyboard.html` → сборка → рендер.

## Notes

- Только проверяемые ошибки: I have 17 years → I'm 17; I am agree → I agree;
  depends from → depends on; discuss about → discuss.
- Без статистики («каждый второй» и т.п.), без обещаний балла; диагностику
  не выдаём за проверку Speaking — она «предварительная оценка уровня».
- Дизайн v3 (как в `../hyperframes-antiad`), «верно» — success #2e5e3a /
  success-soft #e8efe2 (токен из design/tokens.css). Цифры не в Caveat.
- Safe zone Reels y 270–1248. Финал: «Голоса в ролике созданы ИИ».
