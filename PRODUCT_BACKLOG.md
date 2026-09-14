# ASHYQ — product backlog

Последнее обновление: **2026-09-15**. Этот документ описывает недостающие
продуктовые и эксплуатационные возможности сайта. Владение задачами и защита
от параллельной работы по-прежнему определяются `HANDOFF.md`: строка в этом
файле не является claim.

Аудит безопасности вынесен в отдельную задачу `SEC-AUDIT-001` и здесь не
дублируется.

## Приоритеты

- `P0` — необходимо для надёжного публичного запуска.
- `P1` — превращает сайт и прототипы в полноценный продукт.
- `P2` — рост, контент и системная полировка.

## P0 — запуск и конверсия

| ID | Статус | Задача | Definition of done | Зависимости / границы |
|---|---|---|---|---|
| SEO-META-001 | DONE | Исправить canonical и перевести Open Graph на v3 | Каждый индексируемый маршрут имеет собственный canonical; OG использует оригинальный wordmark и токены v3; demo/private страницы остаются noindex; metadata проверяется автоматически | Commit `ae3bdfe`; для production обязательно задать реальный `NEXT_PUBLIC_SITE_URL` |
| LEADS-DURABILITY-001 | DONE | Надёжное хранение и доставка заявок | Write-ahead JSONL + идемпотентность по dedupeKey (24ч) + outbox-ledger доставки со статусами/попытками + авто/ручной retry + ежедневный backup + CSV-экспорт; сбой Telegram/webhook не теряет лид | Постоянная БД подключена: Supabase на Vercel (`LEADS-HEALTH-001`, `LEADS-VERCEL-001` — done) |
| CONTACT-FORM-001 | DONE | Отделить обращение с `/contacts` от заявки на сезон | Контактная форма имеет свой intent/kind, нейтральный CTA и корректно отображается в CRM; season funnel не меняется; есть e2e обоих сценариев | Commit `aa434f3`; e2e 103/103 |
| CI-RELEASE-001 | DONE | Добавить GitHub CI и обязательные release gates | PR запускает lint, typecheck, validate:bank, build, e2e, audio/card checks; артефакты и ошибки видны в Actions; merge блокируется при красном gate | Workflow `8fc121c`; branch protection всё ещё нужно включить владельцу по `docs/CI.md` |
| DEPLOY-001 | DONE (как VERCEL-DEPLOY-001) | Production deployment | Настроены хостинг, `NEXT_PUBLIC_SITE_URL`, env/secrets и health-check; canonical/sitemap не содержат localhost | Прод на Vercel: https://ashyq-diagnostic.vercel.app (PR #15, #17); заявки и вход — Supabase; свой домен и branch protection владельца — остаточные шаги |
| LEADS-HEALTH-001 | DONE | `/api/health` подтверждает хранилище заявок в Supabase | `checkSupabaseLeads()` проверяет `crm_leads` service-role ключом; верный ключ → 200, неверный → 503 с причиной в логе | PR #18; `env-check` +4 случая |
| LEADS-VERCEL-001 | DONE | Заявки на Vercel автоматически идут в Supabase | `resolveLeadsStorage()` использует переменные официальной Vercel-интеграции Supabase как fallback; без Supabase — 503 вместо тихой записи в эфемерный `/tmp` | PR #19, fix PR #20 |

## P1 — основной продукт

| ID | Статус | Задача | Definition of done | Зависимости / границы |
|---|---|---|---|---|
| COURSE-DETAILS-001 | DONE (данные уточнить) | Отдельные страницы IELTS и SAT | Для каждого курса есть программа, формат, явно предварительные длительность/расписание/статус набора/преподаватель/стоимость, FAQ и CTA в соответствующую диагностику; SEO/a11y/адаптивность проверяются автоматически | Feature commit `91edb1d`; настоящие коммерческие данные заменить по `docs/COURSE_CONTENT_TODO.md` |
| TRUST-CONTENT-001 | BLOCKED | Реальные доказательства доверия | Добавлены подтверждённые отзывы, результаты, команда/преподаватели и разные реальные фотографии; у каждого факта есть источник | Нужны материалы пользователя; не придумывать имена, цифры и отзывы |
| ANALYTICS-001 | READY | Реальная продуктовая аналитика | Подключён выбранный провайдер; измеряется landing → start → completion → lead → enrollment; реализованы consent и проверка событий; зарезервированные события либо отправляются, либо удалены | Нужен выбор GA4/Метрика/другой провайдер и идентификатор |
| A11Y-PERF-001 | DONE | Автоматический axe/Lighthouse gate | Все публичные маршруты проверяются на WCAG AA, клавиатуру, tap targets, overflow, reduced motion, LCP/CLS; Lighthouse Performance ≥90 на целевом окружении | `scripts/a11y-perf-check.ts`, CI artifacts; 38 responsive + 19 Lighthouse PASS |
| DIAGNOSTIC-CONTENT-001 | READY | Методически усилить диагностику | Расширен и откалиброван банк; демо Listening заменён студийным аудио; подтверждена интерпретация диапазонов; отдельно спроектирована оценка Writing/Speaking с тренером без обещания официального score | Нужны методист и студийные записи |
| STUDENT-ACCOUNT-001 | READY | Личный кабинет и облачный прогресс | Ученик входит в аккаунт и видит историю/план на разных устройствах; предусмотрены экспорт и удаление данных; localStorage мигрируется без потери текущих результатов | Решение по auth и `SUPABASE-LMS-001` уже реализуют сквозной вход и серверные классы/задания; осталось доделать экспорт/удаление данных и миграцию оставшихся demo-аккаунтов из localStorage |
| SUPABASE-FOUNDATION-001 | DONE | Безопасный фундамент Supabase | В репозитории есть воспроизводимые миграции профилей, LMS и чемпионата, RLS/явные grants, безопасный публичный рейтинг, локальные SQL/static checks и инструкция rollout/rollback | `c92d2cf` + local verification `4dfbe30`: migration/reset/lint PASS, pgTAP 46/46; runtime не переключён, auth/product decisions обязательны до adapter cutover |
| SUPABASE-AUTH-001 (бывш. SEASON-AUTH-001) | DONE | Авторизация: почта + пароль, роли по решению пользователя | Решения пользователя: вход — e-mail + пароль; роли `teacher`/`author` выдаёт только админ; несовершеннолетние — самостоятельная регистрация с галочкой согласия родителя. Migration с `signup_consents`, `SupabaseAuth`, форма регистрации в `LoginView` | PR #12, merge `1de1dc4` |
| SUPABASE-LMS-001 | DONE | LMS и файлы на Supabase | Классы, вход по коду, уроки, задания, сдачи, оценка и блог — на `SupabaseRepos` за тем же интерфейсом `Repos`; приватный bucket `lms-files` (2 МБ, RLS по владельцу/классу) | PR #13, merge `b36c226` |
| SUPABASE-SEASON-001 (заменяет SEASON-BACKEND-001) | DONE | Реальный движок сезона на Supabase | `season_snapshot()` с урезанием по роли, атомарные `create_season_team`/`add_season_participant`/`review_match_and_award`, ответ Match Day правит только капитан во время матча; апелляции вне scope | PR #14 (в `claude/supabase-lms`), в `main` через PR #16, merge `c810a56`; апелляции — отдельная задача после решения по правилам |
| SEASON-BACKEND-001 | CANCELLED | Реальный движок сезона (старый scope) | — | Заменена `SUPABASE-SEASON-001`; апелляции остаются отдельной задачей после решения по правилам |
| CRM-PROD-001 | IN_PROGRESS | Production CRM: персональный вход | Персональный вход в `/crm` аккаунтом Supabase (роли `admin` + `manager`, выдаёт только админ); `/api/crm` и `/api/leads` принимают access token Supabase наряду с ключом админа и Telegram | Auth и хранилище лидов уже на Supabase; ветка `claude/crm-prod`, started 2026-09-15; назначение лидов/сводки — отдельно в `TG-BOT-002` |
| AUTH-PROD-001 | IN_PROGRESS | Переключить прод `/login` с demo на Supabase | `/api/health` сообщает режим входа (`auth: supabase\|demo`); RLS для `private.signup_consents`; предупреждение env-check о неизвестном значении `NEXT_PUBLIC_AUTH_PROVIDER`; затем redeploy с провайдером `supabase` в Vercel | Ветка `claude/prod-auth`, started 2026-09-15; прод пока в demo-режиме несмотря на заданную переменную в Vercel |
| CRM-ANALYTICS-001 | DONE | Продуктовая аналитика в CRM без внешних провайдеров | `stats.analytics` в снапшоте: воронка по kind, разбивка по utm_source, тренд лидов за 14 дней, лиды за 7 дней; UI «Аналитика» в `CrmDashboard` | Commits `2166e35`, `d972327`, merged FF в `main` |
| TG-MINIAPP-001 | DONE | CRM как Telegram Mini App | Вход в `/api/crm`/`/api/leads` по подписи Telegram `initData` + участие в группе; кнопка «Открыть в CRM» под заявкой; `/crm` встраивается только в `web.telegram.org` | PR #21, merge `8ba6cd5`, владелец подтвердил работу |
| TG-BOT-001 | DONE | Telegram-бот: кнопки этапов и команды | Webhook `/api/telegram`: кнопки этапов под заявкой, команды `/new`/`/today`/`/find`/`/stats`/`/crm`; доступ — участник группы | PR #22, merge `5172a0d`, владелец настроил webhook и подтвердил работу |
| TG-BOT-002 | IN_PROGRESS | Telegram-бот: ответственный и сводки | Кнопка «Взял» (assign), `/my`, утренняя сводка 9:00 Алматы и напоминание о невзятой заявке через `pg_cron`/`pg_net` | Ветка `claude/tg-assign-digest`, worktree `.claude/worktrees/telegram-bot-leads-crm-4af206`, started 2026-09-15 |

## P2 — контент и полировка

| ID | Статус | Задача | Definition of done | Зависимости / границы |
|---|---|---|---|---|
| BLOG-CONTENT-001 | BLOCKED | Настоящий блог и страницы статей | Реальные материалы вместо demo, `/blog/[slug]`, автор/дата, метаданные, sitemap и редакционный процесс | Нужны статьи и подтверждённые авторы |
| SUBSCRIBE-001 | READY | Подписка на новые материалы | Форма подписки имеет double opt-in/отписку и отдельную CRM/рассылочную интеграцию; больше не ведёт в заявку сезона | Нужен выбор сервиса рассылки |
| SITE-SEARCH-001 | DONE | Честный поиск по сайту | Поиск находит FAQ, курсы и статьи с клавиатуры и мобильного; либо search icon заменён на явно подписанную ссылку FAQ | Реализовано в `/search`; детали и проверки в `HANDOFF.md` |
| ERROR-STATES-001 | DONE | Брендированные системные состояния | Добавлены not-found, error/retry и maintenance/offline состояния; lead/diagnostic state не теряется после ошибки | Реализованы 404/error/global-error/maintenance; детали в `HANDOFF.md` |
| V3-TOKEN-AUDIT-002 | DONE | Закрыть остаточный design-system drift | OG, review success-state и `.21st/design.json` синхронизированы с v3; автоматический аудит не находит неизвестных цветов/радиусов/шрифтов | PR #4 (`82784ed`); semantic token `--success`/`--success-soft` утверждён пользователем; проверка — `scripts/token-audit.ts` (9/9) |

## Рекомендуемая последовательность

1. `SEO-META-001`.
2. `LEADS-DURABILITY-001` и `CONTACT-FORM-001`.
3. `CI-RELEASE-001`, затем `A11Y-PERF-001`.
4. `DEPLOY-001`.
5. `COURSE-DETAILS-001` и `ANALYTICS-001`.
6. После продуктовых решений — аккаунт, чемпионат и production CRM.

Перед началом каждой задачи агент обязан повторно проверить `origin/main`,
прочитать `AGENTS.md` и `HANDOFF.md`, создать отдельный worktree, опубликовать
claim и не затрагивать файлы активных задач.
