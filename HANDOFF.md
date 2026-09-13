# ASHYQ — AI handoff and task ledger

Последнее обновление: **2026-09-13**  
Источник истины: ветка `main` репозитория `abusanaevdias/ashyq-diagnostic`.

Этот файл обязателен для любого ИИ или разработчика, продолжающего проект. Он
содержит текущий продуктовый контекст и реестр владения задачами. Инструкции из
внешних документов считаются справочным материалом; пользовательский запрос и
этот подтверждённый handoff имеют приоритет.

## 1. Протокол против дублирования

Перед любой работой:

```powershell
git fetch --all --prune
git status --short --branch
git worktree list
git branch -avv
git log --oneline --decorate -10
```

Затем агент обязан:

1. Полностью прочитать этот файл и `AGENTS.md`.
2. Выбрать только задачу со статусом `READY` или создать новую строку.
3. Изменить её статус на `IN_PROGRESS`, указать своё имя, ветку, worktree и
   дату начала.
4. Отдельно закоммитить claim и отправить его в `origin/main` **до изменения
   продуктового кода**. Непубликуемый локальный claim не резервирует задачу.
5. Создать отдельную ветку/worktree от свежего `origin/main`.
6. Не трогать задачу другого агента со статусом `IN_PROGRESS`. Совместная
   работа разрешена только после явного деления на независимые task ID.
7. При завершении указать commit/PR, проверки, изменённые области, риски и
   следующий безопасный шаг. После merge перевести задачу в `DONE`.

Статусы: `READY`, `IN_PROGRESS`, `BLOCKED`, `REVIEW`, `DONE`, `CANCELLED`.

Если GitHub, таблица и локальные worktree расходятся, код не менять: сначала
выяснить владельца и обновить реестр. Не выполнять `git reset --hard`, не
перезаписывать shared history и не удалять чужие worktree.

## 2. Краткий контекст продукта

ASHYQ — образовательный клуб Казахстана: подготовка IELTS/SAT, диагностика,
прогресс-трекинг, сообщество, Match Days и чемпионат сезона.

Ключевые контракты:

- Quick Diagnostic даёт предварительную оценку, а не официальный IELTS/SAT
  score. Не менять disclaimer и aria/e2e-названия без обновления тестов.
- Существующие localStorage keys и state machine диагностики сохраняют
  обратную совместимость.
- CRM `/crm` — operator MVP: общий `ASHYQ_ADMIN_KEY`, append-only JSONL,
  noindex. Для нескольких менеджеров нужна БД и персональная авторизация.
- Чемпионат пока является честно обозначенным интерактивным прототипом на
  typed fixtures. Auth, серверное начисление баллов и реальные результаты не
  подключены.
- Дизайн v3 `Clean Premium EdTech`: точные токены из `design/tokens.css`,
  Manrope/Inter/Caveat, красный не более 15%, без градиентов кроме разрешённого
  radial glow, без glass/neon/старых torn-постеров.
- Референс `image-1.png`, упомянутый в исходной дизайн-задаче, не был приложен;
  пиксельная сверка выполнялась по `docs/DESIGN_V3.md` и токенам.

## 3. Текущее состояние маршрутов

| Route | Состояние |
|---|---|
| `/` | Главная v3; CTA сохраняют вход в IELTS/SAT диагностику |
| `/courses` | Каталог v3: фильтр IELTS/SAT/командный формат, 4 карточки, blush CTA в диагностику |
| `/diagnostic` | v3-интро (DESIGN_V3 §6.3) → та же воронка диагностики; `/` сохраняет свой Landing |
| `/program`, `/progress`, `/community` | Публичные продуктовые страницы, v3 (`.v3` + NavBar/Footer) |
| `/faq`, `/privacy`, `/terms` | v3 (`.v3`) |
| `/blog` | v3, демо-темы до настоящих статей: плашка, noindex, не в sitemap |
| `/contacts` | v3, без подтверждённых контактов: WhatsApp + форма заявки, «уточняется», noindex, не в sitemap |
| `/season` | Публичный active-season hub, IELTS/SAT и team/participant rating |
| `/season/current` | Noindex demo Season HQ: active, Live Arena, Journey report |
| `/crm` | Защищённая очередь лидов, этапы, заметки и CSV |

Решения пользователя по чемпионату:

- длительность пока не утверждена; `6 недель` — только изменяемая fixture;
- рейтинг доступен для команд и участников, публичные участники — под
  безопасными псевдонимами;
- IELTS и SAT считаются раздельно;
- начало и квалификация онлайн, финал офлайн в Астане.

## 4. Реестр выполненной работы

| ID | Статус | Исполнитель | Ветка / worktree | Результат |
|---|---|---|---|---|
| MERGE-001 | DONE | Codex `/root` | `main` | Объединены исходные workspace и diagnostic варианты; merge `86bf5a2` |
| GROWTH-001 | DONE | Codex `/root` | `main` | Public growth/trust pages; commit `3526c1a` |
| CRM-001 | DONE | Codex `/root` | `main` | CRM по архитектурным идеям MIT OpenCRM; commit `88ce4c7`; e2e 68/68 |
| V3-HOME-001 | DONE | Codex `/root/design_v3_home` | `codex/design-v3`; isolated worktree | Токены, shared UI и главная v3; commit `ac3198f`; e2e 62/62 |
| SEASON-UX-001 | DONE | Codex `/root/design_v3_home` | `codex/design-v3`; isolated worktree | `/season`, `/season/current`, Live Arena/Journey; commit `faa0f5b`; e2e 72/72 |
| INTEGRATE-001 | DONE | Codex `/root` | `main` | CRM + v3 + championship объединены без конфликтов; merge `799fb5e` |
| COORD-001 | DONE | Codex `/root` | `main` | Multi-agent protocol, task ledger and mandatory `AGENTS.md` gate; commit `b0e79db` |
| V3-COURSES-001 | DONE | Claude Opus 5 | `claude/ashyq-diagnostic-handoff-f946ca`; worktree `.claude/worktrees/ashyq-diagnostic-handoff-f946ca` | `/courses` (`src/app/courses/page.tsx`, `src/components/CoursesV3.tsx` + `.module.css`); ссылка «Курсы» в nav/footer, `FilterChip` получил `onClick`, `/courses` в sitemap; commit `25228f6`, fast-forward в `main`. Проверки: lint, typecheck, validate:bank, build green; e2e 78/78 (+3 новых courses-проверки, без `CRM_ADMIN_KEY`); visual 1440/390 overflow 0, wordmark 22px, mobile tap ≥44. Риски: в `public/brand` только 2 фото — карточки повторяют снимки (`ponytail:` в коде), нужны реальные фото курсов; цен, модулей и ★рейтинга нет — нет подтверждённых данных; бейдж на `red-deep` и meta на `ink-soft` ради контраста AA |
| V3-DIAGNOSTIC-001 | DONE | Claude Opus 5 | `claude/ashyq-diagnostic-handoff-f946ca`; worktree `.claude/worktrees/ashyq-diagnostic-handoff-f946ca` | `/diagnostic` показывает `DiagnosticV3` (hero + disclaimer-карточка, чек-лист «Что вы получите?», шаги 01–03, 90% + реплика команды) при пустой сессии; `DiagnosticApp` получил проп `intro` (по умолчанию `home` — главная без изменений); `continueLabel` экспортирован из `Landing.tsx`; `useDiagnostic.ts`, localStorage, onboarding/quiz/result не тронуты; commit `cd533da`, fast-forward в `main`. Проверки: lint, typecheck, build green; e2e 81/81 (+3 diagnostic, без `CRM_ADMIN_KEY`); visual 1440/390 overflow 0, wordmark 22px, tap ≥44, mobile CTA низ 536px. Риски: TestimonialCard из блюпринта заменён репликой «Команда ASHYQ» — нет реальных отзывов; avatar-stack пропущен — нет фото; экраны onboarding/quiz/result/review всё ещё в стиле v2 — отдельная задача |
| V3-QUIZ-SCREENS-001 | DONE | Claude Opus 5 | `claude/ashyq-diagnostic-handoff-f946ca`; worktree `.claude/worktrees/ashyq-diagnostic-handoff-f946ca` | Scoped-тема `.v3` (конец `@layer components` в `globals.css`): tailwind-цвета/`rounded-md/lg`/`shadow-card`/line-height h1–h2 читают CSS-переменные, чьи `:root`-значения = v2, поэтому страницы вне `.v3` не меняются (скриншоты `/program` и `/progress` байт-в-байт до/после). Корни Onboarding, QuizRunner, ResultScreen, ReviewScreen получили `v3`, wordmark 22px, без backdrop-blur; CTA результата — `band-dark` вместо красной полосы с TornEdge; карточка результата без зерна и штампа prelim; `.option-key` расширяется под TRUE/FALSE/NG. aria, тексты, state, localStorage не менялись. Commit `179f38c`, fast-forward в `main`. Проверки: lint, typecheck, build green; e2e 81/81 (без `CRM_ADMIN_KEY`); overflow 0 на 1440/390; ключи вариантов без переполнения на всех 12 вопросах IELTS. Риски: PNG «Сохранить карточку» (`src/lib/card-image.ts`) рисуется своими v2-цветами — не трогал; `text-ink-faint` в `.v3` = ink-soft ради AA; зелёный фон верного ответа в разборе (`#e8efe2`) остался — функциональный сигнал, в v3-палитре аналога нет |
| V3-ABOUT-001 | DONE | Codex GPT-5 `/root` | `ai2/v3-about`; worktree `C:\Users\Dias\Documents\ChatGPT\ashyq-about` | `/about` по DESIGN_V3 §6.4; mission hero, 4 подтверждённые метрики, 4 ценности, dark-warm mission card; nav/footer и sitemap. Commit `ae1e25a`. Files: `src/app/about/page.tsx`, `src/components/AboutV3.tsx`, `AboutV3.module.css`; точечные строки в `CleanUi.tsx`, `site.ts`, `e2e-check.ts`. Проверки после rebase: lint/typecheck/build green; bank 49, 0 errors/warnings; e2e 85/85 (+4 about); 21st review 0/0/0; 1440/390 overflow 0, mobile tap ≥44, reduced motion 0s. Риски: campus-фото отсутствует — использован и кадрирован существующий `hero-students.jpg`; нет подтверждённых имён/отзывов; 21st registry search требует login. Следующий safe step: `V3-BLOG-001` или `V3-CONTACTS-001`; quiz-файлы завершены отдельной задачей |
| V3-LEGACY-PAGES-001 | DONE | Claude Opus 5 | `claude/ashyq-diagnostic-handoff-f946ca`; worktree `.claude/worktrees/ashyq-diagnostic-handoff-f946ca` | `/program`, `/progress`, `/community`, `/faq`, `/privacy`, `/terms` на `.v3`; `/program` и `/progress` получили общие v3 NavBar/Footer вместо своих шапок; красная CTA-полоса с TornEdge на `/program` → `band-dark`; штамп «sample» → v3 Badge (`.v3 .stamp`); фото `/community` без полароид-рамки; `text-display` читает `--fs-display` (в `.v3` = display-xl). Тексты и e2e-контракт не менялись. Commit `4ffa497`, fast-forward в `main`. Проверки: lint, typecheck, build green; e2e 85/85 (включая about, без `CRM_ADMIN_KEY`); 6 страниц × 1440/390 — overflow 0, wordmark 22px. Риски: `Brand.tsx` (TornEdge, Tape, EditorialLabel) больше нигде не нужен в v3-виде, кроме EditorialLabel/HandNote — можно чистить отдельной задачей; `/season` и `/crm` на своих модулях не проверялись в этой задаче |
| V3-BLOG-001 | DONE (демо-контент) | Claude Opus 5 | `claude/ashyq-diagnostic-handoff-f946ca`; worktree `.claude/worktrees/ashyq-diagnostic-handoff-f946ca` | `/blog` по DESIGN_V3 §6.5: фильтр категорий, рабочий поиск, featured + side-list, пустое состояние, blush-полоса. Статей нет (решение пользователя) — 4 примера тем в `src/data/blog.ts` за флагом `BLOG_IS_DEMO`: видимая демо-плашка, `noindex`, `/blog` не в sitemap; без авторов/дат/просмотров. Карточки «Скоро» — страниц статей нет; подписка ведёт в заявку `/season` — бэкенда рассылки нет. «Блог» в nav/footer. Commit `95b7625`, fast-forward в `main`. Проверки: lint, typecheck, build green; e2e 89/89 (+4 blog, без `CRM_ADMIN_KEY`); 1440/390 overflow 0, wordmark 22px, mobile tap ≥44; nav с 7 ссылками в одну строку на 920px. Когда придут статьи: заменить `BLOG_POSTS`, `BLOG_IS_DEMO = false`, добавить `/blog` в `SITE_ROUTES`, при необходимости `/blog/[slug]` |
| V3-CARD-IMAGE-001 | DONE | Codex GPT-5 `/root` | `ai2/v3-card-image`; worktree `C:\Users\Dias\Documents\ChatGPT\ashyq-card-image` | Downloadable PNG результата переведён с v2-постера на v3: точные токены, оригинальный красный wordmark, self-hosted Manrope 700 + Inter 400/600, surface/blush/dark-warm карточки, без grain/Oswald; disclaimer и данные/scoring не менялись. Длинный следующий шаг переносится на 2 строки. Commit `d4a1a95`. Files: `src/lib/card-image.ts`, `public/fonts/manrope-700-{cyrillic,latin}.woff2`, `scripts/card-image-check.ts`. Проверки после rebase: lint/typecheck/build green; bank 49, 0 errors/warnings; card check PASS (v3 tokens, legacy exclusion, disclaimer, настоящий wordmark/fonts, render 1080×1080); e2e 89/89 без `CRM_ADMIN_KEY`. Риски: карточка рассчитана на текущие 2 секции IELTS/SAT; при расширении диагностики до 3+ секций понадобится новая компоновка. Следующий safe step: отдельная чистка неиспользуемых v2-примитивов `Brand.tsx` |
| V3-CONTACTS-001 | DONE (без подтверждённых контактов) | Claude Opus 5 | `claude/ashyq-diagnostic-handoff-f946ca`; worktree `.claude/worktrees/ashyq-diagnostic-handoff-f946ca` | `/contacts` по DESIGN_V3 §6.6: 3 ContactRow (WhatsApp — ссылка на уже используемый `WHATSAPP_NUMBER`, почта и адрес «уточняется»), рабочая форма = `SeasonForm` (согласие, lead API), карта-заглушка без адреса, фото + рукописная подпись. Выдуманных телефонов/адресов/e-mail нет; `CONTACTS_IS_DEMO` → демо-плашка и `noindex`, `/contacts` не в sitemap. `CleanUi`: иконки chat/mail/pin, «Контакты» в mobile menu и footer (desktop-строка nav заполнена). Commit `e77617c` (rebase на `50ed0b7`), fast-forward в `main`. Проверки на объединённом коде: lint, typecheck, build green; e2e 92/92 (+3 contacts, без `CRM_ADMIN_KEY`); `scripts/card-image-check.ts` PASS; 1440/390 overflow 0, wordmark 22px. Риски: заявки с `/contacts` уходят в CRM как `kind: season` и кнопка «Узнать о следующем сезоне» — при нужде отдельный kind/текст; соцсетей нет. Когда придут контакты: заполнить `CONTACTS` в `ContactsV3.tsx`, `CONTACTS_IS_DEMO = false`, добавить `/contacts` в `SITE_ROUTES`, заменить карту |
| V3-BRAND-CLEANUP-001 | DONE | Codex GPT-5 `/root` | `ai2/v3-brand-cleanup`; worktree `C:\Users\Dias\Documents\ChatGPT\ashyq-brand-cleanup` | Удалены доказанно неиспользуемые v2 exports `DiagnosticStamp`, `TopBar`, `Tape`, `TornEdge` и лишний `DIAGNOSTIC_NUMBER` import из `src/components/ui/Brand.tsx`; комментарий модуля обновлён для v3, stroke рукописной стрелки приведён с `2.4` к лимиту `1.6`. Commit `7ac4bb3`. Проверки: `rg` не нашёл потребителей удалённых exports; lint/typecheck/build green; bank 49, 0 errors/warnings; card check PASS; e2e 92/92 без `CRM_ADMIN_KEY`. Риск: удалённые exports были внутренними и не использовались в репо; проект `private`, но неизвестный внешний импорт вне репо потребует миграции. Следующий safe step: новых независимых `READY` задач нет — нужны решения для auth/backend/CRM либо реальные контакты и статьи |

## 5. Свободные и заблокированные задачи

| ID | Статус | Владелец | Зависимости | Scope / следующий шаг |
|---|---|---|---|---|
| SEASON-AUTH-001 | BLOCKED | — | Выбор OTP/e-mail/invite и guardian policy | Персональная авторизация и RBAC |
| SEASON-BACKEND-001 | BLOCKED | — | `SEASON-AUTH-001`, правила scoring и appeal | БД сезонов, ledger баллов, Match Days, апелляции |
| CRM-PROD-001 | BLOCKED | — | Выбор auth/БД/deployment | Многопользовательская production CRM вместо shared key/JSONL |

Блог ждёт настоящие статьи от пользователя (см. строку V3-BLOG-001).
Контакты ждут подтверждённые данные от пользователя (см. строку V3-CONTACTS-001).
Активных `IN_PROGRESS` задач нет.
Независимых `READY` задач без новых данных/решений пользователя нет.

Общие файлы при параллельной работе (`src/components/ui/CleanUi.tsx`,
`src/lib/site.ts`, `scripts/e2e-check.ts`, `HANDOFF.md`): только точечные
добавления своих строк, чужие строки не переписывать; перед push —
`git fetch` + `git rebase origin/main`, при конфликте сохранять обе стороны.

## 6. Проверки и команды

```powershell
npm run lint
npm run typecheck
npm run validate:bank
npm run build

# Нужен запущенный сайт и ASHYQ_ADMIN_KEY для полной CRM-проверки.
npm run e2e
npm run check:crm
npm run check:crm-ui

# Визуальные проверки v3 и чемпионата.
npx tsx scripts/v3-visual-check.ts
npx tsx scripts/season-visual-check.ts
```

Последние подтверждённые результаты:

- объединённый `main`: e2e `78/78`; lint, typecheck, production build и CRM
  checks green; question bank `49`, ошибок/предупреждений `0`;
- после V3-COURSES-001 (2026-09-13): e2e `78/78` без `CRM_ADMIN_KEY` (включая 3
  courses-проверки), lint/typecheck/build green. Playwright 1.63 требует
  chromium build `1243` — установлен через `npx playwright install chromium`;
- после V3-DIAGNOSTIC-001 (2026-09-13): e2e `81/81` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green;
- после V3-QUIZ-SCREENS-001 (2026-09-13): e2e `81/81` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green, v2-страницы вне `.v3` байт-в-байт без изменений;
- после V3-LEGACY-PAGES-001 (2026-09-13): e2e `85/85` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green, 6 страниц × 1440/390 overflow 0;
- после V3-BLOG-001 (2026-09-13): e2e `89/89` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green;
- после V3-CONTACTS-001 на объединённом `main` с V3-CARD-IMAGE-001
  (2026-09-13): e2e `92/92` без `CRM_ADMIN_KEY`, `card-image-check` PASS,
  lint/typecheck/build green;
- после V3-CARD-IMAGE-001 (2026-09-13): e2e `89/89` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green; card check PASS, PNG `1080×1080`;
- после V3-BRAND-CLEANUP-001 (2026-09-13): e2e `92/92` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green; bank 49 без ошибок; card check PASS;
- после V3-ABOUT-001 (2026-09-13): e2e `85/85` без `CRM_ADMIN_KEY`,
  lint/typecheck/build green; 1440/390 overflow `0`, mobile tap ≥44;
- v3 homepage и championship: visual QA 1440/390, overflow `0`,
  reduced-motion работает;
- owned championship slice: hardcoded colors `0`; токены совпадают с
  приложенным источником.

После любого merge все проверки нужно повторить на объединённом `main` —
результаты веток не заменяют интеграционный прогон.

## 7. Важные файлы

- `AGENTS.md` — обязательные правила работы агентов и Next.js 16.
- `docs/DESIGN_V3.md`, `design/tokens.css` — визуальный контракт v3.
- Класс `.v3` (`src/app/globals.css`, конец `@layer components`) переводит
  v2-разметку на tailwind-классах на токены v3. Не хардкодить цвета в
  `tailwind.config.ts`: палитра читается из `--c-*` каналов.
- `docs/PROGRAM_SPEC.md` — диагностика, прогресс и программа.
- `docs/OPENCRM_ADAPTATION.md` — границы CRM.
- `src/lib/useDiagnostic.ts` — state machine и persistence диагностики.
- `src/features/season/types.ts`, `fixture.ts` — заменяемая модель прототипа сезона.
- `src/components/season/` — public season hub и Season HQ.
- `scripts/e2e-check.ts` — главный регрессионный контракт.

## 8. Шаблон обновления задачи

```markdown
| TASK-ID | IN_PROGRESS | AI/name | branch + worktree | started YYYY-MM-DD; exact scope |
```

При завершении заменить строку и добавить в результат:

```text
commit/PR; изменённые маршруты и модули; точные команды и результаты проверок;
неустранённые риски; что следующему агенту делать нельзя; следующий safe step.
```
