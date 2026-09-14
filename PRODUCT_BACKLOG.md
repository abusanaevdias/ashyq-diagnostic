# ASHYQ — product backlog

Последнее обновление: **2026-09-14**. Этот документ описывает недостающие
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
| LEADS-DURABILITY-001 | DONE (БД — за DEPLOY-001) | Надёжное хранение и доставка заявок | Write-ahead JSONL + идемпотентность по dedupeKey (24ч) + outbox-ledger доставки со статусами/попытками + авто/ручной retry + ежедневный backup + CSV-экспорт; сбой Telegram/webhook не теряет лид | Постоянную БД подключить в DEPLOY-001 (точка замены — appendLead/readJsonLines)
| CONTACT-FORM-001 | DONE | Отделить обращение с `/contacts` от заявки на сезон | Контактная форма имеет свой intent/kind, нейтральный CTA и корректно отображается в CRM; season funnel не меняется; есть e2e обоих сценариев | Commit `aa434f3`; e2e 103/103 |
| CI-RELEASE-001 | DONE | Добавить GitHub CI и обязательные release gates | PR запускает lint, typecheck, validate:bank, build, e2e, audio/card checks; артефакты и ошибки видны в Actions; merge блокируется при красном gate | Workflow `8fc121c`; branch protection всё ещё нужно включить владельцу по `docs/CI.md` |
| DEPLOY-001 | READY | Production deployment | Настроены хостинг, домен, `NEXT_PUBLIC_SITE_URL`, env/secrets, preview deployments и health-check; canonical/sitemap не содержат localhost | После `SEO-META-001`, `LEADS-DURABILITY-001` и security-аудита |

## P1 — основной продукт

| ID | Статус | Задача | Definition of done | Зависимости / границы |
|---|---|---|---|---|
| COURSE-DETAILS-001 | DONE (данные уточнить) | Отдельные страницы IELTS и SAT | Для каждого курса есть программа, формат, явно предварительные длительность/расписание/статус набора/преподаватель/стоимость, FAQ и CTA в соответствующую диагностику; SEO/a11y/адаптивность проверяются автоматически | Feature commit `91edb1d`; настоящие коммерческие данные заменить по `docs/COURSE_CONTENT_TODO.md` |
| TRUST-CONTENT-001 | BLOCKED | Реальные доказательства доверия | Добавлены подтверждённые отзывы, результаты, команда/преподаватели и разные реальные фотографии; у каждого факта есть источник | Нужны материалы пользователя; не придумывать имена, цифры и отзывы |
| ANALYTICS-001 | READY | Реальная продуктовая аналитика | Подключён выбранный провайдер; измеряется landing → start → completion → lead → enrollment; реализованы consent и проверка событий; зарезервированные события либо отправляются, либо удалены | Нужен выбор GA4/Метрика/другой провайдер и идентификатор |
| A11Y-PERF-001 | DONE | Автоматический axe/Lighthouse gate | Все публичные маршруты проверяются на WCAG AA, клавиатуру, tap targets, overflow, reduced motion, LCP/CLS; Lighthouse Performance ≥90 на целевом окружении | `scripts/a11y-perf-check.ts`, CI artifacts; 38 responsive + 19 Lighthouse PASS |
| DIAGNOSTIC-CONTENT-001 | READY | Методически усилить диагностику | Расширен и откалиброван банк; демо Listening заменён студийным аудио; подтверждена интерпретация диапазонов; отдельно спроектирована оценка Writing/Speaking с тренером без обещания официального score | Нужны методист и студийные записи |
| STUDENT-ACCOUNT-001 | BLOCKED | Личный кабинет и облачный прогресс | Ученик входит в аккаунт и видит историю/план на разных устройствах; предусмотрены экспорт и удаление данных; localStorage мигрируется без потери текущих результатов | `LMS-001` делает локальный demo-слой аккаунта; production auth/БД и guardian policy всё ещё требуют решения |
| SUPABASE-FOUNDATION-001 | DONE | Безопасный фундамент Supabase | В репозитории есть воспроизводимые миграции профилей, LMS и чемпионата, RLS/явные grants, безопасный публичный рейтинг, локальные SQL/static checks и инструкция rollout/rollback | `c92d2cf`; runtime не переключён; Docker SQL-run и auth/product decisions обязательны до adapter cutover |
| SEASON-AUTH-001 | BLOCKED | Авторизация чемпионата | Выбраны OTP/e-mail/invite, роли ученика/капитана/тренера и политика для несовершеннолетних | Требуется решение пользователя |
| SEASON-BACKEND-001 | BLOCKED | Реальный движок сезона | Fixture заменён БД и API; работают команды, Match Days, серверные баллы, рейтинг, задания, журнал начислений и апелляции | После `SEASON-AUTH-001` и утверждения scoring/appeal rules |
| CRM-PROD-001 | BLOCKED | Production CRM | Постоянная БД, персональные менеджеры, RBAC, назначение лидов, задачи, история коммуникаций, отчёты и backup | Нужны auth/БД/deployment decisions; текущий JSONL MVP сохранить до миграции |

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
