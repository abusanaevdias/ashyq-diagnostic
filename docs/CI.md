# CI и release gates (CI-RELEASE-001)

GitHub Actions workflow [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
запускает полный набор проверок из `HANDOFF.md` §6 на каждый pull request и
каждый push в `main`. Секретов не требуется: одноразовый `ASHYQ_ADMIN_KEY`
генерируется на каждый прогон (`openssl rand -hex 32`) и передаётся и серверу,
и проверкам, поэтому e2e проходит полный CRM-сценарий (как локальный запуск с
`CRM_ADMIN_KEY`).

## Что гоняет CI

| Шаг | Команда | Что ловит |
|---|---|---|
| Install dependencies | `npm ci` | рассинхрон `package-lock.json` |
| Playwright Chromium | `npx playwright install --with-deps chromium` | — |
| Lint | `npm run lint` | стиль/ошибки ESLint |
| Typecheck | `npm run typecheck` | ошибки типов |
| Question bank | `npm run validate:bank` | битый банк вопросов |
| Production build | `npm run build` | ошибки сборки Next.js |
| Card image check | `npx tsx scripts/card-image-check.ts` | регрессия v3-карточки результата |
| LMS + season unit | `npm run check:units` | матрица прав, репозитории LMS, лимиты недели, команды по 5, Match Day (без браузера) |
| E2E | `npm run e2e` против `next start` | главный регрессионный контракт (118 проверок с ключом) |
| CRM unit | `npm run check:crm` | склейка лидов по runId, этапы, статистика |
| CRM UI | `npm run check:crm-ui` | экран `/crm` с ключом |
| Audio | `npm run e2e:audio` | IELTS Listening MP3 против запущенного сайта |
| LMS e2e | `npm run e2e:lms` | учебный слой: сценарии a–e на 1440/390, приватный режим, reduced-motion (CI-GATES-002) |
| Season e2e | `npm run e2e:season` | чемпионат: капитан → организатор → рейтинг, права ролей, 1440/390 (CI-GATES-002) |
| Design tokens | `npm run check:tokens` | цвета/радиусы/шрифты только из `design/tokens.*` на 80 экранах (CI-GATES-002) |
| A11Y/Perf | `npm run check:a11y-perf` | axe, tap targets, focus, reduced-motion, Lighthouse ≥90/≥95 |

Артефакты: скриншоты `screenshots/` — при успехе и при падении; лог сервера и
`.data/` с заявками прогона — только при падении.

Node: `24` (LTS, совпадает с локальной средой разработки). Runner:
`ubuntu-latest`.

## Branch protection (настройка владельца репозитория)

Workflow сам по себе не блокирует merge — это делает GitHub. Варианты:

1. **Строгий режим (рекомендуется после стабилизации).**
   `Settings → Branches → Add branch protection rule` для `main`:
   - ✅ Require a pull request before merging;
   - ✅ Require status checks to pass → выбрать job `checks`
     («lint, typecheck, build, e2e, crm, audio, card»);
   - включить `Require branches to be up to date before merging`.

   Минус для текущего протокола: агенты сейчас пушат fast-forward прямо в
   `main`; режим PR потребует менять протокол claim → PR → merge.

2. **Мягкий режим (совместим с текущим протоколом).** Без запрета пуша:
   каждый push в `main` проходит полный прогон, красный прогон — сигнал
   немедленно чинить или откатывать. Ограничить прямой push в `main` можно
   позже, когда протокол перейдёт на PR.

`Settings → Actions → General`: разрешить workflows (по умолчанию включено).
Для приватного репозитория учитывайте лимит минут GitHub.

## Локальный прогон того же набора

```powershell
npm ci
npm run lint
npm run typecheck
npm run validate:bank
npm run build
npx tsx scripts/card-image-check.ts

# терминал 1 (или фон): сервер на свободном порту
npx next start -H 127.0.0.1 -p 3021

# терминал 2: проверки против сервера
$env:ASHYQ_ADMIN_KEY="локальный-длинный-ключ"; $env:CRM_ADMIN_KEY=$env:ASHYQ_ADMIN_KEY
$env:BASE_URL="http://127.0.0.1:3021"
npm run e2e
npm run check:crm
npm run check:crm-ui
npm run e2e:audio
npm run e2e:lms
npm run e2e:season
npm run check:tokens
npm run check:a11y-perf
```

Без сервера: `npm run check:units` (LMS и чемпионат в режиме памяти).
