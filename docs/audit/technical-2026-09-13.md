# Технический аудит маршрутов — 2026-09-13

Агент: sweep (SITE-AUDIT-001). Стенд: worktree `ai2/audit-sweep` (origin/main @ e69636a), `npm run build` — успешно. Сервер `next start` на 127.0.0.1:3021 с `ASHYQ_ADMIN_KEY=audit-key-a1`. Обход Playwright (Chromium, desktop 1440x900, `waitUntil: networkidle`). Продуктовый код не менялся.

## 1. Маршруты (25 проверено)

Все маршруты отдают HTTP 200, title заполнен, ровно один `<h1>` (кроме служебных robots.txt/sitemap.xml — ожидаемо без h1). Console errors (pageerror + console.error): **0 на всех маршрутах**.

| Маршрут | Статус | h1 | Title | Console errors | Битые запросы |
|---|---|---|---|---|---|
| / | 200 | 1 | ASHYQ — Быстрая диагностика IELTS / SAT | 0 | 0 |
| /courses | 200 | 1 | Курсы ASHYQ | 0 | 0 |
| /diagnostic | 200 | 1 | Диагностика IELTS и SAT | 0 | 0 |
| /program | 200 | 1 | Программа ASHYQ | 0 | 0 |
| /progress | 200 | 1 | Мой прогресс — ASHYQ | 0 | 0 |
| /community | 200 | 1 | Сообщество ASHYQ | 0 | 0 |
| /season | 200 | 1 | ASHYQ Championship — активный сезон | 0 | 0 |
| /season/current | 200 | 1 | Season HQ — интерактивный прототип | 0 | 0 |
| /faq | 200 | 1 | Вопросы и ответы — ASHYQ | 0 | 0 |
| /privacy | 200 | 1 | Политика конфиденциальности — ASHYQ | 0 | 0 |
| /terms | 200 | 1 | Условия использования — ASHYQ | 0 | 0 |
| /blog | 200 | 1 | Блог ASHYQ | 0 | 7× RSC-prefetch `ERR_ABORTED` (см. §4) |
| /contacts | 200 | 1 | Контакты ASHYQ | 0 | 0 |
| /about | 200 | 1 | О нас — ASHYQ | 0 | 0 |
| /search | 200 | 1 | Поиск по сайту — ASHYQ | 0 | 0 |
| /maintenance | 200 | 1 | Технические работы — ASHYQ | 0 | 0 |
| /login | 200 | 1 | Вход — ASHYQ | 0 | 0 |
| /robots.txt | 200 | 0 | — | 0 | 0 |
| /sitemap.xml | 200 | 0 | — | 0 | 0 |
| /blog/ielts-true-false-not-given | 200 | 1 | Статья — Блог ASHYQ | 0 | 2× RSC-prefetch `ERR_ABORTED` |
| /blog/sat-math-module-time | 200 | 1 | Статья — Блог ASHYQ | 0 | 2× RSC-prefetch `ERR_ABORTED` |
| /blog/ielts-listening-form-completion | 200 | 1 | Статья — Блог ASHYQ | 0 | 2× RSC-prefetch `ERR_ABORTED` |
| /blog/match-day-inside | 200 | 1 | Статья — Блог ASHYQ | 0 | 3× RSC-prefetch `ERR_ABORTED` |
| /me (LMS) | 200 | 1 | Кабинет — ASHYQ | 0 | 0 |
| /classes (LMS) | 200 | 1 | Мои классы — ASHYQ | 0 | 0 |

### Защищённые LMS-маршруты: 200 без редиректа (отклонение от ожидания «redirect на /login»)

`/me` и `/classes` возвращают HTTP 200 без серверного редиректа. Защита реализована **на клиенте** (`src/components/lms/RequireRole.tsx`, комментарий в коде: «Без редиректов: нет сессии → экран входа»): после гидрации рендерится экран «Нужно войти» с кнопкой `Войти` → `/login?next=<path>`. SSR-HTML до гидрации — «Загружаем кабинет…». Проверено в браузере: итоговый h1 = «Нужно войти», ссылка на /login присутствует. Это осознанное проектное решение, а не дефект; серверной проверки прав пока нет (появится с Supabase) — **зафиксировано как известное ограничение**.

## 2. Внутренние ссылки

Собраны все `href` с `/` со всех 25 страниц: 23 уникальных. Каждая проверена fetch'ем — **все 23 → HTTP 200, битых ссылок нет**.

Включая: `/?start=ielts`, `/?start=sat`, `/#directions` (фрагмент — возвращён 200), `/login?next=%2Fclasses`, `/login?next=%2Fme` и все 4 slug'а блога.

## 3. Sitemap и robots

- **robots.txt**: соответствует ожиданиям — `Allow: /`, `Disallow: /api/`, `Disallow: /crm`, ссылка на sitemap. Расхождений нет.
- **sitemap.xml** содержит 11 URL из `SITE_ROUTES` (`src/lib/site.ts`): `/`, `/courses`, `/about`, `/contacts`, `/program`, `/progress`, `/community`, `/season`, `/faq`, `/privacy`, `/terms`.
- Расхождения с полным списком публичных маршрутов:
  - **/diagnostic отсутствует в sitemap** — публичная маркетинговая страница, не в `SITE_ROUTES`. Вероятное упущение (в отличие от /blog, чьё исключение задокументировано в `src/data/blog.ts` как намеренное до выхода демо-режима `BLOG_IS_DEMO`).
  - /blog и 4 статьи — вне sitemap **намеренно** (демо-контент, `noindex` через metadata; комментарий в `src/data/blog.ts`).
  - /search — вне sitemap (поисковая служебная, корректно).
  - /season/current — вне sitemap (интерактивный прототип, спорно, но допустимо).
- URL в sitemap/robots строятся от `NEXT_PUBLIC_SITE_URL` с фолбэком `http://localhost:3000` (`src/lib/site.ts`). На локальном стенде это ожидаемо, но в проде без заданной переменной sitemap уйдёт в localhost — **проверить наличие NEXT_PUBLIC_SITE_URL в прод-окружении**.

## 4. Аномалии

1. **/blog/*, /blog** — RSC-префетчи соседних статей завершаются `net::ERR_ABORTED` (7 на /blog, 2–3 на статьях). Это отменённые Next-prefetch при закрытии/навигации, не 4xx/5xx, контент не ломается. Классифицировано как шум, дефектом не считается.
2. **/blog/[slug] — единый статический title** «Статья — Блог ASHYQ» для всех 4 статей: `src/app/blog/[slug]/page.tsx` не имеет `generateMetadata` и не подставляет заголовок поста. SEO-минус, актуально убрать при переводе блога из демо-режима.
3. **/me, /classes — клиентский гард без серверного редиректа** (см. §1). SSR отдаёт промежуточное «Загружаем кабинет…».
4. Билд-предупреждение Turbopack: `src/lib/lead-delivery.ts` использует динамический `path.join(process.cwd(), …)` → исходники попадают в серверный бандл. Не ломает работу, но замедляет деплой (рекомендация из вывода Next: статически скоупить путь или `turbopackIgnore`).

## 5. API-проверки

| Запрос | Ожидание | Факт | Итог |
|---|---|---|---|
| POST /api/lead без тела | 400 | 400, `{"ok":false}` | норма |
| GET /api/crm без ключа | 404 | **404** («Not found») | норма |
| GET /api/crm с неверным ключом (`x-admin-key: wrong`) | 404 | 404 | норма |
| GET /api/crm с валидным ключом (`x-ashyq-admin-key: audit-key-a1`) | 200 | 200 | норма |
| POST /api/crm (метод не поддержан) | — | 405 | норма (route принимает только GET/PATCH; проверка ключа — до метода) |

Примечание: заголовок админ-ключа — `x-ashyq-admin-key` (или `Authorization: Bearer`), см. `src/lib/admin-auth.ts`.

## 6. Вердикт

**Техническое состояние — исправное.** 25 маршрутов: все 200, ноль console-ошибок, ноль реальных битых запросов/ресурсов, все 23 внутренние ссылки живые, robots/sitemap/защита API соответствуют ожиданиям. К действию: (1) добавить /diagnostic в `SITE_ROUTES`; (2) `generateMetadata` для статей блога; (3) убедиться в `NEXT_PUBLIC_SITE_URL` в проде; (4) серверная авторизация LMS-маршрутов при появлении Supabase; (5) убрать шумовой turbopack-warning в `lead-delivery.ts`. Ни один пункт не блокирующий.
